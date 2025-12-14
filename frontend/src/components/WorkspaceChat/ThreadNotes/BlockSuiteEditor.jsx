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

import { FilePdf, CircleNotch, Database } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import WorkspaceThread from "@/models/workspaceThread";
import { useEditorContext } from "./EditorContext";
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

                // Listen for changes and autosave with full snapshot
                doc.slots.blockUpdated.on(() => {
                    saveDocSnapshot(doc, collection);
                });

                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize BlockSuite editor:", error);
                toast.error("Failed to load editor");
            }
        };

        // Helper to create an empty doc with required structure
        function createEmptyDoc(collection) {
            const doc = collection.createDoc({ id: "thread-notes" });
            doc.load(() => {
                const pageBlockId = doc.addBlock("affine:page", {});
                doc.addBlock("affine:surface", {}, pageBlockId);
                const noteId = doc.addBlock("affine:note", {}, pageBlockId);
                doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
            });
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


    const handleExport = async () => {
        if (!containerRef.current || !workspaceSlug) return;
        setExporting(true);
        try {
            // Get HTML content from the editor container
            // We clone it to remove any interactive elements if needed, but for now just raw HTML
            // Note: We might want to wrap it in a basic styling wrapper
            const editorHtml = `
                <style>
                    body { font-family: sans-serif; color: black; }
                    /* Add any critical blocksuite styles here if they are missing in the export */
                </style>
                <div>
                    <h1>Doc Export</h1>
                    ${containerRef.current.innerHTML}
                </div>
            `;

            const blob = await WorkspaceThread.exportPdf(workspaceSlug, editorHtml);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `doc-${new Date().toISOString().slice(0, 10)}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("PDF exported successfully");
            } else {
                throw new Error("Failed to generate PDF");
            }
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Export failed");
        } finally {
            setExporting(false);
            setShowExportModal(false);
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

    return (
        <>
            <div className="flex flex-col h-full relative">
                {/* Header with buttons */}
                <div className="sticky top-0 z-20 flex justify-end gap-x-2 px-4 py-2 bg-theme-bg-secondary border-b border-theme-sidebar-border">
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
        </>
    );
});

export default BlockSuiteEditor;
