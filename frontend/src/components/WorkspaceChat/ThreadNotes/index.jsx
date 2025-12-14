import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import WorkspaceThread from "@/models/workspaceThread";
import AICommandModal from "./AICommandModal";
import { NotePencil, WarningCircle } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { EditorProvider, useEditorContext } from "./EditorContext";
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

    const handleInsertAI = useCallback((text) => {
        if (editorRef.current) {
            editorRef.current.insertMarkdown(text);
        }
    }, [editorRef]);

    const runSmartAction = useCallback(async (action) => {
        if (!workspace?.slug || !threadSlug) return;
        if (!editorRef.current) {
            showToast("Notes editor is not ready yet.", "error");
            return;
        }

        setSmartActionLoading(action);
        try {
            const res = await WorkspaceThread.smartAction(workspace.slug, threadSlug, action);
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
            showToast("Inserted into notes.", "success");
        } catch (e) {
            showToast(e?.message || "Smart action failed.", "error");
        } finally {
            setSmartActionLoading(null);
        }
    }, [workspace?.slug, threadSlug, editorRef]);

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
                <div className="sticky top-0 z-10 bg-theme-bg-secondary border-b border-theme-sidebar-border flex items-center justify-between gap-x-2 px-3 py-2">
                    <div className="text-sm font-semibold text-white">
                        Smart Actions
                    </div>
                    <div className="flex items-center gap-x-2">
                        <button
                            type="button"
                            disabled={!!smartActionLoading}
                            onClick={() => runSmartAction("meeting_notes")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {smartActionLoading === "meeting_notes" ? "Working..." : "Meeting Notes"}
                        </button>
                        <button
                            type="button"
                            disabled={!!smartActionLoading}
                            onClick={() => runSmartAction("draft_proposal")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {smartActionLoading === "draft_proposal" ? "Working..." : "Draft Proposal"}
                        </button>
                        <button
                            type="button"
                            disabled={!!smartActionLoading}
                            onClick={() => runSmartAction("quick_quote")}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {smartActionLoading === "quick_quote" ? "Working..." : "Quick Quote"}
                        </button>
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
                        />
                    </Suspense>
                </BlockEditorErrorBoundary>
                <AICommandModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    onInsertText={handleInsertAI}
                />
            </div>
        </EditorProvider>
    );
}

