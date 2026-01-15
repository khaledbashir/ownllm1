// server/utils/AncPricingEngine.js

/**
 * ANC Production Pricing Logic
 * Handles calculations for LED Displays based on "Master Excel" rules.
 */

class AncPricingEngine {
  constructor() {
    // ANC MASTER EXCEL FORMULAS - Ported from calculator.py
    this.PIXEL_PITCH_RATES = {
      '10mm': 2500.00, // Per Sq Ft - Outdoor
      '6mm': 2200.00,   // Per Sq Ft - Outdoor
      '4mm': 1800.00,   // Per Sq Ft - Outdoor
      '1.5mm': 1500.00, // Per Sq Ft - Indoor
    };

    // ANC MASTER EXCEL RATES - Updated
    this.RATES = {
      OUTDOOR_HARDWARE: 2500.00, // Per Sq Ft (Legacy rate)
      INDOOR_HARDWARE: 1200.00,  // Per Sq Ft (Legacy rate)
      LABOR_UNION: 150.00,       // Per Hour/SqFt factor
      STRUCTURAL_BASE: 5000.00,  // Fixed mobilization fee
      STRUCTURAL_VAR: 60.00,     // Per Sq Ft
      PM_FEE: 0.08,              // 8% Project Management (ANC: 8% not 15%)
      MARGIN: 0.30,              // 30% Target Margin
      CONTINGENCY: 0.05,       // 5% for Outdoor + New Steel
      RIBBON_SURCHARGE: 0.20,    // 20% for Ribbon Boards
    };
  }

  /**
   * Calculates the full quote breakdown
   * @param {number} width - Width in feet
   * @param {number} height - Height in feet
   * @param {string} environment - 'indoor' or 'outdoor'
   * @param {number} margin - Margin as decimal (e.g. 0.32)
   * @param {string} address - Project Address
   * @param {string} pixelPitch - Pixel pitch (e.g., '10mm', '6mm', '4mm', '1.5mm')
   * @param {string} productClass - Product class (e.g., 'Ribbon Board')
   * @param {string} accessType - Service access (e.g., 'front', 'rear', 'ceiling', 'wall')
   * @param {string} steelCondition - 'existing' or 'new'
   * @param {string} timeline - 'standard', 'rush', 'asap'
   */
  calculate(width, height, pixelPitch = '1.5mm', environment = 'indoor', margin = 0.30, address = null, productClass = null, steelCondition = 'existing', accessType = 'front', timeline = 'standard') {
    // 1. Validation
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid dimensions provided.");
    }

    const area = width * height;
    const env = environment.toLowerCase().includes('outdoor') ? 'outdoor' : 'indoor';
    const targetMargin = Number(margin) || this.RATES.MARGIN;

    // 1. HARDWARE (Category 1) - ANC MASTER FORMULAS
    // Determine base rate based on Pixel Pitch
    let hardwareRate;
    if (pixelPitch && this.PIXEL_PITCH_RATES[pixelPitch]) {
      hardwareRate = this.PIXEL_PITCH_RATES[pixelPitch];
    } else {
      // Fallback to environment-based rates
      hardwareRate = env === 'outdoor' ? this.RATES.OUTDOOR_HARDWARE : this.RATES.INDOOR_HARDWARE;
    }

    const baseHardwareCost = area * hardwareRate;

    // Ribbon Board Surcharge (+20%)
    const ribbonSurcharge = productClass === 'Ribbon Board' ? baseHardwareCost * this.RATES.RIBBON_SURCHARGE : 0;

    const hardware = {
      base: baseHardwareCost,
      surcharge: ribbonSurcharge,
      spares: area * 50,
      processing: 15000
    };

    // 2. STRUCTURAL (Categories 2-3) - ANC MASTER FORMULAS
    // Materials = Hardware Base × 20%
    let structuralMaterialMod = 1.0;
    if (steelCondition === 'new') structuralMaterialMod += 0.15;  // +15% New Steel

    // Modifiers
    let structuralMod = 1.0;
    if (steelCondition === 'new') structuralMod += 0.15;  // +15% New Steel
    if (accessType === 'rigging') structuralMod += 0.10;    // +10% Rigging
    if (accessType === 'curved') structuralMod += 0.05;      // +5% Curved

    const structuralMaterials = baseHardwareCost * 0.20 * structuralMaterialMod;
    const structuralFabrication = structuralMaterials * structuralMod;  // Labor on materials

    // Structural Labor Modifiers
    let structuralLaborMod = 1.0;
    if (steelCondition === 'new') structuralLaborMod += 0.15;  // +15% New Steel
    if (accessType === 'rigging') structuralLaborMod += 0.10;   // +10% Rigging

