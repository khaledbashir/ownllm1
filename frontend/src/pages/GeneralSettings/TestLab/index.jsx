import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
    PaperPlaneTilt,
    Robot,
    Image as ImageIcon,
    CheckCircle,
    XCircle,
    ArrowClockwise,
    Camera,
    Globe,
    Timer,
    Activity,
    CaretLeft,
    CaretRight,
    X,
    Play,
    FileText,
    Download,
    Clock,
    Check,
    Warning,
    Browser
} from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ breaks: true, gfm: true });

export default function TestLab() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: `## Welcome to Test Lab

I can automate browser testing for you.

**Capabilities:**
- Navigate to any URL
- Fill forms and click elements  
- Take screenshots
- Verify page content

**Try:**
\`\`\`
Navigate to google.com and take a screenshot
\`\`\``,
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStep, setLoadingStep] = useState("");
    const [screenshots, setScreenshots] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState("screenshots");
    const [lightboxImage, setLightboxImage] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
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
                { progress: 90, step: "Generating report..." },
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
                responseContent += `\n\n**Results:** ${data.results.summary.passed}/${data.results.summary.total} steps passed (${data.results.summary.duration}ms)`;
            }

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: responseContent },
            ]);

            if (data.screenshots?.length > 0) {
                setScreenshots((prev) => [...data.screenshots, ...prev]);
            }

            if (data.results) {
                setTestResults((prev) => [data.results, ...prev]);
                // Create a report from the results
                const report = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    url: data.results.url || userMessage,
                    success: data.results.success,
                    summary: data.results.summary,
                    steps: data.results.steps,
                    screenshots: data.screenshots?.length || 0,
                    errors: data.results.errors || [],
                };
                setReports((prev) => [report, ...prev]);
            }
        } catch (error) {
            console.error("Test Lab error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `**Error:** ${error.message}` },
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

    const clearResults = () => {
        setScreenshots([]);
        setTestResults([]);
        setReports([]);
    };

    const openLightbox = (index) => {
        setLightboxIndex(index);
        setLightboxImage(screenshots[index]);
    };

    const closeLightbox = () => setLightboxImage(null);

    const nextImage = () => {
        const newIndex = (lightboxIndex + 1) % screenshots.length;
        setLightboxIndex(newIndex);
        setLightboxImage(screenshots[newIndex]);
    };

    const prevImage = () => {
        const newIndex = (lightboxIndex - 1 + screenshots.length) % screenshots.length;
        setLightboxIndex(newIndex);
        setLightboxImage(screenshots[newIndex]);
    };

    const renderMarkdown = (content) => {
        return { __html: DOMPurify.sanitize(marked.parse(content)) };
    };

    const formatTime = (isoString) => {
        return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const exportReport = (report) => {
        const content = `
# Test Report
Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary
- **URL:** ${report.url}
- **Status:** ${report.success ? "PASSED" : "FAILED"}
- **Duration:** ${report.summary?.duration || 0}ms
- **Steps:** ${report.summary?.passed || 0}/${report.summary?.total || 0} passed
- **Screenshots:** ${report.screenshots}

## Steps
${report.steps?.map((s, i) => `${i + 1}. [${s.success ? "✓" : "✗"}] ${s.action} (${s.duration}ms)`).join("\n") || "No steps recorded"}

${report.errors?.length > 0 ? `## Errors\n${report.errors.join("\n")}` : ""}
        `.trim();

        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `test-report-${report.id}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Report downloaded", "success");
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
                    <button
                        onClick={clearResults}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 rounded-lg transition-all"
                    >
                        <ArrowClockwise size={14} />
                        Clear All
                    </button>
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
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    {msg.role === "assistant" && (
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                                            <Robot size={16} className="text-white/50" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${msg.role === "user" ? "bg-white/10 px-4 py-3 rounded-2xl rounded-tr-md" : ""}`}>
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
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3">
                                        <Robot size={16} className="text-white/50 animate-pulse" />
                                    </div>
                                    <span className="inline-flex gap-1 items-center">
                                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/5">
                            <div className="flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe the test to run..."
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

                    {/* Right: Visual Output */}
                    <div className="w-[440px] flex flex-col border-l border-white/5 bg-black/20">
                        {/* Tabs */}
                        <div className="flex border-b border-white/5">
                            {[
                                { id: "screenshots", icon: Camera, label: "Screenshots", count: screenshots.length },
                                { id: "results", icon: Activity, label: "Steps", count: testResults.length },
                                { id: "reports", icon: FileText, label: "Reports", count: reports.length },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-3 text-xs font-medium transition-all ${activeTab === tab.id ? "text-white bg-white/5" : "text-white/40 hover:text-white/60"
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-1.5">
                                        <tab.icon size={14} />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{tab.count}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === "screenshots" && (
                                screenshots.length === 0 ? (
                                    <EmptyState icon={Camera} text="No screenshots yet" subtext="Run a test to capture screenshots" />
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {screenshots.map((screenshot, idx) => (
                                            <div
                                                key={idx}
                                                className="group rounded-lg overflow-hidden border border-white/5 cursor-pointer hover:border-white/20 transition-all hover:scale-[1.02]"
                                                onClick={() => openLightbox(idx)}
                                            >
                                                <div className="relative aspect-video bg-black">
                                                    <img src={`data:image/png;base64,${screenshot}`} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Play size={24} className="text-white" weight="fill" />
                                                    </div>
                                                </div>
                                                <div className="px-2 py-1.5 bg-white/[0.02]">
                                                    <span className="text-[10px] text-white/40 font-mono">#{screenshots.length - idx}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === "results" && (
                                testResults.length === 0 ? (
                                    <EmptyState icon={Activity} text="No test results yet" subtext="Run a test to see results" />
                                ) : (
                                    <div className="space-y-3">
                                        {testResults.map((result, idx) => (
                                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-medium text-white/70">Test #{testResults.length - idx}</span>
                                                    <StatusBadge success={result.success} />
                                                </div>
                                                <div className="space-y-2">
                                                    {result.steps?.map((step, sIdx) => (
                                                        <div key={sIdx} className="flex items-center gap-2">
                                                            {step.success ? <CheckCircle size={14} className="text-emerald-400/60" weight="fill" /> : <XCircle size={14} className="text-red-400/60" weight="fill" />}
                                                            <span className="text-[11px] text-white/50 flex-1">{step.action}</span>
                                                            {step.duration && <span className="text-[10px] text-white/20"><Timer size={10} className="inline mr-1" />{step.duration}ms</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                                {result.summary && <ProgressBar passed={result.summary.passed} total={result.summary.total} success={result.success} />}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {activeTab === "reports" && (
                                reports.length === 0 ? (
                                    <EmptyState icon={FileText} text="No reports yet" subtext="Reports generate automatically after tests" />
                                ) : (
                                    <div className="space-y-3">
                                        {reports.map((report) => (
                                            <div key={report.id} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                                                {/* Report Header */}
                                                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Browser size={14} className="text-white/40" />
                                                            <span className="text-xs text-white/70 font-medium truncate max-w-[200px]">
                                                                {report.url}
                                                            </span>
                                                        </div>
                                                        <StatusBadge success={report.success} />
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatTime(report.timestamp)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Timer size={10} />
                                                            {report.summary?.duration || 0}ms
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Camera size={10} />
                                                            {report.screenshots}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Report Stats */}
                                                <div className="px-4 py-3 grid grid-cols-3 gap-2">
                                                    <StatBox label="Passed" value={report.summary?.passed || 0} color="emerald" />
                                                    <StatBox label="Failed" value={report.summary?.failed || 0} color="red" />
                                                    <StatBox label="Total" value={report.summary?.total || 0} color="white" />
                                                </div>

                                                {/* Errors */}
                                                {report.errors?.length > 0 && (
                                                    <div className="px-4 py-2 border-t border-white/5 bg-red-500/5">
                                                        <div className="flex items-center gap-2 text-red-400 text-[10px]">
                                                            <Warning size={12} />
                                                            <span>{report.errors.length} error(s)</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="px-4 py-2 border-t border-white/5 flex justify-end">
                                                    <button
                                                        onClick={() => exportReport(report)}
                                                        className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/70 transition-colors"
                                                    >
                                                        <Download size={12} />
                                                        Export
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8" onClick={closeLightbox}>
                    <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    {screenshots.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <CaretLeft size={24} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <CaretRight size={24} />
                            </button>
                        </>
                    )}
                    <img src={`data:image/png;base64,${lightboxImage}`} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm">{lightboxIndex + 1} / {screenshots.length}</div>
                </div>
            )}
        </div>
    );
}

// Helper Components
const EmptyState = ({ icon: Icon, text, subtext }) => (
    <div className="h-full flex flex-col items-center justify-center text-white/30">
        <Icon size={40} className="mb-3" weight="light" />
        <p className="text-xs">{text}</p>
        <p className="text-[10px] text-white/20 mt-1">{subtext}</p>
    </div>
);

const StatusBadge = ({ success }) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
        {success ? "PASSED" : "FAILED"}
    </span>
);

const ProgressBar = ({ passed, total, success }) => (
    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${success ? "bg-emerald-400/50" : "bg-red-400/50"}`} style={{ width: `${(passed / total) * 100}%` }} />
        </div>
        <span className="text-[10px] text-white/30">{passed}/{total}</span>
    </div>
);

const StatBox = ({ label, value, color }) => (
    <div className="text-center py-2 bg-white/[0.02] rounded-lg">
        <div className={`text-lg font-semibold ${color === "emerald" ? "text-emerald-400" : color === "red" ? "text-red-400" : "text-white/70"}`}>
            {value}
        </div>
        <div className="text-[9px] text-white/30 uppercase tracking-wide">{label}</div>
    </div>
);
