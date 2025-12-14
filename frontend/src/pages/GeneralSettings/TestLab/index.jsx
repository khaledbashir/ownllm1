import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
    PaperPlaneTilt,
    Robot,
    Globe,
    CheckCircle,
    XCircle,
    Camera
} from "@phosphor-icons/react";

export default function TestLab() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Welcome to Test Lab! I can automate browser testing.\n\nTry: 'Go to google.com'"
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [screenshots, setScreenshots] = useState([]);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch("/api/v1/agent/test-lab", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await response.json();

            let responseContent = data.message || "Test completed.";
            if (data.results?.summary) {
                responseContent += `\n\nResults: ${data.results.summary.passed}/${data.results.summary.total} steps passed`;
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: responseContent },
            ]);

            if (data.screenshots?.length > 0) {
                setScreenshots((prev) => [...data.screenshots, ...prev]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${error.message}` },
            ]);
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
                            <Globe size={20} className="text-white/70" />
                        </div>
                        <div>
                            <h1 className="text-lg font-medium text-white">Test Lab</h1>
                            <p className="text-xs text-white/40">Browser automation testing</p>
                        </div>
                    </div>
                </div>

                {/* Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Chat */}
                    <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                            <Robot size={16} className="text-white/50" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${msg.role === "user" ? "bg-white/10 px-4 py-3 rounded-2xl rounded-tr-md" : ""}`}>
                                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3">
                                        <Robot size={16} className="text-white/50 animate-pulse" />
                                    </div>
                                    <span className="text-white/50 text-sm">Running test...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5">
                            <div className="flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe the test to run..."
                                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="p-2 rounded-xl bg-white text-black disabled:opacity-30"
                                >
                                    <PaperPlaneTilt size={18} weight="fill" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Screenshots */}
                    <div className="w-[400px] flex flex-col bg-black/20">
                        <div className="px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2 text-white/50 text-xs">
                                <Camera size={14} />
                                Screenshots ({screenshots.length})
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {screenshots.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30">
                                    <Camera size={40} className="mb-3" />
                                    <p className="text-xs">No screenshots yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {screenshots.map((screenshot, idx) => (
                                        <div key={idx} className="rounded-lg overflow-hidden border border-white/5">
                                            <img
                                                src={`data:image/png;base64,${screenshot}`}
                                                alt={`Screenshot ${idx + 1}`}
                                                className="w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
