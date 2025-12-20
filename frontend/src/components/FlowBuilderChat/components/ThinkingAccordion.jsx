import React, { useState } from "react";
import { CaretDown, Brain } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
        className="w-full flex items-center gap-x-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors group"
      >
        <div className="flex items-center gap-x-2 flex-1 min-w-0">
          <div
            className={`p-1 rounded-md ${isStreaming ? "bg-purple-500/20 animate-pulse" : "bg-theme-action-menu-item-hover"}`}
          >
            <Brain
              size={14}
              weight="fill"
              className={
                isStreaming ? "text-purple-400" : "text-theme-text-secondary"
              }
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-theme-bg-primary rounded-lg p-3 border-l-2 border-purple-500/50 overflow-y-auto max-h-[450px]">
          <div className="prose prose-sm prose-invert max-w-none text-theme-text-secondary">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <table
                    className="min-w-full text-xs border border-theme-sidebar-border"
                    {...props}
                  />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="border border-theme-sidebar-border px-2 py-1 bg-theme-bg-secondary text-left"
                    {...props}
                  />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="border border-theme-sidebar-border px-2 py-1"
                    {...props}
                  />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code
                      className="bg-theme-bg-secondary px-1 rounded text-xs"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block bg-theme-bg-secondary p-2 rounded text-xs overflow-x-auto"
                      {...props}
                    />
                  ),
                p: ({ node, ...props }) => (
                  <p className="mb-2 text-sm" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-sm" {...props} />
                ),
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
