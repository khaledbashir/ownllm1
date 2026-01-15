const { Workspace } = require("../../models/workspace");
const { WorkspaceChats } = require("../../models/workspaceChats");
const { SystemSettings } = require("../../models/systemSettings");
const { getLLMProvider } = require("../LLMProviders");
const { getVectorDbClass } = require("../VectorDb");
const { writeResponseChunk } = require("./utils");
const { Telemetry } = require("../../models/telemetry");

const VALID_CHAT_MODE = ["chat", "query"];

async function streamChatWithWorkspace(
  response,
  workspace,
  message,
  chatMode = "chat",
  user = null,
  thread = null,
  attachments = []
) {
  const uuid = require("uuid").v4();
  let sources = [];
  let completeText = "";
  let metrics = {};

  const { isAgentChat, response: performanceMetrics } = await Telemetry.isAgentChat({
    workspace,
    message,
    chatMode,
    user,
    thread,
  });
  if (isAgentChat) return;

  // Load custom provider configuration if needed
  const customProviderConfig = await SystemSettings.getCustomProvider(workspace?.chatProvider);

  const LLMConnector = getLLMProvider({
    provider: workspace?.chatProvider,
    model: workspace?.chatModel,
    customProviderConfig,
  });
  const VectorDb = getVectorDbClass();

  const messageLimit = workspace?.openAiHistory || 20;
  const hasVectorizedSpace = await VectorDb.hasNamespace(workspace.slug);
  const embeddingsCount = await VectorDb.namespaceCount(workspace.slug);

  // User is trying to query-mode chat a workspace that has no data in it - so
  // we should exit early as no information can be found under these conditions.
  if ((!hasVectorizedSpace || embeddingsCount === 0) && chatMode === "query") {
    writeResponseChunk(response, {
      uuid,
      type: "textResponseChunk",
      textResponse: "No information is available for this workspace in query mode.",
      close: true,
      error: false,
    });
    return;
  }

  const { context, sources: chatSources } = await VectorDb.query({
    workspace,
    message,
    limit: messageLimit,
  });
  sources = chatSources;

  const messages = await WorkspaceChats.getChatHistory(workspace, thread, message, chatMode, context);

  if (chatMode === "query") {
    const result = await LLMConnector.getChatCompletion(messages, {
      temperature: workspace?.openAiTemp ?? LLMConnector.defaultTemp,
      user: user,
    });
    completeText = result;
    metrics = performanceMetrics;
    writeResponseChunk(response, {
      uuid,
      sources,
      type: "textResponseChunk",
      textResponse: completeText,
      close: true,
      error: false,
      metrics,
    });
  } else {
    const stream = await LLMConnector.streamGetChatCompletion(messages, {
      temperature: workspace?.openAiTemp ?? LLMConnector.defaultTemp,
      user: user,
    });
    completeText = await LLMConnector.handleStream(response, stream, {
      uuid,
      sources,
    });
    metrics = stream.metrics;
  }

  if (completeText?.length > 0) {
    const { chat } = await WorkspaceChats.new({
      workspaceId: workspace.id,
      prompt: message,
      response: {
        text: completeText,
        sources,
        type: chatMode,
        attachments,
        metrics,
      },
      threadId: thread?.id || null,
      user,
    });

    writeResponseChunk(response, {
      uuid,
      type: "finalizeResponseStream",
      close: true,
      error: false,
      chatId: chat.id,
      metrics,
    });
    return;
  }

  writeResponseChunk(response, {
    uuid,
    type: "finalizeResponseStream",
    close: true,
    error: false,
    metrics,
  });
  return;
}

module.exports = {
  VALID_CHAT_MODE,
  streamChatWithWorkspace,
};
// force refresh
