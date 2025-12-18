const { v4: uuidv4 } = require("uuid");
const { reqBody, multiUserMode } = require("../../utils/http");
const { Telemetry } = require("../../models/telemetry");
const { streamChatWithForEmbed } = require("../../utils/chats/embed");
const { EmbedChats } = require("../../models/embedChats");
const prisma = require("../../utils/prisma");
const {
  validEmbedConfig,
  canRespond,
  setConnectionMeta,
} = require("../../utils/middleware/embedMiddleware");
const {
  convertToChatHistory,
  writeResponseChunk,
} = require("../../utils/helpers/chat/responses");

/**
 * Auto-create a CRM card for a new embed chat session (if pipeline exists for this embed).
 * This allows tracking leads from embedded chat widgets.
 */
async function maybeCreateCrmCardForSession(embed, sessionId, firstMessage) {
  try {
    // Check if a card already exists for this session
    const existingCard = await prisma.crm_cards.findFirst({
      where: { embedSessionId: sessionId },
    });

    if (existingCard) return; // Already tracked

    // Find a pipeline linked to this embed's workspace (or the first available pipeline)
    const pipeline = await prisma.crm_pipelines.findFirst({
      where: { workspaceId: embed.workspace_id },
      orderBy: { createdAt: "asc" },
    });

    // If no workspace-specific pipeline, try finding any pipeline
    const targetPipeline = pipeline || await prisma.crm_pipelines.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!targetPipeline) return; // No pipelines configured yet

    const stages = JSON.parse(targetPipeline.stages || "[]");
    const firstStage = stages[0] || "New";

    // Create the CRM card
    await prisma.crm_cards.create({
      data: {
        pipelineId: targetPipeline.id,
        stage: firstStage,
        position: 1,
        title: `Embed Lead - ${new Date().toLocaleString()}`,
        notes: `First message: ${(firstMessage || "").slice(0, 200)}${firstMessage?.length > 200 ? "..." : ""}`,
        embedSessionId: sessionId,
        metadata: JSON.stringify({
          embedId: embed.id,
          embedUuid: embed.uuid,
          workspaceId: embed.workspace_id,
          source: "embed-chat",
          createdAt: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    // Don't fail the chat if CRM creation fails - just log it
    console.error("[CRM] Failed to create card for embed session:", err.message);
  }
}

function embeddedEndpoints(app) {
  if (!app) return;

  app.post(
    "/embed/:embedId/stream-chat",
    [validEmbedConfig, setConnectionMeta, canRespond],
    async (request, response) => {
      try {
        const embed = response.locals.embedConfig;
        const {
          sessionId,
          message,
          // optional keys for override of defaults if enabled.
          prompt = null,
          model = null,
          temperature = null,
          username = null,
        } = reqBody(request);

        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders();

        // Auto-create CRM card for new embed sessions (fire-and-forget)
        maybeCreateCrmCardForSession(embed, sessionId, message);

        await streamChatWithForEmbed(response, embed, message, sessionId, {
          promptOverride: prompt,
          modelOverride: model,
          temperatureOverride: temperature,
          username,
        });
        await Telemetry.sendTelemetry("embed_sent_chat", {
          multiUserMode: multiUserMode(response),
          LLMSelection: process.env.LLM_PROVIDER || "openai",
          Embedder: process.env.EMBEDDING_ENGINE || "inherit",
          VectorDbSelection: process.env.VECTOR_DB || "lancedb",
        });
        response.end();
      } catch (e) {
        console.error(e);
        writeResponseChunk(response, {
          id: uuidv4(),
          type: "abort",
          sources: [],
          textResponse: null,
          close: true,
          error: e.message,
        });
        response.end();
      }
    }
  );

  app.get(
    "/embed/:embedId/:sessionId",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { sessionId } = request.params;
        const embed = response.locals.embedConfig;
        const history = await EmbedChats.forEmbedByUser(
          embed.id,
          sessionId,
          null,
          null,
          true
        );

        response.status(200).json({ history: convertToChatHistory(history) });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/embed/:embedId/:sessionId",
    [validEmbedConfig],
    async (request, response) => {
      try {
        const { sessionId } = request.params;
        const embed = response.locals.embedConfig;

        await EmbedChats.markHistoryInvalid(embed.id, sessionId);
        response.status(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { embeddedEndpoints };
