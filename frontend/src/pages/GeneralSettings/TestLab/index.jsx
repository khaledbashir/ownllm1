import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
  PaperPlaneTilt,
  Robot,
  Flask,
  Slideshow,
  FileText,
  ChartBar,
  MagnifyingGlass,
  Sparkle,
} from "@phosphor-icons/react";
import BlockSuiteEditor from "@/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor";

// Mode definitions
const MODES = [
  {
    id: "slides",
    label: "Slides",
    icon: Slideshow,
    description: "Presentations & decks",
  },
  {
    id: "docs",
    label: "Docs",
    icon: FileText,
    description: "Documents & reports",
  },
  {
    id: "data",
    label: "Data",
    icon: ChartBar,
    description: "Charts & dashboards",
  },
  {
    id: "research",
    label: "Research",
    icon: MagnifyingGlass,
    description: "Search & analysis",
  },
];

// Sample prompts per mode
const SAMPLE_PROMPTS = {
  slides: [
    "Create a pitch deck for a SaaS startup",
    "Design an all-hands presentation with company updates",
    "Build a product launch presentation",
  ],
  docs: [
    "Write a technical PRD for a new feature",
    "Create a business proposal template",
    "Draft a quarterly review report",
  ],
  data: [
    "Build a sales dashboard with monthly trends",
    "Create a cohort analysis showing user retention",
    "Generate a financial projection spreadsheet",
  ],
  research: [
    "Research the latest AI agent frameworks",
    "Analyze competitor pricing strategies",
    "Find best practices for developer onboarding",
  ],
};

export default function TheLab() {
  const [mode, setMode] = useState("docs");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when mode changes
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Ready to create ${MODES.find((m) => m.id === mode)?.description.toLowerCase()}. What would you like to generate?`,
      },
    ]);
  }, [mode]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // For now, simulate AI response
      // Later: call appropriate endpoint based on mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = `I'll generate that for you. [${mode.toUpperCase()} mode]\n\nThis is where the AI output will appear...`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);

      // If docs mode, stream to BlockSuite
      if (mode === "docs" && editorRef.current?.insertMarkdown) {
        await editorRef.current.insertMarkdown(
          `# ${userMessage}\n\nGenerating content...\n`
        );
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

  const handleSamplePrompt = (prompt) => {
    setInput(prompt);
  };

  // Render canvas based on mode
  const renderCanvas = () => {
    switch (mode) {
      case "docs":
        return (
          <BlockSuiteEditor
            ref={editorRef}
            onSave={() => {}}
            workspaceSlug="lab"
            threadSlug={`lab-${Date.now()}`}
          />
        );
      case "slides":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <Slideshow size={48} className="mb-4" />
            <p className="text-sm">Slides preview coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Slidev integration pending
            </p>
          </div>
        );
      case "data":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <ChartBar size={48} className="mb-4" />
            <p className="text-sm">Charts & Data coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Recharts integration pending
            </p>
          </div>
        );
      case "research":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <MagnifyingGlass size={48} className="mb-4" />
            <p className="text-sm">Research mode coming soon</p>
            <p className="text-xs mt-1 text-white/20">
              Web search integration pending
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header with Mode Selector */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
              <Flask size={20} className="text-white/70" weight="fill" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">The Lab</h1>
              <p className="text-xs text-white/40">Generate anything with AI</p>
            </div>
          </div>

          {/* Mode Pills */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Chat */}
          <div className="w-[400px] flex flex-col min-w-0 border-r border-white/5">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Sample Prompts (when no messages) */}
              {messages.length <= 1 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    Sample prompts
                  </p>
                  {SAMPLE_PROMPTS[mode]?.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSamplePrompt(prompt)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white/70 hover:text-white transition-all flex items-start gap-2"
                    >
                      <Sparkle size={14} className="mt-0.5 text-white/30" />
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <Robot size={16} className="text-white/50" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] ${msg.role === "user" ? "bg-white/10 px-4 py-3 rounded-2xl rounded-tr-md" : ""}`}
                  >
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3">
                    <Robot size={16} className="text-white/50 animate-pulse" />
                  </div>
                  <span className="text-white/50 text-sm">Generating...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-end gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Describe what to create...`}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
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

          {/* Right: Dynamic Canvas */}
          <div className="flex-1 flex flex-col bg-white/[0.02]">
            {renderCanvas()}
          </div>
        </div>
      </div>
    </div>
  );
}
