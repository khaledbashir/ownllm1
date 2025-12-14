const {
  multiUserMode,
  userFromSession,
  reqBody,
  safeJsonParse,
} = require("../utils/http");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { Telemetry } = require("../models/telemetry");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { EventLogs } = require("../models/eventLogs");
const { WorkspaceThread } = require("../models/workspaceThread");
const {
  validWorkspaceSlug,
  validWorkspaceAndThreadSlug,
} = require("../utils/middleware/validWorkspace");
const { WorkspaceChats } = require("../models/workspaceChats");
const { convertToChatHistory } = require("../utils/helpers/chat/responses");
const { getModelTag } = require("./utils");
const {
  isValidSmartAction,
  runThreadSmartAction,
} = require("../utils/chats/smartActions");

function workspaceThreadEndpoints(app) {
  if (!app) return;

  app.post(
    "/workspace/:slug/thread/new",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const { thread, message } = await WorkspaceThread.new(
          workspace,
          user?.id
        );
        await Telemetry.sendTelemetry(
          "workspace_thread_created",
          {
            multiUserMode: multiUserMode(response),
            LLMSelection: process.env.LLM_PROVIDER || "openai",
            Embedder: process.env.EMBEDDING_ENGINE || "inherit",
            VectorDbSelection: process.env.VECTOR_DB || "lancedb",
            TTSSelection: process.env.TTS_PROVIDER || "native",
            LLMModel: getModelTag(),
          },
          user?.id
        );

        await EventLogs.logEvent(
          "workspace_thread_created",
          {
            workspaceName: workspace?.name || "Unknown Workspace",
          },
          user?.id
        );
        response.status(200).json({ thread, message });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/workspace/:slug/threads",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const threads = await WorkspaceThread.where({
          workspace_id: workspace.id,
          user_id: user?.id || null,
        });
        response.status(200).json({ threads });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread/:threadSlug",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (_, response) => {
      try {
        const thread = response.locals.thread;
        await WorkspaceThread.delete({ id: thread.id });
        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread-bulk-delete",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const { slugs = [] } = reqBody(request);
        if (slugs.length === 0) return response.sendStatus(200).end();

        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        await WorkspaceThread.delete({
          slug: { in: slugs },
          user_id: user?.id ?? null,
          workspace_id: workspace.id,
        });
        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/workspace/:slug/thread/:threadSlug/chats",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;
        const history = await WorkspaceChats.where(
          {
            workspaceId: workspace.id,
            user_id: user?.id || null,
            thread_id: thread.id,
            api_session_id: null, // Do not include API session chats.
            include: true,
          },
          null,
          { id: "asc" }
        );

        response.status(200).json({ history: convertToChatHistory(history) });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/workspace/:slug/thread/:threadSlug/update",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const data = reqBody(request);
        const currentThread = response.locals.thread;
        const { thread, message } = await WorkspaceThread.update(
          currentThread,
          data
        );
        response.status(200).json({ thread, message });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // Get thread notes
  app.get(
    "/workspace/:slug/thread/:threadSlug/notes",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (_, response) => {
      try {
        const thread = response.locals.thread;
        response.status(200).json({ notes: thread.notes || "" });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // Update thread notes
  app.put(
    "/workspace/:slug/thread/:threadSlug/notes",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { notes } = reqBody(request);
        const currentThread = response.locals.thread;
        const { thread, message } = await WorkspaceThread.update(
          currentThread,
          { notes: notes || "" }
        );
        response.status(200).json({ thread, message });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread/:threadSlug/delete-edited-chats",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { startingId } = reqBody(request);
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;

        await WorkspaceChats.delete({
          workspaceId: Number(workspace.id),
          thread_id: Number(thread.id),
          user_id: user?.id,
          id: { gte: Number(startingId) },
        });

        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/workspace/:slug/thread/:threadSlug/update-chat",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { chatId, newText = null } = reqBody(request);
        if (!newText || !String(newText).trim())
          throw new Error("Cannot save empty response");

        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;
        const existingChat = await WorkspaceChats.get({
          workspaceId: workspace.id,
          thread_id: thread.id,
          user_id: user?.id,
          id: Number(chatId),
        });
        if (!existingChat) throw new Error("Invalid chat.");

        const chatResponse = safeJsonParse(existingChat.response, null);
        if (!chatResponse) throw new Error("Failed to parse chat response");

        await WorkspaceChats._update(existingChat.id, {
          response: JSON.stringify({
            ...chatResponse,
            text: String(newText),
          }),
        });

        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // Smart Actions: generate markdown outputs (meeting notes / proposal / quote) from last N messages
  app.post(
    "/workspace/:slug/thread/:threadSlug/smart-action",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { action } = reqBody(request);
        if (!isValidSmartAction(action)) {
          return response
            .status(400)
            .json({ success: false, error: "Invalid smart action." });
        }

        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;

        const markdown = await runThreadSmartAction({
          workspace,
          thread,
          user,
          action,
          messageLimit: 10,
        });

        return response.status(200).json({ success: true, markdown });
      } catch (e) {
        console.error(e.message, e);
        return response
          .status(500)
          .json({ success: false, error: "Failed to run smart action." });
      }
    }
  );

  // Embed doc content into workspace vector database
  app.post(
    "/workspace/:slug/thread/:threadSlug/embed-doc",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { content, title } = reqBody(request);
        if (!content || !String(content).trim()) {
          return response
            .status(400)
            .json({ success: false, error: "Content is required." });
        }

        const workspace = response.locals.workspace;
        const thread = response.locals.thread;
        const { v4: uuidv4 } = require("uuid");
        const { getVectorDbClass } = require("../utils/helpers");

        const docTitle = title || `Thread Doc - ${thread.name || thread.slug}`;
        const docContent = String(content).trim();

        const vectorDB = getVectorDbClass();
        const { vectorized, error } = await vectorDB.addDocumentToNamespace(
          workspace.slug,
          {
            docId: uuidv4(),
            id: uuidv4(),
            url: `file://thread-doc-${thread.slug}.md`,
            title: docTitle,
            docAuthor: "@thread-doc",
            description: `Doc from thread: ${thread.name || thread.slug}`,
            docSource: "Thread doc embedded by user.",
            chunkSource: "",
            published: new Date().toLocaleString(),
            wordCount: docContent.split(" ").length,
            pageContent: docContent,
            token_count_estimate: Math.ceil(docContent.length / 4),
          },
          null
        );

        if (error) {
          console.error("Embed doc error:", error);
          return response
            .status(500)
            .json({ success: false, error: "Failed to embed document." });
        }

        // Log the event
        await EventLogs.logEvent(
          "thread_doc_embedded",
          {
            workspaceName: workspace?.name || "Unknown",
            threadName: thread?.name || thread?.slug,
            docTitle,
            wordCount: docContent.split(" ").length,
          },
          null
        );

        return response.status(200).json({
          success: true,
          message: `Doc "${docTitle}" embedded successfully! AI can now retrieve this content.`,
          vectorized,
        });
      } catch (e) {
        console.error("Embed doc error:", e.message, e);
        return response
          .status(500)
          .json({ success: false, error: "Failed to embed document." });
      }
    }
  );
}

module.exports = { workspaceThreadEndpoints };
