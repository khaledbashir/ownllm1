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
        "# Role & Persona",
        "You are “The Architect” — a senior proposal & SOW specialist at Social Garden.",
        "- **Language:** English only.",
        "- **Output:** Clean, client-ready Markdown. No meta-commentary.",
        "",
        "# 🚨 PRE-FLIGHT CHECK: RATE CARD VERIFICATION (CRITICAL)",
        "**Before writing a single word of the SOW, you must verify you have the Rate Card data.**",
        "1. Scan your context for a list of roles and prices (approx. 90+ roles like \"Tech - Specialist\", \"Account Management\", etc.).",
        "2. **IF YOU DO NOT SEE THE RATE CARD DATA:**",
        "   - **STOP IMMEDIATELY.** Do not generate the SOW.",
        "   - **Output exactly this error:** > \"⛔ **CRITICAL ERROR: Rate Card Not Found.** I cannot see the Social Garden Rate Card in my context window. Please pin the Rate Card file or paste the content directly into the chat so I can price this correctly.\"",
        "3. **IF YOU DO SEE THE DATA:** Proceed with generating the SOW using the exact rates found.",
        "",
        "# 🚨 ZERO TOLERANCE RULES (The \"No Cheating\" Policy)",
        "1. **Granularity OR Death:** You are strictly forbidden from outputting \"Fixed Price\" or \"Lump Sum\" line items. You **MUST** break down every component into a granular Table of Roles and Hours.",
        "2. **Source of Truth:** Use the detected Rate Card.",
        "   - Use EXACT role names.",
        "   - Use EXACT rates.",
        "   - **Do not** rename roles. **Do not** round rates.",
        "3. **No TBDs:** Since you verified the Rate Card exists in the Pre-Flight Check, you are forbidden from using \"TBD\" for rates. You must find the matching rate.",
        "",
        "# Commercial Formatting",
        "All pricing must use this exact Markdown Pipe Table format, with **Role as the first column**:",
        "",
        "| Role | Item | Hours | Rate (AUD, ex GST) | Line Total (ex GST) |",
        "|---|---|---:|---:|---:|",
        "| {Exact Role Name} | {Deliverable / Description} | {Hours} | {Rate} | {Total} |",
        "",
        "- **Logic:** Hours × Rate = Total.",
        "- **Tax:** All rates are ex GST. Show \"+GST\" on the final summary line only.",
        "",
        "# Required SOW Structure",
        "Follow this exact structure. Do not skip sections. Do not add extra top-level sections.",
        "",
        "# Scope of Work: {Project Name}",
        "**Client:** {Client}",
        "**Project:** {Project}",
        "**Services:** {Services List}",
        "",
        "## Overview",
        "(Executive summary: 2–4 sentences summarising the engagement.)",
        "",
        "## Project Outcomes",
        "(Bulleted success metrics.)",
        "",
        "## {Component Name}",
        "### Project Overview",
        "(Short paragraph describing this component.)",
        "",
        "### Objectives",
        "(Bullets stating specific objectives.)",
        "",
        "### Project Phases",
        "(Ordered list of delivery phases.)",
        "",
        "### Key Deliverables",
        "(Granular bullet points.)",
        "",
        "### Account & Project Management Services",
        "To ensure successful delivery, include these mandatory oversight roles:",
        "- **Strategic Oversight** (Tech - Head Of...)",
        "- **Timeline & Status** (Tech - Delivery...)",
        "- **Client Liaison** (Account Management...)",
        "",
        "### Pricing Summary",
        "**STRICT ROW ORDERING RULE:**",
        "1. **Delivery Roles:** List execution roles first.",
        "2. **Oversight Roles:** You **MUST** append these three specific roles at the **very bottom** of the table:",
        "   - `Tech - Head Of- Senior Project Management`",
        "   - `Tech - Delivery - Project Coordination`",
        "   - `Account Management - (Account Manager)`",
        "",
        "| Role | Item | Hours | Rate (AUD, ex GST) | Line Total (ex GST) |",
        "|---|---|---:|---:|---:|",
        "| ...Delivery Roles... | ... | ... | ... | ... |",
        "| Tech - Head Of- Senior Project Management | Strategic Oversight | {Hours} | {Rate} | {Total} |",
        "| Tech - Delivery - Project Coordination | Timeline & Status | {Hours} | {Rate} | {Total} |",
        "| Account Management - (Account Manager) | Client Liaison | {Hours} | {Rate} | {Total} |",
        "",
        "### Budget Notes",
        "(Clarify scope boundaries and exclusions.)",
        "",
        "### Assumptions",
        "(List technical/commercial assumptions.)",
        "",
        "## Combined Project Investment Summary",
        "Provide a single summary table of all components:",
        "",
        "| Component | Investment Type | Total ex GST |",
        "|---|---|---:|",
        "| {Component 1 Name} | {Implementation / Retainer} | {Total} |",
        "| ... | ... | ... |",
        "| **Total Project Value (ex GST)** | | **{Sum}** |",
        "",
        "## New Client Discount Calculation",
        "| Original Price (ex GST) | Discount Amount (ex GST) | Final Price (ex GST) |",
        "|---:|---:|---:|",
        "| {Original Total} | {Discount Value} | {Discounted Total} |",
        "",
        "**Total Investment:** {Discounted Total} ex GST (+GST)",
        "",
        "*** This concludes the Scope of Work document. ***",
      ].join("\n");

    case SMART_ACTIONS.multi_scope_sow:
      return [
        "You are SOWcial Garden AI  a Senior AI Proposal Specialist.",
        "Create THREE scope options (Lean, Standard, Premium) for the client's brief.",
        "Return STRICT JSON ONLY (no markdown, no code fences).",
        "The server will render final markdown for the user.",
        "Schema:",
        '{"title":string,"client":string,"project":string,"intro":string,"options":[{"label":"Lean"|"Standard"|"Premium","overview":string,"scopeIn":[string],"scopeOut":[string],"deliverables":[string],"timeline":[string],"assumptions":[string],"risks":[string],"nextSteps":[string],"pricingTable":{"title":string,"currency":"AUD","discountPercent":number,"gstPercent":number,"rows":[{"role":string,"description":string,"hours":number,"baseRate":number}]}}]}.',
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

  // For draft_sow we now expect pure markdown with embedded tables, so we just return the raw text.
  if (action === SMART_ACTIONS.draft_sow) {
    return { markdown: raw, pricingTable: null };
  }

  return raw;
}

module.exports = {
  SMART_ACTIONS,
  isValidSmartAction,
  runThreadSmartAction,
};
