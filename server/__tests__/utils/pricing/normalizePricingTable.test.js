/* eslint-env jest */

const {
  normalizePricingTablePayload,
} = require("../../../utils/pricing/normalizePricingTable");

describe("normalizePricingTablePayload", () => {
  const rateCard = [
    { role: "Tech - Head Of- Senior Project Management", rate: 365 },
    { role: "Tech - Delivery - Project Coordination", rate: 110 },
    { role: "Account Management - (Account Manager)", rate: 180 },
    { role: "Tech - Integrations", rate: 170 },
  ];

  test("forces AUD, clamps percents, and overrides rates", () => {
    const input = {
      title: "Investment",
      currency: "USD",
      discountPercent: 250,
      gstPercent: -5,
      rows: [
        { role: "Tech - Integrations", hours: 10, baseRate: 999 },
        { role: "Unknown Role", hours: 2, baseRate: 123 },
      ],
    };

    const { pricingTable, warnings } = normalizePricingTablePayload(input, {
      rateCardEntries: rateCard,
    });

    expect(pricingTable.currency).toBe("AUD");
    expect(pricingTable.discountPercent).toBe(100);
    expect(pricingTable.gstPercent).toBe(0);

    const integrations = pricingTable.rows.find(
      (r) => r.role === "Tech - Integrations"
    );
    expect(integrations.baseRate).toBe(170);

    const unknown = pricingTable.rows.find((r) => r.role === "Unknown Role");
    expect(unknown.baseRate).toBe(0);

    expect(warnings.some((w) => w.type === "rate_overridden")).toBe(true);
    expect(warnings.some((w) => w.type === "unknown_role")).toBe(true);
  });

  test("injects mandatory roles and enforces ordering (optional)", () => {
    const input = {
      title: "Pricing",
      rows: [{ role: "Tech - Integrations", hours: 1, baseRate: 170 }],
      discountPercent: 0,
      gstPercent: 10,
    };

    const { pricingTable } = normalizePricingTablePayload(input, {
      rateCardEntries: rateCard,
      injectMandatoryRoles: true,
    });

    // Sanity: when disabled, it does not inject
    const { pricingTable: noInject } = normalizePricingTablePayload(input, {
      rateCardEntries: rateCard,
      injectMandatoryRoles: false,
    });
    expect(noInject.rows.some((r) => r.role.includes("Account Management"))).toBe(false);

    const roles = pricingTable.rows.map((r) => r.role);

    expect(roles[0]).toBe("Tech - Head Of- Senior Project Management");
    expect(roles[1]).toBe("Tech - Delivery - Project Coordination");
    expect(roles[roles.length - 1]).toBe("Account Management - (Account Manager)");
  });

  test("fuzzy matches small typos conservatively", () => {
    const input = {
      title: "Pricing",
      rows: [
        {
          role: "Tech - Head Of- Senior Project Managment", // typo
          hours: 1,
          baseRate: 0,
        },
      ],
    };

    const { pricingTable, warnings } = normalizePricingTablePayload(input, {
      rateCardEntries: rateCard,
    });

    expect(pricingTable.rows[0].role).toBe(
      "Tech - Head Of- Senior Project Management"
    );
    expect(warnings.some((w) => w.type === "role_fuzzy_match")).toBe(true);
  });
});