    const structuralEngineering = 5000;
    const structuralLabor = (baseHardwareCost + structuralMaterials) * structuralLaborMod;

    const structural = {
      materials: structuralMaterials,
      modifiers: {
        steel: steelCondition,
        rigging: accessType,
        curved: accessType
      },
      engineering: 5000,
      fabrication: structuralFabrication,
      labor: structuralLabor
    };

    // 3. ELECTRICAL & DATA (Categories 5-6) - ANC MASTER FORMULAS
    // PDUs: 1.5 units per display (~$2,500/unit)
    const pduUnits = Math.ceil(area / 500);  // 1 unit per 500 sqft
    const pduCost = pduUnits * 2500;  // $2,500 per unit

    // Cabling: $15/ft based on distance
    let cableDistance = 'medium';  // Default
    if (area < 200) cableDistance = 'close';
    else if (area < 1000) cableDistance = 'medium';
    else cableDistance = 'far';
    const cableRates = { close: 15, medium: 15, far: 30 };
    const cablingCost = area * cableRates[cableDistance];

    // Subcontracting: ~80 hours labor per project at $150/hr
    const subcontractingCost = 80 * 150;

    const electrical = {
      pdus: pduCost,
      cabling: cablingCost,
      subcontracting: subcontractingCost
    };

    // 4. PROFESSIONAL SERVICES (Categories 10-13) - ANC MASTER FORMULAS
    // Project Management: Subtotal × 8%
    const pmCost = (baseHardwareCost + structuralMaterials + structuralLabor) * this.RATES.PM_FEE;

    // General Conditions: Subtotal × 5%
    const conditionsCost = (baseHardwareCost + structuralMaterials + structuralLabor) * 0.05;

    // Submittals: $2,500 per display type
    const submittalsCost = 2500;

    const proServices = {
      pm: pmCost,
      conditions: conditionsCost,
      submittals: submittalsCost
    };

    // 5. INSTALLATION LABOR (ANC Master Formulas)
    const installationLabor = area * 150;  // $150/hr × sqft
    const supervision = 7500;  // $7,500 fixed
    const travel = 3000;  // $3,000 fixed

    const labor = {
      install: installationLabor,
      supervision: supervision,
      travel: travel
    };

    // 6. INSTALLATION ASSESSMENT (ANC Master)
    const installAssessment = {
      scaffolding: env === 'outdoor' ? 12000 : 5000,
      freight: 4500,
      storage: 2000,
      timeline: timeline  // 'standard', 'rush', 'asap'
    };

    // 7. FINAL CALCULATION - ANC MASTER FORMULAS
    // Cost Basis: Hardware + Structural Materials + Structural Labor + Installation Labor + Electrical + Professional Services + Scaffolding + Freight + Storage
    const costBasis = baseHardwareCost + ribbonSurcharge + hardware.spares + hardware.processing +
                      structuralMaterials + structuralFabrication + structuralEngineering + structuralLabor +
                      labor.install + labor.supervision + labor.travel +
                      electrical.pdus + electrical.cabling + electrical.subcontracting +
                      proServices.pm + proServices.conditions + proServices.submittals +
                      installAssessment.scaffolding + installAssessment.freight + installAssessment.storage;

    // Contingency: +5% if Outdoor AND New Steel
    const contingencyMod = (env === 'outdoor' && steelCondition === 'new') ? this.RATES.CONTINGENCY : 0;
    const contingencyCost = costBasis * contingencyMod;

    // Timeline Surcharge (default is standard, can be 'rush' or 'asap')
    const timelineMod = timeline === 'rush' ? 0.20 : (timeline === 'asap' ? 0.50 : 0);
    const timelineSurchargeCost = costBasis * timelineMod;

    const totalWithMods = costBasis + contingencyCost + timelineSurchargeCost;
    const sellPrice = totalWithMods / (1 - targetMargin);
    const grossProfit = sellPrice - totalWithMods;

    return {
      meta: {
        timestamp: new Date(),
        dimensions: `${width}' x ${height}'`,
        area: area,
        type: env === 'outdoor' ? "Outdoor LED" : "Indoor LED",
        environment: env,
        address: address,
        modifiers: {
          steel: steelCondition,
          accessType: accessType,
          timeline: timeline,
          cableDistance: cableDistance,
          pixelPitch: pixelPitch,
          productClass: productClass
        }
      },
      tabs: {
        summary: {
          costBasis,
          sellPrice,
          grossProfit,
          marginPct: targetMargin * 100,
          contingency: contingencyCost,
          timelineSurcharge: timelineSurchargeCost
        },
        hardware,
        structural,
        labor,
        electrical,
        installAssessment,
        proServices,
        screenDetails: { width, height, area, resolution: "Custom" }
      }
    };
  }
}

module.exports = new AncPricingEngine();
