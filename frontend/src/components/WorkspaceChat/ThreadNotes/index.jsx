import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import WorkspaceThread from "@/models/workspaceThread";
import RichEditor from "./RichEditor";
import AICommandModal from "./AICommandModal";
import { NotePencil } from "@phosphor-icons/react";
import "./editor.css";

export default function ThreadNotes({ workspace }) {
    const { threadSlug } = useParams();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const editorRef = useRef(null);

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

                // Try to parse as JSON (TipTap format), otherwise treat as plain text
                if (fetchedNotes) {
                    try {
                        const parsed = JSON.parse(fetchedNotes);
                        setContent(parsed);
                    } catch {
                        // If not JSON, convert plain text to TipTap format
                        setContent({
                            type: "doc",
                            content: [
                                {
                                    type: "paragraph",
                                    content: fetchedNotes
                                        ? [{ type: "text", text: fetchedNotes }]
                                        : [],
                                },
                            ],
                        });
                    }
                } else {
                    setContent(null);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
                setContent(null);
            }
            setLoading(false);
        }

        fetchNotes();
    }, [workspace?.slug, threadSlug]);

    // Save notes to server
    const handleUpdate = useCallback(
        async (json) => {
            if (!workspace?.slug || !threadSlug) return;

            try {
                const jsonString = JSON.stringify(json);
                await WorkspaceThread.updateNotes(workspace.slug, threadSlug, jsonString);
            } catch (error) {
                console.error("Error saving notes:", error);
            }
        },
        [workspace?.slug, threadSlug]
    );

    // Handle AI command from slash menu or bubble menu
    const handleAICommand = useCallback(() => {
        setAiModalOpen(true);
    }, []);

    // Insert AI-generated text into editor
    const handleInsertAIText = useCallback((text) => {
        // For now, we'll append to the end. In a full implementation,
        // this would insert at the cursor position
        if (editorRef.current) {
            editorRef.current.commands.insertContent(text);
        }
    }, []);

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
        <div className="flex flex-col h-full">
            <RichEditor
                content={content}
                onUpdate={handleUpdate}
                onAICommand={handleAICommand}
                placeholder="Start typing or press '/' for commands..."
            />

            <AICommandModal
                isOpen={aiModalOpen}
                onClose={() => setAiModalOpen(false)}
                workspace={workspace}
                threadSlug={threadSlug}
                onInsertText={handleInsertAIText}
            />
        </div>
    );
}
