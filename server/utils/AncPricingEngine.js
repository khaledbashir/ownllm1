// server/utils/AncPricingEngine.js

/**
 * ANC Production Pricing Logic (Waterfall Methodology)
 * Updated to reflect strict business rules (v2.0)
 */

class AncPricingEngine {
  constructor() {
    // 1. BASE HARDWARE RATES (per sq ft)
    this.BASE_RATES = {
      INDOOR_STANDARD: 800,
      RIBBON_BOARD: 1200,
      OUTDOOR_PREMIUM_ADDER: 200,
    };

    // 2. PIXEL PITCH ADDERS (per sq ft)
    this.PITCH_ADDERS = {
      FINE_PITCH: 400,     // <= 4mm
      ULTRA_FINE: 800,     // <= 2.5mm
      COARSE_DISCOUNT: 0.85 // 16mm or greater get 15% off base
    };

    // 3. PRODUCT CLASS MULTIPLIERS (applied to base rate)
    this.PRODUCT_MULTIPLIERS = {
      'Center Hung': 1.30,
      'Vomitory': 1.15,
      'Standard': 1.0,
    };

    // 4. STRUCTURAL MODIFIERS (Applied to Structural Base Cost)
    this.STRUCTURAL_MODIFIERS = {
      CURVED: 0.05,
      OUTDOOR_WIND: 0.05,
      RIGGING: 0.10,
      NEW_STEEL: 0.15,
    };

    // 5. LABOR MODIFIERS (Applied to Labor Base Cost)
    this.LABOR_MODIFIERS = {
      UNION: 0.15,      // Makes total labor rate ~30%
      PREVAILING: 0.10, // Makes total labor rate ~25%
      NON_UNION: 0.0,   // Standard base 15%
      REAR_ACCESS: 0.02,
      FRONT_ACCESS: 0.15,
    };

    // 6. GLOBAL PERCENTAGES
    this.RATES = {
      STRUCTURAL_BASE_ PCT: 0.20, // 20% of Hardware
      LABOR_BASE_PCT: 0.15,       // 15% of (Hardware + Structural)
      PM_FEE: 0.08,
      SHIPPING: 0.05,
      BOND: 0.01,
      DEFAULT_MARGIN: 0.30,
    };
  }

