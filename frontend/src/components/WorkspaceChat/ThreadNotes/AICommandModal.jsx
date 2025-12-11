import React, { useState, useRef, useEffect } from "react";
import { Sparkle, X, PaperPlaneTilt, CircleNotch } from "@phosphor-icons/react";
import WorkspaceThread from "@/models/workspaceThread";

const AI_SUGGESTIONS = [
    "Write a summary of my notes",
    "Create a table comparing...",
    "Generate 5 action items",
    "Expand on this idea",
    "Make this more concise",
    "Fix grammar and spelling",
];

export default function AICommandModal({
    isOpen,
    onClose,
    workspace,
    threadSlug,
    onInsertText,
}) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setResult("");

        try {
            // For now, we'll use a simple approach
            // In a full implementation, this would stream from the AI
            // Here we show a placeholder that you can enhance later

            // Simulate AI response (replace with actual AI integration)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const mockResponse = `## AI Generated Content

Based on your request: "${prompt}"

Here's what I generated:

- This is a placeholder response
- In the full implementation, this would connect to AnythingLLM's AI
- The AI would have access to your thread context and notes

**Next steps:**
1. Connect this to the workspace chat API
2. Stream the response in real-time
3. Allow editing before inserting`;

            setResult(mockResponse);
        } catch (error) {
            console.error("AI error:", error);
            setResult("Error: Failed to generate content. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInsert = () => {
        if (result) {
            onInsertText?.(result);
            handleClose();
        }
    };

    const handleClose = () => {
        setPrompt("");
        setResult("");
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-4 bg-theme-bg-secondary border border-theme-sidebar-border rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-theme-sidebar-border">
                    <div className="flex items-center gap-2 text-theme-text-primary">
                        <Sparkle size={20} weight="fill" className="text-purple-400" />
                        <span className="font-medium">Ask AI</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Prompt Input */}
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="What would you like the AI to write?"
                                className="flex-1 px-4 py-2 bg-theme-bg-container border border-theme-sidebar-border rounded-lg text-theme-text-primary placeholder-theme-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={!prompt.trim() || loading}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {loading ? (
                                    <CircleNotch size={18} className="animate-spin" />
                                ) : (
                                    <PaperPlaneTilt size={18} weight="fill" />
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Suggestions */}
                    {!result && !loading && (
                        <div className="mb-4">
                            <p className="text-xs text-theme-text-secondary mb-2">
                                Suggestions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {AI_SUGGESTIONS.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setPrompt(suggestion)}
                                        className="px-3 py-1.5 text-xs bg-theme-bg-container border border-theme-sidebar-border rounded-full text-theme-text-secondary hover:text-theme-text-primary hover:border-purple-500/50 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-3 text-theme-text-secondary">
                                <CircleNotch size={24} className="animate-spin text-purple-400" />
                                <span>Generating content...</span>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="border border-theme-sidebar-border rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-theme-bg-container border-b border-theme-sidebar-border">
                                <span className="text-xs text-theme-text-secondary">
                                    Generated Content
                                </span>
                            </div>
                            <div className="p-4 max-h-64 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-theme-text-primary font-sans">
                                    {result}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-theme-sidebar-border bg-theme-bg-container">
                        <button
                            onClick={() => setResult("")}
                            className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleInsert}
                            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            Insert into Notes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
