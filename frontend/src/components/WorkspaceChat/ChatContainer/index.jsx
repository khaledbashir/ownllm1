import { useState, useEffect, useContext, useRef, useCallback } from "react";
import ChatHistory from "./ChatHistory";
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from "./DnDWrapper";
import PromptInput, {
  PROMPT_INPUT_EVENT,
  PROMPT_INPUT_ID,
} from "./PromptInput";
import Workspace from "@/models/workspace";
import handleChat, { ABORT_STREAM_EVENT } from "@/utils/chat";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../../Sidebar";
import { useParams } from "react-router-dom";
import { v4 } from "uuid";
import handleSocketResponse, {
  websocketURI,
  AGENT_SESSION_END,
  AGENT_SESSION_START,
} from "@/utils/chat/agent";
import DnDFileUploaderWrapper from "./DnDWrapper";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { ChatTooltips } from "./ChatTooltips";
import { MetricsProvider } from "./ChatHistory/HistoricalMessage/Actions/RenderMetrics";
import ThreadNotes from "../ThreadNotes";
import { ChatText, NotePencil } from "@phosphor-icons/react";
import { toast } from "react-toastify";

// Event for AI to insert content into notes
export const NOTE_INSERT_EVENT = "note-insert-content";

export default function ChatContainer({ workspace, knownHistory = [] }) {
  const { threadSlug = null } = useParams();
  const [message, setMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState(knownHistory);
  const [socketId, setSocketId] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [pendingNoteInsert, setPendingNoteInsert] = useState(null);
  const { files, parseAttachments } = useContext(DndUploaderContext);

  // Ref for notes editor to allow AI to insert content
  const notesEditorRef = useRef(null);

  // Reset to chat tab when thread changes
  useEffect(() => {
    setActiveTab("chat");
  }, [threadSlug]);

  // Listen for AI note insert events
  useEffect(() => {
    const handleNoteInsert = (event) => {
      const { content } = event.detail || {};
      if (!content) return;

      // Notes editor isn't mounted while on the Chat tab.
      // Queue the content and switch to Notes. A separate effect will
      // insert once the editor ref becomes available.
      setPendingNoteInsert(String(content));
      setActiveTab("notes");
    };

    window.addEventListener(NOTE_INSERT_EVENT, handleNoteInsert);
    return () => window.removeEventListener(NOTE_INSERT_EVENT, handleNoteInsert);
  }, []);

  // When switching to Notes, insert any queued content once the editor is ready.
  useEffect(() => {
    if (!pendingNoteInsert) return;

    let cancelled = false;
    let attempts = 0;

    const tryInsert = () => {
      if (cancelled) return;
      const target = notesEditorRef.current;
      if (target && typeof target.insertMarkdown === "function") {
        target.insertMarkdown(pendingNoteInsert);
        toast.success("Content added to your Notes!");
        setPendingNoteInsert(null);
        return;
      }

      attempts += 1;
      if (attempts >= 60) {
        toast.error("Notes editor is not ready yet.");
        setPendingNoteInsert(null);
        return;
      }

      setTimeout(tryInsert, 100);
    };

    tryInsert();
    return () => {
      cancelled = true;
    };
  }, [pendingNoteInsert]);

  // Maintain state of message from whatever is in PromptInput
  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const { listening, resetTranscript } = useSpeechRecognition({
    clearTranscriptOnListen: true,
  });

  /**
   * Emit an update to the state of the prompt input without directly
   * passing a prop in so that it does not re-render constantly.
   * @param {string} messageContent - The message content to set
   * @param {'replace' | 'append'} writeMode - Replace current text or append to existing text (default: replace)
   */
  function setMessageEmit(messageContent = "", writeMode = "replace") {
    if (writeMode === "append") setMessage((prev) => prev + messageContent);
    else setMessage(messageContent ?? "");

    // Push the update to the PromptInput component (same logic as above to keep in sync)
    window.dispatchEvent(
      new CustomEvent(PROMPT_INPUT_EVENT, {
        detail: { messageContent, writeMode },
      })
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message || message === "") return false;
    const prevChatHistory = [
      ...chatHistory,
      {
        content: message,
        role: "user",
        attachments: parseAttachments(),
      },
      {
        content: "",
        role: "assistant",
        pending: true,
        userMessage: message,
        animate: true,
      },
    ];

    if (listening) {
      // Stop the mic if the send button is clicked
      endSTTSession();
    }
    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  function endSTTSession() {
    SpeechRecognition.stopListening();
    resetTranscript();
  }

  const regenerateAssistantMessage = (chatId) => {
    const updatedHistory = chatHistory.slice(0, -1);
    const lastUserMessage = updatedHistory.slice(-1)[0];
    Workspace.deleteChats(workspace.slug, [chatId])
      .then(() =>
        sendCommand({
          text: lastUserMessage.content,
          autoSubmit: true,
          history: updatedHistory,
          attachments: lastUserMessage?.attachments,
        })
      )
      .catch((e) => console.error(e));
  };

  /**
   * Send a command to the LLM prompt input.
   * @param {Object} options - Arguments to send to the LLM
   * @param {string} options.text - The text to send to the LLM
   * @param {boolean} options.autoSubmit - Determines if the text should be sent immediately or if it should be added to the message state (default: false)
   * @param {Object[]} options.history - The history of the chat prior to this message for overriding the current chat history
   * @param {Object[import("./DnDWrapper").Attachment]} options.attachments - The attachments to send to the LLM for this message
   * @param {'replace' | 'append'} options.writeMode - Replace current text or append to existing text (default: replace)
   * @returns {void}
   */
  const sendCommand = async ({
    text = "",
    autoSubmit = false,
    history = [],
    attachments = [],
    writeMode = "replace",
  } = {}) => {
    // If we are not auto-submitting, we can just emit the text to the prompt input.
    if (!autoSubmit) {
      setMessageEmit(text, writeMode);
      return;
    }

    // If we are auto-submitting in append mode
    // than we need to update text with whatever is in the prompt input + the text we are sending.
    // @note: `message` will not work here since it is not updated yet.
    // If text is still empty, after this, then we should just return.
    if (writeMode === "append") {
      const currentText = document.getElementById(PROMPT_INPUT_ID)?.value;
      text = currentText + text;
    }

    if (!text || text === "") return false;
    // If we are auto-submitting
    // Then we can replace the current text since this is not accumulating.
    let prevChatHistory;
    if (history.length > 0) {
      // use pre-determined history chain.
      prevChatHistory = [
        ...history,
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          attachments,
          animate: true,
        },
      ];
    } else {
      prevChatHistory = [
        ...chatHistory,
        {
          content: text,
          role: "user",
          attachments,
        },
        {
          content: "",
          role: "assistant",
          pending: true,
          userMessage: text,
          animate: true,
        },
      ];
    }

    setChatHistory(prevChatHistory);
    setMessageEmit("");
    setLoadingResponse(true);
  };

  useEffect(() => {
    async function fetchReply() {
      const promptMessage =
        chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
      const remHistory = chatHistory.length > 0 ? chatHistory.slice(0, -1) : [];
      var _chatHistory = [...remHistory];

      // Override hook for new messages to now go to agents until the connection closes
      if (!!websocket) {
        if (!promptMessage || !promptMessage?.userMessage) return false;
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
        websocket.send(
          JSON.stringify({
            type: "awaitingFeedback",
            feedback: promptMessage?.userMessage,
          })
        );
        return;
      }

      if (!promptMessage || !promptMessage?.userMessage) return false;

      // If running and edit or regeneration, this history will already have attachments
      // so no need to parse the current state.
      const attachments = promptMessage?.attachments ?? parseAttachments();
      window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));

      await Workspace.multiplexStream({
        workspaceSlug: workspace.slug,
        threadSlug,
        prompt: promptMessage.userMessage,
        chatHandler: (chatResult) =>
          handleChat(
            chatResult,
            setLoadingResponse,
            setChatHistory,
            remHistory,
            _chatHistory,
            setSocketId
          ),
        attachments,
      });
      return;
    }
    loadingResponse === true && fetchReply();
  }, [loadingResponse, chatHistory, workspace]);

  // TODO: Simplify this WSS stuff
  useEffect(() => {
    function handleWSS() {
      try {
        if (!socketId || !!websocket) return;
        const socket = new WebSocket(
          `${websocketURI()}/api/agent-invocation/${socketId}`
        );
        socket.supportsAgentStreaming = false;

        window.addEventListener(ABORT_STREAM_EVENT, () => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          websocket.close();
        });

        socket.addEventListener("message", (event) => {
          setLoadingResponse(true);
          try {
            handleSocketResponse(socket, event, setChatHistory);
          } catch (e) {
            console.error("Failed to parse data");
            window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
            socket.close();
          }
          setLoadingResponse(false);
        });

        socket.addEventListener("close", (_event) => {
          window.dispatchEvent(new CustomEvent(AGENT_SESSION_END));
          setChatHistory((prev) => [
            ...prev.filter((msg) => !!msg.content),
            {
              uuid: v4(),
              type: "statusResponse",
              content: "Agent session complete.",
              role: "assistant",
              sources: [],
              closed: true,
              error: null,
              animate: false,
              pending: false,
            },
          ]);
          setLoadingResponse(false);
          setWebsocket(null);
          setSocketId(null);
        });
        setWebsocket(socket);
        window.dispatchEvent(new CustomEvent(AGENT_SESSION_START));
        window.dispatchEvent(new CustomEvent(CLEAR_ATTACHMENTS_EVENT));
      } catch (e) {
        setChatHistory((prev) => [
          ...prev.filter((msg) => !!msg.content),
          {
            uuid: v4(),
            type: "abort",
            content: e.message,
            role: "assistant",
            sources: [],
            closed: true,
            error: e.message,
            animate: false,
            pending: false,
          },
        ]);
        setLoadingResponse(false);
        setWebsocket(null);
        setSocketId(null);
      }
    }
    handleWSS();
  }, [socketId]);

  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-hidden z-[2] flex flex-col"
    >
      {isMobile && <SidebarMobileHeader />}

      {/* Tab Header - Only show when in a thread */}
      {threadSlug && (
        <div className="flex items-center border-b border-theme-sidebar-border bg-theme-bg-secondary/80 px-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === "chat"
              ? "border-theme-text-primary text-theme-text-primary"
              : "border-transparent text-theme-text-secondary hover:text-theme-text-primary"
              }`}
          >
            <ChatText size={18} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === "notes"
              ? "border-theme-text-primary text-theme-text-primary"
              : "border-transparent text-theme-text-secondary hover:text-theme-text-primary"
              }`}
          >
            <NotePencil size={18} />
            Notes
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scroll">
        {activeTab === "chat" ? (
          <DnDFileUploaderWrapper>
            <MetricsProvider>
              <ChatHistory
                history={chatHistory}
                workspace={workspace}
                sendCommand={sendCommand}
                updateHistory={setChatHistory}
                regenerateAssistantMessage={regenerateAssistantMessage}
                hasAttachments={files.length > 0}
              />
            </MetricsProvider>
            <PromptInput
              submit={handleSubmit}
              onChange={handleMessageChange}
              isStreaming={loadingResponse}
              sendCommand={sendCommand}
              attachments={files}
            />
          </DnDFileUploaderWrapper>
        ) : (
          <ThreadNotes workspace={workspace} editorRef={notesEditorRef} />
        )}
      </div>

      {activeTab === "chat" && <ChatTooltips />}
    </div>
  );
}

