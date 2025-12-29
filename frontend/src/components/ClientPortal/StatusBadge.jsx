import React from "react";

/**
 * Status Badge - Animated status indicator for proposals
 * 
 * Usage: <StatusBadge status="approved" />
 * 
 * Statuses:
 * - approved: Green gradient
 * - review: Yellow gradient
 * - rejected: Red gradient
 * - draft: Blue gradient
 * - sent: Purple gradient
 */

const STATUS_STYLES = {
  approved: {
    label: "Approved",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-gradient-to-r from-emerald-500 to-green-600",
    border: "border-emerald-600",
    icon: "✓",
  },
  review: {
    label: "In Review",
    gradient: "from-amber-400 to-yellow-500",
    bg: "bg-gradient-to-r from-amber-400 to-yellow-500",
    border: "border-amber-500",
    icon: "◉",
  },
  rejected: {
    label: "Rejected",
    gradient: "from-red-500 to-rose-600",
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    border: "border-rose-600",
    icon: "✗",
  },
  draft: {
    label: "Draft",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
    border: "border-indigo-600",
    icon: "◇",
  },
  sent: {
    label: "Sent",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-gradient-to-r from-violet-500 to-purple-600",
    border: "border-purple-600",
    icon: "📤",
  },
};

export default function StatusBadge({ status, size = "md", animated = true }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;

  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };

  const animationClass = animated
    ? "animate-pulse hover:scale-105 transition-transform duration-200"
    : "";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border-2 shadow-lg ${style.bg} ${style.border} ${sizeClasses[size]} ${animationClass}`}
    >
      <span className="text-white font-bold">{style.icon}</span>
      <span className="text-white font-semibold uppercase tracking-wide">
        {style.label}
      </span>
    </div>
  );
}
