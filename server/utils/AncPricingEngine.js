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
   */
  calculate(width, height, environment = 'indoor') {
    // 1. Validation (Don't calculate garbage)
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Invalid dimensions provided.");
    }

    const area = width * height;
    const isOutdoor = environment.toLowerCase().includes('outdoor');

    // 2. Line Item Calculations
    const hardwareRate = isOutdoor ? this.RATES.OUTDOOR_HARDWARE : this.RATES.INDOOR_HARDWARE;
    const hardwareCost = area * hardwareRate;

    const laborCost = area * this.RATES.LABOR_UNION;
    
    // Structural = Base Fee + Variable based on size
    const structuralCost = this.RATES.STRUCTURAL_BASE + (area * this.RATES.STRUCTURAL_VAR);

    // Electrical (Estimated at 5% of hardware)
    const electricalCost = hardwareCost * 0.05;

    // Subtotal for PM Calculation
    const constructionSubtotal = hardwareCost + laborCost + structuralCost + electricalCost;
    const pmCost = constructionSubtotal * this.RATES.PM_FEE;

    // 3. Totals
    const costBasis = constructionSubtotal + pmCost;
    
    // Margin Calculation (Sell Price = Cost / (1 - Margin%))
    // This is the standard "Gross Margin" formula, NOT a simple markup.
    const sellPrice = costBasis / (1 - this.RATES.MARGIN);
    const grossProfit = sellPrice - costBasis;

    return {
      meta: {
        timestamp: new Date(),
        dimensions: `${width}' x ${height}'`,
        area: area,
        type: isOutdoor ? "Outdoor LED" : "Indoor LED"
      },
      lineItems: {
        hardware: hardwareCost,
        labor: laborCost,
        structural: structuralCost,
        electrical: electricalCost,
        projectManagement: pmCost
      },
      financials: {
        costBasis: costBasis,
        sellPrice: sellPrice,
        marginAmt: grossProfit,
        marginPct: this.RATES.MARGIN * 100
      }
    };
  }
}

module.exports = new AncPricingEngine();
