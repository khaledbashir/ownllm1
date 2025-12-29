import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { AffineEditorContainer } from "@blocksuite/presets";
import { Schema, DocCollection, Text, Job } from "@blocksuite/store";
import { AffineSchemas, PageEditorBlockSpecs } from "@blocksuite/blocks";
import {
  PricingTableBlockSchema,
  PricingTableBlockSpec,
} from "@/components/BlockSuite/pricing-table-block.jsx";
import { setupDatabaseAutoMath } from "@/utils/blocksuite/databaseAutoMath";
import "@blocksuite/presets/themes/affine.css";
// Deep import for HtmlAdapter as it is not exposed in main entry
import { HtmlAdapter } from "@blocksuite/blocks/dist/_common/adapters/html.js";

import {
  FilePdf,
  CircleNotch,
  Database,
  FileDoc,
  CaretDown,
  ShareNetwork,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import ShareProposalModal from "@/components/Modals/ShareProposalModal";
import WorkspaceThread from "@/models/workspaceThread";
import Workspace from "@/models/workspace";
import PdfTemplates from "@/models/pdfTemplates";
import { useEditorContext } from "./EditorContext";
import { setupAISlashMenu } from "@/utils/aiSlashMenu";
import { setupAIFormatBar } from "@/utils/aiFormatBar";
import AIInputModal from "@/components/AIInputModal";
import InlineAI from "@/models/inlineAI";
import DOMPurify from "@/utils/chat/purify";
import renderMarkdown from "@/utils/chat/markdown";
import BlockTemplate from "@/models/blockTemplate";
import "./editor.css";

// Pre-made document templates
export const DOC_TEMPLATES = {
  meeting_notes: {
    name: "Meeting Notes",
    icon: "📋",
    blocks: [
      { type: "h1", text: "Meeting Notes" },
      { type: "h2", text: "📅 Date & Attendees" },
      { type: "paragraph", text: "Date: " },
      { type: "paragraph", text: "Attendees: " },
      { type: "h2", text: "📌 Agenda" },
      { type: "list", items: ["Item 1", "Item 2", "Item 3"] },
      { type: "h2", text: "💬 Discussion" },
      { type: "paragraph", text: "" },
      { type: "h2", text: "✅ Action Items" },
      { type: "list", items: ["[ ] Task 1 - Owner", "[ ] Task 2 - Owner"] },
      { type: "h2", text: "📎 Next Steps" },
      { type: "paragraph", text: "" },
    ],
  },
  proposal: {
    name: "Proposal",
    icon: "💼",
    blocks: [
      { type: "h1", text: "Project Proposal" },
      { type: "h2", text: "Executive Summary" },
      { type: "paragraph", text: "Brief overview of the proposed project..." },
      { type: "h2", text: "Scope of Work" },
      {
        type: "list",
        items: ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      },
      { type: "h2", text: "Timeline" },
      { type: "paragraph", text: "Estimated duration: X weeks" },
      { type: "h2", text: "Investment" },
      { type: "paragraph", text: "Total: $X,XXX" },
      { type: "h2", text: "Terms & Conditions" },
      { type: "paragraph", text: "" },
    ],
  },
  invoice: {
    name: "Invoice",
    icon: "🧾",
    blocks: [
      { type: "h1", text: "INVOICE" },
      { type: "paragraph", text: "Invoice #: INV-XXXX" },
      { type: "paragraph", text: "Date: " },
      { type: "h2", text: "Bill To" },
      { type: "paragraph", text: "Client Name" },
      { type: "paragraph", text: "Company" },
      { type: "paragraph", text: "Address" },
      { type: "h2", text: "Services" },
      { type: "list", items: ["Service 1 - $XXX", "Service 2 - $XXX"] },
      { type: "h2", text: "Total: $X,XXX" },
      { type: "paragraph", text: "Payment due within 30 days." },
    ],
  },
  project_brief: {
    name: "Project Brief",
    icon: "📑",
    blocks: [
      { type: "h1", text: "Project Brief" },
      { type: "h2", text: "Background" },
      { type: "paragraph", text: "Context and reason for the project..." },
      { type: "h2", text: "Objectives" },
      { type: "list", items: ["Objective 1", "Objective 2", "Objective 3"] },
      { type: "h2", text: "Target Audience" },
      { type: "paragraph", text: "" },
      { type: "h2", text: "Key Deliverables" },
      { type: "list", items: ["Deliverable 1", "Deliverable 2"] },
      { type: "h2", text: "Success Metrics" },
      { type: "paragraph", text: "" },
      { type: "h2", text: "Budget & Timeline" },
      { type: "paragraph", text: "" },
    ],
  },
};

/**
 * BlockSuiteEditor - Notion-like block editor using AffineEditorContainer
 *
 * Save/Restore Strategy:
 * - We save the full DocSnapshot JSON from BlockSuite's Job.docToSnapshot()
 * - On restore, we rebuild blocks from the saved snapshot
 * - This preserves all content, formatting, and structure
 */
const BlockSuiteEditor = forwardRef(function BlockSuiteEditor(
  { content, onSave, workspaceSlug, threadSlug },
  ref
) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const collectionRef = useRef(null);
  const jobRef = useRef(null);

  // Get context for global editor access
  const editorContext = useEditorContext();

  const [isReady, setIsReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Brand template state
  const [brandTemplates, setBrandTemplates] = useState([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedBrandTemplate, setSelectedBrandTemplate] = useState(null);

  // Custom AI actions from workspace settings
  const [customAIActions, setCustomAIActions] = useState([]);

  // Fetch custom AI actions from workspace settings
  useEffect(() => {
    async function fetchCustomActions() {
      if (!workspaceSlug) return;
      try {
        const workspace = await Workspace.bySlug(workspaceSlug);
        if (workspace?.inlineAiActions) {
          const actions = JSON.parse(workspace.inlineAiActions);
          setCustomAIActions(Array.isArray(actions) ? actions : []);
          console.log("[BlockSuiteEditor] Loaded custom AI actions:", actions);
        }
      } catch (e) {
        console.warn("[BlockSuiteEditor] Failed to load custom AI actions:", e);
      }
    }
    fetchCustomActions();
  }, [workspaceSlug]);

  // Handler for AI slash menu actions
  const handleAIAction = async (actionType, context) => {
    const { rootElement, model, lang } = context;

    // Get text content from above cursor for context
    const getContextText = () => {
      try {
        const doc = editorRef.current?.doc;
        if (!doc) return "";

        // Get all text blocks and join them
        const blocks = [];
        const traverse = (block) => {
          if (block.text?.toString) {
            blocks.push(block.text.toString());
          }
          block.children?.forEach(traverse);
        };

        const pageBlock = doc.root;
        if (pageBlock) traverse(pageBlock);
        return blocks.join("\n");
      } catch (e) {
        return "";
      }
    };

    switch (actionType) {
      case "ask":
        // Open custom AI input modal
        setShowAIModal(true);
        break;

      case "continue": {
        const contextText = getContextText();
        if (!contextText.trim()) {
          toast.warning("No content to continue from. Write something first!");
          break;
        }
        console.log(
          "[AI Action] Continue writing with context:",
          contextText.slice(-500)
        );

        // Helper to insert text at cursor in BlockSuite
        const insertTextAtCursor = (text) => {
          try {
            const doc = editorRef.current?.doc;
            if (!doc) return false;

            // Find the last note block and add a paragraph
            const noteBlocks = doc
              .getBlocks()
              .filter((b) => b.flavour === "affine:note");
            if (noteBlocks.length > 0) {
              const noteBlock = noteBlocks[noteBlocks.length - 1];
              doc.addBlock(
                "affine:paragraph",
                { text: new Text(text) },
                noteBlock.id
              );
              return true;
            }
            return false;
          } catch (e) {
            console.error("[AI Action] Failed to insert text:", e);
            return false;
          }
        };

        toast.promise(
          (async () => {
            const result = await InlineAI.generate("continue", {
              context: contextText,
              workspaceSlug,
            });

            if (result?.response) {
              insertTextAtCursor(result.response.trim());
              return result.response;
            }
            throw new Error(result?.error || "No response from AI");
          })(),
          {
            pending: "🤖 AI continuing your writing...",
            success: "✅ Content added!",
            error: "❌ Failed to continue writing",
          }
        );
        break;
      }

      case "summarize": {
        const contentToSummarize = getContextText();
        if (!contentToSummarize.trim()) {
          toast.warning("No content to summarize!");
          break;
        }

        toast.promise(
          (async () => {
            const result = await InlineAI.generate("summarize", {
              context: contentToSummarize,
              workspaceSlug,
            });

            if (result?.response) {
              // Insert summary below current content
              const doc = editorRef.current?.doc;
              if (doc) {
                const noteBlocks = doc
                  .getBlocks()
                  .filter((b) => b.flavour === "affine:note");
                if (noteBlocks.length > 0) {
                  const noteBlock = noteBlocks[noteBlocks.length - 1];
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("---") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("📋 Summary:") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text(result.response.trim()) },
                    noteBlock.id
                  );
                }
              }
              return result.response;
            }
            throw new Error(result?.error || "No response from AI");
          })(),
          {
            pending: "🤖 AI summarizing content...",
            success: "✅ Summary added!",
            error: "❌ Failed to summarize",
          }
        );
        break;
      }

      case "improve": {
        const contentToImprove = getContextText();
        if (!contentToImprove.trim()) {
          toast.warning("No content to improve!");
          break;
        }

        toast.promise(
          (async () => {
            const result = await InlineAI.generate("improve", {
              selectedText: contentToImprove,
              workspaceSlug,
            });

            if (result?.response) {
              // Insert improved version below
              const doc = editorRef.current?.doc;
              if (doc) {
                const noteBlocks = doc
                  .getBlocks()
                  .filter((b) => b.flavour === "affine:note");
                if (noteBlocks.length > 0) {
                  const noteBlock = noteBlocks[noteBlocks.length - 1];
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("---") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("✨ Improved version:") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text(result.response.trim()) },
                    noteBlock.id
                  );
                }
              }
              return result.response;
            }
            throw new Error(result?.error || "No response from AI");
          })(),
          {
            pending: "🤖 AI improving writing...",
            success: "✅ Improved version added!",
            error: "❌ Failed to improve writing",
          }
        );
        break;
      }

      case "grammar": {
        const contentToFix = getContextText();
        if (!contentToFix.trim()) {
          toast.warning("No content to fix!");
          break;
        }

        toast.promise(
          (async () => {
            const result = await InlineAI.generate("grammar", {
              selectedText: contentToFix,
              workspaceSlug,
            });

            if (result?.response) {
              // Insert fixed version below
              const doc = editorRef.current?.doc;
              if (doc) {
                const noteBlocks = doc
                  .getBlocks()
                  .filter((b) => b.flavour === "affine:note");
                if (noteBlocks.length > 0) {
                  const noteBlock = noteBlocks[noteBlocks.length - 1];
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("---") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("✅ Grammar fixed:") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text(result.response.trim()) },
                    noteBlock.id
                  );
                }
              }
              return result.response;
            }
            throw new Error(result?.error || "No response from AI");
          })(),
          {
            pending: "🤖 AI fixing grammar...",
            success: "✅ Grammar corrections added!",
            error: "❌ Failed to fix grammar",
          }
        );
        break;
      }

      case "translate": {
        const contentToTranslate = getContextText();
        if (!contentToTranslate.trim()) {
          toast.warning("No content to translate!");
          break;
        }

        toast.promise(
          (async () => {
            const result = await InlineAI.generate("translate", {
              selectedText: contentToTranslate,
              language: lang || "Spanish",
              workspaceSlug,
            });

            if (result?.response) {
              // Insert translation below
              const doc = editorRef.current?.doc;
              if (doc) {
                const noteBlocks = doc
                  .getBlocks()
                  .filter((b) => b.flavour === "affine:note");
                if (noteBlocks.length > 0) {
                  const noteBlock = noteBlocks[noteBlocks.length - 1];
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text("---") },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    {
                      text: new Text(`🌐 Translation (${lang || "Spanish"}):`),
                    },
                    noteBlock.id
                  );
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text(result.response.trim()) },
                    noteBlock.id
                  );
                }
              }
              return result.response;
            }
            throw new Error(result?.error || "No response from AI");
          })(),
          {
            pending: `🤖 AI translating to ${lang || "Spanish"}...`,
            success: "✅ Translation added!",
            error: "❌ Failed to translate",
          }
        );
        break;
      }

      case "selection":
        // AI action from format bar (text selection)
        const { selectedText, actionType: selectionAction } = context;
        if (!selectedText) break;

        // Build prompt based on action type
        const prompts = {
          improve: `Improve this text for clarity and flow. Keep the same meaning. Return ONLY the improved text, no explanations:\n\n${selectedText}`,
          simplify: `Simplify this text to be easier to understand. Use simpler words and shorter sentences. Return ONLY the simplified text:\n\n${selectedText}`,
          formal: `Rewrite this text in a formal, professional tone. Return ONLY the rewritten text:\n\n${selectedText}`,
          casual: `Rewrite this text in a casual, conversational tone. Return ONLY the rewritten text:\n\n${selectedText}`,
          summarize: `Summarize this text into key points. Be concise. Return ONLY the summary:\n\n${selectedText}`,
          expand: `Expand this text with more detail and explanation. Return ONLY the expanded text:\n\n${selectedText}`,
        };

        if (selectionAction === "custom") {
          // Open modal for custom prompt
          setShowAIModal(true);
          break;
        }

        const prompt = prompts[selectionAction];
        if (!prompt) {
          toast.error(`Unknown action: ${selectionAction}`);
          break;
        }

        // Call AI and replace text
        toast.promise(
          (async () => {
            const result = await InlineAI.generate("ask", {
              query: prompt,
              context: "",
              workspaceSlug,
            });

            if (result?.response) {
              const editor = editorRef.current;
              const responseText = result.response.trim();

              // Try to use BlockSuite's command API to replace selection
              // This is the "proper" way that won't break Lit's VDOM
              try {
                if (editor?.std?.command) {
                  editor.std.command.exec("insertText", {
                    text: responseText,
                  });
                  return result.response;
                }
              } catch (e) {
                console.warn(
                  "[BlockSuiteEditor] std.command.insertText failed, falling back",
                  e
                );
              }

              // Fallback: If we can't use the command API, append as a new paragraph
              // instead of messing with the DOM directly.
              const doc = editor?.doc;
              if (doc) {
                const noteBlock = doc.getBlocksByFlavour("affine:note")[0];
                if (noteBlock) {
                  doc.addBlock(
                    "affine:paragraph",
                    { text: new Text(responseText) },
                    noteBlock.id
                  );
                  return result.response;
                }
              }
              return result.response;
            }
            throw new Error("No response from AI");
          })(),
          {
            pending: `✨ AI ${selectionAction}ing text...`,
            success: `✅ Text ${selectionAction === "expand" ? "expanded" : selectionAction + "d"}!`,
            error: "❌ AI failed to process text",
          }
        );
        break;

      default:
        toast.error(`Unknown AI action: ${actionType}`);
    }
  };

  // Helper to save the full document snapshot
  const saveDocSnapshot = useMemo(() => {
    let scheduledId = null;
    let latestDoc = null;

    const cancelScheduled = () => {
      if (scheduledId === null) return;
      if (typeof cancelIdleCallback === "function") {
        cancelIdleCallback(scheduledId);
      } else {
        clearTimeout(scheduledId);
      }
      scheduledId = null;
    };

    const scheduleSnapshot = () => {
      cancelScheduled();

      const run = async () => {
        const doc = latestDoc;
        latestDoc = null;
        if (!doc) return;

        const collection = collectionRef.current;
        if (!collection) return;

        try {
          const job = new Job({ collection });
          const snapshot = await job.docToSnapshot(doc);
          const saveData = JSON.stringify({
            type: "blocksuite-snapshot",
            version: 1,
            snapshot: snapshot,
          });
          onSave(saveData);
        } catch (error) {
          console.error("[BlockSuiteEditor] Failed to save snapshot:", error);
        } finally {
          scheduledId = null;
        }
      };

      if (typeof requestIdleCallback === "function") {
        scheduledId = requestIdleCallback(() => run(), { timeout: 2000 });
      } else {
        scheduledId = setTimeout(() => run(), 0);
      }
    };

    const debounced = debounce((doc) => {
      latestDoc = doc;
      scheduleSnapshot();
    }, 1000);

    const originalCancel = debounced.cancel.bind(debounced);
    debounced.cancel = () => {
      originalCancel();
      cancelScheduled();
      latestDoc = null;
    };

    return debounced;
  }, [onSave]);

  // Initialize BlockSuite editor
  useEffect(() => {
    if (!containerRef.current) return;

    const initEditor = async () => {
      try {
        // Create schema with Affine blocks (+ our custom embed blocks)
        const schema = new Schema().register([
          ...AffineSchemas,
          PricingTableBlockSchema,
        ]);
        const collection = new DocCollection({ schema });
        collection.meta.initialize();
        collectionRef.current = collection;

        // Create job for snapshot operations
        const job = new Job({ collection });
        jobRef.current = job;

        const ensureDocLoaded = async (targetDoc) => {
          if (!targetDoc || typeof targetDoc.load !== "function") return;
          try {
            const result = targetDoc.load();
            if (result && typeof result.then === "function") {
              await result;
            }
          } catch (e) {
            console.warn(
              "[BlockSuiteEditor] doc.load() failed (continuing):",
              e
            );
          }
        };

        let doc;

        // Try to restore from saved snapshot
        if (content) {
          try {
            const parsed = JSON.parse(content);

            if (parsed.type === "blocksuite-snapshot" && parsed.snapshot) {
              // Restore from full snapshot - this is the proper way
              doc = await job.snapshotToDoc(parsed.snapshot);
            } else if (parsed.type === "blocksuite" && parsed.snapshot) {
              // Legacy format with snapshot (in case we saved it before)
              doc = await job.snapshotToDoc(parsed.snapshot);
            } else {
              // Unknown format or old data - create fresh doc
              doc = createEmptyDoc(collection);
            }
          } catch (parseError) {
            console.warn(
              "[BlockSuiteEditor] Could not parse saved content, creating fresh doc:",
              parseError
            );
            doc = createEmptyDoc(collection);
          }
        } else {
          // No content - create fresh doc
          doc = createEmptyDoc(collection);
        }

        // Important: doc must be loaded or editor may appear "frozen"
        await ensureDocLoaded(doc);

        // Setup Auto-Math Service for database blocks
        let unsubscribeAutoMath = null;
        try {
          unsubscribeAutoMath = setupDatabaseAutoMath(doc);
          console.log("✅ Auto-Math Service initialized");
        } catch (e) {
          console.warn("[BlockSuiteEditor] Failed to initialize Auto-Math Service:", e);
        }

        if (
          typeof window !== "undefined" &&
          window?.localStorage?.getItem("debug_blocksuite") === "1"
        ) {
          try {
            const pricingBlocks =
              doc.getBlocksByFlavour?.("affine:embed-pricing-table") || [];
            const databaseBlocks =
              doc.getBlocksByFlavour?.("affine:database") || [];
            console.log(
              "[BlockSuiteEditor][debug] pricing blocks:",
              pricingBlocks.map((b) => ({
                id: b.id,
                rows: Array.isArray(b.model?.rows) ? b.model.rows.length : 0,
                title: b.model?.title?.toString?.(),
              }))
            );
            console.log(
              "[BlockSuiteEditor][debug] database blocks:",
              databaseBlocks.length
            );
          } catch (e) {
            console.warn(
              "[BlockSuiteEditor][debug] failed to inspect blocks:",
              e
            );
          }
        }

        // Create editor and attach document
        const editor = new AffineEditorContainer();
        editor.pageSpecs = [...PageEditorBlockSpecs, PricingTableBlockSpec];
        editor.doc = doc;

        // Clear container and append editor
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(editor);
        }

        // Store refs
        editorRef.current = editor;

        // Register with context for global access
        if (editorContext?.registerEditor) {
          editorContext.registerEditor(editor);
        }

        // Custom Image Upload Handler
        const handleImageUpload = async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          try {
            toast.info("Uploading image...");
            const response = await fetch("/api/utils/upload-image", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("anythingllm_auth_token")}`,
              },
              body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();

            // Insert image block with persistent URL
            if (data.url) {
              // Determine insertion point (simple append for now, or use selection if available)
              // Ideally use editor.std.selection or host.selection
              // For simplicity in this "Custom" implementation, we rely on standard APIs if accessible
              // Or fallback to appending to current note.

              // Trying to insert at selection
              const std = editor.std;
              if (std) {
                // insertBlock is available on std.spec or similar?
                // Let's try appending for stability or using doc.addBlock if we can find where to put it.
                // Actually, standard collection has addBlock.

                // Cleanest way: Append to last note or current focus?
                // Let's try access selection via editor.host if possible
                // If not, just append to the first note found.

                // For now, we manually create the block data
                const noteBlock = doc
                  .getBlocks()
                  .find((b) => b.flavour === "affine:note");
                if (noteBlock) {
                  doc.addBlock(
                    "affine:image",
                    {
                      sourceId: data.url,
                    },
                    noteBlock.id
                  );
                  toast.success("Image uploaded!");
                }
              }
            }
          } catch (e) {
            console.error("Image upload error:", e);
            toast.error("Failed to upload image");
          }
        };

        // Attach Event Listeners
        editor.addEventListener("paste", (e) => {
          const items = e.clipboardData?.items;
          if (items) {
            for (const item of items) {
              if (item.type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                handleImageUpload(file);
              }
            }
          }
        });

        editor.addEventListener("drop", (e) => {
          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("image/")) {
              e.preventDefault();
              handleImageUpload(file);
            }
          }
        });

        // Listen for changes and autosave with full snapshot.
        // Some operations (notably `doc.addBlock`) may not emit `blockUpdated`,
        // so we defensively subscribe to any available slots.
        const attachAutoSave = () => {
          const triggers = ["blockUpdated", "blockAdded", "blockDeleted"];
          triggers.forEach((slotName) => {
            const slot = doc?.slots?.[slotName];
            if (slot && typeof slot.on === "function") {
              slot.on(() => saveDocSnapshot(doc));
            }
          });
        };
        attachAutoSave();

        // Setup AI slash menu after short delay to ensure widgets are ready
        setTimeout(() => {
          try {
            // Access the page root element and its widgets
            const pageRoot = editor.querySelector("affine-page-root");

            // Setup AI Slash Menu
            if (pageRoot?.widgetElements?.["affine-slash-menu-widget"]) {
              const slashMenu =
                pageRoot.widgetElements["affine-slash-menu-widget"];
              setupAISlashMenu(slashMenu, handleAIAction);
            }

            // Setup AI Format Bar (selection toolbar)
            if (pageRoot?.widgetElements?.["affine-format-bar-widget"]) {
              const formatBar =
                pageRoot.widgetElements["affine-format-bar-widget"];
              setupAIFormatBar(formatBar, handleAIAction, customAIActions);
            }
          } catch (err) {
            console.warn("[BlockSuiteEditor] Could not setup AI widgets:", err);
          }
        }, 500);

        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize BlockSuite editor:", error);
        toast.error("Failed to load editor");
      }
    };

    function createEmptyDoc(collection) {
      const doc = collection.createDoc({ id: "thread-notes" });
      // Keep structure minimal; caller will doc.load() safely.
      const pageBlockId = doc.addBlock("affine:page", {});
      doc.addBlock("affine:surface", {}, pageBlockId);
      const noteId = doc.addBlock("affine:note", {}, pageBlockId);
      doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
      return doc;
    }

    initEditor();

    return () => {
      saveDocSnapshot.cancel();
      // Unregister from context
      if (editorContext?.unregisterEditor) {
        editorContext.unregisterEditor();
      }
      // Cleanup Auto-Math Service
      if (typeof unsubscribeAutoMath === 'function') {
        unsubscribeAutoMath();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Parse markdown and add structured blocks to the document
   * Supports: headings, bold/italic (inline), code blocks, lists, paragraphs
   */
  const parseMarkdownToBlocks = (doc, noteBlockId, markdown) => {
    const lines = markdown.split("\n");
    let i = 0;
    let lastHeadingText = null;

    const parseMarkdownTableRow = (row) => {
      const line = String(row || "").trim();
      // Split by pipe but ignore escaped pipes (\|)
      // 1. We replace escaped pipes with a placeholder
      // 2. Split by pipe
      // 3. Restore placeholder to pipe
      const PLACEHOLDER = "___PIPE_PLACEHOLDER___";
      const parts = line
        .replace(/\\\|/g, PLACEHOLDER)
        .split("|")
        .map((part) => part.replace(new RegExp(PLACEHOLDER, "g"), "|").trim());

      // Markdown tables often start and end with empty strings if they have outer pipes
      if (parts.length >= 2 && parts[0] === "") parts.shift();
      if (parts.length >= 2 && parts[parts.length - 1] === "") parts.pop();

      return parts;
    };

    const parseNumber = (value) => {
      const text = String(value || "");
      // Remove currency symbols and commas
      const cleanText = text.replace(/[$,]/g, "");
      const match = cleanText.match(/-?\d+(?:\.\d+)?/);
      if (!match) return null;
      const n = Number(match[0]);
      return Number.isFinite(n) ? n : null;
    };

    const normalizeHeader = (h) =>
      String(h || "")
        .trim()
        .toLowerCase();
    const normalizeRoleKey = (role) =>
      String(role || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");

    const detectCurrency = (texts) => {
      const blob = texts.map((t) => String(t || "").toLowerCase()).join(" ");
      if (blob.includes("usd")) return "USD";
      if (blob.includes("aud")) return "AUD";
      if (blob.includes("gbp")) return "GBP";
      if (blob.includes("eur")) return "EUR";
      return "AUD";
    };

    const parsePercentFromContext = (contextLines, key) => {
      const joined = contextLines.join("\n");
      const direct = joined.match(
        new RegExp(`${key}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)\\s*%`, "i")
      );
      if (direct) return Number(direct[1]);
      const reversed = joined.match(
        new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*${key}`, "i")
      );
      if (reversed) return Number(reversed[1]);
      return null;
    };

    const mandatoryRoleKeys = {
      techHead: normalizeRoleKey("Tech - Head Of- Senior Project Management"),
      projectCoordination: normalizeRoleKey(
        "Tech - Delivery - Project Coordination"
      ),
      accountManagement: normalizeRoleKey(
        "Account Management - (Account Manager)"
      ),
    };

    const orderPricingRows = (rows) => {
      if (!Array.isArray(rows) || rows.length < 2) return rows;
      const rank = (roleName) => {
        const key = normalizeRoleKey(roleName);
        if (key === mandatoryRoleKeys.techHead) return 0;
        if (key === mandatoryRoleKeys.projectCoordination) return 1;
        if (key === mandatoryRoleKeys.accountManagement) return 999;
        return 2;
      };

      return rows
        .map((row, originalIndex) => ({ row, originalIndex }))
        .sort((a, b) => {
          const ra = rank(a.row?.role);
          const rb = rank(b.row?.role);
          if (ra !== rb) return ra - rb;
          return a.originalIndex - b.originalIndex;
        })
        .map((x) => x.row);
    };

    const tryParsePricingTable = ({
      headerCells,
      dataRows,
      titleHint,
      contextLines,
    }) => {
      if (!Array.isArray(headerCells) || headerCells.length < 2) return null;

      const headers = headerCells.map(normalizeHeader);

      // Helper to find column index with looser matching
      const findCol = (keywords) =>
        headers.findIndex((h) => keywords.some((k) => h.includes(k)));

      const idxRole = findCol([
        "role",
        "resource",
        "service",
        "item",
        "deliverable",
        "component", // Added to support summary tables
      ]);
      const idxHours = findCol(["hour", "qty", "quantity", "days", "units"]);
      const idxRate = findCol(["rate", "price", "cost", "fee", "amount"]);
      const idxTotal = findCol(["total", "subtotal", "value", "investment"]); // Added to support summary tables
      const idxDesc = findCol(["description", "detail", "note", "scope", "type"]); // Added 'type' for Investment Type

      // Require at least Role and (Rate OR Total) to be considered a pricing table
      if (idxRole === -1 || (idxRate === -1 && idxTotal === -1)) {
        // Not a pricing table
        return null;
      }

      const currency = detectCurrency([
        ...headerCells,
        ...(contextLines || []),
      ]);
      const discountPercent =
        parsePercentFromContext(contextLines || [], "discount") ?? 0;
      const gstPercent =
        parsePercentFromContext(contextLines || [], "gst") ?? 10;
      const title =
        typeof titleHint === "string" && titleHint.trim()
          ? titleHint.trim()
          : "Project Pricing";

      const rows = (Array.isArray(dataRows) ? dataRows : [])
        .map((cells, idx) => {
          const role = cells[idxRole] || "";
          // Fix: Ignore garbage rows that look like summaries
          if (/subtotal|total/i.test(role)) return null;

          const hours =
            idxHours !== -1 ? (parseNumber(cells[idxHours]) ?? 0) : 0;

          // If Rate is missing but Total exists, use Total as Rate (assuming 1 unit/hour)
          let baseRate = idxRate !== -1 ? (parseNumber(cells[idxRate]) ?? 0) : 0;
          if (idxRate === -1 && idxTotal !== -1) {
            baseRate = parseNumber(cells[idxTotal]) ?? 0;
          }

          const description = idxDesc !== -1 ? cells[idxDesc] || "" : "";

          if (!role) return null;

          return {
            id: `${Date.now()}-${idx}`,
            role,
            description,
            hours: hours || 1, // Default to 1 if hours missing (e.g. summary table)
            baseRate,
          };
        })
        .filter(Boolean);

      if (!rows.length) return null;

      return {
        title,
        currency,
        discountPercent,
        gstPercent,
        rows: orderPricingRows(rows),
      };
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // Markdown table detection - either pricing table embed or affine:database
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableStartIndex = i;
        const tableLines = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          const tableLine = lines[i].trim();
          // Check if this is a separator row (contains only |, -, :, and spaces)
          const isSeparator =
            /^\|[\s\-:|]+\|$/.test(tableLine) && tableLine.includes("-");
          if (!isSeparator) {
            tableLines.push(tableLine);
          }
          i++;
        }

        if (tableLines.length > 0) {
          const headerCells = parseMarkdownTableRow(tableLines[0]);
          const dataRows = tableLines.slice(1).map(parseMarkdownTableRow);
          const contextLines = lines.slice(
            Math.max(0, tableStartIndex - 6),
            Math.min(lines.length, i + 6)
          );

          const parsedPricing = tryParsePricingTable({
            headerCells,
            dataRows,
            titleHint: lastHeadingText,
            contextLines,
          });

          if (parsedPricing) {
            try {
              doc.addBlock(
                "affine:embed-pricing-table",
                {
                  title: new Text(parsedPricing.title),
                  currency: parsedPricing.currency,
                  discountPercent: parsedPricing.discountPercent,
                  gstPercent: parsedPricing.gstPercent,
                  rows: parsedPricing.rows,
                },
                noteBlockId
              );
              // Ensure snapshot persists even if slots didn't fire.
              saveDocSnapshot(doc);
              continue;
            } catch (e) {
              console.error(
                "[BlockSuiteEditor] Failed to insert pricing table embed; falling back to database:",
                e
              );
              // fall through to database handling
            }
          }

          // Fallback: Create affine:database for non-pricing tables
          // Generate unique IDs for columns
          const genId = () => Math.random().toString(36).substring(2, 10);
          const viewsColumns = headerCells.map(() => ({
            id: genId(),
            hide: false,
            width: 180,
          }));

          // Build columns definition
          const columns = headerCells.map((header, index) => ({
            type: index === 0 ? "title" : "rich-text",
            name: header,
            data: {},
            id: viewsColumns[index].id,
          }));

          // Create the database block first (cells will be empty initially)
          const databaseId = doc.addBlock(
            "affine:database",
            {
              views: [
                {
                  id: genId(),
                  name: "Table View",
                  mode: "table",
                  columns: [],
                  filter: { type: "group", op: "and", conditions: [] },
                  header: {
                    titleColumn: viewsColumns[0]?.id,
                    iconColumn: "type",
                  },
                },
              ],
              title: new Text(""),
              cells: {},
              columns,
            },
            noteBlockId
          );

          // Add paragraph rows for title column - these become the row IDs
          const rowBlockIds = dataRows.map((row) => {
            return doc.addBlock(
              "affine:paragraph",
              {
                text: new Text(row[0] || ""),
                type: "text",
              },
              databaseId
            );
          });

          // Now build and set the cells using the actual block IDs as row keys
          const cells = {};
          dataRows.forEach((row, rowIndex) => {
            const rowId = rowBlockIds[rowIndex];
            cells[rowId] = {};
            // Start from column 1 (skip title column which is the paragraph text)
            row.slice(1).forEach((cellValue, colIndex) => {
              const columnId = viewsColumns[colIndex + 1]?.id;
              if (columnId) {
                cells[rowId][columnId] = {
                  columnId: columnId,
                  value: new Text(cellValue),
                };
              }
            });
          });

          // Update the database block with the cells
          const databaseBlock = doc.getBlock(databaseId);
          if (databaseBlock) {
            doc.updateBlock(databaseBlock.model, { cells });
          }
        }
        continue;
      }

      // Fenced code block
      if (trimmed.startsWith("```")) {
        const lang = trimmed.slice(3).trim() || "plain";
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        doc.addBlock(
          "affine:code",
          {
            text: new Text(codeLines.join("\n")),
            language: lang,
          },
          noteBlockId
        );
        continue;
      }

      // Headings
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length; // 1-6
        const headingText = parseInlineFormatting(headingMatch[2]);
        const headingType = level <= 3 ? `h${level}` : "h3";

        // Skip creating H1 blocks if this is being called from insertMarkdown with remainingContent
        // The title should already be set as page title in insertMarkdown
        const isFromInsertMarkdown = doc && doc._insertMarkdownMode;
        if (level === 1 && isFromInsertMarkdown) {
          // Skip H1 blocks in remaining content - title already handled
          console.log("[BlockSuiteEditor] Skipping H1 block in remaining content:", headingText);
        } else {
          doc.addBlock(
            "affine:paragraph",
            {
              type: headingType,
              text: new Text(headingText),
            },
            noteBlockId
          );
        }

        lastHeadingText = headingText;
        i++;
        continue;
      }

      // Unordered list item
      if (/^[-*+]\s+/.test(trimmed)) {
        const listText = trimmed.replace(/^[-*+]\s+/, "");
        doc.addBlock(
          "affine:list",
          {
            type: "bulleted",
            text: new Text(parseInlineFormatting(listText)),
          },
          noteBlockId
        );
        i++;
        continue;
      }

      // Ordered list item
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        doc.addBlock(
          "affine:list",
          {
            type: "numbered",
            text: new Text(parseInlineFormatting(orderedMatch[2])),
          },
          noteBlockId
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith(">")) {
        const quoteText = trimmed.slice(1).trim();
        doc.addBlock(
          "affine:paragraph",
          {
            type: "quote",
            text: new Text(parseInlineFormatting(quoteText)),
          },
          noteBlockId
        );
        i++;
        continue;
      }

      // Image (placeholder for now)
      if (trimmed.startsWith("![")) {
        doc.addBlock(
          "affine:paragraph",
          {
            type: "quote",
            text: new Text("📸 [Screenshot Captured]"),
          },
          noteBlockId
        );
        i++;
        continue;
      }

      // Regular paragraph
      doc.addBlock(
        "affine:paragraph",
        {
          text: new Text(parseInlineFormatting(trimmed)),
        },
        noteBlockId
      );
      i++;
    }
  };

  /**
   * Strip markdown inline formatting for plain text display
   * BlockSuite Text() doesn't support rich text formatting in this version,
   * so we strip bold/italic markers for cleaner display
   */
  const parseInlineFormatting = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, "$1") // **bold** -> bold
      .replace(/__(.+?)__/g, "$1") // __bold__ -> bold
      .replace(/\*(.+?)\*/g, "$1") // *italic* -> italic
      .replace(/_(.+?)_/g, "$1") // _italic_ -> italic
      .replace(/`(.+?)`/g, "$1") // `code` -> code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [link](url) -> link
  };

  // Expose insert method to parent
  useImperativeHandle(ref, () => ({
    isReady: () => isReady,

    // === Programmatic Control API (SiYuan-like) ===

    // Get the full document structure as a JSON tree
    getDocumentStructure: () => {
      if (!editorRef.current?.doc) return null;
      try {
        const doc = editorRef.current.doc;
        // Recursive helper to build tree
        const buildTree = (block) => {
          return {
            id: block.id,
            flavour: block.flavour,
            text: block.text?.toString?.() || "",
            // Add other props as needed
            children: (block.children || []).map(buildTree)
          };
        };
        return buildTree(doc.root);
      } catch (e) {
        console.error("Failed to get document structure:", e);
        return null;
      }
    },

    // Get the current user selection (Block or Text)
    getSelection: () => {
      if (!editorRef.current?.std?.selection) return null;
      try {
        const selection = editorRef.current.std.selection;
        const textSelection = selection.find('text');
        const blockSelection = selection.find('block');

        if (textSelection) {
          return {
            type: 'text',
            from: textSelection.from,
            to: textSelection.to,
            blockId: textSelection.blockId
          };
        }
        if (blockSelection) {
          return {
            type: 'block',
            blockIds: blockSelection.blockIds
          };
        }
        return null;
      } catch (e) {
        console.error("Failed to get selection:", e);
        return null;
      }
    },

    // Update a specific block's text
    updateBlock: (blockId, newText) => {
      if (!editorRef.current?.doc) return false;
      try {
        const doc = editorRef.current.doc;
        const block = doc.getBlock(blockId);
        if (block && block.text) {
          // We need to transact to update text? Or just set it?
          // BlockSuite Text object has update method or we replace the prop
          console.log(`Updating block ${blockId} to "${newText}"`);
          // Note: This is an internal API guess, actual BlockSuite API might vary
          // Usually we do: doc.updateBlock(block, { text: new Text(newText) })
          doc.updateBlock(block, { text: new Text(newText) });
          return true;
        }
        return false;
      } catch (e) {
        console.error("Failed to update block:", e);
        return false;
      }
    },

    // Append a block to a parent (or root/last note if parentId null)
    appendBlock: (type = "affine:paragraph", textContent = "", parentId = null, props = {}) => {
      if (!editorRef.current?.doc) return false;
      try {
        const doc = editorRef.current.doc;
        let pId = parentId;

        // If no parent, find the last note block
        if (!pId) {
          // If we have a selection, try to append after it?
          // For now, default to last note for reliability
          const noteBlocks = doc.getBlocksByFlavour("affine:note");
          if (noteBlocks.length > 0) {
            pId = noteBlocks[noteBlocks.length - 1].id;
          }
        }

        if (!pId) return false; // Cannot find place to insert

        const id = doc.addBlock(
          type,
          { text: new Text(textContent), ...props },
          pId
        );
        return id;
      } catch (e) {
        console.error("Failed to append block:", e);
        return false;
      }
    },

    // Create a database (Kanban/Table)
    insertDatabase: (title, view = 'kanban', columnsDef = [], rowsData = [], parentId = null) => {
      if (!editorRef.current?.doc) return false;
      try {
        const doc = editorRef.current.doc;
        // Generate internal IDs for columns
        const columns = columnsDef.map(col => ({
          id: window.crypto.randomUUID(),
          name: col.name,
          type: col.type || 'text',
          data: col.options ? {
            options: col.options.map(o => ({
              id: window.crypto.randomUUID(),
              value: o,
              color: 'var(--affine-tag-blue)'
            }))
          } : {}
        }));

        // Find parent
        let pId = parentId;
        if (!pId) {
          const noteBlocks = doc.getBlocksByFlavour("affine:note");
          if (noteBlocks.length > 0) pId = noteBlocks[noteBlocks.length - 1].id;
        }
        if (!pId) return false;

        // Create Database Block
        // We must provide a View so it renders.
        const viewId = window.crypto.randomUUID();
        const views = [{
          id: viewId,
          name: 'Default View',
          mode: view || 'table',
          columns: columns.map(c => ({
            id: c.id,
            width: 180,
            hidden: false
          })),
          filter: { type: 'group', op: 'and', conditions: [] }
        }];

        const dbId = doc.addBlock('affine:database', {
          title: new Text(title),
          columns: columns,
          views: views
        }, pId);

        // Add Rows and Populate Cells
        const cells = {};

        for (const row of rowsData) {
          // Identify title content: look for 'title', 'name', 'Task', or first key
          const titleKey = Object.keys(row).find(k => k.toLowerCase() === 'title' || k.toLowerCase() === 'name' || k.toLowerCase() === 'task') || Object.keys(row)[0];
          const rowTitle = row[titleKey] || "Untitled";

          // Create row block (child paragraph)
          const rowId = doc.addBlock('affine:paragraph', { text: new Text(rowTitle) }, dbId);

          // Map other columns
          cells[rowId] = {};
          columns.forEach(col => {
            if (col.name === titleKey) return; // Skip title, already set

            const val = row[col.name];
            if (val) {
              if (col.type === 'select' && col.data?.options) {
                const opt = col.data.options.find(o => o.value === val);
                if (opt) cells[rowId][col.id] = { value: opt.id };
              } else if (col.type === 'multi-select' && Array.isArray(val) && col.data?.options) {
                // Handle multi-select? Just skipping complexity for now
              } else {
                cells[rowId][col.id] = { value: val };
              }
            }
          });
        }

        // Update cells
        const block = doc.getBlock(dbId);
        if (block) {
          doc.updateBlock(block, { cells });
        }

        console.log("[BlockSuite] Created database:", dbId);
        return dbId;
      } catch (e) {
        console.error("Failed to insert database:", e);
        return false;
      }
    },

    // Delete a block
    deleteBlock: (blockId) => {
      if (!editorRef.current?.doc) return false;
      try {
        const doc = editorRef.current.doc;
        const block = doc.getBlock(blockId);
        if (block) {
          doc.deleteBlock(block);
          return true;
        }
        return false;
      } catch (e) {
        console.error("Failed to delete block:", e);
        return false;
      }
    },

    // Clear all content from the document
    clearDocument: () => {
      if (!editorRef.current?.doc) return false;
      const doc = editorRef.current.doc;

      try {
        // Find the note block
        const noteBlocks = doc.getBlocksByFlavour?.("affine:note") || [];
        if (noteBlocks.length === 0) return false;

        const noteBlock = noteBlocks[0];

        // Remove all children from the note block
        const children = [...(noteBlock.children || [])];
        for (const child of children) {
          try {
            doc.deleteBlock(child.id || child);
          } catch (e) {
            // ignore
          }
        }

        // Add an empty paragraph to start fresh
        doc.addBlock("affine:paragraph", { text: new Text() }, noteBlock.id);

        console.log("[BlockSuiteEditor] Document cleared");
        return true;
      } catch (e) {
        console.error("[BlockSuiteEditor] Failed to clear document:", e);
        return false;
      }
    },

    insertMarkdown: async (markdown) => {
      console.log(
        "[BlockSuiteEditor] insertMarkdown called with:",
        markdown?.substring(0, 100)
      );

      if (!markdown) {
        console.error("[BlockSuiteEditor] Missing markdown");
        return false;
      }

      if (!editorRef.current) {
        console.error("[BlockSuiteEditor] Missing editor");
        return false;
      }

      // Get current doc
      const doc = editorRef.current.doc;
      if (!doc) {
        console.error("[BlockSuiteEditor] No doc found");
        return false;
      }

      const getBlocksByFlavourSafe = (targetDoc, flavour) => {
        try {
          if (typeof targetDoc.getBlocksByFlavour === "function") {
            return targetDoc.getBlocksByFlavour(flavour) || [];
          }
        } catch (e) {
          // ignore
        }
        // Fallback: traverse from root
        const found = [];
        const traverse = (block) => {
          if (!block) return;
          if (block.flavour === flavour) found.push(block);
          if (block.children?.length) block.children.forEach(traverse);
        };
        traverse(targetDoc.root);
        return found;
      };

      const ensureThreadNoteBlock = () => {
        // 1) Prefer existing note blocks
        let noteBlock = getBlocksByFlavourSafe(doc, "affine:note")[0];
        if (noteBlock) return noteBlock;

        // 2) Find or create a page block
        let pageBlock = getBlocksByFlavourSafe(doc, "affine:page")[0];
        if (!pageBlock && doc.root?.flavour === "affine:page") {
          pageBlock = doc.root;
        }
        if (!pageBlock) {
          const pageBlockId = doc.addBlock("affine:page", {});
          pageBlock = doc.getBlock(pageBlockId);
        }

        if (!pageBlock?.id) return null;

        // 3) Ensure surface exists (some editor flows assume it)
        const hasSurface =
          getBlocksByFlavourSafe(doc, "affine:surface").length > 0;
        if (!hasSurface) {
          try {
            doc.addBlock("affine:surface", {}, pageBlock.id);
          } catch (e) {
            // ignore
          }
        }

        // 4) Create note block + an initial paragraph
        try {
          const noteBlockId = doc.addBlock("affine:note", {}, pageBlock.id);
          doc.addBlock("affine:paragraph", { text: new Text() }, noteBlockId);
          noteBlock = doc.getBlock(noteBlockId);
          console.log(
            "[BlockSuiteEditor] Created missing note block:",
            noteBlockId
          );
          return noteBlock;
        } catch (e) {
          console.error("[BlockSuiteEditor] Failed to create note block:", e);
          return null;
        }
      };

      // Find the note block for adding content (or create it)
      const noteBlock = ensureThreadNoteBlock();
      if (!noteBlock) {
        console.error("[BlockSuiteEditor] No valid note block found/created");
        return false;
      }

      console.log("[BlockSuiteEditor] Using note block:", noteBlock.id);

      try {
        // Extract title from first heading and remaining content
        const { title, remainingContent } = extractTitleFromMarkdown(markdown);

        // If we found a title, set it as the page title
        if (title) {
          const pageBlock = getBlocksByFlavourSafe(doc, "affine:page")[0] || doc.root;
          if (pageBlock) {
            try {
              const titleProp = pageBlock.title;
              if (titleProp && typeof titleProp.insert === "function") {
                titleProp.clear();
                titleProp.insert(title, 0);
                console.log("[BlockSuiteEditor] Set page title to:", title);
              } else if (
                typeof pageBlock.title === "object" &&
                pageBlock.title?.yText
              ) {
                pageBlock.title.yText.delete(0, pageBlock.title.yText.length);
                pageBlock.title.yText.insert(0, title);
                console.log("[BlockSuiteEditor] Set page title via yText:", title);
              } else {
                console.warn("[BlockSuiteEditor] Could not access page title property");
              }
            } catch (titleError) {
              console.warn("[BlockSuiteEditor] Could not set page title:", titleError);
            }
          }
        }

        // Parse and insert the remaining content
        if (remainingContent.trim()) {
          doc.transact(() => {
            // Set flag to indicate we're in insertMarkdown mode (skip H1 blocks)
            doc._insertMarkdownMode = true;
            parseMarkdownToBlocks(doc, noteBlock.id, remainingContent);
            doc._insertMarkdownMode = false;
          });
        }

        // Ensure snapshot persists even if slots didn't fire.
        saveDocSnapshot(doc);

        console.log(
          "[BlockSuiteEditor] Successfully parsed and inserted markdown"
        );
        return true;
      } catch (e) {
        console.error("[BlockSuiteEditor] parseMarkdownToBlocks failed:", e);
        // Fallback
        try {
          const lines = markdown.split("\n").filter((l) => l.trim());
          for (const line of lines) {
            doc.addBlock(
              "affine:paragraph",
              { text: new Text(line) },
              noteBlock.id
            );
          }
          return true;
        } catch (fallbackError) {
          console.error("[BlockSuiteEditor] Fallback failed:", fallbackError);
          return false;
        }
      }
    },

    // Insert a prefilled interactive pricing table block.
    insertPricingTableWithData: async (data = {}) => {
      if (!editorRef.current) return false;
      const doc = editorRef.current.doc;
      if (!doc) return false;

      const getBlocksByFlavourSafe = (targetDoc, flavour) => {
        try {
          if (typeof targetDoc.getBlocksByFlavour === "function") {
            return targetDoc.getBlocksByFlavour(flavour) || [];
          }
        } catch {
          // ignore
        }
        const found = [];
        const traverse = (block) => {
          if (!block) return;
          if (block.flavour === flavour) found.push(block);
          if (block.children?.length) block.children.forEach(traverse);
        };
        traverse(targetDoc.root);
        return found;
      };

      const ensureThreadNoteBlock = () => {
        let noteBlock = getBlocksByFlavourSafe(doc, "affine:note")[0];
        if (noteBlock) return noteBlock;

        let pageBlock = getBlocksByFlavourSafe(doc, "affine:page")[0];
        if (!pageBlock && doc.root?.flavour === "affine:page")
          pageBlock = doc.root;
        if (!pageBlock) {
          const pageBlockId = doc.addBlock("affine:page", {});
          pageBlock = doc.getBlock(pageBlockId);
        }
        if (!pageBlock?.id) return null;

        const hasSurface =
          getBlocksByFlavourSafe(doc, "affine:surface").length > 0;
        if (!hasSurface) {
          try {
            doc.addBlock("affine:surface", {}, pageBlock.id);
          } catch {
            // ignore
          }
        }

        try {
          const noteBlockId = doc.addBlock("affine:note", {}, pageBlock.id);
          doc.addBlock("affine:paragraph", { text: new Text() }, noteBlockId);
          noteBlock = doc.getBlock(noteBlockId);
          return noteBlock;
        } catch (e) {
          console.error(
            "[BlockSuiteEditor] Failed to create note block for pricing table:",
            e
          );
          return null;
        }
      };

      const toNumber = (v, fallback = 0) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      const normalizeRoleKeyLocal = (role) =>
        String(role || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");

      const mandatoryRoleKeysLocal = {
        techHead: normalizeRoleKeyLocal(
          "Tech - Head Of- Senior Project Management"
        ),
        projectCoordination: normalizeRoleKeyLocal(
          "Tech - Delivery - Project Coordination"
        ),
        accountManagement: normalizeRoleKeyLocal(
          "Account Management - (Account Manager)"
        ),
      };

      const normalizeRows = (rows) => {
        if (!Array.isArray(rows)) return [];

        const cleaned = rows.map((row, idx) => {
          const safeRow = row && typeof row === "object" ? row : {};
          return {
            id: safeRow.id || `${Date.now()}-${idx}`,
            role: safeRow.role || "",
            description: safeRow.description || "",
            hours: toNumber(safeRow.hours, 0),
            baseRate: toNumber(
              safeRow.baseRate ?? safeRow.rate ?? safeRow.hourlyRate,
              0
            ),
          };
        });

        const rank = (roleName) => {
          const key = normalizeRoleKeyLocal(roleName);
          if (key === mandatoryRoleKeysLocal.techHead) return 0;
          if (key === mandatoryRoleKeysLocal.projectCoordination) return 1;
          if (key === mandatoryRoleKeysLocal.accountManagement) return 999;
          return 2;
        };

        return cleaned
          .map((row, originalIndex) => ({ row, originalIndex }))
          .sort((a, b) => {
            const ra = rank(a.row.role);
            const rb = rank(b.row.role);
            if (ra !== rb) return ra - rb;
            return a.originalIndex - b.originalIndex;
          })
          .map((x) => x.row);
      };

      const noteBlock = ensureThreadNoteBlock();
      if (!noteBlock?.id) return false;

      const payload = data && typeof data === "object" ? data : {};
      const title =
        typeof payload.title === "string" ? payload.title : "Project Pricing";
      const currency =
        typeof payload.currency === "string" ? payload.currency : "AUD";
      const discountPercent = toNumber(payload.discountPercent, 0);
      const gstPercent = toNumber(payload.gstPercent, 10);
      const rows = normalizeRows(payload.rows);

      try {
        doc.addBlock(
          "affine:embed-pricing-table",
          {
            title: new Text(title),
            currency,
            discountPercent,
            gstPercent,
            rows,
          },
          noteBlock.id
        );
        // Ensure snapshot persists even if slots didn't fire.
        saveDocSnapshot(doc);
        return true;
      } catch (e) {
        console.error(
          "[BlockSuiteEditor] Failed to insert prefilled pricing table:",
          e
        );
        return false;
      }
    },

    // Simply append markdown content to the end of the doc
    appendMarkdown: async (markdown) => {
      if (!editorRef.current || !markdown) return;
      const doc = editorRef.current.doc;
      if (!doc) return;

      const noteBlock = doc.getBlocksByFlavour("affine:note")[0];
      if (!noteBlock) return;

      try {
        doc.transact(() => {
          parseMarkdownToBlocks(doc, noteBlock.id, markdown);
        });
        // Ensure snapshot persists even if slots didn't fire.
        saveDocSnapshot(doc);
      } catch (e) {
        console.error("[BlockSuiteEditor] appendMarkdown failed:", e);
      }
    },

    // Load a pre-made document template
    loadTemplate: (templateKey) => {
      const template = DOC_TEMPLATES[templateKey];
      if (!template) {
        toast.error("Template not found");
        return;
      }

      const editor = editorRef.current;
      if (!editor || !editor.doc) {
        toast.error("Editor not ready");
        return;
      }

      const doc = editor.doc;
      const collection = collectionRef.current;

      try {
        // Find the note block to add content to
        const pageBlock = doc.root;
        if (!pageBlock) return;

        const noteBlock = pageBlock.children?.find(
          (b) => b.flavour === "affine:note"
        );
        if (!noteBlock) return;

        // Clear existing content (except the first empty paragraph)
        const children = [...(noteBlock.children || [])];
        children.forEach((child) => {
          try {
            doc.deleteBlock(child);
          } catch (e) {
            // Ignore
          }
        });

        // Add template blocks
        template.blocks.forEach((block) => {
          if (
            block.type === "h1" ||
            block.type === "h2" ||
            block.type === "h3"
          ) {
            doc.addBlock(
              "affine:paragraph",
              {
                type: block.type,
                text: new Text(block.text),
              },
              noteBlock.id
            );
          } else if (block.type === "paragraph") {
            doc.addBlock(
              "affine:paragraph",
              {
                text: new Text(block.text),
              },
              noteBlock.id
            );
          } else if (block.type === "list") {
            block.items.forEach((item) => {
              doc.addBlock(
                "affine:list",
                {
                  type: "bulleted",
                  text: new Text(item),
                },
                noteBlock.id
              );
            });
          }
        });

        toast.success(`Loaded "${template.name}" template`);
      } catch (error) {
        console.error("[BlockSuiteEditor] Failed to load template:", error);
        toast.error("Failed to load template");
      }
    },

    getEditor: () => editorRef.current,

    saveAsTemplate: async (name, description) => {
      if (!editorRef.current || !editorRef.current.doc) {
        throw new Error("Editor not ready");
      }

      const doc = editorRef.current.doc;
      const collection = collectionRef.current;

      if (!collection) {
        throw new Error("Document collection not available");
      }

      try {
        // Ensure the document is loaded before creating snapshot
        if (doc.load) {
          const loadResult = doc.load();
          if (loadResult && typeof loadResult.then === 'function') {
            await loadResult;
          }
        }

        console.log("[BlockSuiteEditor] Creating snapshot for template save...");
        const job = new Job({ collection });
        const snapshot = await job.docToSnapshot(doc);

        if (!snapshot) {
          throw new Error("Failed to generate document snapshot");
        }

        console.log("[BlockSuiteEditor] Snapshot created successfully, length:", JSON.stringify(snapshot).length);

        return await BlockTemplate.create(workspaceSlug, {
          name,
          description,
          snapshot,
        });
      } catch (error) {
        console.error("[BlockSuiteEditor] Failed to save template:", error);
        throw new Error(`Failed to save template: ${error.message}`);
      }
    },

    loadBlockTemplate: async (templateId) => {
      try {
        const template = await BlockTemplate.get(templateId);
        if (!template || !template.snapshot)
          throw new Error("Invalid template");

        const job = new Job({ collection: collectionRef.current });

        // Parse snapshot if string
        const snapshot =
          typeof template.snapshot === "string"
            ? JSON.parse(template.snapshot)
            : template.snapshot;

        const newDoc = await job.snapshotToDoc(snapshot);
        await newDoc.load();

        // Switch functionality
        editorRef.current.doc = newDoc;
        toast.success(`Loaded template: ${template.name}`);
        return true;
      } catch (e) {
        console.error("Failed to load block template", e);
        toast.error("Failed to load template");
        return false;
      }
    },
  }));

  /**
   * Extract the first heading or title line from markdown content
   * Returns the title and the remaining content
   */
  function extractTitleFromMarkdown(markdown) {
    const lines = markdown.split("\n");
    let title = null;
    let titleLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check for markdown heading (# Title or ## Title)
      const headingMatch = line.match(/^#{1,2}\s+(.+)$/);
      if (headingMatch) {
        title = headingMatch[1].trim();
        titleLineIndex = i;
        break;
      }

      // Also treat first bold text or first non-empty line as potential title
      // if it's short and looks like a title (< 100 chars, no punctuation at end except ?)
      if (!title && line.length < 100 && !/[.!,;:]$/.test(line)) {
        // Check for **bold** title
        const boldMatch = line.match(/^\*\*(.+?)\*\*$/);
        if (boldMatch) {
          title = boldMatch[1].trim();
          titleLineIndex = i;
          break;
        }
      }
    }

    if (title && titleLineIndex >= 0) {
      // Remove the title line from content
      const remainingLines = lines.filter((_, i) => i !== titleLineIndex);
      return {
        title,
        remainingContent: remainingLines.join("\n"),
      };
    }

    return {
      title: null,
      remainingContent: markdown,
    };
  }

  const handleExport = async (selectedTemplate) => {
    if (!editorRef.current || !workspaceSlug) return;
    setExporting(true);

    try {
      // STRATEGY CHANGE: Do not clone DOM. Serialize DOC to HTML manually.
      // This bypasses Shadow DOM issues and gives us 100% control over the output.

      const doc = editorRef.current.doc;
      if (!doc) throw new Error("Document not found");

      // Ensure the doc is loaded before exporting.
      // Without this, some content (tables/images) can serialize as empty.
      try {
        const maybePromise = doc.load?.();
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
      } catch {
        // ignore; continue export best-effort
      }

      // Get brand color from template, fallback to default blue
      // MUST be declared before serializeDocToHtml to avoid TDZ error
      const brandColor = selectedTemplate?.primaryColor || "#2563eb";

      // 1. Serialize Doc to Standard HTML
      const bodyHtml = await serializeDocToHtml(doc, { brandColor });
      if (!bodyHtml || bodyHtml.includes("No content found")) {
        throw new Error(
          "Serialized document is empty. Please verify content exists."
        );
      }

      // 2.5 Generate Table of Contents from H1/H2 headings
      const generateToc = (html) => {
        // Extract headings using regex
        const headingRegex = /<h([12])[^>]*>([^<]+)<\/h[12]>/gi;
        const headings = [];
        let match;
        let counter = 0;
        let processedHtml = html;

        while ((match = headingRegex.exec(html)) !== null) {
          counter++;
          const level = match[1];
          const text = match[2].trim();
          const id = `toc-heading-${counter}`;
          headings.push({ level, text, id });

          // Add ID to the heading in the HTML
          const originalTag = match[0];
          const tagWithId = originalTag.replace(
            `<h${level}`,
            `<h${level} id="${id}"`
          );
          processedHtml = processedHtml.replace(originalTag, tagWithId);
        }

        if (headings.length === 0) {
          return { tocHtml: "", processedHtml: html };
        }

        // Build TOC HTML
        const tocItems = headings
          .map((h) => {
            const indent = h.level === "2" ? "padding-left: 20px;" : "";
            return `<li style="${indent}margin: 8px 0;"><a href="#${h.id}" style="color: #374151; text-decoration: none;">${h.text}</a></li>`;
          })
          .join("\n");

        const tocHtml = `
          <div class="table-of-contents" style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px 30px;
            margin-bottom: 40px;
            /* break-after: page; Removed to allow content to start immediately */
          ">
            <h2 style="margin: 0 0 15px 0; font-size: 1.4em; color: #111827; border: none;">Table of Contents</h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              ${tocItems}
            </ul>
          </div>
        `;

        return { tocHtml, processedHtml };
      };

      const { tocHtml, processedHtml: bodyWithIds } = generateToc(bodyHtml);

      // 2. Build the Full HTML Wrapper with Styles and Google Fonts
      // Determine which font to use - from template or default
      const templateFont = selectedTemplate?.fontFamily || "Inter";

      // Build Google Fonts URL based on selected font
      // System fonts (Arial, Georgia, Times New Roman) don't need loading
      const systemFonts = ["Arial", "Georgia", "Times New Roman"];
      const isGoogleFont = !systemFonts.includes(templateFont);

      // Map font names to Google Fonts URL format
      const googleFontMap = {
        "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@400;500;600;700",
        Inter: "Inter:wght@400;500;600;700",
        Roboto: "Roboto:wght@400;500;700",
        "Open Sans": "Open+Sans:wght@400;500;600;700",
        Poppins: "Poppins:wght@400;500;600;700",
      };

      const fontUrlParam =
        googleFontMap[templateFont] || "Inter:wght@400;500;600;700";
      const googleFontsUrl = isGoogleFont
        ? `https://fonts.googleapis.com/css2?family=${fontUrlParam}&family=JetBrains+Mono&display=swap`
        : `https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap`;

      // Build Header HTML (injected directly into body for WeasyPrint compatibility)
      let activeTemplateHeader = "";
      let activeTemplateFooter = "";

      if (selectedTemplate) {
        const overrides = selectedTemplate.cssOverrides
          ? JSON.parse(selectedTemplate.cssOverrides)
          : {};
        const logoHeight = overrides.logoHeight || 40;
        const logoAlignment = overrides.logoAlignment || "flex-start";
        const isRightAligned = logoAlignment === "flex-end";
        const isCenterAligned = logoAlignment === "center";

        // Build logo HTML
        const logoHtml = selectedTemplate.logoPath
          ? `<img src="${selectedTemplate.logoPath}" style="height: ${logoHeight}px; object-fit: contain;" />`
          : "";

        // Header styles based on alignment
        let headerContainerStyle = "";
        let headerContent = "";

        if (isCenterAligned) {
          // Center: Logo stacked above, no company name in header (template name is internal only)
          headerContainerStyle = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            border-bottom: 2px solid ${brandColor};
            margin-bottom: 20px;
          `.replace(/\\s+/g, " ");
          headerContent = logoHtml;
        } else {
          // Left or Right: Logo + headerText in row
          headerContainerStyle = `
            display: flex;
            flex-direction: ${isRightAligned ? "row-reverse" : "row"};
            align-items: center;
            justify-content: space-between;
            padding: 15px 20px;
            border-bottom: 2px solid ${brandColor};
            margin-bottom: 20px;
          `.replace(/\\s+/g, " ");
          headerContent = `
            <div style="display: flex; align-items: center; gap: 10px;">
              ${logoHtml}
            </div>
            <div style="color: #6b7280; font-size: 12px; font-family: '${templateFont}', sans-serif;">
              ${selectedTemplate.headerText || ""}
            </div>
          `;
        }

        activeTemplateHeader = `
          <div style="${headerContainerStyle}">
            ${headerContent}
          </div>
        `;

        // Footer HTML (simple - WeasyPrint doesn't do running footers well, so this is just page-end)
        if (selectedTemplate.footerText) {
          activeTemplateFooter = `
            <div style="
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #9ca3af;
              font-family: '${templateFont}', sans-serif;
              text-align: center;
            ">
              ${selectedTemplate.footerText}
            </div>
          `;
        }
      }

      const editorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document Export</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${googleFontsUrl}" rel="stylesheet">
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #1a1a1a;
            --heading-color: #111827;
            --border-color: #e5e7eb;
            --brand-color: ${brandColor};
            --accent-color: ${brandColor};
            --code-bg: #f3f4f6;
            --quote-border: ${brandColor};
        }
        
        * { box-sizing: border-box; }

        body {
            font-family: '${templateFont}', sans-serif;
            color: var(--text-color);
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }

        @media print {
            body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important; 
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 10pt !important;
            }
            /* Prevent pricing tables from splitting across pages */
            .pricing-table-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                width: 100% !important;
                overflow: visible !important;
                border-radius: 0 !important;
            }
            .pricing-table-wrapper table {
                 width: 100% !important;
                 table-layout: fixed !important;
                 font-size: 10pt !important;
            }
            .pricing-table-wrapper th,
            .pricing-table-wrapper td { padding: 4px !important; }
            .pricing-table-wrapper th:nth-child(1),
            .pricing-table-wrapper td:nth-child(1) { width: 15% !important; }
            .pricing-table-wrapper th:nth-child(3),
            .pricing-table-wrapper td:nth-child(3) { width: 80px !important; }
            .pricing-table-wrapper th:nth-child(4),
            .pricing-table-wrapper td:nth-child(4) { width: 100px !important; }
            .pricing-table-wrapper th:nth-child(5),
            .pricing-table-wrapper td:nth-child(5) { width: 15% !important; }
            .pricing-table-wrapper th:nth-child(5) { width: 15% !important; }
            .drag-handle { display: none !important; }
            .pricing-table-wrapper thead,
            .pricing-table-wrapper tbody,
            .pricing-table-wrapper tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        }

        /* Typography */
        h1 { font-size: 2.2em; font-weight: 700; border-bottom: 3px solid var(--brand-color); padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--heading-color); }
        h2 { font-size: 1.8em; font-weight: 600; margin-top: 1.4em; margin-bottom: 0.5em; color: var(--heading-color); border-bottom: 2px solid var(--brand-color); padding-bottom: 0.2em; }
        h3 { font-size: 1.4em; font-weight: 600; margin-top: 1.3em; margin-bottom: 0.5em; color: var(--heading-color); }
        h4, h5, h6 { font-size: 1.1em; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; }
        
        p { margin-bottom: 1em; }
        
        /* Lists */
        ul, ol { margin-bottom: 1em; padding-left: 1.5em; }
        li { margin-bottom: 0.3em; }
        
        /* Code */
        pre {
            background: #1e1e1e;
            color: #e5e7eb;
            padding: 1em;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'JetBrains Mono', monospace;
            margin-bottom: 1em;
            line-height: 1.4;
        }
        code {
            background: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 0.9em;
            font-family: 'JetBrains Mono', monospace;
            color: #ef4444;
        }
        pre code { background: transparent; color: inherit; padding: 0; }

        /* Quotes */
        blockquote {
            border-left: 4px solid var(--quote-border);
            padding-left: 1em;
            margin: 1.5em 0;
            color: #4b5563;
            font-style: italic;
            background: #f9fafb;
            padding: 0.8em;
        }

        /* Pricing Table Brand Accent */
        .pricing-table-wrapper {
            border-left: 4px solid var(--brand-color) !important;
            break-before: auto;
            page-break-before: auto;
        }

        /* Force pricing section to new page if it would split */
        .pricing-table-wrapper {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
        }

        /* Tables - Professional Alignment */
        table {
            width: 100%;
            table-layout: fixed; /* Fixed column widths */
            border-collapse: collapse;
            margin: 2em 0;
            font-size: 0.9em;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 12px 10px; /* More whitespace = luxury feel */
            text-align: left;
            vertical-align: top;
        }
        th { 
            background: #f3f4f6; 
            font-weight: 600; 
            color: #111827;
            border-bottom: 2px solid #000; /* Strong header anchor */
        }
        
        /* Fixed column widths for pricing tables */
        .pricing-table-wrapper th:nth-child(1),
        .pricing-table-wrapper td:nth-child(1) { width: 20%; } /* Role */
        .pricing-table-wrapper th:nth-child(2),
        .pricing-table-wrapper td:nth-child(2) { 
            white-space: pre-wrap; 
            overflow-wrap: break-word; 
            word-wrap: break-word; 
            padding-right: 15px;
        } /* Description */
        .pricing-table-wrapper th:nth-child(3),
        .pricing-table-wrapper td:nth-child(3) { width: 80px; text-align: right; } /* Hours */
        .pricing-table-wrapper th:nth-child(3) { width: 80px; text-align: right; } /* Hours */
        .pricing-table-wrapper th:nth-child(4),
        .pricing-table-wrapper td:nth-child(4) { width: 100px; text-align: right; } /* Rate */
        .pricing-table-wrapper th:nth-child(4) { width: 100px; text-align: right; } /* Rate */
        .pricing-table-wrapper th:nth-child(5),
        .pricing-table-wrapper td:nth-child(5) { width: 120px; text-align: right; font-weight: 600; } /* Total */
        .pricing-table-wrapper th:nth-child(5) { width: 120px; text-align: right; font-weight: 600; } /* Total */

        /* Tabular nums for price alignment */
        .pricing-table-wrapper td {
            font-variant-numeric: tabular-nums;
        }

        /* Summary totals styling */
        .pricing-table-wrapper .total-row td,
        .pricing-table-wrapper tr.total-row td {
            font-weight: 700;
            border-top: 2px solid #000;
            background: #f9fafb;
        }

        /* Paged.js / WeasyPrint page rules */
        @page {
            size: A4;
            size: A4;
            margin: 20mm; /* Standardized margins */
        }
        @page:first {
            margin-top: 15mm; /* Less margin on first page for header */
        }
        
        /* Images */
        img { max-width: 100%; height: auto; display: block; margin: 1em 0; border-radius: 4px; }
    </style>
</head>
<body>
${activeTemplateHeader}
${tocHtml}
    ${bodyWithIds}
${activeTemplateFooter}
</body>
</html>`;

      // No sanitization needed - Puppeteer handles UTF-8 correctly
      const sanitizedEditorHtml = editorHtml;

      const result = await WorkspaceThread.exportPdf(
        workspaceSlug,
        sanitizedEditorHtml,
        {} // No separate header/footer templates - they're in body
      );

      // Check if result is an error object
      if (result?.error) {
        throw new Error(result.error);
      }

      // Create blob and download
      const blob = new Blob([result], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Document-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  /**
   * Extract plain text content from the BlockSuite document
   * for embedding into the vector database
   *
   * Uses HTML serialization (same approach as PDF export) to ensure
   * all content types are captured consistently.
   */
  const extractTextContent = async () => {
    if (!editorRef.current?.doc) return { title: "", content: "" };

    const doc = editorRef.current.doc;

    // Get page title if available
    const pageBlock = doc.getBlocksByFlavour("affine:page")[0];
    let docTitle = "";
    if (pageBlock?.title) {
      const titleText =
        pageBlock.title.toString?.() ||
        pageBlock.title.yText?.toString?.() ||
        "";
      if (titleText && titleText !== "Title") {
        docTitle = titleText;
      }
    }

    console.log("[extractTextContent] Starting extraction...");

    // Serialize doc to HTML (same approach as PDF export)
    // This ensures all content types are captured consistently
    const html = await serializeDocToHtml(doc);

    console.log("[extractTextContent] Serialized HTML length:", html.length);

    // Strip HTML tags to get plain text
    const plainText = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&/g, '&') // Replace HTML entities
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    console.log("[extractTextContent] Plain text length:", plainText.length);
    console.log("[extractTextContent] Plain text preview:", plainText.slice(0, 200));

    return {
      title: docTitle,
      content: plainText,
    };
  };

  /**
   * Handle embedding doc content into workspace vector database
   */
  const insertPricingTable = async () => {
    if (!editorRef.current?.doc) {
      toast.error("Editor not ready");
      return;
    }

    const doc = editorRef.current.doc;

    const getBlocksByFlavourSafe = (targetDoc, flavour) => {
      try {
        if (typeof targetDoc.getBlocksByFlavour === "function") {
          return targetDoc.getBlocksByFlavour(flavour) || [];
        }
      } catch {
        // ignore
      }
      const found = [];
      const traverse = (block) => {
        if (!block) return;
        if (block.flavour === flavour) found.push(block);
        block.children?.forEach?.(traverse);
      };
      traverse(targetDoc.root);
      return found;
    };

    const ensureThreadNoteBlock = () => {
      let noteBlock = getBlocksByFlavourSafe(doc, "affine:note")[0];
      if (noteBlock) return noteBlock;

      let pageBlock = getBlocksByFlavourSafe(doc, "affine:page")[0];
      if (!pageBlock && doc.root?.flavour === "affine:page")
        pageBlock = doc.root;
      if (!pageBlock) {
        const pageBlockId = doc.addBlock("affine:page", {});
        pageBlock = doc.getBlock(pageBlockId);
      }
      if (!pageBlock?.id) return null;

      const hasSurface =
        getBlocksByFlavourSafe(doc, "affine:surface").length > 0;
      if (!hasSurface) {
        try {
          doc.addBlock("affine:surface", {}, pageBlock.id);
        } catch {
          // ignore
        }
      }

      try {
        const noteBlockId = doc.addBlock("affine:note", {}, pageBlock.id);
        doc.addBlock("affine:paragraph", { text: new Text() }, noteBlockId);
        noteBlock = doc.getBlock(noteBlockId);
        return noteBlock;
      } catch (e) {
        console.error(
          "[BlockSuiteEditor] Failed to create note block for pricing table:",
          e
        );
        return null;
      }
    };

    const noteBlock = ensureThreadNoteBlock();
    if (!noteBlock?.id) {
      toast.error("Could not find/create note block");
      return;
    }

    try {
      doc.addBlock("affine:embed-pricing-table", {}, noteBlock.id);
      // Ensure snapshot persists even if slots didn't fire.
      saveDocSnapshot(doc);
      toast.success("Pricing table added");
    } catch (e) {
      console.error("[BlockSuiteEditor] Failed to insert pricing table:", e);
      toast.error("Failed to insert pricing table");
    }
  };

  const handleEmbed = async () => {
    if (!workspaceSlug || !threadSlug) {
      toast.error("Missing workspace or thread information");
      return;
    }

    setEmbedding(true);
    try {
      console.log("[handleEmbed] Starting embed process...");
      const { title, content } = await extractTextContent();

      console.log("[handleEmbed] Extracted content:", {
        title,
        contentLength: content.length,
        contentPreview: content.slice(0, 300),
      });

      if (!content.trim()) {
        console.error("[handleEmbed] Content is empty!");
        toast.error("Doc is empty - nothing to embed");
        return;
      }

      console.log("[handleEmbed] Calling WorkspaceThread.embedDoc...");
      const result = await WorkspaceThread.embedDoc(
        workspaceSlug,
        threadSlug,
        content,
        title || undefined
      );

      console.log("[handleEmbed] Embed result:", result);

      if (result.success) {
        toast.success(
          result.message ||
          "Doc embedded successfully! AI can now retrieve this content."
        );
      } else {
        toast.error(result.error || "Failed to embed doc");
      }
    } catch (error) {
      console.error("[handleEmbed] Embed failed:", error);
      toast.error("Failed to embed doc");
    } finally {
      setEmbedding(false);
    }
  };

  // Fetch brand templates from database
  const fetchBrandTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templates = await PdfTemplates.list();
      setBrandTemplates(templates || []);
    } catch (error) {
      console.error("Failed to fetch brand templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Apply a brand template to the editor (logo + styling)
  const applyBrandTemplate = (template) => {
    const editor = editorRef.current;
    if (!editor || !editor.doc) {
      toast.error("Editor not ready");
      return;
    }

    // Store selected template for PDF export
    setSelectedBrandTemplate(template);
    setShowTemplateDropdown(false);

    const doc = editor.doc;

    try {
      // Note: Logo image insertion skipped - requires blob manager registration
      // Logo will still appear in PDF export via template header injection

      // Inject CSS into the editor for font and brand color
      const brandFont = template.fontFamily || "Inter";
      const brandColor = template.primaryColor || "#3b82f6";

      // Create or update brand style element
      let styleEl = document.getElementById("brand-template-style");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "brand-template-style";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        /* Brand Template Applied: ${template.name} */
        .blocksuite-editor-container,
        affine-editor-container {
          --affine-font-family: '${brandFont}', sans-serif !important;
        }
        .blocksuite-editor-container [data-block-id],
        affine-editor-container [data-block-id] {
          font-family: '${brandFont}', sans-serif !important;
        }
        affine-editor-container h1,
        affine-editor-container [data-block-flavour="affine:paragraph"][data-type="h1"] * {
          border-bottom: 2px solid ${brandColor} !important;
          padding-bottom: 4px !important;
        }
        affine-editor-container h2,
        affine-editor-container [data-block-flavour="affine:paragraph"][data-type="h2"] * {
          border-bottom: 1px solid ${brandColor} !important;
          padding-bottom: 2px !important;
        }
        /* Pricing table accent */
        .pricing-table-container {
          border-left: 4px solid ${brandColor} !important;
        }
      `;

      // 3. Load Google Font if needed
      const systemFonts = ["Arial", "Georgia", "Times New Roman"];
      if (!systemFonts.includes(brandFont)) {
        const fontLink = document.getElementById("brand-font-link");
        if (fontLink) fontLink.remove();
        const link = document.createElement("link");
        link.id = "brand-font-link";
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${brandFont.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }

      toast.success(`Applied: ${template.name}`);
    } catch (error) {
      console.error("Failed to apply brand template:", error);
      toast.error("Failed to apply template");
    }
  };

  return (
    <>
      <div className="flex flex-col h-full relative">
        {/* Header with buttons */}
        <div className="sticky top-0 z-20 flex justify-end gap-x-2 px-4 py-2 bg-theme-bg-secondary border-b border-theme-sidebar-border">
          {/* Brand Template Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!showTemplateDropdown && brandTemplates.length === 0) {
                  fetchBrandTemplates();
                }
                setShowTemplateDropdown(!showTemplateDropdown);
              }}
              disabled={!isReady}
              className="flex items-center gap-x-2 px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white/80 hover:text-white text-sm font-medium rounded-full border border-blue-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Apply a saved brand template"
            >
              <FileDoc className="w-4 h-4" />
              Brand
              <CaretDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {showTemplateDropdown && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-theme-bg-secondary border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                {loadingTemplates ? (
                  <div className="px-4 py-3 text-center text-white/50 text-sm">
                    <CircleNotch className="w-4 h-4 animate-spin inline mr-2" />
                    Loading...
                  </div>
                ) : brandTemplates.length === 0 ? (
                  <div className="px-4 py-3 text-center text-white/50 text-sm">
                    No templates saved yet.
                    <br />
                    <span className="text-xs">
                      Create one in Settings → Document Templates
                    </span>
                  </div>
                ) : (
                  brandTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyBrandTemplate(template)}
                      className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 flex items-center gap-3 transition-colors"
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: template.primaryColor || "#3b82f6",
                        }}
                      >
                        {template.logoPath ? (
                          <img
                            src={template.logoPath}
                            alt=""
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          template.name?.charAt(0) || "T"
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm truncate">
                          {template.name}
                        </div>
                        <div className="text-xs text-white/40 truncate">
                          {template.headerText || "No header"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action buttons styled like mode pills but differentiated */}
          <button
            onClick={insertPricingTable}
            disabled={!isReady}
            className="flex items-center gap-x-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-full border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Insert interactive pricing table"
          >
            Pricing Table
          </button>
          <button
            onClick={handleEmbed}
            disabled={embedding || !isReady || !threadSlug}
            className="flex items-center gap-x-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-full border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Embed this doc into workspace for AI retrieval"
          >
            {embedding ? (
              <CircleNotch className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {embedding ? "Embedding..." : "Embed"}
          </button>
          {/* Export PDF button */}
          <button
            onClick={() => {
              // If brand template already selected, skip modal and export directly
              if (selectedBrandTemplate) {
                handleExport(selectedBrandTemplate);
              } else {
                setShowExportModal(true);
              }
            }}
            disabled={exporting || !isReady}
            className="flex items-center gap-x-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-full border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {exporting ? (
              <CircleNotch className="w-4 h-4 animate-spin" />
            ) : (
              <FilePdf className="w-4 h-4" />
            )}
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!isReady}
            className="flex items-center gap-x-2 px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-sm font-medium rounded-full border border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ShareNetwork className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Document Preview Area - Header + Editor + Footer */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            fontFamily: selectedBrandTemplate?.fontFamily
              ? `'${selectedBrandTemplate.fontFamily}', sans-serif`
              : undefined,
          }}
        >
          {/* Brand Header - Fixed HTML outside editor */}
          {selectedBrandTemplate && (
            <div
              className="brand-template-header flex items-center gap-4 px-6 py-4 bg-white border-b-2 mx-4 mt-4 rounded-t-lg"
              style={{
                borderBottomColor:
                  selectedBrandTemplate.primaryColor || "#3b82f6",
              }}
            >
              {selectedBrandTemplate.logoPath && (
                <img
                  src={selectedBrandTemplate.logoPath}
                  alt="Logo"
                  className="h-10 object-contain"
                  style={{
                    height: selectedBrandTemplate.cssOverrides
                      ? JSON.parse(selectedBrandTemplate.cssOverrides)
                        .logoHeight || 40
                      : 40,
                  }}
                />
              )}
              {selectedBrandTemplate.headerText && (
                <span className="text-gray-600 text-sm">
                  {selectedBrandTemplate.headerText}
                </span>
              )}
            </div>
          )}

          {/* BlockSuite Editor Container - data-theme forces dark mode */}
          <div
            ref={containerRef}
            data-theme="dark"
            className={`blocksuite-editor-wrapper ${selectedBrandTemplate ? "mx-4 bg-white" : "flex-1"}`}
            style={{ minHeight: "300px" }}
          />

          {/* Brand Footer - Fixed HTML outside editor */}
          {selectedBrandTemplate?.footerText && (
            <div className="brand-template-footer px-6 py-3 bg-white border-t border-gray-200 mx-4 mb-4 rounded-b-lg text-center text-gray-500 text-xs">
              {selectedBrandTemplate.footerText}
            </div>
          )}
        </div>
      </div>

      <ExportPdfModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        exporting={exporting}
      />

      <ShareProposalModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        workspaceSlug={workspaceSlug}
        getHtmlContent={async () => {
          if (!editorRef.current?.doc) return null;
          return await serializeDocToHtml(editorRef.current.doc);
        }}
      />

      <AIInputModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        loading={aiLoading}
        onSubmit={async (query) => {
          setAiLoading(true);
          try {
            toast.info(`🤖 Generating response...`);

            // Get context from document
            const context = (() => {
              try {
                const doc = editorRef.current?.doc;
                if (!doc) return "";
                const blocks = [];
                const traverse = (block) => {
                  if (block.text?.toString) blocks.push(block.text.toString());
                  block.children?.forEach(traverse);
                };
                if (doc.root) traverse(doc.root);
                return blocks.join("\n").slice(-2000); // Last 2000 chars
              } catch {
                return "";
              }
            })();

            // Call AI API
            const result = await InlineAI.generate("ask", {
              query,
              context,
            });

            if (result.success && result.content) {
              // Insert AI response into editor at cursor
              const doc = editorRef.current?.doc;
              if (doc) {
                const noteBlocks = doc.getBlocksByFlavour("affine:note");
                if (noteBlocks.length > 0) {
                  const noteId = noteBlocks[0].id;
                  // Add AI response as a new paragraph
                  doc.addBlock(
                    "affine:paragraph",
                    {
                      text: new Text(result.content),
                    },
                    noteId
                  );
                  toast.success("✨ AI response inserted!");
                }
              }
              setShowAIModal(false);
            } else {
              toast.error(result.error || "AI generation failed");
            }
          } catch (error) {
            console.error("[AI] Error:", error);
            toast.error("AI generation failed");
          } finally {
            setAiLoading(false);
          }
        }}
      />
    </>
  );
});

// Helper to recursively serialize BlockSuite doc to HTML
// Helper to recursively serialize BlockSuite doc to HTML
const serializeDocToHtml = async (doc, { brandColor = "#2563eb" } = {}) => {
  if (!doc.root) {
    console.error("[PDF Export] Doc has no root!");
    return "<p>No content found (Empty Root)</p>";
  }

  console.log("[PDF Export] Starting manual serialization for doc:", doc.id);

  // Create job to access assets
  const job = new Job({ collection: doc.collection });

  // Try to populate transformer context and access assets
  // This may fail if the document references blobs that no longer exist in storage
  let assets = new Map();
  try {
    await job.docToSnapshot(doc);
    const assetsManager = job.assetsManager;
    assets = assetsManager.getAssets(); // Map<string, Blob>
  } catch (blobError) {
    console.warn("[PDF Export] Could not load some assets (may have missing blobs):", blobError.message);
    // Continue with empty assets map - images may not render but export won't fail
  }

  const getText = (block) => {
    // Try various text access patterns
    if (block.text?.toString) return block.text.toString();
    if (block.model?.text?.toString) return block.model.text.toString();
    // Check for yText
    if (block.yText?.toString) return block.yText.toString();
    // Check for model.yText
    if (block.model?.yText?.toString) return block.model.yText.toString();
    return "";
  };

  const processBlock = async (blockOrId) => {
    let block = blockOrId;
    // Resolve ID to block if needed
    if (typeof blockOrId === "string") {
      block = doc.getBlock(blockOrId);
    }

    if (!block) {
      // console.warn("[PDF Export] Block not found for:", blockOrId);
      return "";
    }

    const flavour = block.flavour;
    const model = block.model || {};
    const text = getText(block);

    let html = "";
    let childHtml = "";

    // Recursively process children first
    if (block.children && block.children.length > 0) {
      for (const child of block.children) {
        childHtml += await processBlock(child);
      }
    }

    // Render Block
    switch (flavour) {
      case "affine:page":
        html = `<div class="affine-page" style="font-family: var(--font-main); color: var(--text-primary);">${childHtml}</div>`;
        break;
      case "affine:note":
      case "affine:surface":
        html = childHtml;
        break;

      case "affine:paragraph":
        const type = model.type || "text";
        const style = "margin-bottom: 0.5rem; line-height: 1.6;";
        if (type === "h1")
          html = `<h1 style="font-size: 2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">${text}</h1>`;
        else if (type === "h2")
          html = `<h2 style="font-size: 1.5rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.75rem; color: var(--text-primary);">${text}</h2>`;
        else if (type === "h3")
          html = `<h3 style="font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-primary);">${text}</h3>`;
        else if (type === "h4")
          html = `<h4 style="font-size: 1.1rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem;">${text}</h4>`;
        else if (type === "h5")
          html = `<h5 style="font-weight: bold; margin-top: 0.75rem;">${text}</h5>`;
        else if (type === "h6")
          html = `<h6 style="font-weight: bold; margin-top: 0.75rem; color: var(--text-secondary);">${text}</h6>`;
        else if (type === "quote")
          html = `<blockquote style="border-left: 4px solid var(--primary-color); padding-left: 1rem; font-style: italic; color: var(--text-secondary); margin: 1rem 0;">${text}</blockquote>`;
        else html = `<p style="${style}">${text || "&nbsp;"}</p>`;
        break;

      case "affine:list":
        const listType = model.type;
        if (listType === "todo") {
          // Todo/Checkbox list
          const checked = model.checked ? "checked" : "";
          const strikeStyle = model.checked
            ? "text-decoration: line-through; color: #9ca3af;"
            : "";
          html = `<div style="display: flex; align-items: flex-start; margin-bottom: 0.25rem;">
                        <input type="checkbox" ${checked} disabled style="margin-right: 0.5rem; margin-top: 0.25rem;" />
                        <span style="${strikeStyle}">${text}</span>
                    </div>`;
        } else if (listType === "numbered") {
          html = `<ol style="padding-left: 1.5rem; margin-bottom: 0.5rem;"><li style="margin-bottom: 0.25rem;">${text}</li></ol>`;
        } else {
          // Bulleted or default
          html = `<ul style="padding-left: 1.5rem; margin-bottom: 0.5rem;"><li style="margin-bottom: 0.25rem;">${text}</li></ul>`;
        }
        if (childHtml) {
          html = html.replace(`</li>`, ` ${childHtml}</li>`);
        }
        break;

      case "affine:code":
        const lang = model.language || "text";
        // Escape HTML in code content
        const escapedCode = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        html = `<pre style="background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; overflow-x: auto; margin: 1rem 0; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.9rem; line-height: 1.5;"><code class="language-${lang}">${escapedCode}</code></pre>`;
        break;

      case "affine:divider":
        html = `<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />`;
        break;

      case "affine:bookmark":
        // Bookmark/Link card
        const bookmarkUrl = model.url || "";
        const bookmarkTitle = model.title || model.url || "Link";
        const bookmarkDesc = model.description || "";
        html = `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 1rem 0; background: #fafafa;">
                    <a href="${bookmarkUrl}" style="color: #2563eb; font-weight: 600; text-decoration: none;">${bookmarkTitle}</a>
                    ${bookmarkDesc ? `<p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;">${bookmarkDesc}</p>` : ""}
                    <p style="color: #9ca3af; font-size: 0.75rem; margin-top: 0.5rem;">${bookmarkUrl}</p>
                </div>`;
        break;

      case "affine:attachment":
        // Attachment file
        const attachmentName = model.name || "Attachment";
        const attachmentSize = model.size
          ? `(${Math.round(model.size / 1024)} KB)`
          : "";
        html = `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.5rem 0; background: #fafafa; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.25rem;">📎</span>
                    <span style="color: #374151; font-weight: 500;">${attachmentName}</span>
                    <span style="color: #9ca3af; font-size: 0.875rem;">${attachmentSize}</span>
                </div>`;
        break;

      case "affine:embed-pricing-table": {
        // CRITICAL: BlockSuite embed blocks can store props on block, block.model, or block.props
        // We need to check all locations to find the rows data
        const readProp = (key) => {
          try {
            // Check direct block property first (most common for custom embeds)
            if (block[key] !== undefined) return block[key];
            // Check model (if it exists)
            if (model && model[key] !== undefined) return model[key];
            // Check block.props
            if (block.props && block.props[key] !== undefined)
              return block.props[key];
            // Check model.props
            if (model && model.props) {
              if (model.props[key] !== undefined) return model.props[key];
              if (typeof model.props.get === "function")
                return model.props.get(key);
            }
            // Check block.yBlock (Yjs-backed properties)
            if (block.yBlock) {
              const yProps =
                block.yBlock.get("prop:props") || block.yBlock.get("props");
              if (yProps && typeof yProps.get === "function") {
                return yProps.get(key);
              }
              // Direct key on yBlock
              const yVal =
                block.yBlock.get(`prop:${key}`) || block.yBlock.get(key);
              if (yVal !== undefined) return yVal;
            }
            return undefined;
          } catch (e) {
            console.warn(`[PDF Export] Error reading prop '${key}':`, e);
            return undefined;
          }
        };

        const toPlain = (value) => {
          try {
            if (value === null || value === undefined) return value;
            // Y.Array or Y.Map
            if (typeof value.toJSON === "function") return value.toJSON();
            // Proxy objects - try to spread
            if (typeof value === "object" && !Array.isArray(value)) {
              // Check if it looks like a reactive/proxy wrapper
              const keys = Object.keys(value);
              if (keys.length > 0) {
                const plain = {};
                for (const k of keys) {
                  plain[k] = toPlain(value[k]);
                }
                return plain;
              }
            }
            if (Array.isArray(value)) {
              return value.map(toPlain);
            }
          } catch { }
          return value;
        };

        const toNumber = (value, fallback = 0) => {
          const v = toPlain(value);
          if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
          if (typeof v === "string") {
            const n = Number(v.replace(/[^\d.-]/g, ""));
            return Number.isFinite(n) ? n : fallback;
          }
          if (v && typeof v === "object") {
            if (v.value !== undefined) return toNumber(v.value, fallback);
            if (typeof v.toString === "function")
              return toNumber(v.toString(), fallback);
          }
          return fallback;
        };

        const titleVal = readProp("title");
        const currency = readProp("currency") || "AUD";
        const discountPercent = toNumber(readProp("discountPercent"), 0);
        const gstPercent = toNumber(readProp("gstPercent"), 10);
        const showTotalsRaw = readProp("showTotals");
        const showTotals =
          showTotalsRaw === undefined ? true : Boolean(toPlain(showTotalsRaw));

        const title =
          titleVal?.toString?.() ||
          (typeof titleVal === "string" ? titleVal : "") ||
          "Project Pricing";

        let rawRows = readProp("rows");
        console.log(
          "[PDF Export] Pricing table raw rows:",
          rawRows,
          "block:",
          block.id
        );

        rawRows = toPlain(rawRows);
        if (typeof rawRows === "string") {
          try {
            rawRows = JSON.parse(rawRows);
          } catch {
            rawRows = [];
          }
        }
        const rows = Array.isArray(rawRows) ? rawRows.map(toPlain) : [];
        console.log(
          "[PDF Export] Pricing table parsed rows:",
          rows.length,
          "rows"
        );

        const clamp = (n, { min = 0, max = 100 } = {}) => {
          const v = Number(n);
          if (!Number.isFinite(v)) return min;
          return Math.max(min, Math.min(max, v));
        };

        const escapeHtml = (unsafe) => {
          return String(unsafe ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        };

        const formatCurrency = (value) => {
          const n = Math.round(Number(value));
          if (!Number.isFinite(n)) return "$0";
          return "$" + n.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          });
        };

        const subtotal = rows.reduce((sum, row) => {
          const hours = toNumber(row?.hours, 0);
          const rate = toNumber(row?.baseRate, 0);
          return sum + hours * rate;
        }, 0);

        const discount = subtotal * (clamp(discountPercent) / 100);
        const afterDiscount = subtotal - discount;
        const gst = afterDiscount * (clamp(gstPercent) / 100);
        const rawTotal = afterDiscount + gst;
        const total = Math.round(rawTotal / 100) * 100;

        let tableHtml = `<div class="pricing-table-wrapper" style="margin: 2rem 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; page-break-inside: avoid; break-inside: avoid; border-left: 6px solid ${brandColor} !important;">
                    <div style="padding: 1rem 1.25rem; background: #fafafa; border-bottom: 1px solid #e5e7eb;">
                        <div style="font-size: 1.25rem; font-weight: 800; color: #111827; letter-spacing: -0.025em; margin-bottom: 2px;">${escapeHtml(title)}</div>
                        <div style="font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">All prices in ${escapeHtml(currency)}, excluding GST</div>
                    </div>
                    <div style="padding: 0;">
                    <table class="pricing-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem; page-break-inside: avoid; break-inside: avoid;">
                        <thead style="background: ${brandColor}; page-break-inside: avoid; break-inside: avoid;">
                            <tr>
                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border: none;">Role</th>
                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border: none;">Description</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border: none;">Hours</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border: none;">Rate</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; color: #ffffff; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border: none;">Total</th>
                            </tr>
                        </thead>
                        <tbody style="background: #ffffff;">`;

        if (!rows.length) {
          tableHtml += `<tr style="page-break-inside: avoid; break-inside: avoid;"><td colspan="5" style="padding: 2rem; text-align: center; color: #9ca3af; font-style: italic;">No items added to pricing summary.</td></tr>`;
        } else {
          rows.forEach((row) => {
            if (row?.isHeader) {
              tableHtml += `<tr style="background: #f9fafb; page-break-inside: avoid; break-inside: avoid;">
                              <td colspan="5" style="padding: 0.5rem 1rem; border: none; border-bottom: 1px solid #e5e7eb;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                  <div style="width: 3px; height: 12px; background: ${brandColor}; border-radius: 2px;"></div>
                                  <span style="font-size: 11px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(row.role)}</span>
                                </div>
                              </td>
                            </tr>`;
              return;
            }

            const hours = toNumber(row?.hours, 0);
            const rate = toNumber(row?.baseRate, 0);
            const lineTotal = hours * rate;
            const descHtml = DOMPurify.sanitize(
              renderMarkdown(String(row?.description || "")),
              { USE_PROFILES: { html: true } }
            );
            tableHtml += `<tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid; break-inside: avoid;">
                            <td style="padding: 0.75rem 1rem; color: #111827; font-weight: 500; border: none; border-bottom: 1px solid #f3f4f6;">${escapeHtml(row?.role || "")}</td>
                            <td style="padding: 0.75rem 1rem; color: #4b5563; font-size: 0.8rem; line-height: 1.4; border: none; border-bottom: 1px solid #f3f4f6;">${descHtml}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; color: #111827; border: none; border-bottom: 1px solid #f3f4f6;">${hours}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; color: #111827; border: none; border-bottom: 1px solid #f3f4f6;">${formatCurrency(rate)}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #111827; border: none; border-bottom: 1px solid #f3f4f6;">${formatCurrency(lineTotal)}</td>
                        </tr>`;
          });
        }

        tableHtml += `</tbody></table></div>`;

        if (showTotals) {
          const discountLabel =
            clamp(discountPercent) > 0 ? ` (${clamp(discountPercent)}%)` : "";
          const gstLabel =
            clamp(gstPercent) > 0 ? ` (${clamp(gstPercent)}%)` : "";

          tableHtml += `<div style="padding: 1.5rem; display: flex; justify-content: flex-end; background: #fafafa;">
                        <div style="width: 320px; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                                <span style="color: #6b7280; font-weight: 500;">Subtotal</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(subtotal)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; color: #10b981;">
                                <span style="font-weight: 500;">Discount${discountLabel}</span>
                                <span style="font-weight: 700;">-${formatCurrency(discount)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                                <span style="color: #6b7280; font-weight: 500;">After discount</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(afterDiscount)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                                <span style="color: #6b7280; font-weight: 500;">GST${gstLabel}</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(gst)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 1rem 0 0.5rem 0; margin-top: 0.75rem; border-top: 2px solid ${brandColor};">
                                <div style="display: flex; flex-col; gap: 2px;">
                                  <div style="color: #111827; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.025em;">Total Investment</div>
                                  <div style="color: #9ca3af; font-size: 10px; font-style: italic;">Inc. GST & Commercial Rounding</div>
                                </div>
                                <span style="color: ${brandColor}; font-weight: 900; font-size: 1.75rem; letter-spacing: -0.05em;">${formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>`;
        }

        tableHtml += `</div>`;

        html = tableHtml;
        break;
      }

      case "affine:image": {
        console.log("[PDF Export] Image Model:", model);
        let imgSrc = "";

        // BlockSuite typically uses `sourceId` pointing to blob storage.
        // Our app's upload flow stores a persistent URL in `sourceId` (e.g. `/api/assets/<file>`).
        // Some BlockSuite versions may use `src`.
        const sourceId = model.sourceId || model.src;

        const toDataUrl = async (blob) => {
          if (!blob) return "";
          const reader = new FileReader();
          const base64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          return base64 || "";
        };

        const fetchAsDataUrl = async (url) => {
          if (!url) return "";
          try {
            const fetchUrl = url.startsWith("/")
              ? `${window.location.origin}${url}`
              : url;
            const token = localStorage.getItem("anythingllm_auth_token");
            const res = await fetch(fetchUrl, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (!res.ok) {
              console.warn(
                `[PDF Export] Failed to fetch image ${fetchUrl} (status ${res.status})`
              );
              return "";
            }
            return await toDataUrl(await res.blob());
          } catch (e) {
            console.error("[PDF Export] Error fetching image url:", e);
            return "";
          }
        };

        if (typeof sourceId === "string" && sourceId) {
          // 1) Try blob assets via assetsManager (correct BlockSuite path)
          try {
            await assetsManager.readFromBlob(sourceId);
          } catch {
            // Ignore; we'll fall back to other strategies.
          }

          if (assets.has(sourceId)) {
            imgSrc = await toDataUrl(assets.get(sourceId));
          }

          // 2) If sourceId is a URL (our persistent uploads), fetch and inline
          if (
            !imgSrc &&
            (sourceId.startsWith("http") || sourceId.startsWith("/"))
          ) {
            imgSrc = await fetchAsDataUrl(sourceId);
            if (imgSrc)
              console.log(`[PDF Export] Inlined persistent image ${sourceId}`);
          }
        }

        // 3) Fallback to DOM if still no image
        if (!imgSrc) {
          const domEl = document.querySelector(
            `[data-block-id="${block.id}"] img`
          );
          if (domEl) {
            const domSrc = domEl.getAttribute("src");
            if (domSrc) {
              if (domSrc.startsWith("data:")) {
                imgSrc = domSrc;
              } else if (domSrc.startsWith("blob:")) {
                try {
                  const res = await fetch(domSrc);
                  imgSrc = await toDataUrl(await res.blob());
                } catch {
                  // ignore
                }
              } else if (domSrc.startsWith("http") || domSrc.startsWith("/")) {
                imgSrc = await fetchAsDataUrl(domSrc);
              }
            }
          }
        }

        if (imgSrc) {
          const align = model.align || model.alignment || "center";
          let justify = "center";
          if (align === "left" || align === "start") justify = "flex-start";
          else if (align === "right" || align === "end") justify = "flex-end";

          html = `<div style="display: flex; justify-content: ${justify}; margin: 1rem 0;"><img src="${imgSrc}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" /></div>`;
        } else {
          html = `<p style="color: red;">[Image Missing]</p>`;
        }
        break;
      }

      case "affine:database": {
        // Database/Table Rendering
        // Key insight: Each ROW is a child paragraph/list block, not only a cells object entry.
        const columns = model.columns || [];
        const headers = columns.map((c) => c.name || "");
        const children = block.children || [];

        if (headers.length === 0) {
          console.warn("[PDF Export] Database skipped: No headers found");
          break;
        }

        console.log(
          `[PDF Export] Database found. Headers: ${headers.length}, Children: ${children.length}`
        );

        // Calculate column widths - first column (Role/Description) gets more space
        const colCount = headers.length;
        const firstColWidth = colCount > 3 ? "30%" : "40%";
        const otherColWidth =
          colCount > 3
            ? `${Math.floor(70 / (colCount - 1))}%`
            : `${Math.floor(60 / (colCount - 1))}%`;

        let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
                    <thead style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <tr>`;

        headers.forEach((h, idx) => {
          const width = idx === 0 ? firstColWidth : otherColWidth;
          const align = idx === 0 ? "left" : "right"; // Numbers right-aligned
          tableHtml += `<th style="padding: 0.75rem 1rem; text-align: ${align}; font-weight: 600; color: #111827; width: ${width}; white-space: nowrap;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        const cells = model.cells || {};

        // CRITICAL: Iterate block.children to get the rows (as required)
        const rowBlocks = children
          .map((child) =>
            typeof child === "string" ? doc.getBlock(child) : child
          )
          .filter(Boolean);

        if (rowBlocks.length === 0) {
          tableHtml += `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center; color: #9ca3af;">No Data Rows Found</td></tr>`;
        } else {
          for (const rowBlock of rowBlocks) {
            const rowId = rowBlock.id;
            const firstColText = getText(rowBlock);

            tableHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">`;
            tableHtml += `<td style="padding: 0.75rem 1rem; color: #374151; word-wrap: break-word;">${firstColText}</td>`;

            const rowCells = cells[rowId] || {};
            columns.slice(1).forEach((col, idx) => {
              const cell = rowCells[col.id];
              let cellVal = "";
              if (cell) {
                if (cell.value?.toString) cellVal = cell.value.toString();
                else if (typeof cell.value === "string") cellVal = cell.value;
                else if (cell.value?.text) cellVal = cell.value.text;
              }
              // Right-align numeric columns and prevent wrap
              tableHtml += `<td style="padding: 0.75rem 1rem; color: #6b7280; text-align: right; white-space: nowrap;">${cellVal}</td>`;
            });

            tableHtml += "</tr>";
          }
        }

        tableHtml += "</tbody></table></div>";
        html = tableHtml;
        break;
      }

      case "affine:total-summary": {
        // Total Summary Footer Block
        // Look at previous sibling - if it's a database, sum the "Total" column
        const previousBlock = doc.getBlock(block.id)?.previousSibling;
        if (!previousBlock || previousBlock.flavour !== 'affine:database') {
          html = `<div style="width:100%; background:#000; color:#fff; padding:10px; text-align:right; font-weight:bold;">TOTAL INVESTMENT: No database found</div>`;
          break;
        }

        let grandTotal = 0;
        const totalCol = previousBlock.model.columns?.find(c => c.name?.toLowerCase().includes('total'));
        if (!totalCol) {
          html = `<div style="width:100%; background:#000; color:#fff; padding:10px; text-align:right; font-weight:bold;">TOTAL INVESTMENT: No total column found</div>`;
          break;
        }

        // Iterate rows from block.children (as required)
        const children = previousBlock.children || [];
        const cells = previousBlock.model.cells || {};

        children.forEach(row => {
          const rowCells = cells[row.id] || {};
          const cell = rowCells[totalCol.id];
          if (cell && cell.value) {
            const val = parseFloat(String(cell.value).replace(/[^0-9.]/g, ''));
            if (!isNaN(val)) grandTotal += val;
          }
        });

        // Format as Currency
        const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
        html = `<div style="width:100%; background:#000; color:#fff; padding:10px; text-align:right; font-weight:bold;">TOTAL INVESTMENT: ${formatter.format(grandTotal)}</div>`;
        break;
      }

      case "affine:table": {
        // Some BlockSuite versions use a dedicated table flavour.
        // Treat it similarly to database export if it exposes columns/cells/children.
        const columns = model.columns || [];
        const headers = columns.map((c) => c.name || "");
        const children = block.children || [];
        const cells = model.cells || {};

        if (headers.length === 0) {
          html = childHtml;
          break;
        }

        const rowBlocks = children
          .map((child) =>
            typeof child === "string" ? doc.getBlock(child) : child
          )
          .filter(Boolean);

        // Calculate column widths
        const colCount = headers.length;
        const firstColWidth = colCount > 3 ? "30%" : "40%";
        const otherColWidth =
          colCount > 3
            ? `${Math.floor(70 / (colCount - 1))}%`
            : `${Math.floor(60 / (colCount - 1))}%`;

        let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
                    <thead style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <tr>`;

        headers.forEach((h, idx) => {
          const width = idx === 0 ? firstColWidth : otherColWidth;
          const align = idx === 0 ? "left" : "right";
          tableHtml += `<th style="padding: 0.75rem 1rem; text-align: ${align}; font-weight: 600; color: #111827; width: ${width}; white-space: nowrap;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        if (rowBlocks.length === 0) {
          tableHtml += `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center; color: #9ca3af;">No Data Rows Found</td></tr>`;
        } else {
          for (const rowBlock of rowBlocks) {
            const rowId = rowBlock.id;
            const firstColText = getText(rowBlock);

            tableHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">`;
            tableHtml += `<td style="padding: 0.75rem 1rem; color: #374151; word-wrap: break-word;">${firstColText}</td>`;

            const rowCells = cells[rowId] || {};
            columns.slice(1).forEach((col) => {
              const cell = rowCells[col.id];
              let cellVal = "";
              if (cell) {
                if (cell.value?.toString) cellVal = cell.value.toString();
                else if (typeof cell.value === "string") cellVal = cell.value;
                else if (cell.value?.text) cellVal = cell.value.text;
              }
              tableHtml += `<td style="padding: 0.75rem 1rem; color: #6b7280; text-align: right; white-space: nowrap;">${cellVal}</td>`;
            });

            tableHtml += "</tr>";
          }
        }

        tableHtml += "</tbody></table></div>";
        html = tableHtml;
        break;
      }

      default:
        if (text) html = `<p>${text}</p>`;
        html += childHtml;
        break;
    }
    return html;
  };

  try {
    let bodyHtml = await processBlock(doc.root);
    // Inject styles
    const styles = `
            <style>
                :root {
                    --primary-color: ${brandColor};
                    --text-primary: #111827;
                    --text-secondary: #4b5563;
                    --border-color: #e5e7eb;
                    --font-main: 'Inter', sans-serif;
                }
                /* Dark Mode overrides if needed, usually handled by PDF printer */
            </style>
        `;
    return styles + bodyHtml;
  } catch (e) {
    console.error("[PDF Export] Error serializing doc:", e);
    return `<p>Error exporting document: ${e.message}</p>`;
  }
};

export default BlockSuiteEditor;
