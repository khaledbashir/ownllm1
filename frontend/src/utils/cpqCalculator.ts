import { CPQInput, CalculationResult, ScreenConfig } from './types';

// Pricing Rules Engine
// These rules encapsulate the "Estimator Logic" derived from Natalia's requirements.
const RULES = {
    hardware: {
        baseRate: (input: any) => {
            let rate = 800; // Default Indoor/Standard
            if (input.productClass === 'Ribbon') rate = 1200;
            if (input.pixelPitch <= 4) rate += 400; // Fine pitch premium
            if (input.pixelPitch <= 2.5) rate += 800; // Ultra fine
            if (input.environment === 'Outdoor') rate += 200; // Weatherproofing
            return rate;
        }
    },
    structural: {
        multiplier: (input: any) => {
            let rate = 0.20; // Base: 20% of hardware
            // Modifiers
            if (input.environment === 'Outdoor') rate += 0.05; // Wind load
            if (input.structureCondition === 'NewSteel') rate += 0.15; // New steel is expensive
            if (input.mountingType === 'Rigging') rate += 0.10; // Complex rigging
            if (input.shape === 'Curved') rate += 0.05; // Custom framing
            return rate;
        }
    },
    labor: {
        multiplier: (input: any) => {
            let rate = 0.15; // Base: 15% of (HW + Structural)
            if (input.laborType === 'Union') rate += 0.15; // Union double cost roughly
            if (input.laborType === 'Prevailing') rate += 0.10;
            if (input.access === 'Rear') rate += 0.02; // Slower install
            return rate;
        }
    },
    shipping: 0.05, // 5%
    bond: 0.01, // 1%
    margin: 0.30 // Target margin
};

export function calculateScreen(config: Partial<ScreenConfig> | CPQInput): CalculationResult {
    const input = config as any;

    // 1. Dimensions & Base Cost
    const sqFt = (input.widthFt || 0) * (input.heightFt || 0);
    const baseRate = RULES.hardware.baseRate(input);
    const rawHardwareCost = sqFt * baseRate;

    // 2. Structural Cost
    const structMult = RULES.structural.multiplier(input);
    const rawStructuralCost = rawHardwareCost * structMult;

    // 3. Labor Cost
    const laborMult = RULES.labor.multiplier(input);
    const rawLaborCost = (rawHardwareCost + rawStructuralCost) * laborMult;

    // 4. Expenses & Shipping
    const rawExpenseCost = rawHardwareCost * RULES.shipping;

    // 5. Margin Calculation
    // Total Cost = HW + Struct + Labor + Exp
    const subTotalCost = rawHardwareCost + rawStructuralCost + rawLaborCost + rawExpenseCost;

    // Sell Price = Cost / (1 - Margin)
    const targetMargin = (input.targetMargin !== undefined && input.targetMargin > 0)
        ? input.targetMargin / 100
        : RULES.margin;

    const markupFactor = 1 / (1 - targetMargin);

    // Distribute markup to line items for "Client Facing" break down
    const hardwareSell = rawHardwareCost * markupFactor;
    const structuralSell = rawStructuralCost * markupFactor;
    const laborSell = rawLaborCost * markupFactor;
    const expenseSell = rawExpenseCost * markupFactor;

    // 6. Contingency (Value Add Feature)
    let contingencyCost = 0;
    // High risk project logic
    if (input.structureCondition === 'NewSteel' && input.environment === 'Outdoor') {
        contingencyCost = (subTotalCost * markupFactor) * 0.05;
    }

    // 7. Bond
    let bondCost = 0;
    if (input.bondRequired) {
        // Bond is usually on the total contract value
        const partialTotal = hardwareSell + structuralSell + laborSell + expenseSell + contingencyCost;
        bondCost = partialTotal * RULES.bond;
    }

    const totalSellPrice = hardwareSell + structuralSell + laborSell + expenseSell + contingencyCost + bondCost;

    // Power Calculation
    const wattsPerSqFt = input.environment === 'Outdoor' ? 65 : 35;
    const totalWatts = sqFt * wattsPerSqFt;
    const powerAmps = Math.round(totalWatts / 120); // 120V reference

    // Detailed Breakdown for Expert View (Distributing the calculated buckets into line items)
    const costBreakdown: { [key: string]: number } = {
        '1. Hardware': Math.round(hardwareSell * 0.95), // 95% Display
        '2. Structural Materials': Math.round(structuralSell * 0.65),
        '3. Structural Labor': Math.round(structuralSell * 0.35),
        '4. LED Installation': Math.round(laborSell * 0.45),
        '5. Electrical Materials': Math.round(laborSell * 0.05),
        '6. Electrical Labor': Math.round(laborSell * 0.10),
        '7. CMS Equipment': Math.round(hardwareSell * 0.05), // 5% CMS
        '8. CMS Installation': Math.round(laborSell * 0.05),
        '9. CMS Commissioning': Math.round(laborSell * 0.05),
        '10. Project Management': Math.round(expenseSell * 0.20),
        '11. General Conditions': Math.round(expenseSell * 0.10),
        '12. Travel & Expenses': Math.round(expenseSell * 0.40),
        '13. Submittals': Math.round(expenseSell * 0.05),
        '14. Engineering': Math.round(expenseSell * 0.15),
        '15. Permits': Math.round(expenseSell * 0.10),
        '16. Final Commissioning': Math.round(laborSell * 0.30),
        '17. Bond': Math.round(bondCost),
        '18. Contingency': Math.round(contingencyCost)
    };

    return {
        sqFt,
        hardwareCost: Math.round(hardwareSell),
        structuralCost: Math.round(structuralSell),
        laborCost: Math.round(laborSell),
        pmCost: Math.round(expenseSell * 0.2), // PM is part of expenses usually
        expenseCost: Math.round(expenseSell * 0.8),
        bondCost: Math.round(bondCost),
        contingencyCost: Math.round(contingencyCost),
        totalCost: Math.round(subTotalCost), // Internal Cost
        sellPrice: Math.round(totalSellPrice),
        margin: targetMargin,
        powerAmps,
        costBreakdown
    };
}

