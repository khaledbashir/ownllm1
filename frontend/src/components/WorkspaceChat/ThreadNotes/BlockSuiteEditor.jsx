import React, {
    forwardRef,
    useEffect,
    useRef,
    useState,
    useImperativeHandle,
    useMemo
} from "react";
import { createEmptyDoc, PageEditor } from "@blocksuite/presets";
import { Text } from "@blocksuite/store";
import { FilePdf, CircleNotch } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";
import debounce from "lodash.debounce";
import ExportPdfModal from "./ExportPdfModal";
import "./editor.css";

const BlockSuiteEditor = forwardRef(({ content, onSave, workspaceSlug }, ref) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const docRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Debounced save
    const debouncedSave = useMemo(
        () => debounce((snapshot) => {
            onSave(JSON.stringify(snapshot));
        }, 1000),
        [onSave]
    );

    // Initialize BlockSuite using official Quick Start pattern
    useEffect(() => {
        if (!containerRef.current) return;

        // Use the official createEmptyDoc helper
        const doc = createEmptyDoc().init();
        docRef.current = doc;

        // Add initial content if empty
        const paragraphs = doc.getBlockByFlavour("affine:paragraph");
        if (paragraphs.length > 0 && content) {
            try {
                const savedData = JSON.parse(content);
                if (savedData.type === "blocksuite" && savedData.text) {
                    // Restore saved text
                    const paragraph = paragraphs[0];
                    doc.updateBlock(paragraph, { text: new Text(savedData.text) });
                } else if (typeof savedData === "string") {
                    const paragraph = paragraphs[0];
                    doc.updateBlock(paragraph, { text: new Text(savedData) });
                }
            } catch (e) {
                // If content is plain text string
                if (typeof content === "string" && content.trim()) {
                    const paragraph = paragraphs[0];
                    doc.updateBlock(paragraph, { text: new Text(content) });
                }
            }
        }

        // Create editor using official PageEditor
        const editor = new PageEditor();
        editor.doc = doc;
        editorRef.current = editor;

        // Mount editor
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(editor);

        // Setup auto-save on block updates
        doc.slots.blockUpdated.on(() => {
            // Get text content for saving
            const allParagraphs = doc.getBlockByFlavour("affine:paragraph");
            let textContent = "";
            allParagraphs.forEach(block => {
                if (block.text) {
                    textContent += block.text.toString() + "\n";
                }
            });
            debouncedSave({ type: "blocksuite", text: textContent.trim() });
        });

        setIsReady(true);

        return () => {
            debouncedSave.cancel();
            if (editorRef.current && editorRef.current.remove) {
                editorRef.current.remove();
            }
        };
    }, []);

    // External API for AI insertion
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            if (!docRef.current || !editorRef.current) return;
            try {
                const doc = docRef.current;
                const noteBlocks = doc.getBlockByFlavour("affine:note");
                if (noteBlocks.length > 0) {
                    const noteId = noteBlocks[0].id;
                    // Split by lines and add paragraphs
                    const lines = markdown.split("\n").filter(l => l.trim());
                    lines.forEach(line => {
                        doc.addBlock("affine:paragraph", { text: new Text(line) }, noteId);
                    });
                }
                toast.success("Content inserted");
            } catch (e) {
                console.error("Failed to insert markdown:", e);
                toast.error("Failed to insert content");
            }
        },
        getEditor: () => editorRef.current,
    }));

    // PDF Export
    const handleExport = async (template) => {
        if (!workspaceSlug || !editorRef.current) {
            toast.error("Cannot export - editor not ready");
            return;
        }

        setExporting(true);
        try {
            const doc = docRef.current;

            // Build HTML from blocks
            let htmlContent = "<div>";
            const paragraphs = doc.getBlockByFlavour("affine:paragraph");
            paragraphs.forEach(block => {
                htmlContent += `<p>${block.text?.toString() || ""}</p>`;
            });
            htmlContent += "</div>";

            const primaryColor = template?.primaryColor || "#3b82f6";
            const fontFamily = template?.fontFamily || "Inter";
            const headerText = template?.headerText || "";
            const footerText = template?.footerText || "";
            const logoPath = template?.logoPath || "";

            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                        body { font-family: '${fontFamily}', sans-serif; padding: 40px; }
                        h1, h2, h3 { color: ${primaryColor}; }
                        p { font-size: 14px; line-height: 1.6; margin-bottom: 1em; }
                    </style>
                </head>
                <body>
                    ${logoPath ? `<img src="${logoPath}" style="max-height:80px;margin-bottom:30px;" />` : ""}
                    ${headerText ? `<div style="margin-bottom:30px;font-size:18px;font-weight:500;color:${primaryColor};border-bottom:2px solid ${primaryColor};padding-bottom:10px;">${headerText}</div>` : ""}
                    ${htmlContent}
                    ${footerText ? `<div style="margin-top:50px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${footerText}</div>` : ""}
                </body>
                </html>
            `;

            const response = await fetch(`${API_BASE}/workspace/${workspaceSlug}/export-pdf`, {
                method: "POST",
                headers: {
                    ...baseHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ html: fullHtml })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Server export failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = template?.name ? `${template.name.toLowerCase().replace(/\s+/g, "-")}.pdf` : "notes.pdf";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("PDF exported successfully!");
        } catch (e) {
            console.error("PDF export failed", e);
            toast.error(`PDF export failed: ${e.message}`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full relative">
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={() => setShowExportModal(true)}
                        disabled={exporting || !isReady}
                        className="flex items-center gap-x-2 px-3 py-1 bg-theme-bg-secondary hover:bg-theme-bg-primary border border-theme-border rounded-md text-sm transition-colors disabled:opacity-50"
                    >
                        {exporting ? (
                            <CircleNotch className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : (
                            <FilePdf className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-theme-text-primary">
                            {exporting ? "Exporting..." : "Export PDF"}
                        </span>
                    </button>
                </div>
                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto bg-theme-bg-secondary blocksuite-editor-wrapper"
                    style={{ minHeight: "100%" }}
                />
            </div>
            <ExportPdfModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />
        </>
    );
});

export default BlockSuiteEditor;
