import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Paperclip,
  Sparkles,
  Download,
  X,
  Plus,
  ChevronUp,
  Minus2,
} from "lucide-react";

/**
 * FloatingActionBar Component
 *
 * Premium floating action bar for quick actions:
 * - Fixed position bottom-right
 * - Quick actions: Comment, Attach, AI Chat, Download
 * - Collapse on scroll, expand on hover
 * - Tooltip labels
 * - Smooth animations
 */

const FloatingActionBar = ({
  onAddComment,
  onAttachFile,
  onOpenAIChat,
  onDownload,
  isCollapsed: externalCollapsed,
  onToggleCollapse,
  tooltipPosition = "left",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(externalCollapsed ?? false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync with external collapse state
  useEffect(() => {
    setIsCollapsed(externalCollapsed ?? false);
  }, [externalCollapsed]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const threshold = 300; // Pixels to trigger collapse
      setIsScrolledDown(scrollPosition > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const actions = [
    {
      id: "comment",
      icon: MessageSquare,
      label: "Add Comment",
      color: "bg-blue-600 hover:bg-blue-700",
      tooltip: "Add a comment to the proposal",
      onClick: onAddComment,
    },
    {
      id: "attach",
      icon: Paperclip,
      label: "Attach File",
      color: "bg-purple-600 hover:bg-purple-700",
      tooltip: "Attach a file to this proposal",
      onClick: onAttachFile,
    },
    {
      id: "ai-chat",
      icon: Sparkles,
      label: "AI Assistant",
      color: "bg-amber-500 hover:bg-amber-600",
      tooltip: "Ask AI about this proposal",
      onClick: onOpenAIChat,
    },
    {
      id: "download",
      icon: Download,
      label: "Download",
      color: "bg-green-600 hover:bg-green-700",
      tooltip: "Download proposal as PDF",
      onClick: onDownload,
    },
  ];

  const handleActionClick = (action) => {
    if (action.onClick) {
      setIsAnimating(true);
      action.onClick();
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    }
  };

  const shouldCollapse = isScrolledDown || isCollapsed;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Expanded Actions */}
      <div
        className={`flex flex-col items-end gap-2 transition-all duration-300 ease-out ${
          shouldCollapse
            ? "opacity-0 translate-y-4 scale-95 pointer-events-none"
            : "opacity-100 translate-y-0 scale-100"
        }`}
      >
        {actions.map((action, index) => (
          <div key={action.id} className="relative group">
            {/* Action Button */}
            <button
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
                transform transition-all duration-200
                ${action.color}
                ${isAnimating ? "scale-90" : "hover:scale-110 hover:shadow-xl"}
                ${hoveredAction === action.id ? "scale-110 shadow-xl" : ""}
              `}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              aria-label={action.label}
            >
              <action.icon className="w-5 h-5 text-white" />
            </button>

            {/* Tooltip */}
            <div
              className={`
                absolute right-14 top-1/2 -translate-y-1/2
                px-3 py-1.5 bg-gray-900 dark:bg-gray-700
                text-white text-sm font-medium rounded-lg shadow-lg
                whitespace-nowrap opacity-0 group-hover:opacity-100
                transition-opacity duration-200 pointer-events-none
                ${tooltipPosition === "left" ? "right-14" : "left-14"}
              `}
            >
              {action.tooltip}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="
          w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600
          hover:from-purple-700 hover:to-indigo-700
          flex items-center justify-center shadow-lg shadow-purple-500/30
          transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50
        "
        aria-label={shouldCollapse ? "Expand actions" : "Collapse actions"}
      >
        {shouldCollapse ? (
          <Plus className="w-6 h-6 text-white" />
        ) : (
          <Minus2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Keyboard Shortcut Hint */}
      {shouldCollapse && (
        <div
          className="
            absolute bottom-16 right-0
            px-3 py-1.5 bg-gray-900/90 dark:bg-gray-700/90
            text-white text-xs font-medium rounded-lg
            backdrop-blur-sm opacity-0 hover:opacity-100
            transition-opacity duration-200 pointer-events-none
          "
        >
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl</kbd>{" "}
          + <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">K</kbd>{" "}
          to expand
        </div>
      )}
    </div>
  );
};

export default FloatingActionBar;
