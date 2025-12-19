const { v4: uuidv4 } = require("uuid");
const { WorkspaceChats } = require("../../models/workspaceChats");
const { resetMemory } = require("./commands/reset");
const { convertToPromptHistory } = require("../helpers/chat/responses");
const { SlashCommandPresets } = require("../../models/slashCommandsPresets");
const { SystemPromptVariables } = require("../../models/systemPromptVariables");
const { SmartPlugins } = require("../../models/smartPlugins");

const SMART_PLUGIN_PROMPT_CACHE_TTL_MS = 30_000;
const SMART_PLUGIN_PROMPT_MAX_CHARS = 3_000;
const smartPluginPromptCache = new Map();

function safeTrimTo(text, maxChars) {
  if (typeof text !== "string") return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 3)) + "...";
}

function buildSmartPluginsAppendix(plugins = []) {
  if (!Array.isArray(plugins) || plugins.length === 0) return "";

  const lines = [
    "\n\nSmart Plugins (data-driven; no code execution):",
    "- When asked to produce a Smart Plugin table, respond with a fenced JSON code block.",
    "- Format: a JSON array of row objects; keys must match the plugin field keys.",
    "- Do not include HTML/JS; output plain JSON only.",
  ];

  for (const plugin of plugins) {
    const name = safeTrimTo(String(plugin?.name ?? ""), 80);
    if (!name) continue;
    const schema = plugin?.schema;
    const uiConfig = plugin?.uiConfig;

    lines.push(`\nPlugin: ${name}`);
    if (schema?.fields && Array.isArray(schema.fields)) {
      const fieldParts = schema.fields
        .slice(0, 20)
        .map((f) => {
          const key = safeTrimTo(String(f?.key ?? ""), 64);
          const label = safeTrimTo(String(f?.label ?? ""), 80);
          const type = safeTrimTo(String(f?.type ?? ""), 32);
          return key ? `${key}${label ? ` (${label})` : ""}${type ? `:${type}` : ""}` : null;
        })
        .filter(Boolean);
      if (fieldParts.length) lines.push(`Fields: ${fieldParts.join(", ")}`);
    }

    if (uiConfig?.prompt && typeof uiConfig.prompt === "string") {
      const prompt = safeTrimTo(uiConfig.prompt, 500);
      if (prompt) lines.push(`Notes: ${prompt}`);
    }
  }

  return safeTrimTo(lines.join("\n"), SMART_PLUGIN_PROMPT_MAX_CHARS);
}

async function smartPluginsPromptAppendix(workspaceId) {
  if (!workspaceId) return "";
  const cached = smartPluginPromptCache.get(workspaceId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const plugins = await SmartPlugins.activeForWorkspace(workspaceId);
    const appendix = buildSmartPluginsAppendix(plugins);
    smartPluginPromptCache.set(workspaceId, {
      value: appendix,
      expiresAt: Date.now() + SMART_PLUGIN_PROMPT_CACHE_TTL_MS,
    });
    return appendix;
  } catch (e) {
    // Never block chat because of plugin lookup issues.
    return "";
  }
}

const VALID_COMMANDS = {
  "/reset": resetMemory,
};

async function grepCommand(message, user = null) {
  const userPresets = await SlashCommandPresets.getUserPresets(user?.id);
  const availableCommands = Object.keys(VALID_COMMANDS);

  // Check if the message starts with any built-in command
  for (let i = 0; i < availableCommands.length; i++) {
    const cmd = availableCommands[i];
    const re = new RegExp(`^(${cmd})`, "i");
    if (re.test(message)) {
      return cmd;
    }
  }

  // Replace all preset commands with their corresponding prompts
  // Allows multiple commands in one message
  let updatedMessage = message;
  for (const preset of userPresets) {
    const regex = new RegExp(
      `(?:\\b\\s|^)(${preset.command})(?:\\b\\s|$)`,
      "g"
    );
    updatedMessage = updatedMessage.replace(regex, preset.prompt);
  }

  return updatedMessage;
}

/**
 * @description This function will do recursive replacement of all slash commands with their corresponding prompts.
 * @notice This function is used for API calls and is not user-scoped. THIS FUNCTION DOES NOT SUPPORT PRESET COMMANDS.
 * @returns {Promise<string>}
 */
async function grepAllSlashCommands(message) {
  const allPresets = await SlashCommandPresets.where({});

  // Replace all preset commands with their corresponding prompts
  // Allows multiple commands in one message
  let updatedMessage = message;
  for (const preset of allPresets) {
    const regex = new RegExp(
      `(?:\\b\\s|^)(${preset.command})(?:\\b\\s|$)`,
      "g"
    );
    updatedMessage = updatedMessage.replace(regex, preset.prompt);
  }

  return updatedMessage;
}

