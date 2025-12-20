import React, { useState, useRef, useEffect } from "react";
import { X, PaperPlaneTilt, Sparkle, SpinnerGap } from "@phosphor-icons/react";

/**
 * AI Input Modal - Elegant inline-style prompt bar like Affine's design
 */
export default function AIInputModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  placeholder = "What are your thoughts?",
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
      setQuery("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl mx-4 animate-in slide-in-from-top-4 zoom-in-95 duration-200">
        {/* Main Input Card */}
        <div className="bg-zinc-900/95 border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden">
          {/* Header Label */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkle size={14} weight="fill" className="text-white" />
            </div>
            <span className="text-sm font-medium text-white/80">Ask AI</span>
            <span className="text-xs text-zinc-500 ml-auto">
              Press Enter to send
            </span>
          </div>

          {/* Input Field */}
          <form onSubmit={handleSubmit} className="px-4 pb-4">
            <div className="relative flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={loading}
                className="flex-1 bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <SpinnerGap size={18} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={18} weight="fill" />
                )}
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {[
              "Summarize this document",
              "Generate ideas for...",
              "Explain this concept",
              "Write a draft about...",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1.5 text-xs text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700/50 hover:text-white rounded-full border border-zinc-700/50 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Close hint */}
        <div className="text-center mt-3">
          <span className="text-xs text-zinc-500">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
              Esc
            </kbd>{" "}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
