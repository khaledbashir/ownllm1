import { useState, forwardRef, useImperativeHandle } from "react";
import renderMarkdown from "@/utils/chat/markdown";
import { CaretDown } from "@phosphor-icons/react";
import DOMPurify from "dompurify";
import { isMobile } from "react-device-detect";
import ThinkingAnimation from "@/media/animations/thinking-animation.webm";
import ThinkingStatic from "@/media/animations/thinking-static.png";

const THOUGHT_KEYWORDS = ["thought", "thinking", "think", "thought_chain"];
const CLOSING_TAGS = [...THOUGHT_KEYWORDS, "response", "answer"];
export const THOUGHT_REGEX_OPEN = new RegExp(
  THOUGHT_KEYWORDS.map((keyword) => `<${keyword}\\s*(?:[^>]*?)?\\s*>`).join("|")
);
export const THOUGHT_REGEX_CLOSE = new RegExp(
  CLOSING_TAGS.map((keyword) => `</${keyword}\\s*(?:[^>]*?)?>`).join("|")
);
export const THOUGHT_REGEX_COMPLETE = new RegExp(
  THOUGHT_KEYWORDS.map(
    (keyword) =>
      `<${keyword}\\s*(?:[^>]*?)?\\s*>[\\s\\S]*?<\\/${keyword}\\s*(?:[^>]*?)?>`
  ).join("|")
);
const THOUGHT_PREVIEW_LENGTH = isMobile ? 25 : 50;

/**
 * Checks if the content has readable content.
 * @param {string} content - The content to check.
 * @returns {boolean} - Whether the content has readable content.
 */
function contentIsNotEmpty(content = "") {
  return (
    content
      ?.trim()
      ?.replace(THOUGHT_REGEX_OPEN, "")
      ?.replace(THOUGHT_REGEX_CLOSE, "")
      ?.replace(/[\n\s]/g, "")?.length > 0
  );
}

/**
 * Component to render a thought chain.
 * @param {string} content - The content of the thought chain.
 * @param {boolean} expanded - Whether the thought chain is expanded.
 * @returns {JSX.Element}
 */
export const ThoughtChainComponent = forwardRef(
  ({ content: initialContent, expanded }, ref) => {
    const [content, setContent] = useState(initialContent);
    const [hasReadableContent, setHasReadableContent] = useState(
      contentIsNotEmpty(initialContent)
    );
    const [isExpanded, setIsExpanded] = useState(expanded);
    useImperativeHandle(ref, () => ({
      updateContent: (newContent) => {
        setContent(newContent);
        setHasReadableContent(contentIsNotEmpty(newContent));
      },
    }));

    const isThinking =
      content.match(THOUGHT_REGEX_OPEN) && !content.match(THOUGHT_REGEX_CLOSE);
    const isComplete =
      content.match(THOUGHT_REGEX_COMPLETE) ||
      content.match(THOUGHT_REGEX_CLOSE);
    const tagStrippedContent = content
      .replace(THOUGHT_REGEX_OPEN, "")
      .replace(THOUGHT_REGEX_CLOSE, "");
    const autoExpand =
      isThinking && tagStrippedContent.length > THOUGHT_PREVIEW_LENGTH;
    const canExpand = tagStrippedContent.length > THOUGHT_PREVIEW_LENGTH;
    if (!content || !content.length || !hasReadableContent) return null;

    function handleExpandClick() {
      if (!canExpand) return;
      setIsExpanded(!isExpanded);
    }

    return (
      <div className="flex justify-start items-end transition-all duration-200 w-full md:max-w-[800px] mb-2">
        <div className="w-full flex gap-x-5 flex-col relative">
          <div
            className={`flex flex-col rounded-lg border border-theme-sidebar-border bg-theme-bg-secondary overflow-hidden transition-all duration-200`}
          >
            {/* Header / Toggle */}
            <div
              onClick={handleExpandClick}
              className={`flex items-center gap-x-2 px-3 py-2 cursor-pointer hover:bg-theme-sidebar-item-hover transition-colors ${isExpanded ? "border-b border-theme-sidebar-border" : ""}`}
            >
              <div className="flex items-center gap-x-2 flex-1">
                <div className="w-5 h-5 flex items-center justify-center">
                  {isThinking ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-5 h-5 object-contain opacity-80"
                    >
                      <source src={ThinkingAnimation} type="video/webm" />
                    </video>
                  ) : (
                    <img
                      src={ThinkingStatic}
                      alt="Thinking complete"
                      className="w-4 h-4 object-contain opacity-60"
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-theme-text-secondary uppercase tracking-wide">
                  {isThinking ? "Thinking..." : "Reasoning Process"}
                </span>
                <span className="text-xs text-theme-text-secondary/50">
                  {isThinking ? "" : isExpanded ? "(Click to hide)" : "(Click to view)"}
                </span>
              </div>

              {canExpand && (
                <CaretDown
                  className={`w-4 h-4 text-theme-text-secondary transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              )}
            </div>

            {/* Content */}
            {(isExpanded || isThinking) && (
              <div className="px-4 py-3 bg-theme-bg-chat-input/30">
                <div className="text-theme-text-primary text-sm leading-relaxed font-mono">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(renderMarkdown(tagStrippedContent)),
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ThoughtChainComponent.displayName = "ThoughtChainComponent";
