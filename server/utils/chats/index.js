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

  const appendix = await smartPluginsPromptAppendix(workspace?.id);
  return `${expanded}${appendix}`;
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
