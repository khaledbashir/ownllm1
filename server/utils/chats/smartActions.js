const { getLLMProvider } = require("../helpers");
const { recentChatHistory, chatPrompt } = require("./index");
const {
  normalizePricingTablePayload,
} = require("../pricing/normalizePricingTable");
const {
  scalePricingTableToTarget,
} = require("../pricing/scalePricingTableToTarget");
const {
  renderPricingTableMarkdown,
} = require("../pricing/renderPricingTableMarkdown");

const SMART_ACTIONS = {
  meeting_notes: "meeting_notes",
  draft_proposal: "draft_proposal",
  quick_quote: "quick_quote",
  draft_sow: "draft_sow",
  multi_scope_sow: "multi_scope_sow",
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

    case SMART_ACTIONS.draft_sow:
      return [
        "You are SOWcial Garden AI  a Senior AI Proposal Specialist.",
        "Generate a client-ready Statement of Work (SOW) based ONLY on the conversation plus any workspace knowledge base context.",
        "Output MUST be markdown (no HTML).",
        "Currency must be AUD. Always show that totals are +GST.",
        "If a workspace HOURLY RATE CARD is provided in the system prompt, you MUST use those exact role names and hourly rates.",
        "Do NOT invent, rename, or substitute roles/rates. If a required role is missing, call it out in assumptions/questions.",
        "Pricing must be represented as a structured JSON payload (for an interactive pricing table) and referenced in the markdown.",
        "Return TWO parts:",
        "1) The SOW markdown document.",
        "2) A JSON object on the final line ONLY, prefixed with: __PRICING_TABLE_JSON__=",
        "   The JSON must be strict JSON (double quotes) and must include:",
        "   {\"title\":string,\"currency\":\"AUD\",\"discountPercent\":number,\"gstPercent\":number,\"rows\":[{\"role\":string,\"description\":string,\"hours\":number,\"baseRate\":number}]}",
        "Ordering rule for pricing rows (if present):",
        "- Tech-Head Of Senior Project Management must be first",
        "- Project Coordination must be after the above",
        "- Account Management must be last",
        "If the conversation includes multiple options, output multiple SOW options (clearly labeled) and include pricing rows for each option.",
        "Use a clear SOW structure with: Overview, Objectives, Scope (In/Out), Deliverables, Timeline, Roles & Responsibilities, Assumptions, Risks, Next Steps.",
        "Avoid citations or source tags.",
      ].join("\n");

    case SMART_ACTIONS.multi_scope_sow:
      return [
        "You are SOWcial Garden AI  a Senior AI Proposal Specialist.",
        "Create THREE scope options (Lean, Standard, Premium) for the client's brief.",
        "Return STRICT JSON ONLY (no markdown, no code fences).",
        "The server will render final markdown for the user.",
        "Schema:",
        "{\"title\":string,\"client\":string,\"project\":string,\"intro\":string,\"options\":[{\"label\":\"Lean\"|\"Standard\"|\"Premium\",\"overview\":string,\"scopeIn\":[string],\"scopeOut\":[string],\"deliverables\":[string],\"timeline\":[string],\"assumptions\":[string],\"risks\":[string],\"nextSteps\":[string],\"pricingTable\":{\"title\":string,\"currency\":\"AUD\",\"discountPercent\":number,\"gstPercent\":number,\"rows\":[{\"role\":string,\"description\":string,\"hours\":number,\"baseRate\":number}]}}]}.",
        "Estimate realistic non-zero hours for delivery roles (do not use 0 hours).",
        "If a workspace HOURLY RATE CARD is provided in the system prompt, you MUST use those exact role names and hourly rates.",
        "Do NOT invent, rename, or substitute roles/rates.",
        "Always include the mandatory roles in each option pricingTable.rows:",
        "- Tech - Head Of- Senior Project Management",
        "- Tech - Delivery - Project Coordination",
        "- Account Management - (Account Manager)",
        "Avoid citations or source tags.",
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
  // For actions that support it, allow supplying a target budget.
  // Interpretation: desired subtotal after discount, ex GST.
  targetAfterDiscountExGst = null,
  // Optional override (eg from UI) for multi-scope.
  discountPercent = null,
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

  const baseSystemPrompt = await chatPrompt(workspace, user);
  const systemPrompt =
    action === SMART_ACTIONS.multi_scope_sow
      ? `${baseSystemPrompt}\n\nYou are OwnLLM in Proposal Workbench mode. Output strict JSON only.`
      : `${baseSystemPrompt}\n\nYou are OwnLLM in Proposal Workbench mode. Output markdown only.`;
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

  const raw = String(textResponse || "").trim();

  // Multi-scope SOW is returned as a single markdown document with multiple pricing tables.
  // We normalize and (optionally) budget-scale each table before rendering back to markdown.
  if (action === SMART_ACTIONS.multi_scope_sow) {
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      // If the model didn't return JSON, pass-through markdown.
      return { markdown: raw, pricingTable: null };
    }

    const {
      renderMultiScopeSowMarkdown,
    } = require("../pricing/renderMultiScopeSowMarkdown");

    const rateCard = workspace?.rateCard
      ? typeof workspace.rateCard === "string"
        ? JSON.parse(workspace.rateCard)
        : workspace.rateCard
      : [];

    const rateCardEntries = Array.isArray(rateCard)
      ? rateCard.map((r) => ({
          role: r?.name ?? r?.role,
          rate: r?.hourlyRate ?? r?.rate,
        }))
      : [];

    const mandatoryRoleNames = [
      "Tech - Head Of- Senior Project Management",
      "Tech - Delivery - Project Coordination",
      "Account Management - (Account Manager)",
    ];

    const options = Array.isArray(parsed.options) ? parsed.options : [];
    const optionsResolved = [];

    for (const option of options) {
      const rawPricing = option?.pricingTable || option?.pricing || {};
      const optionPayload =
        discountPercent == null
          ? rawPricing
          : { ...rawPricing, discountPercent: Number(discountPercent) };

      const normalized = normalizePricingTablePayload(optionPayload, {
        rateCardEntries,
        currency: "AUD",
        defaultGstPercent: 10,
        injectMandatoryRoles: true,
        mandatoryRoleNames,
      });

      let pricingTable = normalized.pricingTable;
      const warnings = [...(normalized.warnings || [])];

      if (targetAfterDiscountExGst != null) {
        const scaled = scalePricingTableToTarget(pricingTable, {
          targetAfterDiscountExGst,
          mandatoryRoleNames,
        });
        pricingTable = scaled.pricingTable;
        if (scaled.warnings?.length) warnings.push(...scaled.warnings);
      }

      optionsResolved.push({
        option,
        pricingTable: pricingTable,
        targetAfterDiscountExGst,
      });

      if (warnings.length) {
        console.warn(
          "[smartActions:multi_scope_sow] pricing normalization warnings:",
          warnings
        );
      }
    }

    const markdown = renderMultiScopeSowMarkdown(parsed, {
      optionsResolved,
    });

    return { markdown, pricingTable: null };
  }

  // For draft_sow we allow a structured payload appended to the markdown.
  if (action === SMART_ACTIONS.draft_sow) {
    const marker = "__PRICING_TABLE_JSON__=";
    const markerIndex = raw.lastIndexOf(marker);

    if (markerIndex !== -1) {
      const markdown = raw.slice(0, markerIndex).trim();
      const jsonText = raw.slice(markerIndex + marker.length).trim();
      let pricingTable = null;
      try {
        pricingTable = JSON.parse(jsonText);
      } catch {
        pricingTable = null;
      }

      // Normalize pricingTable against workspace rate card.
      if (pricingTable && typeof pricingTable === "object") {
        try {
          const rateCard = workspace?.rateCard
            ? typeof workspace.rateCard === "string"
              ? JSON.parse(workspace.rateCard)
              : workspace.rateCard
            : [];

          const rateCardEntries = Array.isArray(rateCard)
            ? rateCard.map((r) => ({
                role: r?.name ?? r?.role,
                rate: r?.hourlyRate ?? r?.rate,
              }))
            : [];

          const normalized = normalizePricingTablePayload(pricingTable, {
            rateCardEntries,
            currency: "AUD",
            defaultGstPercent: 10,
            injectMandatoryRoles: true,
            mandatoryRoleNames: [
              "Tech - Head Of- Senior Project Management",
              "Tech - Delivery - Project Coordination",
              "Account Management - (Account Manager)",
            ],
          });

          pricingTable = normalized.pricingTable;
          if (normalized.warnings?.length) {
            console.warn(
              "[smartActions:draft_sow] pricing normalization warnings:",
              normalized.warnings
            );
          }
        } catch (e) {
          console.warn(
            "[smartActions:draft_sow] pricing normalization failed:",
            e?.message || e
          );
        }
      }

      return { markdown, pricingTable };
    }

    return { markdown: raw, pricingTable: null };
  }

  return raw;
}

module.exports = {
  SMART_ACTIONS,
  isValidSmartAction,
  runThreadSmartAction,
};
