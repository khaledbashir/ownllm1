import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
    PaperPlaneTilt,
    Robot,
    ArrowClockwise,
    Globe,
    FileText,
    Camera,
    Play
} from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { marked } from "marked";
import DOMPurify from "dompurify";
import BlockSuiteEditor from "@/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor";

marked.setOptions({ breaks: true, gfm: true });

export default function TestLab() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: `## Welcome to Test Lab

I can automate browser testing and document the results.

**Capabilities:**
- Navigate to any URL
- Fill forms and click elements  
- Take screenshots and verify content
- **Auto-document:** I'll log everything to the document on the right.

**Try:**
\`\`\`
Go to google.com and screenshot
\`\`\``,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStep, setLoadingStep] = useState("");

    // Editor ref to stream content
    const editorRef = useRef(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (loading) {
            setLoadingProgress(0);
            const steps = [
                { progress: 15, step: "Connecting to browser..." },
                { progress: 35, step: "Navigating to page..." },
                { progress: 55, step: "Executing test steps..." },
                { progress: 75, step: "Capturing results..." },
                { progress: 90, step: "Documenting..." },
            ];
            let stepIndex = 0;
            const interval = setInterval(() => {
                if (stepIndex < steps.length) {
                    setLoadingProgress(steps[stepIndex].progress);
                    setLoadingStep(steps[stepIndex].step);
                    stepIndex++;
                }
            }, 800);
            return () => clearInterval(interval);
        } else {
            setLoadingProgress(100);
            setTimeout(() => setLoadingProgress(0), 300);
        }
    }, [loading]);

    // Initial setup of the doc
    useEffect(() => {
        if (editorRef.current && editorRef.current.insertMarkdown) {
            // Initialize with a title if empty?
            // editorRef.current.insertMarkdown("# Browser Test Report\n\n");
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            // 1. Add header to doc
            if (editorRef.current?.appendMarkdown) {
                await editorRef.current.appendMarkdown(`\n## Test: ${userMessage}\n*Started at ${new Date().toLocaleTimeString()}*\n`);
            }

            const response = await fetch("/api/v1/agent/test-lab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            let responseContent = data.message || "Test completed.";
            if (data.results?.summary) {
                responseContent += `\n\n**Results:** ${data.results.summary.passed}/${data.results.summary.total} steps passed (${data.results.summary.duration}ms)`;
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: responseContent },
            ]);

            // Stream results to Doc
            if (editorRef.current?.appendMarkdown) {
                let docLog = "";

                // Log steps
                if (data.results?.steps) {
                    docLog += "\n### Execution Log\n";
                    data.results.steps.forEach(step => {
                        docLog += `- [${step.success ? 'x' : ' '}] **${step.action}** ${step.selector ? `\`${step.selector}\`` : ''} (${step.duration || 0}ms)\n`;
                    });
                }

                // Log screenshots
                if (data.screenshots && data.screenshots.length > 0) {
                    docLog += "\n### Screenshots\n";
                    data.screenshots.forEach((screenshot, idx) => {
                        // We can't easily insert base64 images into BlockSuite via markdown yet unless supported.
                        // But wait, BlockSuite handles images via specialized blocks usually.
                        // For now, let's try inserting as a standard markdown image and see if parseMarkdownToBlocks handles it.
                        // If not, we might need a dedicated image insertion method later.
                        // Standard markdown: ![alt](url)
                        // Data URI might be too large for some parsers, but let's try.
                        docLog += `\n![Screenshot ${idx + 1}](data:image/png;base64,${screenshot})\n`;
                    });
                }

                // Log Summary
                if (data.results?.summary) {
                    docLog += `\n> **Summary:** ${data.results.success ? 'Passed' : 'Failed'} - ${data.results.summary.passed}/${data.results.summary.total} steps passed.\n`;
                }

                if (data.results?.errors && data.results.errors.length > 0) {
                    docLog += `\n**Errors:**\n\`\`\`\n${data.results.errors.join('\n')}\n\`\`\`\n`;
                }

                await editorRef.current.appendMarkdown(docLog);
            }

        } catch (error) {
            console.error("Test Lab error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `**Error:** ${error.message}` },
            ]);
            if (editorRef.current?.appendMarkdown) {
                await editorRef.current.appendMarkdown(`\n❌ **Error:** ${error.message}\n`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearDoc = () => {
        // Implement clear if needed, or just reload page
        // editorRef.current?.insertMarkdown("# New Report\n");
    };

    const renderMarkdown = (content) => {
        return { __html: DOMPurify.sanitize(marked.parse(content)) };
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                            <Globe size={20} className="text-white/70" weight="regular" />
                        </div>
                        <div>
                            <h1 className="text-lg font-medium text-white">Agent Canvas</h1>
                            <p className="text-xs text-white/40">Browser automation & Documentation</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                {loading && (
                    <div className="px-6 py-2 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/50">{loadingStep}</span>
                            <span className="text-xs text-white/30">{loadingProgress}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-white/30 to-white/50 rounded-full transition-all duration-500"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Chat */}
                    <div className="flex-1 flex flex-col min-w-0 max-w-[400px] border-r border-white/5">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                            <Robot size={16} className="text-white/50" />
                                        </div>
                                    )}
                                    <div className={`max-w-[90%] ${msg.role === "user" ? "bg-white/10 px-4 py-3 rounded-2xl rounded-tr-md" : ""}`}>
                                        {msg.role === "user" ? (
                                            <p className="text-sm text-white">{msg.content}</p>
                                        ) : (
                                            <div
                                                className="prose prose-invert prose-sm max-w-none prose-headings:text-white/90 prose-p:text-white/70 prose-code:text-white/80 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10"
                                                dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5 bg-theme-bg-secondary">
                            <div className="flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Instruct the agent..."
                                    rows={1}
                                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none resize-none"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="p-2 rounded-xl bg-white text-black disabled:opacity-30 hover:bg-white/90 transition-all"
                                >
                                    <PaperPlaneTilt size={18} weight="fill" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Universal Canvas (BlockSuite) */}
                    <div className="flex-1 flex flex-col bg-white/[0.02]">
                        <BlockSuiteEditor
                            ref={editorRef}
                            onSave={() => { }} // No auto-save to DB for temp lab yet
                            workspaceSlug="lab"
                            threadSlug="temp"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
