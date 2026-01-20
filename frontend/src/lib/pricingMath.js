/**
 * Pricing Logic Engine for ownllm1
 * Inspired by Natalia's CPQ but adapted for AI infrastructure/managed services.
 */

export const TIERS = {
    ESTIMATOR: {
        baseFee: 2500,
        monthlyRetainer: 400,
        multiplier: 1.0,
        label: "Estimator Engine"
    },
    SOVEREIGN: {
        baseFee: 4500,
        monthlyRetainer: 600,
        multiplier: 1.5,
        label: "Sovereign Intelligence OS"
    }
};

/**
 * Calculates a project quote based on scale and tier.
 * @param {number} scale - Scale factor (1-10)
 * @param {string} tierKey - 'ESTIMATOR' or 'SOVEREIGN'
 * @param {number} margin - Target margin percentage (0-100), default 30
 * @returns {object} Calculated pricing details
 */
export function calculateProjectQuote(scale = 5, tierKey = 'ESTIMATOR', margin = 30) {
    const tier = TIERS[tierKey] || TIERS.ESTIMATOR;

    // Base math: Fee scales with project complexity/scale
    // We use a non-linear scale for "Vibe"
    const scaleFactor = 1 + (scale - 1) * 0.2; // 1.0 at scale 1, 2.8 at scale 10

    const internalCost = tier.baseFee * scaleFactor;

    // Apply margin logic similar to Natalia's engine: Sell = Cost / (1 - Margin)
    const marginDecimal = margin / 100;
    const sellPrice = internalCost / (1 - marginDecimal);

    // Monthly infrastructure scales slightly with scale
    const monthlyRetainer = tier.monthlyRetainer + (scale - 1) * 50;

    return {
        buildFee: Math.round(sellPrice),
        monthlyRetainer: Math.round(monthlyRetainer),
        breakdown: {
            hardware: Math.round(sellPrice * 0.45),
            intelligence: Math.round(sellPrice * 0.35),
            support: Math.round(sellPrice * 0.20)
        }
    };
}
