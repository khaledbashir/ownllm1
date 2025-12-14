import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { AffineEditorContainer } from "@blocksuite/presets";
import { Schema, DocCollection, Text } from "@blocksuite/store";
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
 * Uses the correct integration pattern from official examples:
 * 1. Create editor with `new AffineEditorContainer()`
 * 2. Append to DOM via ref
 */
const BlockSuiteEditor = forwardRef(function BlockSuiteEditor(
    { content, onSave, workspaceSlug },
    ref
) {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const collectionRef = useRef(null);

    // Get context for global editor access
    const editorContext = useEditorContext();

    const [isReady, setIsReady] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const debouncedSave = useMemo(
        () =>
            debounce((content) => {
                onSave(content);
            }, 1000),
        [onSave]
    );

    // Initialize BlockSuite editor
    useEffect(() => {
        if (!containerRef.current) return;

        try {
            // Create schema with Affine blocks
            const schema = new Schema().register(AffineSchemas);
            const collection = new DocCollection({ schema });
            collection.meta.initialize();

            // Create doc with initial content
            const doc = collection.createDoc({ id: "thread-notes" });
            doc.load(() => {
                const pageBlockId = doc.addBlock("affine:page", {});
                doc.addBlock("affine:surface", {}, pageBlockId);
                const noteId = doc.addBlock("affine:note", {}, pageBlockId);

                // If we have initial content, try to parse and add it
                if (content) {
                    try {
                        const parsed = JSON.parse(content);
                        if (parsed.type === "blocksuite" && parsed.value) {
                            // TODO: Restore from saved state
                            doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
                        } else if (typeof parsed === "string") {
                            // For now, just add empty paragraph (text model is created automatically)
                            doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
                        } else {
                            doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
                        }
                    } catch {
                        // Plain text content - add empty paragraph
                        doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
                    }
                } else {
                    doc.addBlock("affine:paragraph", { text: new Text() }, noteId);
                }

                // Create editor AFTER blocks are ready
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
                collectionRef.current = collection;

                // Listen for changes and autosave
                doc.slots.blockUpdated.on(() => {
                    const content = JSON.stringify({
                        type: "blocksuite",
                        docId: doc.id,
                    });
                    debouncedSave(content);
                });

                setIsReady(true);
            });
        } catch (error) {
            console.error("Failed to initialize BlockSuite editor:", error);
            toast.error("Failed to load editor");
        }

        return () => {
            debouncedSave.cancel();
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

    // Expose insert method to parent
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            if (!editorRef.current || !markdown) return;

            // Get current doc
            const doc = editorRef.current.doc;
            if (!doc) return;

            // Find the note block and add content
            const pageBlock = doc.getBlocksByFlavour("affine:page")[0];
            if (!pageBlock) return;

            const noteBlock = doc.getBlocksByFlavour("affine:note")[0];
            if (!noteBlock) return;

            // Split markdown by lines and add as paragraphs
            const lines = markdown.split("\n");
            for (const line of lines) {
                if (line.trim()) {
                    doc.addBlock("affine:paragraph", { text: new Text(line) }, noteBlock.id);
                }
            }
        },
        getEditor: () => editorRef.current,
    }));

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
