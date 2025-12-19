/* eslint-env jest */

jest.mock("../../../utils/helpers", () => ({
  getLLMProvider: () => ({
    compressMessages: async () => [],
    getChatCompletion: async () => ({
      textResponse: JSON.stringify({
        title: "Statement of Work",
        client: "Acme",
        project: "HubSpot integration + landing pages",
        intro: "Three options.",
        options: [
          {
            label: "Lean",
            overview: "Lean overview",
            scopeIn: ["Item A"],
            scopeOut: ["Item B"],
            deliverables: ["Deliverable A"],
            timeline: ["2 weeks"],
            assumptions: ["Assumption"],
            risks: ["Risk"],
            nextSteps: ["Next"],
            pricingTable: {
              title: "Lean Pricing",
              currency: "AUD",
              discountPercent: 5,
              gstPercent: 10,
              rows: [
                {
                  role: "Tech - Integrations",
                  description: "",
                  hours: 20,
                  baseRate: 999,
                },
              ],
            },
          },
          {
            label: "Standard",
            overview: "Standard overview",
            scopeIn: ["Item A", "Item C"],
            scopeOut: ["Item B"],
            deliverables: ["Deliverable A", "Deliverable C"],
            timeline: ["3 weeks"],
            assumptions: ["Assumption"],
            risks: ["Risk"],
            nextSteps: ["Next"],
            pricingTable: {
              title: "Standard Pricing",
              currency: "AUD",
              discountPercent: 5,
              gstPercent: 10,
              rows: [
                {
                  role: "Tech - Integrations",
                  description: "",
                  hours: 30,
                  baseRate: 999,
                },
              ],
            },
          },
          {
            label: "Premium",
            overview: "Premium overview",
            scopeIn: ["Item A", "Item C", "Item D"],
            scopeOut: ["Item B"],
            deliverables: ["Deliverable A", "Deliverable C", "Deliverable D"],
            timeline: ["4 weeks"],
            assumptions: ["Assumption"],
            risks: ["Risk"],
            nextSteps: ["Next"],
            pricingTable: {
              title: "Premium Pricing",
              currency: "AUD",
              discountPercent: 5,
              gstPercent: 10,
              rows: [
                {
                  role: "Tech - Integrations",
                  description: "",
                  hours: 40,
                  baseRate: 999,
                },
              ],
            },
          },
        ],
      }),
    }),
    defaultTemp: 0.7,
  }),
}));

jest.mock("../../../utils/chats/index", () => ({
  recentChatHistory: async () => ({ rawHistory: [], chatHistory: [] }),
  chatPrompt: async () => "",
}));

const { runThreadSmartAction, SMART_ACTIONS } = require("../../../utils/chats/smartActions");

describe("smartActions multi_scope_sow", () => {
  test("returns markdown containing three pricing tables", async () => {
    const workspace = {
      chatProvider: "mock",
      chatModel: "mock",
      rateCard: JSON.stringify([
        { id: "1", name: "Tech - Integrations", rate: 170 },
        { id: "2", name: "Tech - Head Of- Senior Project Management", rate: 365 },
        { id: "3", name: "Tech - Delivery - Project Coordination", rate: 110 },
        { id: "4", name: "Account Management - (Account Manager)", rate: 180 },
      ]),
      openAiTemp: 0,
    };

    const result = await runThreadSmartAction({
      workspace,
      thread: { id: 1 },
      user: { id: 1 },
      action: SMART_ACTIONS.multi_scope_sow,
      targetAfterDiscountExGst: 22000,
      discountPercent: 5,
    });

    expect(result).toBeTruthy();
    expect(typeof result.markdown).toBe("string");

    // Should have 3 separate markdown pipe tables.
    const tables = result.markdown.match(/\n\| Role \| Description \| Hours \| Rate \(AUD ex GST\) \| Line total \(AUD ex GST\) \|\n/g);
    expect(tables?.length).toBe(3);

    // Should not leak JSON.
    expect(result.markdown.includes("__PRICING_TABLE_JSON__=")).toBe(false);

    // Rate should be normalized using rate card.
    expect(result.markdown.includes("| Tech - Integrations ")).toBe(true);
    expect(result.markdown.includes("| 170 ")).toBe(true);

    // Mandatory roles injected.
    expect(
      result.markdown.includes("Tech - Head Of- Senior Project Management")
    ).toBe(true);
    expect(result.markdown.includes("Tech - Delivery - Project Coordination")).toBe(true);
    expect(
      result.markdown.includes("Account Management - (Account Manager)")
    ).toBe(true);
  });
});
