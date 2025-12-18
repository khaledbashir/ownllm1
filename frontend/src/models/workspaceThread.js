import { ABORT_STREAM_EVENT } from "@/utils/chat";
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { v4 } from "uuid";

const WorkspaceThread = {
  all: async function (workspaceSlug) {
    const { threads } = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/threads`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { threads: [] };
      });

    return { threads };
  },
  new: async function (workspaceSlug) {
    const { thread, error } = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/new`,
      {
        method: "POST",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { thread: null, error: e.message };
      });

    return { thread, error };
  },
  update: async function (workspaceSlug, threadSlug, data = {}) {
    const { thread, message } = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/update`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { thread: null, message: e.message };
      });

    return { thread, message };
  },
  delete: async function (workspaceSlug, threadSlug) {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}`,
      {
        method: "DELETE",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.ok)
      .catch(() => false);
  },
  deleteBulk: async function (workspaceSlug, threadSlugs = []) {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread-bulk-delete`,
      {
        method: "DELETE",
        body: JSON.stringify({ slugs: threadSlugs }),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.ok)
      .catch(() => false);
  },
  chatHistory: async function (workspaceSlug, threadSlug) {
    const history = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/chats`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => res.history || [])
      .catch(() => []);

    // Sanitize chat history to fix corrupted content (React Error #31)
    // Some LLMs return {textResponse, metrics} instead of a string
    return history.map((msg) => {
      if (msg.content && typeof msg.content !== "string") {
        console.warn("[ThreadChatHistory] Fixing corrupted content:", msg.content);
        if (msg.content.textResponse) {
          return { ...msg, content: msg.content.textResponse };
        }
        return { ...msg, content: JSON.stringify(msg.content) };
      }
      return msg;
    });
  },
  streamChat: async function (
    { workspaceSlug, threadSlug },
    message,
    handleChat,
    attachments = []
  ) {
    const ctrl = new AbortController();

    // Listen for the ABORT_STREAM_EVENT key to be emitted by the client
    // to early abort the streaming response. On abort we send a special `stopGeneration`
    // event to be handled which resets the UI for us to be able to send another message.
    // The backend response abort handling is done in each LLM's handleStreamResponse.
    window.addEventListener(ABORT_STREAM_EVENT, () => {
      ctrl.abort();
      handleChat({ id: v4(), type: "stopGeneration" });
    });

    await fetchEventSource(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/stream-chat`,
      {
        method: "POST",
        body: JSON.stringify({ message, attachments }),
        headers: baseHeaders(),
        signal: ctrl.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (response.ok) {
            return; // everything's good
          } else if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            handleChat({
              id: v4(),
              type: "abort",
              textResponse: null,
              sources: [],
              close: true,
              error: `An error occurred while streaming response. Code ${response.status}`,
            });
            ctrl.abort();
            throw new Error("Invalid Status code response.");
          } else {
            handleChat({
              id: v4(),
              type: "abort",
              textResponse: null,
              sources: [],
              close: true,
              error: `An error occurred while streaming response. Unknown Error.`,
            });
            ctrl.abort();
            throw new Error("Unknown error");
          }
        },
        async onmessage(msg) {
          try {
            const chatResult = JSON.parse(msg.data);
            handleChat(chatResult);
          } catch { }
        },
        onerror(err) {
          handleChat({
            id: v4(),
            type: "abort",
            textResponse: null,
            sources: [],
            close: true,
            error: `An error occurred while streaming response. ${err.message}`,
          });
          ctrl.abort();
          throw new Error();
        },
      }
    );
  },
  _deleteEditedChats: async function (
    workspaceSlug = "",
    threadSlug = "",
    startingId
  ) {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/delete-edited-chats`,
      {
        method: "DELETE",
        headers: baseHeaders(),
        body: JSON.stringify({ startingId }),
      }
    )
      .then((res) => {
        if (res.ok) return true;
        throw new Error("Failed to delete chats.");
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  },
  _updateChatResponse: async function (
    workspaceSlug = "",
    threadSlug = "",
    chatId,
    newText
  ) {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/update-chat`,
      {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify({ chatId, newText }),
      }
    )
      .then((res) => {
        if (res.ok) return true;
        throw new Error("Failed to update chat.");
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  },
  getNotes: async function (workspaceSlug, threadSlug) {
    const { notes } = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/notes`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch(() => {
        return { notes: "" };
      });
    return notes;
  },
  updateNotes: async function (workspaceSlug, threadSlug, notes) {
    const { thread, message } = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/notes`,
      {
        method: "PUT",
        body: JSON.stringify({ notes }),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { thread: null, message: e.message };
      });
    return { thread, message };
  },

  smartAction: async function (workspaceSlug, threadSlug, action) {
    const res = await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/smart-action`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
        headers: { ...baseHeaders(), "Content-Type": "application/json" },
      }
    ).catch((e) => null);

    if (!res) return { success: false, error: "Network error" };
    const data = await res
      .json()
      .catch(() => ({ success: false, error: "Invalid server response" }));
    return data;
  },
  exportPdf: async function (workspaceSlug, html, options = {}) {
    try {
      const res = await fetch(
        `${API_BASE}/workspace/${workspaceSlug}/export-pdf`,
        {
          method: "POST",
          body: JSON.stringify({ html, ...options }),
          headers: baseHeaders(),
        }
      );

      if (!res.ok) {
        // Try to get error message from response
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${res.status}`;
        throw new Error(errorMsg);
      }

      const blob = await res.blob();

      // Validate the blob is actually a PDF (should start with %PDF)
      if (blob.size < 100) {
        throw new Error("PDF generation returned empty or invalid content");
      }

      return blob;
    } catch (e) {
      console.error("PDF Export error:", e);
      // Return error object instead of null so we can show meaningful error
      return { error: e.message || "Failed to export PDF" };
    }
  },

  /**
   * Embed doc content into workspace vector database for AI retrieval
   * @param {string} workspaceSlug
   * @param {string} threadSlug
   * @param {string} content - The text content to embed
   * @param {string} title - Optional title for the embedded doc
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  embedDoc: async function (workspaceSlug, threadSlug, content, title = null) {
    try {
      const res = await fetch(
        `${API_BASE}/workspace/${workspaceSlug}/thread/${threadSlug}/embed-doc`,
        {
          method: "POST",
          body: JSON.stringify({ content, title }),
          headers: { ...baseHeaders(), "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Failed to embed doc" };
      }

      return await res.json();
    } catch (e) {
      console.error("embedDoc error:", e);
      return { success: false, error: e.message || "Network error" };
    }
  },
};

export default WorkspaceThread;

