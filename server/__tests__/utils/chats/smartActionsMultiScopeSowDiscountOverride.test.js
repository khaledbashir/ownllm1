/* eslint-env jest */

jest.mock("../../../utils/helpers", () => ({
  getLLMProvider: () => ({
    compressMessages: async () => [],
    getChatCompletion: async () => ({
      textResponse: JSON.stringify({
        title: "Statement of Work",
        client: "Acme",
        project: "Test",
        intro: "",
        options: [
          {
            label: "Lean",
            overview: "",
            scopeIn: ["A"],
            scopeOut: ["B"],
            deliverables: ["D"],
            timeline: ["T"],
            assumptions: [],
            risks: [],
            nextSteps: [],
            pricingTable: {
              title: "Lean",
              currency: "AUD",
              discountPercent: 0,
              gstPercent: 10,
              rows: [
                {
                  role: "Tech - Integrations",
                  description: "",
                  hours: 10,
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

describe("smartActions multi_scope_sow discount override", () => {
  test("uses the provided discountPercent instead of model value", async () => {
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
      discountPercent: 7.5,
    });

    expect(result.markdown.includes("Discount: 7.5%")).toBe(true);
  });
});
