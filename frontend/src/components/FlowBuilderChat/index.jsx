import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    ChatCircle,
    X,
    PaperPlaneTilt,
    Robot,
    SpinnerGap,
    Trash,
    ArrowsOutSimple,
    ArrowsInSimple,
    SpeakerHigh,
    StopCircle
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
 * Parse thinking content from message - handles think/thinking/thought tags
 */
function parseThinking(content) {
    // Find opening and closing tags (any variant)
    const openMatch = content.match(/<(think|thinking|thought)\s*>/i);
    const closeMatch = content.match(/<\/(think|thinking|thought)\s*>/i);

    if (openMatch && closeMatch) {
        const openIndex = content.indexOf(openMatch[0]);
        const closeIndex = content.indexOf(closeMatch[0]) + closeMatch[0].length;

        const thinking = content
            .substring(openIndex, closeIndex)
            .replace(/<(think|thinking|thought)\s*>/gi, "")
            .replace(/<\/(think|thinking|thought)\s*>/gi, "")
            .trim();

        const mainContent = (
            content.substring(0, openIndex) + content.substring(closeIndex)
        ).trim();

        return { thinking, mainContent };
    }

    return { thinking: null, mainContent: content };
}

/**
 * Message bubble component with markdown rendering
 */
function MessageBubble({ message, onApplyFlow }) {
    const isUser = message.role === "user";
    const { thinking, mainContent } = parseThinking(message.content);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // TTS speak function
    const handleSpeak = () => {
        if (!('speechSynthesis' in window)) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Extract text from content (remove HTML/markdown)
        const textContent = (mainContent || message.content)
            .replace(/<[^>]*>/g, '')
            .replace(/\*\*/g, '')
            .replace(/[#*`]/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(textContent);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}>
            <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 ${isUser
                    ? "bg-primary-button text-white rounded-br-md shadow-lg"
                    : "bg-zinc-800/90 text-white rounded-bl-md border border-zinc-700 shadow-md"
                    }`}
            >
                {/* Thinking accordion for assistant messages */}
                {!isUser && thinking && (
                    <ThinkingAccordion content={thinking} />
                )}

                {/* Main content with markdown */}
                <div
                    className="text-sm prose prose-sm prose-invert max-w-none 
                        prose-headings:text-white prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                        prose-p:text-white/80 prose-p:leading-relaxed prose-p:my-1
                        prose-strong:text-white prose-strong:font-semibold
                        prose-code:text-white/90 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2
                        prose-ul:text-white/80 prose-li:text-white/80 prose-li:my-0.5
                        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                        [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:marker:text-white/50"
                    dangerouslySetInnerHTML={{
                        __html: renderMarkdown(mainContent || message.content)
                    }}
                />

                {/* Attachments for user messages */}
                {isUser && message.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/20">
                        {message.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-1 text-xs opacity-70">
                                {att.preview ? (
                                    <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover" />
                                ) : (
                                    <span className="px-2 py-0.5 bg-white/10 rounded">{att.name}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* TTS Button for assistant messages */}
                {!isUser && (
                    <button
                        onClick={handleSpeak}
                        className="mt-2 flex items-center gap-1.5 text-xs text-white/60 hover:text-white/90 transition-colors"
                        title={isSpeaking ? "Stop speaking" : "Read aloud"}
                    >
                        {isSpeaking ? (
                            <>
                                <StopCircle size={14} weight="fill" className="text-red-400" />
                                <span>Stop</span>
                            </>
                        ) : (
                            <>
                                <SpeakerHigh size={14} />
                                <span>Read aloud</span>
                            </>
                        )}
                    </button>
                )}
                {/* Apply Flow Button */}
                {message.flow && (
                    <button
                        onClick={() => onApplyFlow(message.flow)}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
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
            <div className="bg-theme-bg-chat-input rounded-2xl rounded-bl-md px-4 py-3 border border-theme-modal-border">
                <div className="flex items-center gap-2">
                    <SpinnerGap size={18} className="text-primary-button animate-spin" />
                    <span className="text-sm text-theme-text-secondary">Thinking</span>
                    <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-primary-button rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-primary-button rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-primary-button rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            <div className="w-16 h-16 rounded-2xl bg-primary-button/20 flex items-center justify-center mb-4">
                <Robot size={32} weight="fill" className="text-primary-button" />
            </div>
            <h3 className="text-theme-text-primary font-medium mb-1">AI Flow Builder</h3>
            <p className="text-theme-text-secondary text-sm mb-6 max-w-[250px]">
                Describe what you want to automate and I'll build the flow for you.
            </p>
            <div className="w-full space-y-2">
                <p className="text-xs text-theme-text-secondary uppercase tracking-wider">Try saying:</p>
                {suggestions.map((suggestion, idx) => (
                    <button
                        key={idx}
                        className="w-full text-left text-xs text-theme-text-secondary hover:text-theme-text-primary bg-theme-bg-chat-input hover:bg-theme-action-menu-item-hover rounded-lg px-3 py-2 transition-all border border-theme-modal-border"
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
            // Auto-focus textarea after AI responds
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            }, 100);
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

    // Dynamic sizing - max 70vh to avoid covering top buttons
    const panelHeight = isExpanded ? "70vh" : "500px";
    const actualWidth = isExpanded ? Math.min(panelWidth * 1.3, MAX_WIDTH) : panelWidth;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary-button hover:brightness-110 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                    title="AI Flow Builder"
                >
                    <Robot size={28} weight="fill" className="text-white group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-theme-bg-primary animate-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    style={{
                        width: actualWidth,
                        height: panelHeight,
                    }}
                    className="fixed bottom-6 right-6 z-50 bg-theme-bg-secondary border border-theme-modal-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
                >
                    {/* Resize Handle */}
                    <ResizableHandle
                        onResize={handleResize}
                        position="left"
                        minWidth={MIN_WIDTH}
                        maxWidth={MAX_WIDTH}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-theme-bg-primary border-b border-theme-modal-border">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-button flex items-center justify-center shadow-lg">
                                <Robot size={20} weight="fill" className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-theme-text-primary font-semibold text-sm">AI Flow Builder</h3>
                                <p className="text-theme-text-secondary text-xs">Powered by AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                            />
                            <button
                                onClick={toggleExpanded}
                                className="p-2 rounded-lg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded ? <ArrowsInSimple size={16} /> : <ArrowsOutSimple size={16} />}
                            </button>
                            <button
                                onClick={clearChat}
                                className="p-2 rounded-lg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title="Clear chat"
                            >
                                <Trash size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-bg-chat">
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
                    <div className="p-3 border-t border-theme-modal-border bg-theme-bg-primary">
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
                                className="flex-1 bg-theme-bg-chat-input border border-theme-chat-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-theme-placeholder resize-none focus:outline-none focus:border-primary-button transition-all min-h-[48px] max-h-[120px]"
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
                                className="flex-shrink-0 w-12 h-12 bg-primary-button hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg flex items-center justify-center"
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
