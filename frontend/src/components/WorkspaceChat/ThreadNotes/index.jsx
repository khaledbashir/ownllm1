import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import WorkspaceThread from "@/models/workspaceThread";
import AICommandModal from "./AICommandModal";
import MultiScopeSowModal from "./MultiScopeSowModal";
import { NotePencil, WarningCircle, CaretDown, FileText, MagicWand } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { EditorProvider, useEditorContext } from "./EditorContext";
import { DOC_TEMPLATES } from "./BlockSuiteEditor";
import "./editor.css";

// Lazy load BlockSuite editor to isolate any initialization errors
const BlockEditor = React.lazy(() => import("./BlockSuiteEditor"));

// Error boundary to catch Editor crashes
class BlockEditorErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[BlockEditor Error]", error);
        console.error("[BlockEditor ErrorInfo]", errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-theme-text-secondary p-8">
                    <WarningCircle size={48} className="mb-4 text-red-400" />
                    <p className="text-center text-red-400 font-medium mb-2">
                        Notes Editor Failed to Load
                    </p>
                    <p className="text-center text-sm opacity-75 max-w-md">
                        There was an error initializing the notes editor. This is a known issue being investigated.
                    </p>
                    <pre className="mt-4 p-4 bg-theme-bg-primary rounded text-xs text-red-300 max-w-lg overflow-auto">
                        {this.state.error?.message || "Unknown error"}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function ThreadNotes({ workspace, editorRef: externalEditorRef }) {
    const { threadSlug } = useParams();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [smartActionLoading, setSmartActionLoading] = useState(null);

    // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
    const internalEditorRef = useRef(null);
    // Use external ref if provided, otherwise use internal
    const editorRef = externalEditorRef || internalEditorRef;
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isMultiScopeModalOpen, setIsMultiScopeModalOpen] = useState(false);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const templateMenuRef = useRef(null);

    // Close template menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (templateMenuRef.current && !templateMenuRef.current.contains(e.target)) {
                setShowTemplateMenu(false);
            }
        };
        if (showTemplateMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showTemplateMenu]);

    const handleLoadTemplate = useCallback((templateKey) => {
        if (editorRef.current?.loadTemplate) {
            editorRef.current.loadTemplate(templateKey);
        } else {
            showToast("Editor not ready", "error");
        }
        setShowTemplateMenu(false);
    }, [editorRef]);

    const handleInsertAI = useCallback((text) => {
        if (editorRef.current) {
            editorRef.current.insertMarkdown(text);
        }
    }, [editorRef]);

    const runSmartAction = useCallback(async (action, options = {}) => {
        if (!workspace?.slug || !threadSlug) return;
        if (!editorRef.current) {
            showToast("Notes editor is not ready yet.", "error");
            return;
        }

        setSmartActionLoading(action);
        try {
            const res = await WorkspaceThread.smartAction(workspace.slug, threadSlug, action, options);
            if (!res?.success) {
                showToast(res?.error || "Smart action failed.", "error");
                return;
            }

            const markdown = String(res?.markdown || "").trim();
            if (!markdown) {
                showToast("Smart action returned empty output.", "error");
                return;
            }

            editorRef.current.insertMarkdown(`\n\n${markdown}\n`);

            // If the markdown contains pricing tables, BlockSuiteEditor.insertMarkdown will convert them
            // into interactive pricing blocks automatically. Only insert the structured pricing payload
            // as a fallback when the markdown contains no pipe tables.
            const markdownHasPipeTable = /\n\s*\|.*\|\s*\n\s*\|\s*[-:|\s]+\|/m.test(markdown);
            if (
                action === "draft_sow" &&
                res?.pricingTable &&
                editorRef.current?.insertPricingTableWithData &&
                !markdownHasPipeTable
            ) {
                editorRef.current.insertPricingTableWithData(res.pricingTable);
            }

            showToast("Inserted into notes.", "success");
        } catch (e) {
            showToast(e?.message || "Smart action failed.", "error");
        } finally {
            setSmartActionLoading(null);
        }
    }, [workspace?.slug, threadSlug, editorRef]);

    const runMultiScopeSow = useCallback(async ({ targetAfterDiscountExGst, discountPercent } = {}) => {
        setIsMultiScopeModalOpen(false);
        return runSmartAction("multi_scope_sow", { targetAfterDiscountExGst, discountPercent });
    }, [runSmartAction]);

    // Fetch notes on mount or thread change
    useEffect(() => {
        async function fetchNotes() {
            if (!workspace?.slug || !threadSlug) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const fetchedNotes = await WorkspaceThread.getNotes(
                    workspace.slug,
                    threadSlug
                );
                setContent(fetchedNotes || null);
            } catch (error) {
                console.error("Error fetching notes:", error);
                setContent(null);
            }
            setLoading(false);
        }

        fetchNotes();
    }, [workspace?.slug, threadSlug]);

    // Save notes to server
    const handleSave = useCallback(
        async (jsonString) => {
            if (!workspace?.slug || !threadSlug) return;
            try {
                await WorkspaceThread.updateNotes(workspace.slug, threadSlug, jsonString);
            } catch (error) {
                console.error("Error saving notes:", error);
            }
        },
        [workspace?.slug, threadSlug]
    );

    // Conditional returns AFTER all hooks
    if (!threadSlug) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-theme-text-secondary p-8">
                <NotePencil size={48} className="mb-4 opacity-50" />
                <p className="text-center">
                    Select a thread to view and edit notes.
                    <br />
                    <span className="text-sm opacity-75">
                        Notes are saved per-thread and can be used as context for your AI
                        conversations.
                    </span>
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-theme-text-secondary">
                    Loading notes...
                </div>
            </div>
        );
    }

    return (
        <EditorProvider>
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="sticky top-0 z-30 bg-theme-bg-secondary border-b border-theme-sidebar-border flex items-center justify-between gap-x-2 px-3 py-2">
                    <div className="flex items-center gap-x-3">
                        <div className="text-sm font-semibold text-white">
                            Actions
                        </div>
                        {/* Template Picker Dropdown */}
                        <button
                            type="button"
                            onClick={() => runSmartAction("draft_sow")}
                            disabled={smartActionLoading === "draft_sow"}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                            title="Generate a SOW + interactive pricing table"
                        >
                            <MagicWand size={16} />
                            {smartActionLoading === "draft_sow" ? "Drafting..." : "Draft SOW"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsMultiScopeModalOpen(true)}
                            disabled={smartActionLoading === "multi_scope_sow"}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/70 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
                            title="Generate Lean/Standard/Premium SOW options with pricing"
                        >
                            <MagicWand size={16} />
                            {smartActionLoading === "multi_scope_sow" ? "Drafting..." : "Multi-Scope SOW"}
                        </button>

                        <div className="relative" ref={templateMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
                            >
                                <FileText size={16} />
                                Templates
                                <CaretDown size={14} className={`transition-transform ${showTemplateMenu ? "rotate-180" : ""}`} />
                            </button>
                            {showTemplateMenu && (
                                <div className="absolute left-0 top-full mt-1 w-48 bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg shadow-xl z-50 overflow-hidden">
                                    {Object.entries(DOC_TEMPLATES).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleLoadTemplate(key)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-theme-bg-container transition-colors text-left"
                                        >
                                            <span>{template.icon}</span>
                                            <span>{template.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <BlockEditorErrorBoundary>
                    <Suspense fallback={
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-pulse text-theme-text-secondary">
                                Loading editor...
                            </div>
                        </div>
                    }>
                        <BlockEditor
                            key={threadSlug}
                            ref={editorRef}
                            content={content}
                            onSave={handleSave}
                            workspaceSlug={workspace?.slug}
                            threadSlug={threadSlug}
                        />
                    </Suspense>
                </BlockEditorErrorBoundary>
                <AICommandModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onInsertText={handleInsertAI}
                />

                <MultiScopeSowModal
                    isOpen={isMultiScopeModalOpen}
                    onClose={() => setIsMultiScopeModalOpen(false)}
                    onSubmit={runMultiScopeSow}
                    loading={smartActionLoading === "multi_scope_sow"}
                    defaultBudget="22000"
                    defaultDiscountPercent="5"
                />
            </div>
        </EditorProvider>
    );
}