async function recentChatHistory({
  user = null,
  workspace,
  thread = null,
  messageLimit = 20,
  apiSessionId = null,
}) {
  const rawHistory = (
    await WorkspaceChats.where(
      {
        workspaceId: workspace.id,
        user_id: user?.id || null,
        thread_id: thread?.id || null,
        api_session_id: apiSessionId || null,
        include: true,
      },
      messageLimit,
      { id: "desc" }
    )
  ).reverse();
  return { rawHistory, chatHistory: convertToPromptHistory(rawHistory) };
}

/**
 * Builds the products and rate card context to append to the system prompt.
 * @param {Object|null} workspace - the workspace object
 * @returns {string} - formatted context for products/rate card
 */
function buildProposalContext(workspace) {
  if (!workspace) return "";

  let context = "";

  const normalizeMoneyValue = (value) => {
    if (value === null || value === undefined) return "Not Set";
    const asString = String(value).trim();
    if (!asString) return "Not Set";
    // Treat 0/"0" as not configured to avoid "$0" proposals.
    if (asString === "0" || asString === "0.0" || asString === "0.00") return "Not Set";
    return asString;
  };

  // Inject products/services if available
  if (workspace.products) {
    try {
      const products = typeof workspace.products === "string"
        ? JSON.parse(workspace.products)
        : workspace.products;
      if (Array.isArray(products) && products.length > 0) {
        const normalizedProducts = products.map((p) => {
          if (!p || typeof p !== "object") return p;
          return {
            ...p,
            price: normalizeMoneyValue(p.price),
          };
        });

        context += "\n\n## AVAILABLE PRODUCTS & SERVICES\n";
        context += "Use these exact prices when creating proposals. Do NOT invent or hallucinate prices.\n";
        context += JSON.stringify(normalizedProducts, null, 2);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Inject rate card if available
  if (workspace.rateCard) {
    try {
      const rateCard = typeof workspace.rateCard === "string"
        ? JSON.parse(workspace.rateCard)
        : workspace.rateCard;
      if (Array.isArray(rateCard) && rateCard.length > 0) {
        const normalizedRateCard = rateCard.map((r) => {
          if (!r || typeof r !== "object") return r;
          const rawRate = r.hourlyRate ?? r.rate;
          return {
            id: r.id,
            name: r.name,
            category: r.category,
            hourlyRate: normalizeMoneyValue(rawRate),
          };
        });

        context += "\n\n## HOURLY RATE CARD\n";
        context += "All rates are in AUD (ex GST) unless explicitly stated otherwise.\n";
        context += "Use these exact role names and hourly rates for time & materials estimates. Do NOT invent, rename, or substitute roles/rates.\n";
        context += JSON.stringify(normalizedRateCard, null, 2);
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Add instruction if we have any proposal context
  if (context) {
    context += "\n\n## PROPOSAL INSTRUCTIONS\n";
    context += "When asked to create a proposal, estimate, or quote:\n";
    context += "1. ONLY use the products, services, and rates listed above.\n";
    context += "2. Calculate totals accurately (price × quantity or rate × hours).\n";
    context += "3. Format pricing clearly in tables when appropriate.\n";
    context += "4. If a requested service is not in the list, say so rather than inventing a price.\n";
  }

  return context;
}

/**
 * Returns the base prompt for the chat. This method will also do variable
 * substitution on the prompt if there are any defined variables in the prompt.
 * @param {Object|null} workspace - the workspace object
 * @param {Object|null} user - the user object
 * @returns {Promise<string>} - the base prompt
 */
async function chatPrompt(workspace, user = null) {
  const { SystemSettings } = require("../../models/systemSettings");
  const basePrompt =
    workspace?.openAiPrompt ?? SystemSettings.saneDefaultSystemPrompt;
  const expanded = await SystemPromptVariables.expandSystemPromptVariables(
    basePrompt,
    user?.id,
    workspace?.id
  );

  const smartPluginsAppendix = await smartPluginsPromptAppendix(workspace?.id);
  const proposalContext = buildProposalContext(workspace);

  return `${expanded}${proposalContext}${smartPluginsAppendix}`;
}

// We use this util function to deduplicate sources from similarity searching
// if the document is already pinned.
// Eg: You pin a csv, if we RAG + full-text that you will get the same data
// points both in the full-text and possibly from RAG - result in bad results
// even if the LLM was not even going to hallucinate.
function sourceIdentifier(sourceDocument) {
  if (!sourceDocument?.title || !sourceDocument?.published) return uuidv4();
  return `title:${sourceDocument.title}-timestamp:${sourceDocument.published}`;
}

module.exports = {
  sourceIdentifier,
  recentChatHistory,
  chatPrompt,
  grepCommand,
  grepAllSlashCommands,
  VALID_COMMANDS,
};
