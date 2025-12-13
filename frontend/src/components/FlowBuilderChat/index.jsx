import React, { useState, useRef, useEffect } from "react";
import { ChatCircle, X, PaperPlaneTilt, Robot, SpinnerGap } from "@phosphor-icons/react";
import FlowGenerator from "@/models/flowGenerator";
import showToast from "@/utils/toast";

export default function FlowBuilderChat({ onFlowGenerated }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await FlowGenerator.generate(newMessages);

            if (response.success) {
                const assistantMessage = { role: "assistant", content: response.message };
                setMessages([...newMessages, assistantMessage]);

                // If a flow was generated, notify parent
                if (response.flow) {
                    showToast("Flow generated! Click 'Apply Flow' to use it.", "success");
                    // Store the generated flow for later use
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1].flow = response.flow;
                        return updated;
                    });
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
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
                    title="AI Flow Builder"
                >
                    <Robot size={28} weight="fill" className="text-white group-hover:scale-110 transition-transform" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-theme-bg-secondary border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Robot size={24} weight="fill" className="text-blue-400" />
                            <div>
                                <h3 className="text-white font-semibold text-sm">AI Flow Builder</h3>
                                <p className="text-white/60 text-xs">Describe what you want to automate</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={clearChat}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors text-xs"
                                title="Clear chat"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-white/40">
                                <Robot size={48} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Tell me what you want to build!</p>
                                <p className="text-xs mt-1">Example: "Monitor my website and alert me on Slack if it goes down"</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${msg.role === "user"
                                            ? "bg-blue-500 text-white rounded-br-md"
                                            : "bg-white/10 text-white/90 rounded-bl-md"
                                        }`}
                                >
                                    {msg.content}

                                    {/* Apply Flow Button */}
                                    {msg.flow && (
                                        <button
                                            onClick={() => handleApplyFlow(msg.flow)}
                                            className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                        >
                                            ✅ Apply This Flow
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                                    <SpinnerGap size={20} className="text-blue-400 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-white/10">
                        <div className="flex gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe what you want to build..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                                rows={2}
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="self-end px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                            >
                                <PaperPlaneTilt size={20} weight="fill" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
