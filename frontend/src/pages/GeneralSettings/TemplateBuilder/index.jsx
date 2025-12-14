import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import { SandpackProvider, SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import { PaperPlaneTilt, Sparkle, FloppyDisk, Spinner, ArrowClockwise, Image as ImageIcon, CaretDown, FilePdf } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import PdfTemplates from "@/models/pdfTemplates";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

// Think tag regex patterns - flexible to handle mismatched tags
const THINK_REGEX_OPEN = /<(think|thinking|thought)\s*>/gi;
const THINK_REGEX_CLOSE = /<\/(think|thinking|thought)\s*>/gi;
// Matches any combo of think/thinking/thought open/close
const THINK_REGEX_COMPLETE = /<(think|thinking|thought)\s*>([\s\S]*?)<\/(think|thinking|thought)\s*>/gi;

// Default HTML template to start with
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
    .logo { font-size: 24px; font-weight: 700; color: #3b82f6; }
    .date { color: #64748b; font-size: 14px; }
    h1 { font-size: 32px; margin-bottom: 16px; color: #0f172a; }
    p { line-height: 1.6; color: #475569; margin-bottom: 16px; }
    .highlight { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 24px; border-radius: 8px; margin: 24px 0; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Your Company</div>
      <div class="date">{{date}}</div>
    </div>
    <h1>Welcome to Template Builder</h1>
    <p>Start chatting with AI to design your custom template. Describe what you need:</p>
    <div class="highlight">
      <p><strong>Try saying:</strong> "Create a proposal template for my web development agency with sections for services, pricing, and timeline."</p>
    </div>
    <p>The AI will generate beautiful, branded HTML that you can save and export as PDF.</p>
    <div class="footer">
      <p>&copy; 2024 Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

export default function TemplateBuilder() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [templateHtml, setTemplateHtml] = useState(DEFAULT_TEMPLATE);
    const [templateName, setTemplateName] = useState("");
    const [brandSettings, setBrandSettings] = useState(null);
    const [logoUrl, setLogoUrl] = useState("");
    const chatEndRef = useRef(null);
    const inputRef = useRef(null);

    // Load brand settings on mount
    useEffect(() => {
        loadBrandSettings();
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadBrandSettings = async () => {
        try {
            const templates = await PdfTemplates.list();
            const defaultBrand = templates.find((t) => t.isDefault);
            if (defaultBrand) {
                setBrandSettings(defaultBrand);
            }
        } catch (e) {
            console.error("Failed to load brand settings:", e);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            // Get auth token
            const AUTH_TOKEN = localStorage.getItem("anythingllm_authToken");

            // Call our template generation endpoint
            const response = await fetch("/api/templates/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : undefined,
                },
                body: JSON.stringify({
                    messages: [
                        ...messages.map((m) => ({ role: m.role, content: m.content })),
                        { role: "user", content: userMessage },
                    ],
                    brandContext: {
                        ...brandSettings,
                        logoPath: logoUrl || brandSettings?.logoPath || null,
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to get AI response");
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to generate template");
            }

            // Update template if HTML was extracted
            if (data.templateHtml) {
                setTemplateHtml(data.templateHtml);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "✨ Template updated! Check the preview on the right." },
                ]);
            } else {
                // Show AI message if no HTML extracted
                setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
            }
        } catch (e) {
            console.error("Chat error:", e);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${e.message}. Make sure your LLM is configured in Settings.` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            showToast("Please enter a template name", "error");
            return;
        }

        setSaving(true);

        // Timeout
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Save timed out. Please try again.")), 8000)
        );

        try {
            const apiCall = PdfTemplates.create({
                name: templateName,
                logoPath: logoUrl || brandSettings?.logoPath || "",
                primaryColor: brandSettings?.primaryColor || "#3b82f6",
                secondaryColor: brandSettings?.secondaryColor || "#1e293b",
                fontFamily: brandSettings?.fontFamily || "Inter",
                cssOverrides: templateHtml,
                isDefault: false,
            });

            const res = await Promise.race([apiCall, timeout]);

            // Check for success in any form
            if (res && (res.success !== false || res.template)) {
                showToast(`Template "${templateName}" saved!`, "success");
                setTemplateName("");
            } else {
                showToast(res?.error || "Save failed. Check console for details.", "error");
            }
        } catch (e) {
            console.error("[TemplateBuilder] Save error:", e);
            showToast(e.message || "Error saving template", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleExportPdf = async () => {
        if (exporting || templateHtml === DEFAULT_TEMPLATE) return;
        setExporting(true);

        try {
            const AUTH_TOKEN = localStorage.getItem("anythingllm_authToken");
            const response = await fetch("/api/templates/export-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : undefined,
                },
                body: JSON.stringify({
                    html: templateHtml,
                    filename: templateName || "template",
                }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Failed to export PDF");
            }

            // Download the PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${templateName || "template"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast("PDF exported successfully!", "success");
        } catch (e) {
            showToast(e.message || "Error exporting PDF", "error");
        } finally {
            setExporting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-theme-sidebar-border">
                    <div>
                        <h1 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
                            <Sparkle size={24} className="text-yellow-400" />
                            AI Template Builder
                        </h1>
                        <p className="text-sm text-theme-text-secondary mt-1">
                            Chat with AI to design beautiful document templates
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Template name..."
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="bg-theme-bg-primary border border-theme-border-primary rounded-lg px-3 py-2 text-sm text-white w-36"
                        />
                        <div className="flex items-center gap-1 bg-theme-bg-primary border border-theme-border-primary rounded-lg px-2 py-2">
                            <ImageIcon size={16} className="text-theme-text-secondary" />
                            <input
                                type="text"
                                placeholder="Logo URL..."
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                className="bg-transparent text-sm text-white w-32 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSaveTemplate}
                            disabled={saving || !templateName.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <Spinner className="w-4 h-4 animate-spin" />
                            ) : (
                                <FloppyDisk size={18} />
                            )}
                            Save
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={exporting || templateHtml === DEFAULT_TEMPLATE}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {exporting ? (
                                <Spinner className="w-4 h-4 animate-spin" />
                            ) : (
                                <FilePdf size={18} />
                            )}
                            PDF
                        </button>
                    </div>
                </div>

                {/* Main Content - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Chat */}
                    <div className="w-1/2 flex flex-col border-r border-theme-sidebar-border">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-12 text-theme-text-secondary">
                                    <Sparkle size={48} className="mx-auto mb-4 text-yellow-400/50" />
                                    <p className="text-lg font-medium">Start designing your template</p>
                                    <p className="text-sm mt-2">
                                        Describe what you need and AI will create it for you.
                                    </p>
                                    <div className="mt-6 space-y-2 text-sm">
                                        <p className="text-theme-text-primary">💡 Try these prompts:</p>
                                        <button
                                            onClick={() => setInput("Create a professional proposal template for a web development agency")}
                                            className="block w-full text-left px-4 py-2 bg-theme-bg-primary rounded-lg hover:bg-theme-bg-secondary transition-colors"
                                        >
                                            "Create a proposal template for a web agency"
                                        </button>
                                        <button
                                            onClick={() => setInput("Design an invoice template with a modern, minimal style")}
                                            className="block w-full text-left px-4 py-2 bg-theme-bg-primary rounded-lg hover:bg-theme-bg-secondary transition-colors"
                                        >
                                            "Design a modern invoice template"
                                        </button>
                                        <button
                                            onClick={() => setInput("Create a quote template for a marketing consultant")}
                                            className="block w-full text-left px-4 py-2 bg-theme-bg-primary rounded-lg hover:bg-theme-bg-secondary transition-colors"
                                        >
                                            "Create a quote template for consultants"
                                        </button>
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl ${msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-theme-bg-primary text-theme-text-primary"
                                            }`}
                                    >
                                        <MessageContent content={msg.content} role={msg.role} />
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-theme-bg-primary text-theme-text-primary px-4 py-3 rounded-2xl flex items-center gap-2">
                                        <Spinner className="w-4 h-4 animate-spin" />
                                        Generating template...
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-theme-sidebar-border">
                            <div className="flex gap-2">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe your template or request changes..."
                                    rows={2}
                                    className="flex-1 bg-theme-bg-primary border border-theme-border-primary rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PaperPlaneTilt size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="w-1/2 flex flex-col bg-theme-bg-primary">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-theme-sidebar-border">
                            <span className="text-sm font-medium text-theme-text-secondary">Live Preview</span>
                            <button
                                onClick={() => setTemplateHtml(DEFAULT_TEMPLATE)}
                                className="flex items-center gap-1 text-xs text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                            >
                                <ArrowClockwise size={14} />
                                Reset
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <SandpackProvider
                                template="static"
                                theme="dark"
                                files={{
                                    "/index.html": templateHtml,
                                }}
                            >
                                <SandpackLayout>
                                    <SandpackPreview
                                        showNavigator={false}
                                        showRefreshButton={true}
                                        style={{ height: "100%", minHeight: "500px" }}
                                    />
                                </SandpackLayout>
                            </SandpackProvider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Message content component with think tag accordion and markdown
function MessageContent({ content, role }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content) return null;

    // User messages render as plain text
    if (role === "user") {
        return <span>{content}</span>;
    }

    // Extract thinking content - reset regex (global flag issue)
    let thoughtContent = null;
    let mainContent = content;

    // Simple approach: find first opening and last closing tag
    const openMatch = content.match(/<(think|thinking|thought)\s*>/i);
    const closeMatch = content.match(/<\/(think|thinking|thought)\s*>/i);

    if (openMatch && closeMatch) {
        const openIndex = content.indexOf(openMatch[0]);
        const closeIndex = content.indexOf(closeMatch[0]) + closeMatch[0].length;

        // Extract the thinking block
        thoughtContent = content.substring(openIndex, closeIndex);
        // Remove thinking block from main content
        mainContent = (content.substring(0, openIndex) + content.substring(closeIndex)).trim();
    }

    // Strip tags from thought content for display
    const strippedThought = thoughtContent
        ?.replace(/<(think|thinking|thought)\s*>/gi, "")
        ?.replace(/<\/(think|thinking|thought)\s*>/gi, "")
        ?.trim();

    return (
        <div className="space-y-2">
            {/* Think Accordion */}
            {strippedThought && (
                <div className="bg-theme-bg-secondary rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-container transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-yellow-400">💭</span>
                            <span className="font-medium">AI Thinking</span>
                        </span>
                        <CaretDown
                            size={16}
                            className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                    </button>
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                            }`}
                    >
                        <div className="px-3 pb-3 text-sm text-theme-text-secondary prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {strippedThought}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content with Markdown */}
            {mainContent && (
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            table: ({ node, ...props }) => (
                                <table className="min-w-full border border-theme-sidebar-border" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                                <th className="border border-theme-sidebar-border px-2 py-1 bg-theme-bg-secondary" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="border border-theme-sidebar-border px-2 py-1" {...props} />
                            ),
                            code: ({ node, inline, ...props }) => (
                                inline
                                    ? <code className="bg-theme-bg-secondary px-1 rounded" {...props} />
                                    : <code className="block bg-theme-bg-secondary p-2 rounded overflow-x-auto" {...props} />
                            ),
                        }}
                    >
                        {mainContent}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}
