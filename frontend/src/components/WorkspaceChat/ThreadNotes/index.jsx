import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import WorkspaceThread from "@/models/workspaceThread";
import AICommandModal from "./AICommandModal";
import { NotePencil, WarningCircle } from "@phosphor-icons/react";
import "./editor.css";

// Lazy load BlockSuiteEditor to isolate any initialization errors
const BlockEditor = React.lazy(() => import("./BlockSuiteEditor"));

// Error boundary to catch BlockNote crashes
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
        <div className="flex-1 overflow-hidden relative">
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
    );
}

