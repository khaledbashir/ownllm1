/* eslint-env jest */

jest.mock("../../../utils/helpers", () => ({
  getLLMProvider: () => ({
    compressMessages: async () => [],
    getChatCompletion: async () => ({
      textResponse: [
        "## SOW",
        "__PRICING_TABLE_JSON__={\"title\":\"Pricing\",\"currency\":\"AUD\",\"discountPercent\":0,\"gstPercent\":10,\"rows\":[{\"role\":\"Tech - Integrations\",\"description\":\"\",\"hours\":2,\"baseRate\":999}]}"
      ].join("\n"),
    }),
    defaultTemp: 0.7,
  }),
}));

jest.mock("../../../utils/chats/index", () => ({
  recentChatHistory: async () => ({ rawHistory: [], chatHistory: [] }),
  chatPrompt: async () => "",
}));

const { runThreadSmartAction, SMART_ACTIONS } = require("../../../utils/chats/smartActions");

describe("smartActions draft_sow pricing normalization", () => {
  test("overrides baseRate using workspace rate card", async () => {
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
      action: SMART_ACTIONS.draft_sow,
    });

    const integrations = result.pricingTable.rows.find(
      (r) => r.role === "Tech - Integrations"
    );
    expect(integrations.baseRate).toBe(170);

    // Mandatory roles are injected with estimated hours if missing.
    const pm = result.pricingTable.rows.find(
      (r) => r.role === "Tech - Head Of- Senior Project Management"
    );
    expect(pm).toBeTruthy();
    expect(pm.hours).toBeGreaterThan(0);

    const coord = result.pricingTable.rows.find(
      (r) => r.role === "Tech - Delivery - Project Coordination"
    );
    expect(coord).toBeTruthy();
    expect(coord.hours).toBeGreaterThan(0);

    const am = result.pricingTable.rows.find(
      (r) => r.role === "Account Management - (Account Manager)"
    );
    expect(am).toBeTruthy();
    expect(am.hours).toBeGreaterThan(0);
  });
});
