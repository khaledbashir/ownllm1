import React, { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { FilePdf, CircleNotch } from "@phosphor-icons/react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import ExportPdfModal from "./ExportPdfModal";
import "./editor.css";

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeImageSrc(input) {
    const value = String(input || "").trim();
    if (!value) return "";
    if (value.startsWith("data:image/")) return value;
    if (value.startsWith("/")) return value;
    try {
        const url = new URL(value);
        if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    } catch {
        // ignore
    }
    return "";
}

const BlockEditor = forwardRef(({ content, onSave }, ref) => {
    const [blocks, setBlocks] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Safe Content Loading Logic
    const initialContent = React.useMemo(() => {
        if (!content) return undefined;
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) return parsed;
            return undefined;
        } catch (e) {
            // Legacy text fallback
            return [{
                type: "paragraph",
                content: String(content)
            }];
        }
    }, [content]);

    // Initialize editor with default schema
    const editor = useCreateBlockNote({
        initialContent: initialContent,
    });

    // Auto-save debounce
    const debouncedSave = useCallback(
        debounce((newBlocks) => {
            onSave(JSON.stringify(newBlocks));
        }, 1000),
        [onSave]
    );

    const onChange = useCallback(() => {
        const newBlocks = editor.topLevelBlocks;
        setBlocks(newBlocks);
        debouncedSave(newBlocks);
    }, [editor, debouncedSave]);

    // AI Insertion handler
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            const blocks = await editor.tryParseMarkdownToBlocks(markdown);
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(blocks, currentBlock, "after");
        },
        getEditor: () => editor,
    }));

    // Export Handler
    const handleExport = async (template) => {
        setExporting(true);
        try {
            const html2pdf = (await import("html2pdf.js")).default;
            const htmlContent = await editor.blocksToHTMLLossy(editor.topLevelBlocks);

            const primaryColor = template?.primaryColor || "#3b82f6";
            const secondaryColor = template?.secondaryColor || "#1e293b";
            const fontFamily = template?.fontFamily || "Inter";
            const headerText = escapeHtml(template?.headerText || "");
            const footerText = escapeHtml(template?.footerText || "");
            const logoPath = safeImageSrc(template?.logoPath || "");

            const container = document.createElement("div");
            container.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    * { box-sizing: border-box; }
                    body { font-family: '${fontFamily}', sans-serif; }
                    .pdf-container { padding: 40px; }
                    h1 { font-size: 28px; color: ${primaryColor}; }
                    h2 { font-size: 22px; color: ${primaryColor}; }
                    p { font-size: 14px; line-height: 1.7; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 10px; }
                    th { background-color: ${primaryColor}; color: white; }
                </style>
                <div class="pdf-container">
                    ${logoPath ? `<img src="${logoPath}" style="max-height:60px;margin-bottom:20px;" />` : ''}
                    ${headerText ? `<div style="margin-bottom:20px;">${headerText}</div>` : ''}
                    ${htmlContent}
                    ${footerText ? `<div style="margin-top:30px;font-size:11px;color:#666;">${footerText}</div>` : ''}
                </div>
            `;

            const opt = {
                margin: [15, 15],
                filename: template?.name ? `${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf` : 'notes.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(container).save();
            toast.success("PDF exported successfully!");
        } catch (e) {
            console.error("PDF export failed", e);
            toast.error("PDF export failed");
        } finally {
            setExporting(false);
        }
    };

    return (
        <MantineProvider>
            <div className="flex flex-col h-full relative">
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={() => setShowExportModal(true)}
                        disabled={exporting}
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
                <div className="flex-1 overflow-y-auto rich-editor-container bg-theme-bg-secondary p-4">
                    <BlockNoteView editor={editor} onChange={onChange} theme="dark" />
                </div>
            </div>
            <ExportPdfModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />
        </MantineProvider>
    );
});

export default BlockEditor;
