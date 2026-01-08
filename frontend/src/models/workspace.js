import { API_BASE, fullApiUrl } from "@/utils/constants";
import { baseHeaders, safeJsonParse } from "@/utils/request";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import WorkspaceThread from "@/models/workspaceThread";
import { v4 } from "uuid";
import { ABORT_STREAM_EVENT } from "@/utils/chat";

const Workspace = {
  workspaceOrderStorageKey: "anythingllm-workspace-order",
  /** The maximum percentage of the context window that can be used for attachments */
  maxContextWindowLimit: 0.8,

  new: async function (data = {}) {
    const { workspace, message } = await fetch(`${API_BASE}/workspace/new`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        return { workspace: null, message: e.message };
      });

    return { workspace, message };
  },
  update: async function (slug, data = {}) {
    const { workspace, message } = await fetch(
      `${API_BASE}/workspace/${slug}/update`,
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { workspace: null, message: e.message };
      });

    return { workspace, message };
  },
  replicate: async function (slug, name = null) {
    const { workspace, message } = await fetch(
      `${API_BASE}/workspace/${slug}/replicate`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { workspace: null, message: e.message };
      });

    return { workspace, message };
  },
  modifyEmbeddings: async function (slug, changes = {}) {
    const { workspace, message } = await fetch(
      `${API_BASE}/workspace/${slug}/update-embeddings`,
      {
        method: "POST",
        body: JSON.stringify(changes), // contains 'adds' and 'removes' keys that are arrays of filepaths
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { workspace: null, message: e.message };
      });

    return { workspace, message };
  },
  chatHistory: async function (slug) {
    const history = await fetch(`${API_BASE}/workspace/${slug}/chats`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.history || [])
      .catch(() => []);

    // Sanitize chat history to fix corrupted content (React Error #31)
    // Some LLMs return {textResponse, metrics} instead of a string
    return history.map((msg) => {
      if (msg.content && typeof msg.content !== "string") {
        console.warn("[chatHistory] Fixing corrupted content:", msg.content);
        if (msg.content.textResponse) {
          return { ...msg, content: msg.content.textResponse };
        }
        return { ...msg, content: JSON.stringify(msg.content) };
      }
      return msg;
    });
  },
  updateChatFeedback: async function (chatId, slug, feedback) {
    const result = await fetch(
      `${API_BASE}/workspace/${slug}/chat-feedback/${chatId}`,
      {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify({ feedback }),
      }
    )
      .then((res) => res.ok)
      .catch(() => false);
    return result;
  },

  deleteChats: async function (slug = "", chatIds = []) {
    return await fetch(`${API_BASE}/workspace/${slug}/delete-chats`, {
      method: "DELETE",
      headers: baseHeaders(),
      body: JSON.stringify({ chatIds }),
    })
      .then((res) => {
        if (res.ok) return true;
        throw new Error("Failed to delete chats.");
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  },
  deleteEditedChats: async function (slug = "", threadSlug = "", startingId) {
    if (!!threadSlug)
      return this.threads._deleteEditedChats(slug, threadSlug, startingId);
    return this._deleteEditedChats(slug, startingId);
  },
  updateChatResponse: async function (
    slug = "",
    threadSlug = "",
    chatId,
    newText
  ) {
    if (!!threadSlug)
      return this.threads._updateChatResponse(
        slug,
        threadSlug,
        chatId,
        newText
      );
    return this._updateChatResponse(slug, chatId, newText);
  },
  multiplexStream: async function ({
    workspaceSlug,
    threadSlug = null,
    prompt,
    chatHandler,
    attachments = [],
  }) {
    if (!!threadSlug)
      return this.threads.streamChat(
        { workspaceSlug, threadSlug },
        prompt,
        chatHandler,
        attachments
      );
    return this.streamChat(
      { slug: workspaceSlug },
      prompt,
      chatHandler,
      attachments
    );
  },
  streamChat: async function ({ slug }, message, handleChat, attachments = []) {
    const ctrl = new AbortController();

    // Listen for the ABORT_STREAM_EVENT key to be emitted by the client
    // to early abort the streaming response. On abort we send a special `stopGeneration`
    // event to be handled which resets the UI for us to be able to send another message.
    // The backend response abort handling is done in each LLM's handleStreamResponse.
    window.addEventListener(ABORT_STREAM_EVENT, () => {
      ctrl.abort();
      handleChat({ id: v4(), type: "stopGeneration" });
    });

    await fetchEventSource(`${API_BASE}/workspace/${slug}/stream-chat`, {
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
    });
  },
  all: async function () {
    const workspaces = await fetch(`${API_BASE}/workspaces`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.workspaces || [])
      .catch(() => []);

    return workspaces;
  },
  bySlug: async function (slug = "") {
    const workspace = await fetch(`${API_BASE}/workspace/${slug}`, {
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.workspace)
      .catch(() => null);
    return workspace;
  },
  delete: async function (slug) {
    const result = await fetch(`${API_BASE}/workspace/${slug}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch(() => false);

    return result;
  },
  wipeVectorDb: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/reset-vector-db`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch(() => false);
  },
  uploadFile: async function (slug, formData) {
    const response = await fetch(`${API_BASE}/workspace/${slug}/upload`, {
      method: "POST",
      body: formData,
      headers: baseHeaders(),
    });

    const data = await response.json();
    return { response, data };
  },
  parseFile: async function (slug, formData) {
    const response = await fetch(`${API_BASE}/workspace/${slug}/parse`, {
      method: "POST",
      body: formData,
      headers: baseHeaders(),
    });

    const data = await response.json();
    return { response, data };
  },

  getParsedFiles: async function (slug, threadSlug = null) {
    const basePath = new URL(`${fullApiUrl()}/workspace/${slug}/parsed-files`);
    if (threadSlug) basePath.searchParams.set("threadSlug", threadSlug);
    const response = await fetch(basePath, {
      method: "GET",
      headers: baseHeaders(),
    });

    const data = await response.json();
    return data;
  },
  uploadLink: async function (slug, link) {
    const response = await fetch(`${API_BASE}/workspace/${slug}/upload-link`, {
      method: "POST",
      body: JSON.stringify({ link }),
      headers: baseHeaders(),
    });

    const data = await response.json();
    return { response, data };
  },

  getSuggestedMessages: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/suggested-messages`, {
      method: "GET",
      cache: "no-cache",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch suggested messages.");
        return res.json();
      })
      .then((res) => res.suggestedMessages)
      .catch((e) => {
        console.error(e);
        return null;
      });
  },
  setSuggestedMessages: async function (slug, messages) {
    return fetch(`${API_BASE}/workspace/${slug}/suggested-messages`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ messages }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.statusText || "Error setting suggested messages."
          );
        }
        return { success: true, ...res.json() };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  setPinForDocument: async function (slug, docPath, pinStatus) {
    return fetch(`${API_BASE}/workspace/${slug}/update-pin`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ docPath, pinStatus }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            res.statusText || "Error setting pin status for document."
          );
        }
        return true;
      })
      .catch((e) => {
        console.error(e);
        return false;
      });
  },
  ttsMessage: async function (slug, chatId) {
    return await fetch(`${API_BASE}/workspace/${slug}/tts/${chatId}`, {
      method: "GET",
      cache: "no-cache",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (res.ok && res.status !== 204) return res.blob();
        throw new Error("Failed to fetch TTS.");
      })
      .then((blob) => (blob ? URL.createObjectURL(blob) : null))
      .catch((e) => {
        return null;
      });
  },
  uploadPfp: async function (formData, slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/upload-pfp`, {
      method: "POST",
      body: formData,
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error uploading pfp.");
        return { success: true, error: null };
      })
      .catch((e) => {
        console.log(e);
        return { success: false, error: e.message };
      });
  },

  fetchPfp: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/pfp`, {
      method: "GET",
      cache: "no-cache",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (res.ok && res.status !== 204) return res.blob();
        throw new Error("Failed to fetch pfp.");
      })
      .then((blob) => (blob ? URL.createObjectURL(blob) : null))
      .catch((e) => {
        // console.log(e);
        return null;
      });
  },

  removePfp: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/remove-pfp`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (res.ok) return { success: true, error: null };
        throw new Error("Failed to remove pfp.");
      })
      .catch((e) => {
        console.log(e);
        return { success: false, error: e.message };
      });
  },
  _updateChatResponse: async function (slug = "", chatId, newText) {
    return await fetch(`${API_BASE}/workspace/${slug}/update-chat`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ chatId, newText }),
    })
      .then((res) => {
        if (res.ok) return true;
        throw new Error("Failed to update chat.");
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  },
  _deleteEditedChats: async function (slug = "", startingId) {
    return await fetch(`${API_BASE}/workspace/${slug}/delete-edited-chats`, {
      method: "DELETE",
      headers: baseHeaders(),
      body: JSON.stringify({ startingId }),
    })
      .then((res) => {
        if (res.ok) return true;
        throw new Error("Failed to delete chats.");
      })
      .catch((e) => {
        console.log(e);
        return false;
      });
  },
  deleteChat: async (chatId) => {
    return await fetch(`${API_BASE}/workspace/workspace-chats/${chatId}`, {
      method: "PUT",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  },
  forkThread: async function (slug = "", threadSlug = null, chatId = null) {
    return await fetch(`${API_BASE}/workspace/${slug}/thread/fork`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ threadSlug, chatId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fork thread.");
        return res.json();
      })
      .then((data) => data.newThreadSlug)
      .catch((e) => {
        console.error("Error forking thread:", e);
        return null;
      });
  },
  /**
   * Uploads and embeds a single file in a single call into a workspace
   * @param {string} slug - workspace slug
   * @param {FormData} formData
   * @returns {Promise<{response: {ok: boolean}, data: {success: boolean, error: string|null, document: {id: string, location:string}|null}}>}
   */
  uploadAndEmbedFile: async function (slug, formData) {
    const response = await fetch(
      `${API_BASE}/workspace/${slug}/upload-and-embed`,
      {
        method: "POST",
        body: formData,
        headers: baseHeaders(),
      }
    );

    const data = await response.json();
    return { response, data };
  },

  deleteParsedFiles: async function (slug, fileIds = []) {
    const response = await fetch(
      `${API_BASE}/workspace/${slug}/delete-parsed-files`,
      {
        method: "DELETE",
        headers: baseHeaders(),
        body: JSON.stringify({ fileIds }),
      }
    );
    return response.ok;
  },

  embedParsedFile: async function (slug, fileId) {
    const response = await fetch(
      `${API_BASE}/workspace/${slug}/embed-parsed-file/${fileId}`,
      {
        method: "POST",
        headers: baseHeaders(),
      }
    );

    const data = await response.json();
    return { response, data };
  },

  /**
   * Deletes and un-embeds a single file in a single call from a workspace
   * @param {string} slug - workspace slug
   * @param {string} documentLocation - location of file eg: custom-documents/my-file-uuid.json
   * @returns {Promise<boolean>}
   */
  deleteAndUnembedFile: async function (slug, documentLocation) {
    const response = await fetch(
      `${API_BASE}/workspace/${slug}/remove-and-unembed`,
      {
        method: "DELETE",
        body: JSON.stringify({ documentLocation }),
        headers: baseHeaders(),
      }
    );
    return response.ok;
  },

  /**
   * Reorders workspaces in the UI via localstorage on client side.
   * @param {string[]} workspaceIds - array of workspace ids to reorder
   * @returns {boolean}
   */
  storeWorkspaceOrder: function (workspaceIds = []) {
    try {
      localStorage.setItem(
        this.workspaceOrderStorageKey,
        JSON.stringify(workspaceIds)
      );
      return true;
    } catch (error) {
      console.error("Error reordering workspaces:", error);
      return false;
    }
  },

  /**
   * Orders workspaces based on the order preference stored in localstorage
   * @param {Array} workspaces - array of workspace JSON objects
   * @returns {Array} - ordered workspaces
   */
  orderWorkspaces: function (workspaces = []) {
    const workspaceOrderPreference =
      safeJsonParse(localStorage.getItem(this.workspaceOrderStorageKey)) || [];
    if (workspaceOrderPreference.length === 0) return workspaces;
    const orderedWorkspaces = Array.from(workspaces);
    orderedWorkspaces.sort(
      (a, b) =>
        workspaceOrderPreference.indexOf(a.id) -
        workspaceOrderPreference.indexOf(b.id)
    );
    return orderedWorkspaces;
  },

  /**
   * Searches for workspaces and threads
   * @param {string} searchTerm
   * @returns {Promise<{workspaces: [{slug: string, name: string}], threads: [{slug: string, name: string, workspace: {slug: string, name: string}}]}}>}
   */
  searchWorkspaceOrThread: async function (searchTerm) {
    const response = await fetch(`${API_BASE}/workspace/search`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ searchTerm }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { workspaces: [], threads: [] };
      });
    return response;
  },

  importProducts: async function (slug, url, query = null) {
    const { products, error } = await fetch(
      `${API_BASE}/workspace/${slug}/import-products`,
      {
        method: "POST",
        body: JSON.stringify({ url, query }),
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        return { products: [], error: e.message };
      });
    return { products, error };
  },

  /**
   * Creates a public proposal link for client sharing
   * @param {string} slug - workspace slug
   * @param {string} htmlContent - HTML snapshot of the proposal
   * @param {object} options - { password?: string, expiresAt?: string }
   * @returns {Promise<{url: string|null, error: string|null}>}
   */
  createPublicProposal: async function (slug, htmlContent, options = {}) {
    return await fetch(`${API_BASE}/workspace/${slug}/proposals`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ htmlContent, options }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          return { url: data.url, error: null };
        }
        return { url: null, error: data.error || "Failed to create proposal" };
      })
      .catch((e) => {
        console.error("createPublicProposal error:", e);
        return { url: null, error: e.message };
      });
  },

  // Forms
  getForms: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.forms || [])
      .catch(() => []);
  },
  createForm: async function (slug, data) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms`, {
      method: "POST",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
  generateForm: async function (slug, data) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms/generate`, {
      method: "POST",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
  getForm: async function (slug, uuid) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms/${uuid}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
  updateForm: async function (slug, uuid, data) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms/${uuid}`, {
      method: "PUT",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
  deleteForm: async function (slug, uuid) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms/${uuid}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({ success: false, error: e.message }));
  },
  getFormResponses: async function (slug, uuid) {
    return await fetch(`${API_BASE}/workspace/${slug}/forms/${uuid}/responses`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then(res => res.responses || [])
      .catch((e) => []);
  },

  threads: WorkspaceThread,
};

export default Workspace;