export function calculateCPQ(input: CPQInput): CalculationResult {
    // 1. Calculate the active screen (current state)
    const activeResult = calculateScreen(input);

    // 2. If no additional screens, just return active
    if (!input.screens || input.screens.length === 0) {
        return activeResult;
    }

    // 3. Otherwise, map and sum all screens including active
    const otherResults = input.screens.map(s => calculateScreen({ ...input, ...s }));
    const allResults = [...otherResults, activeResult];

    return allResults.reduce((acc, curr) => {
        // Sum breakdowns
        const mergedBreakdown: { [key: string]: number } = {};
        if (acc.costBreakdown && curr.costBreakdown) {
            for (const key in acc.costBreakdown) {
                mergedBreakdown[key] = (acc.costBreakdown[key] || 0) + (curr.costBreakdown[key] || 0);
            }
        }

        return {
            sqFt: acc.sqFt + curr.sqFt,
            hardwareCost: acc.hardwareCost + curr.hardwareCost,
            structuralCost: acc.structuralCost + curr.structuralCost,
            laborCost: acc.laborCost + curr.laborCost,
            pmCost: acc.pmCost + curr.pmCost,
            expenseCost: acc.expenseCost + curr.expenseCost,
            bondCost: acc.bondCost + curr.bondCost,
            contingencyCost: acc.contingencyCost + curr.contingencyCost,
            totalCost: acc.totalCost + curr.totalCost,
            sellPrice: acc.sellPrice + curr.sellPrice,
            margin: input.targetMargin ? input.targetMargin / 100 : RULES.margin,
            powerAmps: acc.powerAmps + curr.powerAmps,
            costBreakdown: mergedBreakdown
        };
    });
}
