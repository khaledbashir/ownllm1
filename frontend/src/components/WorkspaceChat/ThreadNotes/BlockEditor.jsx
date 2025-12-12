import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"; // Import schema core
import { createReactBlockSpec } from "@blocknote/react"; // Import React helper
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import { FilePdf, CircleNotch } from "@phosphor-icons/react";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import ExportPdfModal from "./ExportPdfModal";
import { getSmartBlock } from "../../SmartBlocks"; // Import Registry
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

// Custom dark theme for Mantine (used by BlockNote)
const darkTheme = createTheme({
    primaryColor: 'blue',
    colors: {
        dark: [
            '#C1C2C5', // 0
            '#A6A7AB', // 1
            '#909296', // 2
            '#5C5F66', // 3
            '#373A40', // 4
            '#2C2E33', // 5
            '#25262B', // 6
            '#1A1B1E', // 7
            '#141517', // 8
            '#101113', // 9
        ],
    },
});

// Define Smart Block Spec
const SmartBlock = createReactBlockSpec(
    {
        type: "smart-block",
        propSchema: {
            blockType: { default: "pricing-table" },
            blockData: { default: "{}" } // JSON string of data
        },
        content: "none",
    },
    {
        render: (props) => {
            const { blockType, blockData } = props.block.props;
            const BlockConfig = getSmartBlock(blockType);

            if (!BlockConfig || !BlockConfig.component) {
                return <div className="p-4 bg-red-100 text-red-500 rounded">Unknown Smart Block: {blockType}</div>;
            }

            const Component = BlockConfig.component;
            const data = JSON.parse(blockData || "{}");

            // Handle update from component
            const handleUpdate = (newData) => {
                // Update the block's props in the editor document
                props.editor.updateBlock(props.block, {
                    props: { ...props.block.props, blockData: JSON.stringify(newData) }
                });
            };

            return (
                <div className="smart-block-wrapper my-4">
                    <Component initialData={data.rows || []} onUpdate={handleUpdate} />
                </div>
            );
        },
    }
);

// Create Schema with defensive check
const filteredBlockSpecs = Object.fromEntries(
    Object.entries(defaultBlockSpecs).filter(([key, value]) => value !== undefined)
);

const schema = BlockNoteSchema.create({
    blockSpecs: {
        ...filteredBlockSpecs,
        "smart-block": SmartBlock,
    },
});

