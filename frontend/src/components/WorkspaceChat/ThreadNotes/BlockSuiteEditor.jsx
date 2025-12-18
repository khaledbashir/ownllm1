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
import { AffineSchemas } from "@blocksuite/blocks";
import "@blocksuite/presets/themes/affine.css";
// Deep import for HtmlAdapter as it is not exposed in main entry
import { HtmlAdapter } from "@blocksuite/blocks/dist/_common/adapters/html.js";

import { FilePdf, CircleNotch, Database, FileDoc, CaretDown } from "@phosphor-icons/react";
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
            { type: "list", items: ["Deliverable 1", "Deliverable 2", "Deliverable 3"] },
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
                console.log("[AI Action] Continue writing with context:", contextText.slice(-500));
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
                    toast.info(`🤖 AI processing selected text: "${selectedText.slice(0, 30)}..."`);
                    setShowAIModal(true);
                }
                break;

            default:
                toast.error(`Unknown AI action: ${actionType}`);
        }
    };

    // Helper to save the full document snapshot
    const saveDocSnapshot = useMemo(() => {
        return debounce(async (doc, collection) => {
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
                // Create schema with Affine blocks
                const schema = new Schema().register(AffineSchemas);
                const collection = new DocCollection({ schema });
                collection.meta.initialize();
                collectionRef.current = collection;

                // Create job for snapshot operations
                const job = new Job({ collection });
                jobRef.current = job;

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
                        console.warn("[BlockSuiteEditor] Could not parse saved content, creating fresh doc:", parseError);
                        doc = createEmptyDoc(collection);
                    }
                } else {
                    // No content - create fresh doc
                    doc = createEmptyDoc(collection);
                }

                // Create editor and attach document
                const editor = new AffineEditorContainer();
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
                                "Authorization": `Bearer ${localStorage.getItem("anythingllm_auth_token")}`
                            },
                            body: formData
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
                                const noteBlock = doc.getBlocks().find(b => b.flavour === 'affine:note');
                                if (noteBlock) {
                                    doc.addBlock("affine:image", {
                                        sourceId: data.url
                                    }, noteBlock.id);
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

                // Listen for changes and autosave with full snapshot
                doc.slots.blockUpdated.on(() => {
                    saveDocSnapshot(doc, collection);
                });

                // Setup AI slash menu after short delay to ensure widgets are ready
                setTimeout(() => {
                    try {
                        // Access the page root element and its widgets
                        const pageRoot = editor.querySelector('affine-page-root');

                        // Setup AI Slash Menu
                        if (pageRoot?.widgetElements?.['affine-slash-menu-widget']) {
                            const slashMenu = pageRoot.widgetElements['affine-slash-menu-widget'];
                            setupAISlashMenu(slashMenu, handleAIAction);
                        }

                        // Setup AI Format Bar (selection toolbar)
                        if (pageRoot?.widgetElements?.['affine-format-bar-widget']) {
                            const formatBar = pageRoot.widgetElements['affine-format-bar-widget'];
                            setupAIFormatBar(formatBar, handleAIAction);
                        }
                    } catch (err) {
                        console.warn('[BlockSuiteEditor] Could not setup AI widgets:', err);
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
            // Initialize directly without doc.load wrapper to avoid Yjs "before reading data" error
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

        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) {
                i++;
                continue;
            }

            // Markdown table detection - create proper affine:database block
            if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
                const tableLines = [];
                while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
                    const tableLine = lines[i].trim();
                    // Check if this is a separator row (contains only |, -, :, and spaces)
                    const isSeparator = /^\|[\s\-:|]+\|$/.test(tableLine) && tableLine.includes("-");
                    if (!isSeparator) {
                        tableLines.push(tableLine);
                    }
                    i++;
                }

                if (tableLines.length > 0) {
                    // Parse header row (first line) and data rows
                    const parseRow = (row) => row.split("|").filter(cell => cell.trim()).map(cell => cell.trim());
                    const headerCells = parseRow(tableLines[0]);
                    const dataRows = tableLines.slice(1).map(parseRow);

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
                    const databaseId = doc.addBlock("affine:database", {
                        views: [{
                            id: genId(),
                            name: "Table View",
                            mode: "table",
                            columns: [],
                            filter: { type: "group", op: "and", conditions: [] },
                            header: { titleColumn: viewsColumns[0]?.id, iconColumn: "type" },
                        }],
                        title: new Text(""),
                        cells: {},
                        columns,
                    }, noteBlockId);

                    // Add paragraph rows for title column - these become the row IDs
                    const rowBlockIds = dataRows.map((row) => {
                        return doc.addBlock("affine:paragraph", {
                            text: new Text(row[0] || ""),
                            type: "text",
                        }, databaseId);
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
                doc.addBlock("affine:code", {
                    text: new Text(codeLines.join("\n")),
                    language: lang
                }, noteBlockId);
                continue;
            }

            // Headings
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                const level = headingMatch[1].length; // 1-6
                const headingType = level <= 3 ? `h${level}` : "h3";
                doc.addBlock("affine:paragraph", {
                    type: headingType,
                    text: new Text(parseInlineFormatting(headingMatch[2]))
                }, noteBlockId);
                i++;
                continue;
            }

            // Unordered list item
            if (/^[-*+]\s+/.test(trimmed)) {
                const listText = trimmed.replace(/^[-*+]\s+/, "");
                doc.addBlock("affine:list", {
                    type: "bulleted",
                    text: new Text(parseInlineFormatting(listText))
                }, noteBlockId);
                i++;
                continue;
            }

            // Ordered list item
            const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
            if (orderedMatch) {
                doc.addBlock("affine:list", {
                    type: "numbered",
                    text: new Text(parseInlineFormatting(orderedMatch[2]))
                }, noteBlockId);
                i++;
                continue;
            }

            // Blockquote
            if (trimmed.startsWith(">")) {
                const quoteText = trimmed.slice(1).trim();
                doc.addBlock("affine:paragraph", {
                    type: "quote",
                    text: new Text(parseInlineFormatting(quoteText))
                }, noteBlockId);
                i++;
                continue;
            }

            // Image (placeholder for now)
            if (trimmed.startsWith("![")) {
                doc.addBlock("affine:paragraph", {
                    type: "quote",
                    text: new Text("📸 [Screenshot Captured]")
                }, noteBlockId);
                i++;
                continue;
            }

            // Regular paragraph
            doc.addBlock("affine:paragraph", {
                text: new Text(parseInlineFormatting(trimmed))
            }, noteBlockId);
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
            .replace(/\*\*(.+?)\*\*/g, "$1")  // **bold** -> bold
            .replace(/__(.+?)__/g, "$1")       // __bold__ -> bold
            .replace(/\*(.+?)\*/g, "$1")       // *italic* -> italic
            .replace(/_(.+?)_/g, "$1")         // _italic_ -> italic
            .replace(/`(.+?)`/g, "$1")         // `code` -> code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [link](url) -> link
    };

    // Expose insert method to parent
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            console.log("[BlockSuiteEditor] insertMarkdown called with:", markdown?.substring(0, 100));

            if (!editorRef.current || !markdown) {
                console.error("[BlockSuiteEditor] Missing editor or markdown");
                return;
            }

            // Get current doc
            const doc = editorRef.current.doc;
            if (!doc) {
                console.error("[BlockSuiteEditor] No doc found");
                return;
            }

            // Find the note block for adding content
            const noteBlock = doc.getBlocksByFlavour("affine:note")[0];
            if (!noteBlock) {
                console.error("[BlockSuiteEditor] No note block found");
                return;
            }

            console.log("[BlockSuiteEditor] Found note block:", noteBlock.id);

            try {
                // Extract title from first heading and remaining content
                const { title, remainingContent } = extractTitleFromMarkdown(markdown);

                // If we found a title, try to set it as the page title
                if (title) {
                    try {
                        // Get the page block - it holds the document title
                        const pageBlock = doc.getBlocksByFlavour("affine:page")[0];
                        if (pageBlock) {
                            // BlockSuite page title is stored in the page block's title property
                            // We need to update the title text
                            const titleProp = pageBlock.title;
                            if (titleProp && typeof titleProp.insert === 'function') {
                                // Clear existing title and set new one
                                titleProp.clear();
                                titleProp.insert(title, 0);
                                console.log("[BlockSuiteEditor] Set page title to:", title);
                            } else if (typeof pageBlock.title === 'object' && pageBlock.title?.yText) {
                                // Alternative: try modifying yText directly
                                pageBlock.title.yText.delete(0, pageBlock.title.yText.length);
                                pageBlock.title.yText.insert(0, title);
                                console.log("[BlockSuiteEditor] Set page title via yText:", title);
                            } else {
                                // Fallback: Add title as first H1 block
                                doc.addBlock("affine:paragraph", {
                                    type: "h1",
                                    text: new Text(title)
                                }, noteBlock.id);
                                console.log("[BlockSuiteEditor] Added title as H1 block:", title);
                            }
                        }
                    } catch (titleError) {
                        console.warn("[BlockSuiteEditor] Could not set page title, adding as H1:", titleError);
                        // Fallback: Add as H1 block
                        doc.addBlock("affine:paragraph", {
                            type: "h1",
                            text: new Text(title)
                        }, noteBlock.id);
                    }
                }

                // Parse and insert the remaining content
                if (remainingContent.trim()) {
                    parseMarkdownToBlocks(doc, noteBlock.id, remainingContent);
                }

                console.log("[BlockSuiteEditor] Successfully parsed and inserted markdown");
            } catch (e) {
                console.error("[BlockSuiteEditor] parseMarkdownToBlocks failed:", e);
                // Fallback
                try {
                    const lines = markdown.split("\n").filter(l => l.trim());
                    for (const line of lines) {
                        doc.addBlock("affine:paragraph", { text: new Text(line) }, noteBlock.id);
                    }
                } catch (fallbackError) {
                    console.error("[BlockSuiteEditor] Fallback failed:", fallbackError);
                }
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

                const noteBlock = pageBlock.children?.find(b => b.flavour === "affine:note");
                if (!noteBlock) return;

                // Clear existing content (except the first empty paragraph)
                const children = [...(noteBlock.children || [])];
                children.forEach(child => {
                    try {
                        doc.deleteBlock(child);
                    } catch (e) {
                        // Ignore
                    }
                });

                // Add template blocks
                template.blocks.forEach(block => {
                    if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
                        doc.addBlock("affine:paragraph", {
                            type: block.type,
                            text: new Text(block.text),
                        }, noteBlock.id);
                    } else if (block.type === "paragraph") {
                        doc.addBlock("affine:paragraph", {
                            text: new Text(block.text),
                        }, noteBlock.id);
                    } else if (block.type === "list") {
                        block.items.forEach(item => {
                            doc.addBlock("affine:list", {
                                type: "bulleted",
                                text: new Text(item),
                            }, noteBlock.id);
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
                remainingContent: remainingLines.join("\n")
            };
        }

        return {
            title: null,
            remainingContent: markdown
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

            // 1. Serialize Doc to Standard HTML
            const bodyHtml = await serializeDocToHtml(doc);
            if (!bodyHtml || bodyHtml.includes("No content found")) {
                throw new Error("Serialized document is empty. Please verify content exists.");
            }

            // 2. Build the Full HTML Wrapper with Styles and Google Fonts
            const editorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document Export</title>
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
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
            font-family: 'Inter', sans-serif;
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
                const overrides = activeTemplate.cssOverrides ? JSON.parse(activeTemplate.cssOverrides) : {};
                const logoHeight = overrides.logoHeight || 40;
                const logoAlignment = overrides.logoAlignment || 'flex-start';
                const isRightAligned = logoAlignment === 'flex-end';

                // We use flex-direction to handle "Reversed" layout (Logo on right)
                // and standard margins for spacing.
                const logoHtml = activeTemplate.logoPath ?
                    `<img src="${activeTemplate.logoPath}" style="height: ${logoHeight}px; margin-right: ${isRightAligned ? '0' : '10px'}; margin-left: ${isRightAligned ? '10px' : '0'};" />` :
                    '';

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
                    flex-direction: ${isRightAligned ? 'row-reverse' : 'row'};
                `.replace(/\s+/g, ' '); // Minify slightly for cleanliness

                headerTemplate = `
                <div style="${containerStyle}">
                    <div style="display: flex; align-items: center;">
                        ${logoHtml}
                        <span style="font-size: 14px; font-weight: 600; font-family: sans-serif;">${activeTemplate.name || 'Company Name'}</span>
                    </div>
                    <div style="color: #6b7280; font-family: sans-serif;">${activeTemplate.headerText || ''}</div>
                </div>`;

                footerTemplate = `
                <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; margin: 0 20px; color: #9ca3af; font-family: sans-serif;">
                    <span>${activeTemplate.footerText || ''}</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>`;
            } else {
                // Default minimalist footer with page numbers even if no template
                footerTemplate = `
                <div style="font-size: 10px; width: 100%; display: flex; justify-content: flex-end; margin: 0 20px; color: #9ca3af; font-family: sans-serif;">
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>`;
            }


            const result = await WorkspaceThread.exportPdf(workspaceSlug, editorHtml, {
                headerTemplate,
                footerTemplate
            });

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
            const titleText = pageBlock.title.toString?.() || pageBlock.title.yText?.toString?.() || "";
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
        noteBlocks.forEach(noteBlock => {
            if (noteBlock.children) {
                noteBlock.children.forEach(extractFromBlock);
            }
        });

        return {
            title: docTitle,
            content: textParts.join("\n\n")
        };
    };

    /**
     * Handle embedding doc content into workspace vector database
     */
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

            console.log("[BlockSuiteEditor] Embedding doc:", { title, contentLength: content.length });

            const result = await WorkspaceThread.embedDoc(
                workspaceSlug,
                threadSlug,
                content,
                title || undefined
            );

            if (result.success) {
                toast.success(result.message || "Doc embedded successfully! AI can now retrieve this content.");
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
            doc.addBlock("affine:paragraph", {
                type: "h1",
                text: new Text(headerText),
            }, noteBlock.id);

            // Add separator
            doc.addBlock("affine:divider", {}, noteBlock.id);

            // Add placeholder for content
            doc.addBlock("affine:paragraph", {
                text: new Text(""),
            }, noteBlock.id);

            // Add footer
            if (template.footerText) {
                doc.addBlock("affine:divider", {}, noteBlock.id);
                doc.addBlock("affine:paragraph", {
                    text: new Text(template.footerText),
                }, noteBlock.id);
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
                                        <span className="text-xs">Create one in Settings → Document Templates</span>
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
                                                style={{ backgroundColor: template.primaryColor || "#3b82f6" }}
                                            >
                                                {template.logoPath ? (
                                                    <img src={template.logoPath} alt="" className="w-full h-full object-contain rounded" />
                                                ) : (
                                                    template.name?.charAt(0) || "T"
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-sm truncate">{template.name}</div>
                                                <div className="text-xs text-white/40 truncate">{template.headerText || "No header"}</div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action buttons styled like mode pills but differentiated */}
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
                            } catch { return ""; }
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
                                    doc.addBlock("affine:paragraph", {
                                        text: new Text(result.content),
                                    }, noteId);
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
    // We need to wait for the job to be ready or just use assets directly?
    // Usually job.docToSnapshot loads assets.
    await job.docToSnapshot(doc);
    const assets = job.assets; // Map<string, Blob>

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
        if (typeof blockOrId === 'string') {
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
                if (type === "h1") html = `<h1 style="font-size: 2rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">${text}</h1>`;
                else if (type === "h2") html = `<h2 style="font-size: 1.5rem; font-weight: bold; margin-top: 1.25rem; margin-bottom: 0.75rem; color: var(--text-primary);">${text}</h2>`;
                else if (type === "h3") html = `<h3 style="font-size: 1.25rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-primary);">${text}</h3>`;
                else if (type === "h4") html = `<h4 style="font-size: 1.1rem; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem;">${text}</h4>`;
                else if (type === "h5") html = `<h5 style="font-weight: bold; margin-top: 0.75rem;">${text}</h5>`;
                else if (type === "h6") html = `<h6 style="font-weight: bold; margin-top: 0.75rem; color: var(--text-secondary);">${text}</h6>`;
                else if (type === "quote") html = `<blockquote style="border-left: 4px solid var(--primary-color); padding-left: 1rem; font-style: italic; color: var(--text-secondary); margin: 1rem 0;">${text}</blockquote>`;
                else html = `<p style="${style}">${text || "&nbsp;"}</p>`;
                break;

            case "affine:list":
                const listType = model.type;
                if (listType === "todo") {
                    // Todo/Checkbox list
                    const checked = model.checked ? "checked" : "";
                    const strikeStyle = model.checked ? "text-decoration: line-through; color: #9ca3af;" : "";
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
                const escapedCode = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
                const attachmentSize = model.size ? `(${Math.round(model.size / 1024)} KB)` : "";
                html = `<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.5rem 0; background: #fafafa; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.25rem;">📎</span>
                    <span style="color: #374151; font-weight: 500;">${attachmentName}</span>
                    <span style="color: #9ca3af; font-size: 0.875rem;">${attachmentSize}</span>
                </div>`;
                break;

            case "affine:image":
                console.log("[PDF Export] Image Model:", model);
                let imgSrc = "";
                const sourceId = model.sourceId;

                // If sourceId is present, try to resolve it
                if (sourceId) {
                    if (assets.has(sourceId)) {
                        // Blob in memory (old behavior)
                        const blob = assets.get(sourceId);
                        if (blob) {
                            const reader = new FileReader();
                            const base64 = await new Promise(r => {
                                reader.onload = () => r(reader.result);
                                reader.readAsDataURL(blob);
                            });
                            imgSrc = base64;
                        }
                    } else if (typeof sourceId === 'string' && (sourceId.startsWith('http') || sourceId.startsWith('/'))) {
                        // Persistent URL (new behavior)
                        try {
                            // Resolve relative URLs to absolute for fetching
                            const fetchUrl = sourceId.startsWith('/')
                                ? `${window.location.origin}${sourceId}`
                                : sourceId;

                            const res = await fetch(fetchUrl);
                            if (res.ok) {
                                const b = await res.blob();
                                const reader = new FileReader();
                                const base64 = await new Promise(r => {
                                    reader.onload = () => r(reader.result);
                                    reader.readAsDataURL(b);
                                });
                                imgSrc = base64;
                                console.log(`[PDF Export] Inlined persistent image ${sourceId}`);
                            } else {
                                console.warn(`[PDF Export] Failed to fetch image ${fetchUrl}`);
                            }
                        } catch (e) {
                            console.error("[PDF Export] Error fetching image url:", e);
                        }
                    }
                }

                // Fallback to DOM if still no image (e.g. some other adapter logic?)
                if (!imgSrc) {
                    const domEl = document.querySelector(`[data-block-id="${block.id}"] img`);
                    if (domEl) {
                        const domSrc = domEl.getAttribute("src");
                        if (domSrc && (domSrc.startsWith("data:") || domSrc.startsWith("blob:"))) {
                            // If it's a blob URL that we missed, try to fetch it
                            if (domSrc.startsWith("blob:")) {
                                try {
                                    const res = await fetch(domSrc);
                                    const b = await res.blob();
                                    const reader = new FileReader();
                                    const base64 = await new Promise(r => {
                                        reader.onload = () => r(reader.result);
                                        reader.readAsDataURL(b);
                                    });
                                    imgSrc = base64;
                                } catch (e) { }
                            } else {
                                imgSrc = domSrc;
                            }
                        }
                    }
                }

                if (imgSrc) {
                    // Dynamic Alignment based on model property
                    // Default to center if not specified, or respect 'align'/'alignment' prop
                    const align = model.align || model.alignment || "center";
                    let justify = "center";
                    if (align === "left" || align === "start") justify = "flex-start";
                    else if (align === "right" || align === "end") justify = "flex-end";

                    html = `<div style="display: flex; justify-content: ${justify}; margin: 1rem 0;"><img src="${imgSrc}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" /></div>`;
                } else {
                    html = `<p style="color: red;">[Image Missing]</p>`;
                }
                break;

            case "affine:database":
                // Database/Table Rendering
                // Key insight: Each ROW is a child paragraph/list block, not a cells object entry
                const columns = model.columns || [];
                const headers = columns.map(c => c.name || "");
                const childBlocks = block.children || [];

                if (headers.length > 0 && childBlocks.length > 0) {
                    let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                            <tr>`;
                    headers.forEach(h => tableHtml += `<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #111827;">${h}</th>`);
                    tableHtml += `</tr></thead><tbody>`;

                    // Each child is a ROW - the first column is the child's text, other columns are in cells
                    const cells = model.cells || {};
                    for (const childBlock of childBlocks) {
                        const rowId = childBlock.id;
                        const rowModel = childBlock.model || {};
                        const firstColText = getText(childBlock); // Title column from paragraph text

                        tableHtml += `<tr style="border-bottom: 1px solid #e5e7eb;">`;

                        // First column is the child block's text content
                        tableHtml += `<td style="padding: 0.75rem 1rem; color: #374151;">${firstColText}</td>`;

                        // Remaining columns from cells object
                        const rowCells = cells[rowId] || {};
                        columns.slice(1).forEach(col => {
                            const cell = rowCells[col.id];
                            let cellVal = "";
                            if (cell) {
                                // Cell value can be Text object, string, or other
                                if (cell.value?.toString) {
                                    cellVal = cell.value.toString();
                                } else if (typeof cell.value === "string") {
                                    cellVal = cell.value;
                                } else if (cell.value?.text) {
                                    cellVal = cell.value.text;
                                }
                            }
                            tableHtml += `<td style="padding: 0.75rem 1rem; color: #6b7280;">${cellVal}</td>`;
                        });
                        tableHtml += "</tr>";
                    }
                    tableHtml += "</tbody></table></div>";
                    html = tableHtml;
                } else if (headers.length > 0) {
                    // Empty table with just headers
                    let tableHtml = `<div style="overflow-x: auto; margin: 1.5rem 0; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead style="background: #f3f4f6;"><tr>`;
                    headers.forEach(h => tableHtml += `<th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">${h}</th>`);
                    tableHtml += `</tr></thead><tbody><tr><td colspan="${headers.length}" style="padding: 1rem; text-align: center; color: #9ca3af;">No data</td></tr></tbody></table></div>`;
                    html = tableHtml;
                }
                break;

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

