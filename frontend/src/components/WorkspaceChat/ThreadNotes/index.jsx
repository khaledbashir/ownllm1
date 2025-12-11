import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import WorkspaceThread from "@/models/workspaceThread";
import BlockEditor from "./BlockEditor";
import AICommandModal from "./AICommandModal";
import { NotePencil } from "@phosphor-icons/react";
import "./editor.css";

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
            <BlockEditor
                key={threadSlug}
                ref={editorRef}
                content={content}
                onSave={handleSave}
            />
            <AICommandModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onInsertText={handleInsertAI}
            />
        </div>
    );
}
