/**
 * Ported ANC Pricing Rules Engine
 * Derived from Natalia's requirements for interactive CPQ.
 */

const RULES = {
    hardware: {
        baseRate: (input) => {
            let rate = 800; // Default Indoor/Standard
            if (input.productClass === 'Ribbon Board' || input.productType === 'Ribbon') rate = 1200;
            if (input.pixelPitch <= 4) rate += 400; // Fine pitch premium
            if (input.pixelPitch <= 2.5) rate += 800; // Ultra fine
            if (input.environment === 'Outdoor') rate += 200; // Weatherproofing
            return rate;
        }
    },
    structural: {
        multiplier: (input) => {
            let rate = 0.20; // Base: 20% of hardware
            if (input.environment === 'Outdoor') rate += 0.05; // Wind load
            if (input.structureStatus === 'New' || input.steelType === 'New') rate += 0.15;
            if (input.mountingType === 'Rigging') rate += 0.10;
            if (input.shape === 'Curved') rate += 0.05;
            return rate;
        }
    },
    labor: {
        multiplier: (input) => {
            let rate = 0.15; // Base: 15% of (HW + Structural)
            if (input.laborJurisdiction === 'Union' || input.laborType === 'Union') rate += 0.15;
            if (input.access === 'Rear') rate += 0.02;
            return rate;
        }
    },
    shipping: 0.05,
    bond: 0.01,
    defaultMargin: 0.30
};

/**
 * Calculates a complete ANC quote from input parameters.
 * @param {object} input - User/AI provided parameters
 * @returns {object} Calculated result matching quoteData format
 */
export function calculateANCQuote(input = {}) {
    const width = parseFloat(input.width) || 0;
    const height = parseFloat(input.height) || 0;
    const sqFt = width * height;

    // 1. Hardware Base
    const baseRate = RULES.hardware.baseRate(input);
    const rawHardwareCost = sqFt * baseRate;

    // 2. Structural
    const structMult = RULES.structural.multiplier(input);
    const rawStructuralCost = rawHardwareCost * structMult;

    // 3. Labor
    const laborMult = RULES.labor.multiplier(input);
    const rawLaborCost = (rawHardwareCost + rawStructuralCost) * laborMult;

    // 4. Expenses
    const rawExpenseCost = rawHardwareCost * RULES.shipping;

    // 5. Margin
    const marginPercent = input.marginPercent !== undefined ? input.marginPercent : (RULES.defaultMargin * 100);
    const marginDecimal = marginPercent / 100;
    const markupFactor = marginDecimal === 1 ? 1 : 1 / (1 - marginDecimal);

    const hardwareSell = rawHardwareCost * markupFactor;
    const structuralSell = rawStructuralCost * markupFactor;
    const laborSell = rawLaborCost * markupFactor;
    const expenseSell = rawExpenseCost * markupFactor;

    // 6. Contingency & Bond
    let contingencyCost = 0;
    if ((input.structureStatus === 'New' || input.steelType === 'New') && input.environment === 'Outdoor') {
        contingencyCost = (hardwareSell + structuralSell + laborSell + expenseSell) * 0.05;
    }

    const partialTotal = hardwareSell + structuralSell + laborSell + expenseSell + contingencyCost;
    const bondCost = input.bondRequired ? (partialTotal * RULES.bond) : 0;

    const finalPrice = partialTotal + bondCost;

    return {
        ...input,
        width,
        height,
        screenArea: sqFt,
        hardwareCost: Math.round(hardwareSell),
        structuralCost: Math.round(structuralSell),
        laborCost: Math.round(laborSell),
        pmFee: Math.round(expenseSell * 0.2),
        expenseCost: Math.round(expenseSell),
        contingency: Math.round(contingencyCost),
        bondCost: Math.round(bondCost),
        totalCost: Math.round(rawHardwareCost + rawStructuralCost + rawLaborCost + rawExpenseCost),
        finalPrice: Math.round(finalPrice),
        marginPercent: Math.round(marginPercent),
        grossProfit: Math.round(finalPrice - (rawHardwareCost + rawStructuralCost + rawLaborCost + rawExpenseCost)),
        isAutoCalculated: true
    };
}
