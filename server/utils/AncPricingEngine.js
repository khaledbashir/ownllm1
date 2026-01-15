// server/utils/AncPricingEngine.js

/**
 * ANC Production Pricing Logic
 * Handles calculations for LED Displays based on "Master Excel" rules.
 */

class AncPricingEngine {
  constructor() {
    // These constants can eventually be moved to a DB/Config file without breaking code
    this.RATES = {
      OUTDOOR_HARDWARE: 2500.00, // Per Sq Ft
      INDOOR_HARDWARE: 1200.00,  // Per Sq Ft
      LABOR_UNION: 150.00,       // Per Hour/SqFt factor
      STRUCTURAL_BASE: 5000.00,  // Fixed mobilization fee
      STRUCTURAL_VAR: 50.00,     // Per Sq Ft
      PM_FEE: 0.15,              // 15% Project Management
      MARGIN: 0.30               // 30% Target Margin
    };
  }

  /**
   * Calculates the full quote breakdown
   * @param {number} width - Width in feet
   * @param {number} height - Height in feet
   * @param {string} environment - 'indoor' or 'outdoor'
   * @param {object} rfpSpecs - Optional specifications from RFP processing
   */
  calculate(width, height, environment = 'indoor', rfpSpecs = {}) {
    // 1. Validation
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid dimensions provided.");
    }

    const area = width * height;
    const env = environment.toLowerCase().includes('outdoor') ? 'outdoor' : 'indoor';

    // 1. LED Hardware Logic
    const hardware = {
      base: area * (env === 'outdoor' ? 2500 : 1200),
      spares: area * 50,
      processing: 15000
    };

    // 2. Structural Requirements Logic
    const structural = {
      materials: area * 60,
      engineering: 5000,
      fabrication: area * 20
    };

    // 3. Labor Analysis Logic
    const labor = {
      install: area * 150,
      supervision: 7500,
      travel: 3000
    };

    // 4. Electrical Systems Logic (Estimated)
    const electrical = {
      distribution: area * 25,
      backup: 12000,
      connectivity: 5000
    };

    // 5. Professional Services Logic
    const proServices = {
      pm: (hardware.base + structural.materials + labor.install) * 0.15,
      commissioning: 4500,
      training: 2500
    };

    // 6. Installation Assessment (Placeholder logic)
    const installAssessment = {
      scaffolding: env === 'outdoor' ? 12000 : 5000,
      freight: 4500,
      storage: 2000
    };

    const costBasis = hardware.base + hardware.spares + hardware.processing + 
                      structural.materials + structural.engineering + structural.fabrication +
                      labor.install + labor.supervision + labor.travel +
                      electrical.distribution + electrical.backup + electrical.connectivity +
                      proServices.pm + proServices.commissioning + proServices.training +
                      installAssessment.scaffolding + installAssessment.freight + installAssessment.storage;

    const sellPrice = costBasis / (1 - this.RATES.MARGIN); // 30% Margin
    const grossProfit = sellPrice - costBasis;

    return {
      meta: {
        timestamp: new Date(),
        dimensions: `${width}' x ${height}'`,
        area: area,
        type: env === 'outdoor' ? "Outdoor LED" : "Indoor LED",
        environment: env
      },
      tabs: {
        summary: { costBasis, sellPrice, grossProfit, marginPct: this.RATES.MARGIN * 100 },
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
