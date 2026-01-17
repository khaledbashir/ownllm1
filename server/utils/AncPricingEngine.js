// server/utils/AncPricingEngine.js

/**
 * ANC Production Pricing Logic
 * Handles calculations for LED Displays based on "Master Excel" rules.
 */

class AncPricingEngine {
  constructor() {
    // ANC PRODUCT CATALOG - Test Data (swap for real data later)
    this.PRODUCT_CATALOG = {
      'P001': { pitch: '10mm', environment: 'Outdoor', basePrice: 2500, category: 'Ribbon Board', weight: 45 },
      'P002': { pitch: '6mm', environment: 'Outdoor', basePrice: 3200, category: 'Scoreboards', weight: 65 },
      'P003': { pitch: '4mm', environment: 'Indoor', basePrice: 1800, category: 'Ribbon Board', weight: 35 },
      'P004': { pitch: '1.5mm', environment: 'Indoor', basePrice: 5500, category: 'Premium', weight: 25 },
    };

    // ANC MASTER PRICING FORMULAS - From Test Catalog
    this.PIXEL_PITCH_RATES = {
      '10mm': 2500.00,    // P001 - Outdoor Ribbon
      '6mm': 3200.00,     // P002 - Outdoor Scoreboard
      '4mm': 1800.00,     // P003 - Indoor Ribbon
      '1.5mm': 5500.00,   // P004 - Indoor Premium
    };

    // ANC MASTER EXCEL RATES - Aligned with Test Catalog Rules
    this.RATES = {
      LABOR_UNION_HOURLY: 150.00,    // $150/hour (Union labor)
      PM_FEE: 0.08,                  // 8% Project Management
      MARGIN: 0.30,                  // 30% Target Margin
      CONTINGENCY: 0.05,             // 5% for Outdoor + New Steel
      RIBBON_SURCHARGE: 0.20,        // 20% surcharge for Ribbon Board category
      STRUCTURAL_MATERIALS: 0.20,    // 20% of hardware cost
      STRUCTURAL_CURVED_MOD: 1.15,   // 1.15x multiplier for curved mounting
      LABOR_COMPLEXITY: {
        'front': 1.0,                // Front service = 1.0x
        'rear': 1.5,                 // Rear service = 1.5x (more access needed)
        'curved': 1.2,               // Curved = 1.2x (extra engineering)
      },
      LABOR_HOURS_BASE: 40,          // 40 hours per 100 sq ft
    };
  }

  /**
   * Calculates the full quote breakdown following ANC Master Rules
   * Step 1: Hardware Cost (Base) = Area × Base Price/SqFt
   * Step 2: Apply Adjustments (Ribbon Surcharge, Outdoor Contingency)
   * Step 3: Installation & Labor Costs
   * Step 4: Final Pricing with Margin
   */
  calculate(width, height, pixelPitch = '1.5mm', environment = 'Indoor', margin = 0.30, clientName = '', productCategory = 'Premium', serviceAccess = 'front', steelType = 'existing') {
    // ===== VALIDATION =====
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid dimensions: width and height must be > 0");
    }
    if (!clientName || clientName.trim() === '') {
      throw new Error("Client name is required");
    }

    const area = width * height;
    const env = environment.toLowerCase().includes('outdoor') ? 'Outdoor' : 'Indoor';
    const targetMargin = Number(margin) || this.RATES.MARGIN;

    // ===== STEP 1: HARDWARE COST (BASE) =====
    // Formula: Screen Area (sq ft) × Base Price per SqFt
    const hardwareRate = this.PIXEL_PITCH_RATES[pixelPitch] || this.PIXEL_PITCH_RATES['1.5mm'];
    const baseHardwareCost = area * hardwareRate;

    // ===== STEP 2: ADJUSTMENTS & MODIFIERS =====
    // Ribbon Board Surcharge: +20% if category = "Ribbon Board"
    const isRibbonBoard = productCategory === 'Ribbon Board';
    const ribbonSurcharge = isRibbonBoard ? baseHardwareCost * this.RATES.RIBBON_SURCHARGE : 0;
    const hardwareAfterRibbon = baseHardwareCost + ribbonSurcharge;

    // Environment Outdoor Contingency: +5% if Outdoor AND New Steel
    const isOutdoorNewSteel = (env === 'Outdoor' && steelType === 'new');
    const contingencyAmount = isOutdoorNewSteel ? hardwareAfterRibbon * this.RATES.CONTINGENCY : 0;
    const hardwareWithContingency = hardwareAfterRibbon + contingencyAmount;

    // ===== STEP 3: INSTALLATION & LABOR COSTS =====
    // 3A. Structural Materials = Hardware Cost × 0.20
    let structuralMaterials = baseHardwareCost * this.RATES.STRUCTURAL_MATERIALS;
    // Modifier: If curved mounting = ×1.15
    if (serviceAccess.toLowerCase() === 'curved') {
      structuralMaterials *= this.RATES.STRUCTURAL_CURVED_MOD;
    }

    // 3B. Installation Labor
    // Base Rate: $150/hour (Union)
    // Hours = (Screen Area / 100) × 40 hours
    const laborHours = (area / 100) * this.RATES.LABOR_HOURS_BASE;
    let complexityFactor = this.RATES.LABOR_COMPLEXITY[serviceAccess.toLowerCase()] || 1.0;
    const installationLaborCost = laborHours * this.RATES.LABOR_UNION_HOURLY * complexityFactor;

    // ===== STEP 4: FINAL CALCULATION =====
    const totalCost = hardwareWithContingency + structuralMaterials + installationLaborCost;
    
    // Add PM Fee (8% of subtotal)
    const pmFee = totalCost * this.RATES.PM_FEE;
    const costWithPM = totalCost + pmFee;

    // Calculate Sell Price with Margin
    // Sell Price = Cost / (1 - Margin%)
    const finalPrice = costWithPM / (1 - targetMargin);
    const grossProfit = finalPrice - costWithPM;

    return {
      // Client & Project Info
      clientName: clientName,
      projectType: env === 'Outdoor' ? "Outdoor LED Display" : "Indoor LED Display",
      environment: env,
      
      // Dimensions & Area
      screenWidth: width,
      screenHeight: height,
      screenArea: area,
      
      // Product Details
      pixelPitch: pixelPitch,
      category: productCategory,
      
      // COST BREAKDOWN (for Excel export)
      baseHardwareCost: baseHardwareCost,
      ribbonSurcharge: ribbonSurcharge,
      contingencyAmount: contingencyAmount,
      hardwareCost: hardwareWithContingency,
      
      structuralCost: structuralMaterials,
      laborHours: laborHours,
      complexityFactor: complexityFactor,
      laborCost: installationLaborCost,
      
      pmFee: pmFee,
      
      // FINAL PRICING
      totalCost: costWithPM,
      finalPrice: Math.round(finalPrice * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      marginPercent: (targetMargin * 100).toFixed(1),
      
      // Metadata
      quoteDate: new Date().toISOString().split('T')[0],
      serviceAccess: serviceAccess,
      steelType: steelType,
      calculationMethod: "ANC Master Formula Bank v1",
    };
  }
}

module.exports = new AncPricingEngine();
