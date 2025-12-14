import React, { useState } from "react";
import { CaretDown, Brain } from "@phosphor-icons/react";

/**
 * Collapsible accordion for displaying AI thinking/reasoning
 * @param {Object} props
 * @param {string} props.content - The thinking content to display
 * @param {boolean} props.isStreaming - Whether currently streaming
 */
export default function ThinkingAccordion({ content, isStreaming = false }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!content) return null;

    // Clean any <think> tags if present
    const cleanContent = content.replace(/<\/?think>/g, "").trim();
    if (!cleanContent) return null;

    return (
        <div className="mb-3 w-full">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-x-2 text-white/60 hover:text-white/80 transition-colors group"
            >
                <div className="flex items-center gap-x-2 flex-1 min-w-0">
                    <div className={`p-1 rounded-md ${isStreaming ? "bg-purple-500/20 animate-pulse" : "bg-white/10"}`}>
                        <Brain
                            size={14}
                            weight="fill"
                            className={isStreaming ? "text-purple-400" : "text-white/60"}
                        />
                    </div>
                    <span className="text-xs font-medium">
                        {isStreaming ? "Thinking..." : "View reasoning"}
                    </span>
                </div>
                <CaretDown
                    size={14}
                    weight="bold"
                    className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="bg-white/5 rounded-lg p-3 border-l-2 border-purple-500/50">
                    <pre className="text-xs text-white/70 font-mono whitespace-pre-wrap break-words overflow-y-auto max-h-[350px]">
                        {cleanContent}
                    </pre>
                </div>
            </div>
        </div>
    );
}
