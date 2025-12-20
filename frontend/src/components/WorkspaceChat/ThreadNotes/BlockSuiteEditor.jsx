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
import "@blocksuite/presets/themes/affine.css";
// Deep import for HtmlAdapter as it is not exposed in main entry
import { HtmlAdapter } from "@blocksuite/blocks/dist/_common/adapters/html.js";

import {
  FilePdf,
  CircleNotch,
  Database,
  FileDoc,
  CaretDown,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import WorkspaceThread from "@/models/workspaceThread";
import PdfTemplates from "@/models/pdfTemplates";
import { useEditorContext } from "./EditorContext";
import { setupAISlashMenu } from "@/utils/aiSlashMenu";
import { setupAIFormatBar } from "@/utils/aiFormatBar";
import AIInputModal from "@/components/AIInputModal";
import InlineAI from "@/models/inlineAI";
import DOMPurify from "@/utils/chat/purify";
import renderMarkdown from "@/utils/chat/markdown";
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
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Brand template state
  const [brandTemplates, setBrandTemplates] = useState([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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

      case "continue":
        const contextText = getContextText();
        toast.info("🤖 AI continuing your writing...");
        console.log(
          "[AI Action] Continue writing with context:",
          contextText.slice(-500)
        );
        // TODO: Call AI with context and stream response
        break;

      case "summarize":
        toast.info("🤖 AI summarizing content...");
        // TODO: Get content above, summarize, insert
        break;

      case "improve":
        toast.info("🤖 AI improving writing...");
        // TODO: Get selected text or paragraph, improve, replace
        break;

      case "grammar":
        toast.info("🤖 AI fixing grammar...");
        // TODO: Get text, fix grammar, replace
        break;

      case "translate":
        toast.info(`🤖 AI translating to ${lang}...`);
        // TODO: Get text, translate, replace
        break;

      case "selection":
        // AI action from format bar (text selection)
        const { selectedText } = context;
        if (selectedText) {
          toast.info(
            `🤖 AI processing selected text: "${selectedText.slice(0, 30)}..."`
          );
          setShowAIModal(true);
        }
        break;

      default:
        toast.error(`Unknown AI action: ${actionType}`);
    }
  };

  // Helper to save the full document snapshot
  const saveDocSnapshot = useMemo(() => {
    return debounce(async (doc) => {
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
      }
    }, 1000);
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
              setupAIFormatBar(formatBar, handleAIAction);
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
      const match = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
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
      ]);
      const idxHours = findCol(["hour", "qty", "quantity", "days", "units"]);
      const idxRate = findCol(["rate", "price", "cost", "fee", "amount"]);
      const idxDesc = findCol(["description", "detail", "note", "scope"]);

      // Require at least Role and Rate to be considered a pricing table
      // Hours is optional (can default to 1 or 0) but highly recommended
      if (idxRole === -1 || idxRate === -1) {
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
          const baseRate = parseNumber(cells[idxRate]) ?? 0;
          const description = idxDesc !== -1 ? cells[idxDesc] || "" : "";

          if (!role) return null;

          return {
            id: `${Date.now()}-${idx}`,
            role,
            description,
            hours,
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
        doc.addBlock(
          "affine:paragraph",
          {
            type: headingType,
            text: new Text(headingText),
          },
          noteBlockId
        );
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

        // If we found a title, try to set it as the page title
        if (title) {
          try {
            // Get the page block - it holds the document title
            const pageBlock =
              getBlocksByFlavourSafe(doc, "affine:page")[0] || doc.root;
            if (pageBlock) {
              // BlockSuite page title is stored in the page block's title property
              // We need to update the title text
              const titleProp = pageBlock.title;
              if (titleProp && typeof titleProp.insert === "function") {
                // Clear existing title and set new one
                titleProp.clear();
                titleProp.insert(title, 0);
                console.log("[BlockSuiteEditor] Set page title to:", title);
              } else if (
                typeof pageBlock.title === "object" &&
                pageBlock.title?.yText
              ) {
                // Alternative: try modifying yText directly
                pageBlock.title.yText.delete(0, pageBlock.title.yText.length);
                pageBlock.title.yText.insert(0, title);
                console.log(
                  "[BlockSuiteEditor] Set page title via yText:",
                  title
                );
              } else {
                // Fallback: Add title as first H1 block
                doc.addBlock(
                  "affine:paragraph",
                  {
                    type: "h1",
                    text: new Text(title),
                  },
                  noteBlock.id
                );
                console.log(
                  "[BlockSuiteEditor] Added title as H1 block:",
                  title
                );
              }
            }
          } catch (titleError) {
            console.warn(
              "[BlockSuiteEditor] Could not set page title, adding as H1:",
              titleError
            );
            // Fallback: Add as H1 block
            doc.addBlock(
              "affine:paragraph",
              {
                type: "h1",
                text: new Text(title),
              },
              noteBlock.id
            );
          }
        }

        // Parse and insert the remaining content
        if (remainingContent.trim()) {
          parseMarkdownToBlocks(doc, noteBlock.id, remainingContent);
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
        parseMarkdownToBlocks(doc, noteBlock.id, markdown);
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

      // 1. Serialize Doc to Standard HTML
      const bodyHtml = await serializeDocToHtml(doc);
      if (!bodyHtml || bodyHtml.includes("No content found")) {
        throw new Error(
          "Serialized document is empty. Please verify content exists."
        );
      }

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
        "Inter": "Inter:wght@400;500;600;700",
        "Roboto": "Roboto:wght@400;500;700",
        "Open Sans": "Open+Sans:wght@400;500;600;700",
        "Poppins": "Poppins:wght@400;500;600;700",
      };

      const fontUrlParam = googleFontMap[templateFont] || "Inter:wght@400;500;600;700";
      const googleFontsUrl = isGoogleFont
        ? `https://fonts.googleapis.com/css2?family=${fontUrlParam}&family=JetBrains+Mono&display=swap`
        : `https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap`;

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
            --accent-color: #2563eb;
            --code-bg: #f3f4f6;
            --quote-border: #3b82f6;
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
            }
            /* Prevent pricing tables from splitting across pages */
            .pricing-table-wrapper {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .pricing-table-wrapper table,
            .pricing-table-wrapper thead,
            .pricing-table-wrapper tbody,
            .pricing-table-wrapper tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        }

        /* Typography */
        h1 { font-size: 2.2em; font-weight: 700; border-bottom: 2px solid var(--border-color); padding-bottom: 0.3em; margin-top: 1.5em; margin-bottom: 0.5em; color: var(--heading-color); }
        h2 { font-size: 1.8em; font-weight: 600; margin-top: 1.4em; margin-bottom: 0.5em; color: var(--heading-color); }
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

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 2em 0;
            font-size: 0.9em;
        }
        th, td {
            border: 1px solid var(--border-color);
            padding: 10px;
            text-align: left;
            vertical-align: top;
        }
        th { background: #f3f4f6; font-weight: 600; color: #111827; }
        
        /* Images */
        img { max-width: 100%; height: auto; display: block; margin: 1em 0; border-radius: 4px; }
    </style>
</head>
<body>
    ${bodyHtml}
</body>
</html>`;

      // Use the selected template passed from modal
      // If null/undefined, activeTemplate will be null, disabling headers/footers
      const activeTemplate = selectedTemplate;

      // Construct Header/Footer Templates
      // Playwright requires explicit font-size in the template inline style
      let headerTemplate = undefined;
      let footerTemplate = undefined;

      if (activeTemplate) {
        // Parse CSS Overrides for Logo Customization
        const overrides = activeTemplate.cssOverrides
          ? JSON.parse(activeTemplate.cssOverrides)
          : {};
        const logoHeight = overrides.logoHeight || 40;
        const logoAlignment = overrides.logoAlignment || "flex-start";
        const isRightAligned = logoAlignment === "flex-end";

        // We use flex-direction to handle "Reversed" layout (Logo on right)
        // and standard margins for spacing.
        const logoHtml = activeTemplate.logoPath
          ? `<img src="${activeTemplate.logoPath}" style="height: ${logoHeight}px; margin-right: ${isRightAligned ? "0" : "10px"}; margin-left: ${isRightAligned ? "10px" : "0"};" />`
          : "";

        // Flex container style
        const containerStyle = `
                    font-size: 10px; 
                    width: 100%; 
                    height: ${Math.max(60, logoHeight + 20)}px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    margin: 0 20px; 
                    border-bottom: 1px solid #e5e7eb;
                    flex-direction: ${isRightAligned ? "row-reverse" : "row"};
                `.replace(/\s+/g, " "); // Minify slightly for cleanliness

        headerTemplate = `
                <div style="${containerStyle}">
                    <div style="display: flex; align-items: center;">
                        ${logoHtml}
                        <span style="font-size: 14px; font-weight: 600; font-family: sans-serif;">${activeTemplate.name || "Company Name"}</span>
                    </div>
                    <div style="color: #6b7280; font-family: sans-serif;">${activeTemplate.headerText || ""}</div>
                </div>`;

        footerTemplate = `
                <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; margin: 0 20px; color: #9ca3af; font-family: sans-serif;">
                    <span>${activeTemplate.footerText || ""}</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>`;
      }
      // When activeTemplate is null, headerTemplate and footerTemplate stay undefined
      // This ensures displayHeaderFooter stays false in Playwright (no header/footer at all)

      const result = await WorkspaceThread.exportPdf(
        workspaceSlug,
        editorHtml,
        {
          headerTemplate,
          footerTemplate,
        }
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
   */
  const extractTextContent = () => {
    if (!editorRef.current?.doc) return { title: "", content: "" };

    const doc = editorRef.current.doc;
    const textParts = [];
    let docTitle = "";

    // Get page title if available
    const pageBlock = doc.getBlocksByFlavour("affine:page")[0];
    if (pageBlock?.title) {
      const titleText =
        pageBlock.title.toString?.() ||
        pageBlock.title.yText?.toString?.() ||
        "";
      if (titleText && titleText !== "Title") {
        docTitle = titleText;
      }
    }

    // Get all paragraph and list blocks
    const extractFromBlock = (block) => {
      if (!block) return;

      // Get text from paragraph blocks
      if (block.flavour === "affine:paragraph" && block.text) {
        const text = block.text.toString?.() || "";
        if (text.trim()) textParts.push(text);
      }

      // Get text from list blocks
      if (block.flavour === "affine:list" && block.text) {
        const text = block.text.toString?.() || "";
        if (text.trim()) textParts.push(`• ${text}`);
      }

      // Get text from code blocks
      if (block.flavour === "affine:code" && block.text) {
        const text = block.text.toString?.() || "";
        if (text.trim()) textParts.push(`\`\`\`\n${text}\n\`\`\``);
      }

      // Recursively extract from children
      if (block.children?.length) {
        block.children.forEach(extractFromBlock);
      }
    };

    // Extract from all note blocks
    const noteBlocks = doc.getBlocksByFlavour("affine:note");
    noteBlocks.forEach((noteBlock) => {
      if (noteBlock.children) {
        noteBlock.children.forEach(extractFromBlock);
      }
    });

    return {
      title: docTitle,
      content: textParts.join("\n\n"),
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
      const { title, content } = extractTextContent();

      if (!content.trim()) {
        toast.error("Doc is empty - nothing to embed");
        return;
      }

      console.log("[BlockSuiteEditor] Embedding doc:", {
        title,
        contentLength: content.length,
      });

      const result = await WorkspaceThread.embedDoc(
        workspaceSlug,
        threadSlug,
        content,
        title || undefined
      );

      if (result.success) {
        toast.success(
          result.message ||
          "Doc embedded successfully! AI can now retrieve this content."
        );
      } else {
        toast.error(result.error || "Failed to embed doc");
      }
    } catch (error) {
      console.error("Embed failed:", error);
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

  // Apply a brand template (header + footer) to current document
  const applyBrandTemplate = (template) => {
    const editor = editorRef.current;
    if (!editor || !editor.doc) {
      toast.error("Editor not ready");
      return;
    }

    const doc = editor.doc;

    try {
      // Find the note block to insert content
      const noteBlocks = doc.getBlocksByFlavour("affine:note");
      if (noteBlocks.length === 0) {
        toast.error("No editable area found");
        return;
      }
      const noteBlock = noteBlocks[0];

      // Create header paragraph with template styling
      const headerText = `${template.headerText || template.name}`;
      doc.addBlock(
        "affine:paragraph",
        {
          type: "h1",
          text: new Text(headerText),
        },
        noteBlock.id
      );

      // Add separator
      doc.addBlock("affine:divider", {}, noteBlock.id);

      // Add placeholder for content
      doc.addBlock(
        "affine:paragraph",
        {
          text: new Text(""),
        },
        noteBlock.id
      );

      // Add footer
      if (template.footerText) {
        doc.addBlock("affine:divider", {}, noteBlock.id);
        doc.addBlock(
          "affine:paragraph",
          {
            text: new Text(template.footerText),
          },
          noteBlock.id
        );
      }

      toast.success(`Applied "${template.name}" template`);
      setShowTemplateDropdown(false);
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
            onClick={() => setShowExportModal(true)}
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
        </div>

        {/* BlockSuite Editor Container - data-theme forces dark mode */}
        <div
          ref={containerRef}
          data-theme="dark"
          className="flex-1 overflow-y-auto blocksuite-editor-wrapper"
          style={{ minHeight: "300px" }}
        />
      </div>

      <ExportPdfModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        exporting={exporting}
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
const serializeDocToHtml = async (doc) => {
  if (!doc.root) {
    console.error("[PDF Export] Doc has no root!");
    return "<p>No content found (Empty Root)</p>";
  }

  console.log("[PDF Export] Starting manual serialization for doc:", doc.id);

  // Create job to access assets
  const job = new Job({ collection: doc.collection });
  // Populate transformer context and allow asset reads
  await job.docToSnapshot(doc);
  const assetsManager = job.assetsManager;
  const assets = assetsManager.getAssets(); // Map<string, Blob>

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
            if (block.props && block.props[key] !== undefined) return block.props[key];
            // Check model.props
            if (model && model.props) {
              if (model.props[key] !== undefined) return model.props[key];
              if (typeof model.props.get === "function") return model.props.get(key);
            }
            // Check block.yBlock (Yjs-backed properties)
            if (block.yBlock) {
              const yProps = block.yBlock.get("prop:props") || block.yBlock.get("props");
              if (yProps && typeof yProps.get === "function") {
                return yProps.get(key);
              }
              // Direct key on yBlock
              const yVal = block.yBlock.get(`prop:${key}`) || block.yBlock.get(key);
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
        console.log("[PDF Export] Pricing table raw rows:", rawRows, "block:", block.id);

        rawRows = toPlain(rawRows);
        if (typeof rawRows === "string") {
          try {
            rawRows = JSON.parse(rawRows);
          } catch {
            rawRows = [];
          }
        }
        const rows = Array.isArray(rawRows) ? rawRows.map(toPlain) : [];
        console.log("[PDF Export] Pricing table parsed rows:", rows.length, "rows");

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
          const n = Number(value);
          if (!Number.isFinite(n)) return "$0+GST";
          try {
            const formatted = n.toLocaleString(undefined, {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            });
            return `${formatted}+GST`;
          } catch {
            return `$${Math.round(n)}+GST`;
          }
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

        let tableHtml = `<div class="pricing-table-wrapper" style="margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; page-break-inside: avoid; break-inside: avoid;">
                    <div style="padding: 0.75rem 1rem; background: #f3f4f6; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-weight: 700; color: #111827;">${escapeHtml(title)}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">${escapeHtml(currency)}</div>
                    </div>
                    <div>
                    <table class="pricing-table" style="width: 100%; border-collapse: collapse; font-size: 0.9rem; page-break-inside: avoid; break-inside: avoid;">
                        <thead style="background: #fafafa; border-bottom: 1px solid #e5e7eb; page-break-inside: avoid; break-inside: avoid;">
                            <tr>
                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #111827;">Role</th>
                                <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #111827;">Description</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #111827;">Hours</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #111827;">Rate</th>
                                <th style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #111827;">Total</th>
                            </tr>
                        </thead>
                        <tbody>`;

        if (!rows.length) {
          tableHtml += `<tr style="page-break-inside: avoid; break-inside: avoid;"><td colspan="5" style="padding: 1rem; text-align: center; color: #9ca3af;">No rows</td></tr>`;
        } else {
          rows.forEach((row) => {
            const hours = toNumber(row?.hours, 0);
            const rate = toNumber(row?.baseRate, 0);
            const lineTotal = hours * rate;
            const descHtml = DOMPurify.sanitize(
              renderMarkdown(String(row?.description || "")),
              { USE_PROFILES: { html: true } }
            );
            tableHtml += `<tr style="border-bottom: 1px solid #f3f4f6; page-break-inside: avoid; break-inside: avoid;">
                            <td style="padding: 0.75rem 1rem; color: #111827;">${escapeHtml(row?.role || "")}</td>
                            <td style="padding: 0.75rem 1rem; color: #4b5563;">${descHtml}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; color: #111827;">${hours}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; color: #111827;">${formatCurrency(rate)}</td>
                            <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #111827;">${formatCurrency(lineTotal)}</td>
                        </tr>`;
          });
        }

        tableHtml += `</tbody></table></div>`;

        if (showTotals) {
          const discountLabel =
            clamp(discountPercent) > 0 ? ` (${clamp(discountPercent)}%)` : "";
          const gstLabel =
            clamp(gstPercent) > 0 ? ` (${clamp(gstPercent)}%)` : "";

          tableHtml += `<div style="padding: 0.75rem 1rem; display: flex; justify-content: flex-end;">
                        <div style="width: 320px; font-size: 0.9rem;">
                            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0;">
                                <span style="color: #6b7280;">Subtotal</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(subtotal)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0;">
                                <span style="color: #6b7280;">Discount${discountLabel}</span>
                                <span style="color: #111827; font-weight: 600;">-${formatCurrency(discount)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0;">
                                <span style="color: #6b7280;">After discount</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(afterDiscount)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0;">
                                <span style="color: #6b7280;">GST${gstLabel}</span>
                                <span style="color: #111827; font-weight: 600;">${formatCurrency(gst)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; margin-top: 0.25rem; border-top: 1px solid #e5e7eb;">
                                <span style="color: #111827; font-weight: 700;">Total (Commercial Rounding)</span>
                                <span style="color: #111827; font-weight: 700;">${formatCurrency(total)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.15rem 0; opacity: 0.65; font-size: 0.75rem;">
                                <span style="color: #6b7280;">Exact</span>
                                <span style="color: #111827;">${formatCurrency(rawTotal)}</span>
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

        let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <tr>`;

        headers.forEach((h) => {
          tableHtml += `<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #111827;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        const cells = model.cells || {};

        // IMPORTANT: BlockSuite can store children as IDs or block objects depending on API.
        // Normalize children to block objects.
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
            tableHtml += `<td style="padding: 0.75rem 1rem; color: #374151;">${firstColText}</td>`;

            const rowCells = cells[rowId] || {};
            columns.slice(1).forEach((col) => {
              const cell = rowCells[col.id];
              let cellVal = "";
              if (cell) {
                if (cell.value?.toString) cellVal = cell.value.toString();
                else if (typeof cell.value === "string") cellVal = cell.value;
                else if (cell.value?.text) cellVal = cell.value.text;
              }
              tableHtml += `<td style="padding: 0.75rem 1rem; color: #6b7280;">${cellVal}</td>`;
            });

            tableHtml += "</tr>";
          }
        }

        tableHtml += "</tbody></table></div>";
        html = tableHtml;
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

        let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <thead style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                        <tr>`;

        headers.forEach((h) => {
          tableHtml += `<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #111827;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        if (rowBlocks.length === 0) {
          tableHtml += `<tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center; color: #9ca3af;">No Data Rows Found</td></tr>`;
        } else {
          for (const rowBlock of rowBlocks) {
            const rowId = rowBlock.id;
            const firstColText = getText(rowBlock);

            tableHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">`;
            tableHtml += `<td style="padding: 0.75rem 1rem; color: #374151;">${firstColText}</td>`;

            const rowCells = cells[rowId] || {};
            columns.slice(1).forEach((col) => {
              const cell = rowCells[col.id];
              let cellVal = "";
              if (cell) {
                if (cell.value?.toString) cellVal = cell.value.toString();
                else if (typeof cell.value === "string") cellVal = cell.value;
                else if (cell.value?.text) cellVal = cell.value.text;
              }
              tableHtml += `<td style="padding: 0.75rem 1rem; color: #6b7280;">${cellVal}</td>`;
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
                    --primary-color: #3b82f6;
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
