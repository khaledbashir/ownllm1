import React from "react";
import {
  User,
  Building,
  DollarSign,
  Clock,
  Edit3,
  Trash2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { API_BASE } from "@/utils/constants";

export default function KanbanCard({
  card,
  onEdit,
  onDelete,
  onDragStart,
  isDragging,
}) {
  const priorityColors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  const priorityConfig = priorityColors[card.priority] || priorityColors.medium;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      className={`relative group overflow-hidden rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border hover:border-theme-text-secondary/50 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging
          ? "opacity-50 scale-95 shadow-lg"
          : "hover:-translate-y-1 hover:shadow-md"
      }`}
    >
      <div className="p-4 space-y-3">
        {/* Header & Priority */}
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-theme-text-primary font-bold text-sm leading-snug line-clamp-2 flex-1">
            {card.title}
          </h4>
          {card.priority && (
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${priorityConfig} shrink-0`}
            >
              {card.priority}
            </span>
          )}
        </div>

        {/* Contact Details */}
        {(card.name || card.company) && (
          <div className="space-y-1.5 pt-1">
            {card.name && (
              <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
                <User size={12} className="shrink-0 opacity-70" />
                <span className="truncate">{card.name}</span>
              </div>
            )}
            {card.company && (
              <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
                <Building size={12} className="shrink-0 opacity-70" />
                <span className="truncate">{card.company}</span>
              </div>
            )}
          </div>
        )}

        {/* Value Tag */}
        {card.value && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-amount-text">
            <div className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
              <DollarSign size={10} />
              <span>{Number(card.value).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-theme-sidebar-border/50">
          {card.embedSessionId && (
            <div
              className="p-1 rounded-md bg-blue-500/10 text-blue-400"
              title="From embedded chat"
            >
              <MessageSquare size={12} />
            </div>
          )}

          {card.lastActivity && (
            <div className="flex items-center gap-1 text-[10px] text-theme-text-secondary ml-auto opacity-70">
              <Clock size={10} />
              <span>{card.lastActivity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-theme-bg-secondary p-1 rounded-lg border border-theme-sidebar-border shadow-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
          className="p-1.5 rounded-md hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          title="Edit"
        >
          <Edit3 size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="p-1.5 rounded-md hover:bg-red-500/20 text-theme-text-secondary hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
