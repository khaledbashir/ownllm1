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

import { FilePdf, CircleNotch } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import WorkspaceThread from "@/models/workspaceThread";
import { useEditorContext } from "./EditorContext";
import "./editor.css";

/**
 * BlockSuiteEditor - Notion-like block editor using AffineEditorContainer
 * 
 * Save/Restore Strategy:
 * - We save the full DocSnapshot JSON from BlockSuite's Job.docToSnapshot()
 * - On restore, we rebuild blocks from the saved snapshot
 * - This preserves all content, formatting, and structure
 */
const BlockSuiteEditor = forwardRef(function BlockSuiteEditor(
    { content, onSave, workspaceSlug },
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
                // Fallback: just add simple paragraphs
                try {
                    const lines = markdown.split("\n").filter(l => l.trim());
                    for (const line of lines) {
                        doc.addBlock("affine:paragraph", { text: new Text(line) }, noteBlock.id);
                    }
                    console.log("[BlockSuiteEditor] Fallback: added simple paragraphs");
                } catch (fallbackError) {
                    console.error("[BlockSuiteEditor] Fallback also failed:", fallbackError);
                }
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
                    <h1>Notes Export</h1>
                    ${containerRef.current.innerHTML}
                </div>
            `;

            const blob = await WorkspaceThread.exportPdf(workspaceSlug, editorHtml);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `notes-${new Date().toISOString().slice(0, 10)}.pdf`;
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

    return (
        <>
            <div className="flex flex-col h-full relative">
                {/* Export PDF Button - Sticky */}
                <div className="sticky top-0 z-20 flex justify-end px-4 py-2 bg-theme-bg-secondary border-b border-theme-sidebar-border">
                    <button
                        onClick={() => setShowExportModal(true)}
                        disabled={exporting || !isReady}
                        className="flex items-center gap-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
