/* eslint-env jest */

const { scalePricingTableToTarget } = require("../../../utils/pricing/scalePricingTableToTarget");
const { computePricingSummary } = require("../../../utils/pricing/pricingMath");

describe("scalePricingTableToTarget", () => {
  test("scales hours to meet target after-discount subtotal", () => {
    const pricingTable = {
      title: "Pricing",
      currency: "AUD",
      discountPercent: 10,
      gstPercent: 10,
      rows: [
        {
          role: "Tech - Delivery - Frontend Development",
          description: "",
          hours: 40,
          baseRate: 200,
        },
        {
          role: "Tech - Head Of- Senior Project Management",
          description: "",
          hours: 4,
          baseRate: 365,
        },
      ],
    };

    const targetAfterDiscountExGst = 9000; // ex GST, after 10% discount

    const result = scalePricingTableToTarget(pricingTable, {
      targetAfterDiscountExGst,
      mandatoryRoleNames: ["Tech - Head Of- Senior Project Management"],
    });

    const summary = computePricingSummary(result.pricingTable);
    // We can't expect exact equality after hour rounding; allow small error.
    expect(summary.discountedSubtotalExGst).toBeGreaterThan(8500);
    expect(summary.discountedSubtotalExGst).toBeLessThan(9500);

    // Mandatory role should still have non-zero hours.
    const pm = result.pricingTable.rows.find(
      (r) => r.role === "Tech - Head Of- Senior Project Management"
    );
    expect(pm.hours).toBeGreaterThan(0);
  });
});
