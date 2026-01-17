import { useState, useEffect, useContext, useRef, useCallback } from "react";
import ChatHistory from "./ChatHistory";
import { CLEAR_ATTACHMENTS_EVENT, DndUploaderContext } from "./DnDWrapper";
import PromptInput, {
  PROMPT_INPUT_EVENT,
  PROMPT_INPUT_ID,
} from "./PromptInput";
import Workspace from "@/models/workspace";
import handleChat, { ABORT_STREAM_EVENT } from "@/utils/chat";
import { baseHeaders } from "@/utils/request";
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
import { ChatText, FileText, NotePencil } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import WorkspaceForms from "../../WorkspaceForms";
import ProposalPreviewSlider from "../../ProposalPreviewSlider";
import { extractAndValidateJson, mergeQuoteData, hasMinimumQuoteData, removeJsonBlockFromText, logQuoteUpdate } from "@/utils/quoteDataParser";

// Event for AI to insert content into notes
export const NOTE_INSERT_EVENT = "note-insert-content";

function sanitizeNotesMarkdown(raw) {
  if (raw == null) return "";
  let text = String(raw);

  // Remove <think>...</think> blocks (multiline) - various tag names
  const thinkTagPatterns = [
    /<think\b[^>]*>[\s\S]*?<\/think>/gi,
    /<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi,
    /<thought\b[^>]*>[\s\S]*?<\/thought>/gi,
    /<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi,
    /<reflection\b[^>]*>[\s\S]*?<\/reflection>/gi,
  ];

  for (const pattern of thinkTagPatterns) {
    text = text.replace(pattern, "");
  }

  // Remove any dangling think-like tags
  text = text.replace(
    /<\/?(?:think|thinking|thought|reasoning|reflection)\b[^>]*>/gi,
    ""
  );

  // Also handle escaped tags like &lt;think&gt; ... &lt;/think&gt;
  text = text.replace(
    /&lt;(?:think|thinking|thought|reasoning|reflection)\b[^&]*&gt;[\s\S]*?&lt;\/(?:think|thinking|thought|reasoning|reflection)&gt;/gi,
    ""
  );
  text = text.replace(
    /&lt;\/?(?:think|thinking|thought|reasoning|reflection)\b[^&]*&gt;/gi,
    ""
  );

  // Remove fenced code blocks that are JSON (explicit lang or JSON-parsable body)
  text = text.replace(
    /```([\w/+.-]+)?\s*\n([\s\S]*?)```/g,
    (match, lang, body) => {
      const normalizedLang = String(lang || "")
        .trim()
        .toLowerCase();
      const trimmedBody = String(body || "").trim();

      if (normalizedLang === "json" || normalizedLang === "application/json") {
        return "";
      }

      // If the fenced block is valid JSON, drop it.
      const looksLikeJson =
        (trimmedBody.startsWith("{") && trimmedBody.endsWith("}")) ||
        (trimmedBody.startsWith("[") && trimmedBody.endsWith("]"));

      if (looksLikeJson) {
        try {
          JSON.parse(trimmedBody);
          return "";
        } catch {
          // Keep non-JSON code blocks.
        }
      }

      return match;
    }
  );

  // NEW: Remove raw JSON objects that span multiple lines (Flow builder configs, transcripts, etc.)
  // This matches { ... } that contain JSON-like content at the start of message or on their own line
  const jsonObjectPattern = /^\s*\{[\s\S]*?"[\w]+"[\s\S]*?\}\s*$/gm;
  text = text.replace(jsonObjectPattern, (match) => {
    try {
      JSON.parse(match.trim());
      return ""; // It's valid JSON - remove it
    } catch {
      return match; // Not valid JSON - keep it
    }
  });

  // Remove inline JSON objects like {"name":"flow_xxx",...}
  // Be more aggressive - if it looks like {"key":"value", start JSON and has colon/quotes
  text = text.replace(/\{"[^"]+"\s*:\s*[\"\{\[]/g, (match, offset) => {
    // Try to find the matching closing brace
    let depth = 1;
    let i = offset + match.length;
    while (i < text.length && depth > 0) {
      if (text[i] === "{") depth++;
      if (text[i] === "}") depth--;
      i++;
    }
    const jsonCandidate = text.substring(offset, i);
    try {
      JSON.parse(jsonCandidate);
      // Return empty to remove - we'll do a full pass after
      return "";
    } catch {
      return match;
    }
  });

  // Final pass: Try to detect and remove standalone JSON that looks like a flow config or transcript
  // Match patterns like: {"name":"...", "blocks":...} or {"transcript":"..."}
  const flowJsonPattern =
    /\{[^{}]*"(?:name|blocks|config|transcript|arguments|steps|flow)"[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  text = text.replace(flowJsonPattern, (match) => {
    try {
      JSON.parse(match);
      return "";
    } catch {
      return match;
    }
  });

  // Normalize excessive whitespace after stripping blocks
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

export default function ChatContainer({
  workspace,
  knownHistory = [],
  externalEditorRef = null,
  externalToolHandler = null, // New prop for custom tools
  threadSlug: propThreadSlug = null,
  chatOnly = false, // Lightweight mode: no doc tabs, no insert modals
}) {
  const { threadSlug: paramThreadSlug } = useParams();
  const threadSlug = chatOnly
    ? null
    : propThreadSlug || paramThreadSlug || null;
  const [message, setMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [chatHistory, setChatHistory] = useState(knownHistory);
  const [socketId, setSocketId] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [pendingNoteInsert, setPendingNoteInsert] = useState(null);
  const [pendingContent, setPendingContent] = useState(null); // Content waiting for user choice
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [shouldReplace, setShouldReplace] = useState(false); // Flag to clear doc before insert
  const { files, parseAttachments } = useContext(DndUploaderContext);

  // NEW: ANC Proposal Preview Slider State
  const [quoteData, setQuoteData] = useState({});
  const [previewSliderOpen, setPreviewSliderOpen] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  // Detect if this is an ANC workspace by checking system prompt
  const isANCWorkspace = workspace?.inlineAiSystemPrompt?.includes('ANC Sports Proposal Engine');

  // Ref for notes editor to allow AI to insert content
  // If external ref is provided, use it. Otherwise use internal ref.
  const internalNotesEditorRef = useRef(null);
  const notesEditorRef = externalEditorRef || internalNotesEditorRef;
  const executedMessageIds = useRef(new Set());

  const executeTool = useCallback(
    async (toolCall) => {
      const editor = notesEditorRef.current;
      if (!editor) return;

      const { tool, args } = toolCall;
      console.log("[ClientTool] Executing:", tool, args);

      try {
        switch (tool) {
          case "insert_block":
            // args: type, text, parentId, props
            await editor.appendBlock(
              args.type,
              args.text,
              args.parentId,
              args.props
            );
            toast.success("AI inserted content");
            break;
          case "insert_database":
            await editor.insertDatabase(
              args.title,
              args.view,
              args.columns,
              args.rows,
              args.parentId
            );
            toast.success("AI created database");
            break;
          case "update_block":
            // args: id, text
            await editor.updateBlock(args.id, args.text);
            toast.success("AI updated content");
            break;
          case "delete_block":
            // args: id
            await editor.deleteBlock(args.id);
            toast.success("AI deleted content");
            break;
          case "clear_document":
            await editor.clearDocument();
            toast.success("AI cleared document");
            break;
          case "get_selection":
            const sel = editor.getSelection();
            console.log("[ClientTool] Selection:", sel);
            // In a full implementation, we'd feed this back to the AI
            break;
          case "get_document_structure":
            const struct = editor.getDocumentStructure();
            console.log("[ClientTool] Structure:", struct);
            break;
          default:
            if (externalToolHandler) {
              await externalToolHandler(tool, args);
            } else {
              console.warn("[ClientTool] Unknown tool:", tool);
            }
        }
      } catch (e) {
        console.error("[ClientTool] Execution failed:", e);
        toast.error(`AI Action Failed: ${e.message}`);
      }
    },
    [notesEditorRef, externalToolHandler]
  );

  // Tool Execution Effect
  useEffect(() => {
    if (loadingResponse) return; // Wait for stream to finish
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.uuid) return;

    if (executedMessageIds.current.has(lastMsg.uuid)) return;

    // Regex to find the JSON block
    const toolRegex = /```json\s*\n(\{\s*"tool":\s*".*?"[\s\S]*?\})\s*\n```/;
    const match = lastMsg.content?.match(toolRegex);

    if (match) {
      try {
        const toolCall = JSON.parse(match[1]);
        executedMessageIds.current.add(lastMsg.uuid);
        executeTool(toolCall);
      } catch (e) {
        console.error("Failed to parse tool call", e);
      }
    }
  }, [chatHistory, loadingResponse, executeTool]);

  // Reset to chat tab when thread changes (only if not using external editor)
  useEffect(() => {
    if (!externalEditorRef) {
      setActiveTab("chat");
    }
  }, [threadSlug, externalEditorRef]);

  // Listen for AI note insert events
  useEffect(() => {
    const handleNoteInsert = (event) => {
      const { content } = event.detail || {};
      if (!content) return;

      const cleaned = sanitizeNotesMarkdown(content);
      if (!cleaned) {
        toast.error("Nothing client-facing to save.");
        return;
      }

      // Show modal asking user to Replace or Add
      setPendingContent(cleaned);
      setShowInsertModal(true);
    };

    // Handle user's choice from insert modal
    const handleInsertChoice = (mode) => {
      if (!pendingContent) return;

      if (mode === "replace") {
        // Clear first, then insert
        const target = notesEditorRef.current;
        if (target && typeof target.clearDocument === "function") {
          target.clearDocument();
        }
      }

      // Queue the content
      setPendingNoteInsert(pendingContent);

      // Only switch tab if NOT using external editor (split screen)
      if (!externalEditorRef) {
        setActiveTab("notes");
      }

      setShowInsertModal(false);
      setPendingContent(null);
    };

    // Expose handler to window for modal access
    window._handleInsertChoice = handleInsertChoice;

    window.addEventListener(NOTE_INSERT_EVENT, handleNoteInsert);
    return () =>
      window.removeEventListener(NOTE_INSERT_EVENT, handleNoteInsert);
  }, [externalEditorRef]); // Re-bind if ref strategy changes

  // When pending content exists, insert it once the editor is ready.
  useEffect(() => {
    if (!pendingNoteInsert) return;

    let cancelled = false;

    const waitForEditorAndInsert = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;

        const tryInsert = async () => {
          if (cancelled) {
            reject(new Error("Cancelled"));
            return;
          }

          const target = notesEditorRef.current;
          const canInsert =
            target &&
            typeof target.insertMarkdown === "function" &&
            (typeof target.isReady !== "function" || target.isReady() === true);

          if (canInsert) {
            try {
              // If Replace was chosen, clear doc first
              if (shouldReplace && typeof target.clearDocument === "function") {
                target.clearDocument();
                setShouldReplace(false); // Reset flag
              }
              const ok = await target.insertMarkdown(pendingNoteInsert);
              if (ok) {
                resolve();
              } else {
                reject(new Error("Could not insert into Notes."));
              }
            } catch (e) {
              reject(e);
            }
            return;
          }

          attempts += 1;
          if (attempts >= 100) {
            // 10 seconds max
            reject(
              new Error("Editor took too long to initialize. Please try again.")
            );
            return;
          }

          setTimeout(tryInsert, 100);
        };

        tryInsert();
      });
    };

    toast
      .promise(waitForEditorAndInsert(), {
        pending: "Waitng for editor...",
        success: "Content added to your Notes!",
        error: {
          render({ data }) {
            return data?.message || "Could not insert into Notes.";
          },
        },
      })
      .finally(() => {
        setPendingNoteInsert(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingNoteInsert, shouldReplace]);

  // Parse and validate JSON quote data from assistant messages (ANC Proposal System)
  // Runs in all workspaces for testing
  useEffect(() => {
    // Removed isANCWorkspace check for debugging
    if (!chatHistory || chatHistory.length === 0) return;

    // Scan last 5 assistant messages to find the most recent quote data
    // This prevents losing data if the bot sends a short follow-up message
    const assistantMsgs = chatHistory
      .slice(-5) // Look at last 5
      .filter(m => m.role === 'assistant');

    if (assistantMsgs.length === 0) return;

    let foundData = false;
    let newQuoteData = {};

    // Process messages from oldest to newest in the slice to build up state
    for (const msg of assistantMsgs) {
      const content = msg.content || '';
      if (!content) continue;

      const validationResult = extractAndValidateJson(content);
      if (validationResult.valid) {
        foundData = true;
        // Merge this message's data into our accumulator
        newQuoteData = mergeQuoteData(newQuoteData, validationResult.data);
      }
    }

    if (foundData) {
      setQuoteData(prev => {
        const merged = mergeQuoteData(prev, newQuoteData);
        return merged;
      });

      // Auto-open slider when we have meaningful data
      if (newQuoteData.fields && Object.keys(newQuoteData.fields).length > 0) {
        setPreviewSliderOpen(true);
      }
    }
  }, [chatHistory, isANCWorkspace]);

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

  // ANC Proposal Handlers
  const handleGenerateExcel = async () => {
    if (!hasMinimumQuoteData(quoteData)) {
      toast.error("Need complete proposal data first");
      return;
    }

    setGeneratingProposal(true);
    try {
      const response = await fetch(
        `/api/workspace/${workspace.slug}/generate-proposal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...baseHeaders(),
          },
          body: JSON.stringify({
            ...quoteData,
            outputFormat: 'excel',
            margin: quoteData.marginPercent ? (quoteData.marginPercent / 100) : 0.30,
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.downloadUrl) {
        // Download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'proposal.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Excel proposal generated and downloaded');
      } else {
        throw new Error(data.error || 'Failed to generate Excel');
      }
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.error(`Failed to generate Excel: ${error.message}`);
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!hasMinimumQuoteData(quoteData)) {
      toast.error("Need complete proposal data first");
      return;
    }

    setGeneratingProposal(true);
    try {
      const response = await fetch(
        `/api/workspace/${workspace.slug}/generate-proposal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...baseHeaders(),
          },
          body: JSON.stringify({
            ...quoteData,
            outputFormat: 'pdf',
            margin: quoteData.marginPercent ? (quoteData.marginPercent / 100) : 0.30,
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.downloadUrl) {
        // Download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'proposal.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('PDF proposal downloaded');
      } else {
        throw new Error(data.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
    } finally {
      setGeneratingProposal(false);
    }
  };

  return (
    <div
      style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
      className="transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-hidden z-[2] flex flex-col"
    >
      {isMobile && <SidebarMobileHeader />}

      {/* Tab Header - Only show when NOT split screen and NOT chatOnly */}
      {!externalEditorRef && !chatOnly && (
        <div className="flex items-center border-b border-theme-sidebar-border bg-theme-bg-secondary/80 px-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "chat"
                ? "border-theme-text-primary text-theme-text-primary"
                : "border-transparent text-theme-text-secondary hover:text-theme-text-primary"
            }`}
          >
            <ChatText size={18} />
            Chat
          </button>
          {threadSlug && (
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === "notes"
                  ? "border-theme-text-primary text-theme-text-primary"
                  : "border-transparent text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              <FileText size={18} />
              Doc
            </button>
          )}
          <button
            onClick={() => setActiveTab("forms")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === "forms"
                ? "border-theme-text-primary text-theme-text-primary"
                : "border-transparent text-theme-text-secondary hover:text-theme-text-primary"
            }`}
          >
            <NotePencil size={18} />
            Forms
          </button>
        </div>
      )}

      {/* Content Area */}
      <div 
        className="flex-1 overflow-y-auto no-scroll transition-all duration-300"
        style={{ marginRight: previewSliderOpen && !isMobile ? '450px' : '0' }}
      >
        {activeTab === "chat" || externalEditorRef ? (
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
              workspace={workspace}
              submit={handleSubmit}
              onChange={handleMessageChange}
              isStreaming={loadingResponse}
              sendCommand={sendCommand}
              attachments={files}
            />
          </DnDFileUploaderWrapper>
        ) : activeTab === "notes" ? (
          <ThreadNotes workspace={workspace} editorRef={notesEditorRef} />
        ) : (
          <WorkspaceForms workspace={workspace} />
        )}
      </div>

      {activeTab === "chat" && !chatOnly && <ChatTooltips />}

      {/* Insert Mode Modal - Only when not chatOnly */}
      {showInsertModal && !chatOnly && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-theme-bg-secondary border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">
              Insert to Notes
            </h3>
            <p className="text-white/60 text-sm mb-6">
              How would you like to add this content?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (pendingContent) {
                    setShouldReplace(true); // Set flag, will clear after editor mounts
                    setPendingNoteInsert(pendingContent);
                    setActiveTab("notes");
                  }
                  setShowInsertModal(false);
                  setPendingContent(null);
                }}
                className="flex-1 px-4 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
              >
                <div className="font-medium">🔄 Replace</div>
                <div className="text-xs opacity-70">Clear existing content</div>
              </button>
              <button
                onClick={() => {
                  if (pendingContent) {
                    setPendingNoteInsert(pendingContent);
                    setActiveTab("notes");
                  }
                  setShowInsertModal(false);
                  setPendingContent(null);
                }}
                className="flex-1 px-4 py-3 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
              >
                <div className="font-medium">➕ Add</div>
                <div className="text-xs opacity-70">Append to existing</div>
              </button>
            </div>
            <button
              onClick={() => {
                setShowInsertModal(false);
                setPendingContent(null);
              }}
              className="w-full mt-3 px-4 py-2 text-white/50 hover:text-white/70 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ANC Proposal Preview Slider - Show for testing */}
      <ProposalPreviewSlider
        quoteData={quoteData}
        isOpen={previewSliderOpen}
        onToggle={() => setPreviewSliderOpen(!previewSliderOpen)}
        onGenerateExcel={handleGenerateExcel}
        onDownloadPdf={handleDownloadPdf}
        isGenerating={generatingProposal}
      />
    </div>
  );
}