  /**
   * Main Calculation Method
   */
  calculate(
    width, 
    height, 
    pixelPitch = 4, // Int or float
    environment = 'Indoor', 
    margin = 0.30, 
    clientName = '', 
    productClass = 'Scoreboard', // "Scoreboard", "Ribbon Board", "Center Hung", "Vomitory"
    serviceAccess = 'Front', 
    steelType = 'Existing',
    laborType = 'Non-Union',
    shape = 'Flat',
    mountingType = 'Wall',
    bondRequired = 'No',
    unitCostOverride = null
  ) {
    // A. Validation
    if (!width || !height || width <= 0) throw new Error("Invalid dimensions");
    
    // Normalization
    const env = environment.toLowerCase() === 'outdoor' ? 'Outdoor' : 'Indoor';
    const pitch = Number(pixelPitch) || 10;
    const area = width * height;
    const access = serviceAccess.toLowerCase();
    const isCurved = shape.toLowerCase() === 'curved';
    const isNewSteel = steelType.toLowerCase() === 'new';
    const isOutdoor = env === 'Outdoor';

    // ==========================================================
    // STEP 1: HARDWARE COST CALCULATION
    // ==========================================================
    let baseRatePerSqFt = 0;

    // 1-A: Determine Base Product Rate
    if (productClass === 'Ribbon Board') {
      baseRatePerSqFt = this.BASE_RATES.RIBBON_BOARD;
    } else {
      baseRatePerSqFt = this.BASE_RATES.INDOOR_STANDARD;
    }

    // 1-B: Outdoor Adder
    if (isOutdoor) {
      baseRatePerSqFt += this.BASE_RATES.OUTDOOR_PREMIUM_ADDER;
    }

    // 1-C: Product Class Multipliers (Center Hung / Vomitory)
    const classMult = this.PRODUCT_MULTIPLIERS[productClass] || 1.0;
    baseRatePerSqFt = baseRatePerSqFt * classMult;

    // 1-D: Pixel Pitch Modifiers
    if (pitch <= 2.5) {
      baseRatePerSqFt += this.PITCH_ADDERS.ULTRA_FINE;
    } else if (pitch <= 4) {
      baseRatePerSqFt += this.PITCH_ADDERS.FINE_PITCH;
    } else if (pitch >= 16) {
      baseRatePerSqFt = baseRatePerSqFt * this.PITCH_ADDERS.COARSE_DISCOUNT;
    }

    // 1-E: Manual Override (Waterfall Priority 1)
    if (unitCostOverride && unitCostOverride > 0) {
      baseRatePerSqFt = unitCostOverride;
    }

    const totalHardwareCost = area * baseRatePerSqFt;

    // ==========================================================
    // STEP 2: STRUCTURAL MATERIALS
    // ==========================================================
    // Base: 20% of Hardware
    let structBase = totalHardwareCost * this.RATES['STRUCTURAL_BASE_ PCT'];
    let structModifiers = 0;

    if (isCurved) structModifiers += this.STRUCTURAL_MODIFIERS.CURVED;
    if (isOutdoor) structModifiers += this.STRUCTURAL_MODIFIERS.OUTDOOR_WIND;
    if (mountingType.toLowerCase() === 'rigging') structModifiers += this.STRUCTURAL_MODIFIERS.RIGGING;
    if (isNewSteel) structModifiers += this.STRUCTURAL_MODIFIERS.NEW_STEEL;

    const totalStructuralCost = structBase * (1 + structModifiers);

    // ==========================================================
    // STEP 3: LABOR & INSTALLATION
    // ==========================================================
    // Base: 15% of (Hardware + Structural)
    const costUseBias = totalHardwareCost + totalStructuralCost;
    let laborBase = costUseBias * this.RATES.LABOR_BASE_PCT;
    let laborModifiers = 0;

    // Labor Type Modifiers
    if (laborType === 'Union') laborModifiers += this.LABOR_MODIFIERS.UNION;
    if (laborType === 'Prevailing') laborModifiers += this.LABOR_MODIFIERS.PREVAILING;

    // Access Modifiers
    if (access === 'front') laborModifiers += this.LABOR_MODIFIERS.FRONT_ACCESS;
    if (access === 'rear') laborModifiers += this.LABOR_MODIFIERS.REAR_ACCESS;

    const totalLaborCost = laborBase * (1 + laborModifiers);

    // ==========================================================
    // STEP 4: EXPENSES & PM
    // ==========================================================
    const shippingCost = totalHardwareCost * this.RATES.SHIPPING;
    const pmFee = (totalHardwareCost + totalStructuralCost + totalLaborCost) * this.RATES.PM_FEE;
    
    // Subtotal before contingency and margin
    const subtotal = totalHardwareCost + totalStructuralCost + totalLaborCost + shippingCost + pmFee;

    // ==========================================================
    // STEP 5: CONTINGENCY & BOND
    // ==========================================================
    // Dynamic Contingency: Outdoor + New Steel = +5% risk buffer
    let contingencyAmt = 0;
    if (isOutdoor && isNewSteel) {
      contingencyAmt = subtotal * 0.05;
    }

    // Bond Cost (1% of Contract Value - iterative estimation)
    // Approximate contract value first
    let estimatedSell = (subtotal + contingencyAmt) / (1 - margin);
    let bondCost = (bondRequired === 'Yes') ? (estimatedSell * this.RATES.BOND) : 0;

    const totalCostBasis = subtotal + contingencyAmt + bondCost;

    // ==========================================================
    // STEP 6: FINAL PRICE
    // ==========================================================
    const finalSellPrice = totalCostBasis / (1 - margin);
    const grossProfit = finalSellPrice - totalCostBasis;

    return {
      clientName,
      projectType: `${env} ${productClass}`,
      environment: env,
      pixelPitch: pitch,
      screenArea: area,
      screenWidth: width,
      screenHeight: height,
      
      // Breakdown
      baseRatePerSqFt,
      unitCostOverride,
      hardwareCost: totalHardwareCost,
      structuralCost: totalStructuralCost,
      laborCost: totalLaborCost,
      shippingCost,
      pmFee,
      contingency: contingencyAmt,
      bondCost,
      
      // Totals
      totalCost: totalCostBasis,
      finalPrice: Math.round(finalSellPrice * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      marginPercent: (margin * 100).toFixed(1),
      
      calculationMethod: "ANC Waterfall v2.0",
      productClass,
      steelType,
      laborType
    };
  }
}

module.exports = new AncPricingEngine();
