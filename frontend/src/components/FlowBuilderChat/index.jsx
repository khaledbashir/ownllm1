import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    ChatCircle,
    X,
    PaperPlaneTilt,
    Robot,
    SpinnerGap,
    Trash,
    ArrowsOutSimple,
    ArrowsInSimple
} from "@phosphor-icons/react";
import FlowGenerator from "@/models/flowGenerator";
import showToast from "@/utils/toast";
import ResizableHandle from "./components/ResizableHandle";
import ThinkingAccordion from "./components/ThinkingAccordion";
import ModelSelector from "./components/ModelSelector";
import AttachmentButton from "./components/AttachmentButton";
import renderMarkdown from "@/utils/chat/markdown";

const STORAGE_KEY_WIDTH = "flowBuilderChatWidth";
const STORAGE_KEY_EXPANDED = "flowBuilderChatExpanded";
const MIN_WIDTH = 380;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 420;

/**
 * Parse thinking content from message
 */
function parseThinking(content) {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch ? thinkMatch[1].trim() : null;
    const mainContent = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return { thinking, mainContent };
}

/**
 * Message bubble component with markdown rendering
 */
function MessageBubble({ message, onApplyFlow }) {
    const isUser = message.role === "user";
    const { thinking, mainContent } = parseThinking(message.content);

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}>
            <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${isUser
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/20"
                        : "bg-white/10 backdrop-blur-sm text-white/90 rounded-bl-md border border-white/5"
                    }`}
            >
                {/* Thinking accordion for assistant messages */}
                {!isUser && thinking && (
                    <ThinkingAccordion content={thinking} />
                )}

                {/* Main content with markdown */}
                <div
                    className="text-sm prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-black/30 prose-pre:rounded-lg prose-code:text-blue-300"
                    dangerouslySetInnerHTML={{
                        __html: renderMarkdown(mainContent || message.content)
                    }}
                />

                {/* Attachments for user messages */}
                {isUser && message.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/20">
                        {message.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-1 text-xs text-white/70">
                                {att.preview ? (
                                    <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                    <span className="px-2 py-0.5 bg-white/10 rounded">{att.name}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Apply Flow Button */}
                {message.flow && (
                    <button
                        onClick={() => onApplyFlow(message.flow)}
                        className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 flex items-center justify-center gap-2"
                    >
                        <span>✨</span> Apply This Flow
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Loading indicator with animated dots
 */
function LoadingIndicator() {
    return (
        <div className="flex justify-start animate-in fade-in-0 duration-300">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
                <div className="flex items-center gap-2">
                    <SpinnerGap size={18} className="text-blue-400 animate-spin" />
                    <span className="text-sm text-white/60">Thinking</span>
                    <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Empty state with suggestions
 */
function EmptyState() {
    const suggestions = [
        "Monitor my website and alert me on Slack if it goes down",
        "Scrape product prices daily and store in a spreadsheet",
        "Process emails and create Notion tasks automatically",
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <Robot size={32} weight="fill" className="text-blue-400" />
            </div>
            <h3 className="text-white font-medium mb-1">AI Flow Builder</h3>
            <p className="text-white/40 text-sm mb-6 max-w-[250px]">
                Describe what you want to automate and I'll build the flow for you.
            </p>
            <div className="w-full space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">Try saying:</p>
                {suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        className="w-full text-left text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
                    >
                        "{suggestion}"
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function FlowBuilderChat({ onFlowGenerated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_EXPANDED);
        return stored === "true";
    });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [panelWidth, setPanelWidth] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY_WIDTH);
        return stored ? parseInt(stored, 10) : DEFAULT_WIDTH;
    });

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isOpen && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isOpen]);

    const handleResize = useCallback((newWidth) => {
        setPanelWidth(newWidth);
        localStorage.setItem(STORAGE_KEY_WIDTH, newWidth.toString());
    }, []);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => {
            const newValue = !prev;
            localStorage.setItem(STORAGE_KEY_EXPANDED, newValue.toString());
            return newValue;
        });
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            role: "user",
            content: input.trim(),
            attachments: [...attachments]
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setAttachments([]);
        setLoading(true);

        try {
            const response = await FlowGenerator.generate(
                newMessages.map(m => ({ role: m.role, content: m.content })),
                selectedModel,
                attachments
            );

            if (response.success) {
                const assistantMessage = {
                    role: "assistant",
                    content: response.message,
                    flow: response.flow || null
                };
                setMessages([...newMessages, assistantMessage]);

                if (response.flow) {
                    showToast("Flow generated! Click 'Apply Flow' to use it.", "success");
                }
            } else {
                showToast(response.error || "Failed to get response", "error");
            }
        } catch (e) {
            console.error("Flow generation error:", e);
            showToast("Error communicating with AI", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFlow = (flow) => {
        if (onFlowGenerated && flow) {
            onFlowGenerated(flow);
            showToast("Flow applied to builder!", "success");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setAttachments([]);
    };

    const handleAttach = (newAttachments) => {
        setAttachments(prev => [...prev, ...newAttachments]);
    };

    const handleRemoveAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    // Dynamic sizing
    const panelHeight = isExpanded ? "85vh" : "550px";
    const actualWidth = isExpanded ? Math.min(panelWidth * 1.3, MAX_WIDTH) : panelWidth;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                    title="AI Flow Builder"
                >
                    <Robot size={28} weight="fill" className="text-white group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a2e] animate-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    style={{
                        width: actualWidth,
                        height: panelHeight,
                    }}
                    className="fixed bottom-6 right-6 z-50 bg-gradient-to-b from-[#1e1e2f] to-[#151521] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
                >
                    {/* Resize Handle */}
                    <ResizableHandle
                        onResize={handleResize}
                        position="left"
                        minWidth={MIN_WIDTH}
                        maxWidth={MAX_WIDTH}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-purple-600/10 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Robot size={20} weight="fill" className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">AI Flow Builder</h3>
                                <p className="text-white/40 text-xs">Powered by AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                            />
                            <button
                                onClick={toggleExpanded}
                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? <ArrowsInSimple size={16} /> : <ArrowsOutSimple size={16} />}
                            </button>
                            <button
                                onClick={clearChat}
                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                title="Clear chat"
                            >
                                <Trash size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {messages.length === 0 ? (
                            <EmptyState />
                        ) : (
                            messages.map((msg, idx) => (
                                <MessageBubble
                                    key={idx}
                                    message={msg}
                                    onApplyFlow={handleApplyFlow}
                                />
                            ))
                        )}

                        {loading && <LoadingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-white/5 bg-black/20">
                        {/* Attachment chips */}
                        <AttachmentButton
                            attachments={attachments}
                            onAttach={handleAttach}
                            onRemove={handleRemoveAttachment}
                        />

                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe what you want to automate..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[48px] max-h-[120px]"
                                rows={1}
                                disabled={loading}
                                style={{ height: "auto" }}
                                onInput={(e) => {
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:shadow-none flex items-center justify-center"
                            >
                                {loading ? (
                                    <SpinnerGap size={20} className="animate-spin" />
                                ) : (
                                    <PaperPlaneTilt size={20} weight="fill" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
