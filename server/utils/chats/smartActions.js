const { getLLMProvider } = require("../helpers");
const { recentChatHistory, chatPrompt } = require("./index");

const SMART_ACTIONS = {
  meeting_notes: "meeting_notes",
  draft_proposal: "draft_proposal",
  quick_quote: "quick_quote",
};

function isValidSmartAction(action) {
  return Object.values(SMART_ACTIONS).includes(action);
}

function smartActionUserPrompt(action) {
  switch (action) {
    case SMART_ACTIONS.meeting_notes:
      return [
        "Turn the conversation into clean Meeting Notes.",
        "Output MUST be markdown.",
        "Use this structure:",
        "- ## Meeting Notes",
        "- **Summary** (bullets)",
        "- **Key Points** (bullets)",
        "- **Decisions** (bullets, or write 'None')",
        "- **Action Items** (checklist with owners if inferable)",
        "- **Open Questions / Risks**",
        "- **Next Steps**",
        "Be concise but not vague. Do not invent facts not present in the chat.",
      ].join("\n");

    case SMART_ACTIONS.draft_proposal:
      return [
        "Draft a client-ready Proposal based on the conversation.",
        "Output MUST be markdown.",
        "If PRODUCTS/SERVICES or RATE CARD context is provided, use ONLY those prices/rates.",
        "If something is missing (scope, timeline, quantities, hours), ask clarifying questions at the end.",
        "Use this structure:",
        "- ## Proposal",
        "- **Client / Project**",
        "- **Goals**",
        "- **Scope** (in/out)",
        "- **Deliverables**",
        "- **Timeline**",
        "- **Pricing** (table)",
        "- **Assumptions**",
        "- **Risks**",
        "- **Next Steps**",
        "Be specific and professional.",
      ].join("\n");

    case SMART_ACTIONS.quick_quote:
      return [
        "Create a Quick Quote based on the conversation.",
        "Output MUST be markdown.",
        "If PRODUCTS/SERVICES or RATE CARD context is provided, use ONLY those prices/rates.",
        "Prefer a short table with line items and totals.",
        "If required inputs are missing, include an **Assumptions** section and list what you assumed.",
        "Use this structure:",
        "- ## Quick Quote",
        "- **Scope Summary**",
        "- **Pricing** (table + total)",
        "- **Assumptions**",
        "- **Next Steps**",
      ].join("\n");

    default:
      return "";
  }
}

async function runThreadSmartAction({
  workspace,
  thread,
  user,
  action,
  messageLimit = 10,
}) {
  if (!workspace) throw new Error("Missing workspace.");
  if (!thread) throw new Error("Missing thread.");
  if (!isValidSmartAction(action)) throw new Error("Invalid action.");

  const { rawHistory, chatHistory } = await recentChatHistory({
    user,
    workspace,
    thread,
    messageLimit,
  });

  const LLMConnector = getLLMProvider({
    provider: workspace?.chatProvider,
    model: workspace?.chatModel,
  });

  const systemPrompt = `${await chatPrompt(workspace, user)}\n\nYou are OwnLLM in Proposal Workbench mode. Output markdown only.`;
  const userPrompt = smartActionUserPrompt(action);

  const messages = await LLMConnector.compressMessages(
    {
      systemPrompt,
      userPrompt,
      contextTexts: [],
      chatHistory,
      attachments: [],
    },
    rawHistory
  );

  const { textResponse } = await LLMConnector.getChatCompletion(messages, {
    temperature: workspace?.openAiTemp ?? LLMConnector.defaultTemp,
    user,
  });

  return String(textResponse || "").trim();
}

module.exports = {
  SMART_ACTIONS,
  isValidSmartAction,
  runThreadSmartAction,
};
