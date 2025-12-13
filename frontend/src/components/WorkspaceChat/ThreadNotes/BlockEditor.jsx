import { useCreateBlockNote, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@mantine/core/styles.css";
import { FilePdf, CircleNotch, Package } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";
import debounce from "lodash.debounce";
import { toast } from "react-toastify";
import ExportPdfModal from "./ExportPdfModal";
import "./editor.css";
import "./editor-fixes.css";

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

const BlockEditor = forwardRef(({ content, onSave, workspaceSlug }, ref) => {
    const [exporting, setExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Safe Content Loading Logic
    const initialContent = useMemo(() => {
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

    // Initialize editor with all default features
    const editor = useCreateBlockNote({
        initialContent: initialContent,
    });

    // Auto-save debounce
    const debouncedSave = useMemo(
        () => debounce((newBlocks) => {
            onSave(JSON.stringify(newBlocks));
        }, 1000),
        [onSave]
    );

    const onChange = useCallback(() => {
        const newBlocks = editor.document;
        debouncedSave(newBlocks);
    }, [editor, debouncedSave]);

    // AI Insertion handler
    useImperativeHandle(ref, () => ({
        insertMarkdown: async (markdown) => {
            try {
                const blocks = await editor.tryParseMarkdownToBlocks(markdown);
                const currentBlock = editor.getTextCursorPosition().block;
                editor.insertBlocks(blocks, currentBlock, "after");
            } catch (e) {
                console.error("Failed to insert markdown:", e);
            }
        },
        getEditor: () => editor,
    }));

    // Export Handler
    const handleExport = async (template) => {
        if (!workspaceSlug) {
            toast.error("Workspace context missing.");
            return;
        }

        setExporting(true);
        try {
            const htmlContent = await editor.blocksToHTMLLossy(editor.document);

            const primaryColor = template?.primaryColor || "#3b82f6";
            const fontFamily = template?.fontFamily || "Inter";
            const headerText = escapeHtml(template?.headerText || "");
            const footerText = escapeHtml(template?.footerText || "");
            const logoPath = safeImageSrc(template?.logoPath || "");

            container.innerHTML = `
                <head>
                    <meta charset="UTF-8">
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    * { box-sizing: border-box; }
                    body { font-family: '${fontFamily}', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .pdf-container { padding: 40px; max-width: 100%; }
                    
                    /* Branding */
                    h1 { font-size: 28px; color: ${primaryColor}; margin-bottom: 0.5em; font-weight: 700; }
                    h2 { font-size: 22px; color: ${primaryColor}; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
                    h3 { font-size: 18px; color: ${primaryColor}; margin-top: 1.2em; margin-bottom: 0.5em; font-weight: 600; }
                    
                    p { font-size: 14px; line-height: 1.6; margin-bottom: 1em; color: #1f2937; }
                    ul, ol { margin-left: 20px; margin-bottom: 1em; }
                    li { margin-bottom: 0.5em; }
                    
                    /* Tables - Page Break Handling */
                    table { 
                        border-collapse: collapse; 
                        width: 100%; 
                        margin: 20px 0; 
                        page-break-inside: auto;
                    }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    
                    th, td { 
                        border: 1px solid #e5e7eb; 
                        padding: 12px; 
                        text-align: left; 
                        font-size: 14px;
                    }
                    th { 
                        background-color: ${primaryColor} !important; 
                        color: white !important; 
                        font-weight: 600;
                    }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    
                    /* Code Blocks */
                    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
                    pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 1em; }
                    
                    /* Quotes */
                    blockquote { border-left: 4px solid ${primaryColor}; padding-left: 16px; color: #4b5563; font-style: italic; margin: 1.5em 0; }
                    
                    /* Images */
                    img { max-width: 100%; height: auto; display: block; margin: 1em 0; }
                </style>
                <body class="pdf-container">
                    ${logoPath ? `<img src="${logoPath}" style="max-height:80px;margin-bottom:30px;" />` : ''}
                    ${headerText ? `<div style="margin-bottom:30px;font-size:18px;font-weight:500;color:${primaryColor};border-bottom:2px solid ${primaryColor};padding-bottom:10px;">${headerText}</div>` : ''}
                    
                    <div class="content">
                        ${htmlContent}
                    </div>

                    ${footerText ? `
                        <div style="margin-top:50px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;display:flex;justify-content:space-between;">
                            <span>${footerText}</span>
                            <span>Page <span class="pageNumber"></span></span>
                        </div>
                    ` : ''}
                </body>
            `;

            // Server-side PDF generation
            const response = await fetch(`${API_BASE}/workspace/${workspaceSlug}/export-pdf`, {
                method: "POST",
                headers: {
                    ...baseHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ html: container.outerHTML })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Server export failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = template?.name ? `${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf` : 'notes.pdf';
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

    // Slash Menu Items
    const getCustomSlashMenuItems = useCallback((editor) => {
        const insertProductsItem = {
            name: "Insert Products",
            aliases: ["products", "pricing", "table"],
            group: "Workspace",
            icon: <Package size={18} />,
            hint: "Insert a table of workspace products",
            execute: async (editor) => {
                if (!workspaceSlug) {
                    toast.error("Workspace context missing.");
                    return;
                }

                const toastId = toast.info("Fetching products...", { autoClose: false });
                try {
                    const workspace = await Workspace.bySlug(workspaceSlug);
                    if (!workspace?.products) {
                        toast.update(toastId, { render: "No products found.", type: "info", autoClose: 2000 });
                        return;
                    }

                    let products = [];
                    try {
                        products = JSON.parse(workspace.products);
                    } catch { }

                    if (products.length === 0) {
                        toast.update(toastId, { render: "No products defined.", type: "info", autoClose: 2000 });
                        return;
                    }

                    // Create Markdown Table
                    let md = "| Product | Category | Price | Type |\n| :--- | :--- | :--- | :--- |\n";
                    products.forEach(p => {
                        md += `| ${p.name} | ${p.category} | $${p.price.toLocaleString()} | ${p.pricingType} |\n`;
                    });

                    // Insert blocks
                    const blocks = await editor.tryParseMarkdownToBlocks(md);
                    editor.insertBlocks(blocks, editor.getTextCursorPosition().block, "after");
                    toast.dismiss(toastId);
                } catch (e) {
                    console.error(e);
                    toast.update(toastId, { render: "Failed to insert products.", type: "error", autoClose: 2000 });
                }
            },
        };

        const insertDividerItem = {
            name: "Divider",
            aliases: ["line", "hr", "separator"],
            group: "Basic Blocks",
            icon: <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>—</div>,
            hint: "Insert a horizontal rule",
            execute: async (editor) => {
                const currentBlock = editor.getTextCursorPosition().block;
                // Insert a markdown horizontal rule
                const blocks = await editor.tryParseMarkdownToBlocks("---");
                editor.insertBlocks(blocks, currentBlock, "after");
            }
        };

        return [
            insertProductsItem,
            insertDividerItem,
            ...getDefaultReactSlashMenuItems(editor.schema),
        ];
    }, []);

    return (
        <>
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
                <div className="flex-1 overflow-y-auto bg-theme-bg-secondary blocknote-dark-wrapper" style={{ minHeight: '100%' }}>
                    <BlockNoteView
                        editor={editor}
                        slashMenuItems={getCustomSlashMenuItems(editor)}
                        onChange={onChange}
                        theme="dark"
                        className="blocknote-editor-full"
                    />
                </div>
            </div>
            <ExportPdfModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExport}
            />
        </>
    );
});

export default BlockEditor;