const BlockEditor = forwardRef(({ content, onSave }, ref) => {
    const [blocks, setBlocks] = useState([]);
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Safe Content Loading Logic
    const initialContent = React.useMemo(() => {
        if (!content) return undefined;
        try {
            const parsed = JSON.parse(content);
            // Ensure it's an array
            if (Array.isArray(parsed)) return parsed;
            return undefined;
        } catch (e) {
            // Legacy text fallback - BlockNote expects content to be an array of inline content
            // For plain text, we create a paragraph with proper inline content format
            return [{
                type: "paragraph",
                content: [{ type: "text", text: String(content), styles: {} }]
            }];
        }
    }, [content]);

    // Initialize editor
    const editor = useCreateBlockNote({
        schema, // Use custom schema
        initialContent: initialContent,
        uploadFile: async (file) => {
            return URL.createObjectURL(file);
        },
    });

    // Auto-save debounce
    const debouncedSave = useCallback(
        debounce((newBlocks) => {
            onSave(JSON.stringify(newBlocks));
        }, 1000),
        [onSave]
    );

    const onChange = useCallback(() => {
        const newBlocks = editor.document;
        setBlocks(newBlocks);
        debouncedSave(newBlocks);
    }, [editor, debouncedSave]);

    // AI Insertion handler (to be attached to parent via ref)
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            const blocks = await editor.tryParseMarkdownToBlocks(markdown);
            const currentBlock = editor.getTextCursorPosition().block;
            editor.insertBlocks(blocks, currentBlock, "after");
        },
        getEditor: () => editor,
    }));

    // Export Handler - Download as PDF using html2pdf.js with optional template styling
    const handleExport = async (template) => {
        setExporting(true);
        try {
            // Dynamically import html2pdf to avoid SSR issues
            const html2pdf = (await import("html2pdf.js")).default;

            // Convert blocks to HTML
            const htmlContent = await editor.blocksToHTMLLossy(editor.document);

            // Template styling or defaults
            const primaryColor = template?.primaryColor || "#3b82f6";
            const secondaryColor = template?.secondaryColor || "#1e293b";
            const fontFamily = template?.fontFamily || "Inter";
            const headerText = escapeHtml(template?.headerText || "");
            const footerText = escapeHtml(template?.footerText || "");
            const logoPath = safeImageSrc(template?.logoPath || "");

            // Create a styled wrapper for PDF generation with template branding
            const container = document.createElement("div");
            container.innerHTML = `
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&family=Lato:wght@400;700&display=swap');
                    
                    * { box-sizing: border-box; }
                    body { font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                    
                    .pdf-container { padding: 40px; max-width: 100%; }
                    
                    /* Header with logo */
                    .pdf-header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        padding-bottom: 20px;
                        border-bottom: 2px solid ${primaryColor};
                    }
                    .pdf-header img { max-height: 60px; max-width: 200px; margin-bottom: 10px; }
                    .pdf-header-text { color: ${secondaryColor}; font-size: 12px; margin-top: 8px; }
                    
                    /* Content styling */
                    h1 { font-size: 28px; font-weight: 700; margin-bottom: 16px; color: ${primaryColor}; }
                    h2 { font-size: 22px; font-weight: 600; margin-bottom: 14px; color: ${primaryColor}; }
                    h3 { font-size: 18px; font-weight: 600; margin-bottom: 10px; color: ${secondaryColor}; }
                    p { font-size: 14px; line-height: 1.7; margin-bottom: 12px; color: #333; }
                    ul, ol { margin-left: 24px; margin-bottom: 14px; }
                    li { margin-bottom: 6px; line-height: 1.6; }
                    
                    /* Tables */
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
                    th { background-color: ${primaryColor}; color: white; font-weight: 600; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    
                    /* Code blocks */
                    code { background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; }
                    pre { background-color: ${secondaryColor}; color: #e4e4e4; padding: 20px; border-radius: 8px; overflow-x: auto; margin-bottom: 20px; }
                    pre code { background: none; padding: 0; color: inherit; }
                    
                    /* Blockquote */
                    blockquote { border-left: 4px solid ${primaryColor}; padding-left: 20px; margin-left: 0; color: #555; font-style: italic; margin-bottom: 16px; }
                    
                    /* Footer */
                    .pdf-footer { 
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                        font-size: 11px;
                        color: #666;
                    }
                </style>
                
                <div class="pdf-container">
                    ${logoPath || headerText ? `
                        <div class="pdf-header">
                            ${logoPath ? `<img src="${logoPath}" alt="Logo" />` : ''}
                            ${headerText ? `<div class="pdf-header-text">${headerText}</div>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="pdf-content">
                        ${htmlContent}
                    </div>
                    
                    ${footerText ? `
                        <div class="pdf-footer">
                            ${footerText}
                        </div>
                    ` : ''}
                </div>
            `;

            const filename = template?.name
                ? `${template.name.toLowerCase().replace(/\s+/g, '-')}-document.pdf`
                : 'notes.pdf';

            const opt = {
                margin: [15, 15, 15, 15],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(container).save();
            toast.success("PDF exported successfully!");
        } catch (e) {
            console.error("PDF export failed", e);
            toast.error("PDF export failed. Downloading as Markdown instead.");
            // Fallback: export as Markdown
            try {
                const markdown = await editor.blocksToMarkdownLossy(editor.document);
                const blob = new Blob([markdown], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "notes.md";
                a.click();
                URL.revokeObjectURL(url);
            } catch (fallbackError) {
                console.error("Markdown fallback failed", fallbackError);
                toast.error("Export failed completely.");
            }
        } finally {
            setExporting(false);
        }
    };

    return (
        <MantineProvider theme={darkTheme} forceColorScheme="dark">
            <div className="flex flex-col h-full relative">
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={() => setShowExportModal(true)}
                        disabled={exporting}
                        className="flex items-center gap-x-2 px-3 py-1 bg-theme-bg-secondary hover:bg-theme-bg-primary border border-theme-border rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
