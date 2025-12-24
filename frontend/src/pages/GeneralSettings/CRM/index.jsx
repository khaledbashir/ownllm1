import React, { useEffect, useState, useMemo } from "react";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/SettingsSidebar";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Edit3,
  ExternalLink,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import CRM from "@/models/crm";
import showToast from "@/utils/toast";
import { API_BASE } from "@/utils/constants";

// Enhanced stage colors with gradients and better contrast
const STAGE_COLORS = {
  New: {
    bg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/40",
    text: "text-blue-400",
    icon: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  Contacted: {
    bg: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10",
    border: "border-yellow-500/40",
    text: "text-yellow-400",
    icon: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  Qualified: {
    bg: "bg-gradient-to-br from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/40",
    text: "text-purple-400",
    icon: "text-purple-400",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  Proposal: {
    bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/40",
    text: "text-orange-400",
    icon: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  Won: {
    bg: "bg-gradient-to-br from-green-500/20 to-green-600/10",
    border: "border-green-500/40",
    text: "text-green-400",
    icon: "text-green-400",
    badge: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  Lost: {
    bg: "bg-gradient-to-br from-red-500/20 to-red-600/10",
    border: "border-red-500/40",
    text: "text-red-400",
    icon: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

function getStageColor(stage) {
  return (
    STAGE_COLORS[stage] || {
      bg: "bg-theme-bg-container",
      border: "border-theme-sidebar-border",
      text: "text-theme-text-secondary",
      icon: "text-theme-text-secondary",
      badge: "bg-theme-bg-secondary text-theme-text-secondary border-theme-sidebar-border",
    }
  );
}

// Priority levels
const PRIORITY_LEVELS = {
  high: { label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  medium: { label: "Medium", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

// Statistics Card Component
function StatCard({ icon: Icon, label, value, trend, trendUp, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border p-5 hover:border-theme-chat-input-border transition-all duration-300 group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}>
              <Icon size={20} className={color.replace("bg-", "text-")} />
            </div>
            <div>
              <p className="text-sm text-theme-text-secondary font-medium">{label}</p>
              <p className="text-2xl font-bold text-theme-text-primary mt-1">
                {value}
              </p>
            </div>
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                trendUp
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Card Component
function KanbanCard({ card, onEdit, onDelete, onDragStart, isDragging }) {
  const stageColor = getStageColor(card.stage);
  const priority = card.priority || "medium";
  const priorityConfig = PRIORITY_LEVELS[priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      className={`relative overflow-hidden rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border hover:border-theme-chat-input-border cursor-grab active:cursor-grabbing transition-all duration-300 group ${
        isDragging ? "opacity-50 scale-95 shadow-2xl" : "hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      {/* Priority Badge */}
      <div className="absolute top-3 right-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityConfig.color}`}>
          {priorityConfig.label}
        </span>
      </div>

      <div className="p-4">
        {/* Card Header */}
        <div className="mb-3 pr-16">
          <h4 className="text-theme-text-primary font-semibold text-base leading-tight line-clamp-2">
            {card.title}
          </h4>
        </div>

        {/* Contact Info */}
        {(card.name || card.email || card.company) && (
          <div className="space-y-2 mb-3">
            {card.name && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-theme-bg-primary">
                  <User size={12} className="text-theme-text-secondary" />
                </div>
                <span className="text-theme-text-secondary truncate flex-1">
                  {card.name}
                </span>
              </div>
            )}
            {card.company && (
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-theme-bg-primary">
                  <Building size={12} className="text-theme-text-secondary" />
                </div>
                <span className="text-theme-text-secondary truncate flex-1">
                  {card.company}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Value Display */}
        {card.value && (
          <div className="flex items-center justify-between mb-3 p-2.5 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-green-400" />
              <span className="text-green-400 font-semibold text-sm">
                {Number(card.value).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-green-400/70">Est. Value</span>
          </div>
        )}

        {/* Activity Indicator */}
        {card.embedSessionId && (
          <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20">
            <MessageSquare size={10} />
            <span>From embed chat</span>
          </div>
        )}

        {/* Proposal Link */}
        {card.proposalId && (
          <a
            href={`${API_BASE}/p/${card.proposalId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            <ExternalLink size={10} />
            <span>View proposal</span>
          </a>
        )}

        {/* Last Activity */}
        {card.lastActivity && (
          <div className="flex items-center gap-1.5 text-xs text-theme-text-secondary mt-2">
            <Clock size={10} />
            <span>{card.lastActivity}</span>
          </div>
        )}
      </div>

      {/* Hover Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-theme-bg-secondary to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(card)}
            className="flex-1 p-2 rounded-lg bg-theme-bg-primary hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors flex items-center justify-center gap-1 text-xs font-medium"
          >
            <Edit3 size={12} />
            Edit
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="flex-1 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1 text-xs font-medium"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Stage Column Component
function StageColumn({
  stage,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}) {
  const stageColor = getStageColor(stage);
  const stageCards = cards.filter((c) => c.stage === stage);
  const totalValue = stageCards.reduce((sum, card) => sum + (Number(card.value) || 0), 0);

  return (
    <div
      className={`flex-shrink-0 w-80 transition-all duration-300 ${
        isDragOver ? "scale-[1.02]" : ""
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage)}
    >
      {/* Stage Header */}
      <div
        className={`relative overflow-hidden rounded-t-2xl border ${stageColor.bg} ${stageColor.border} p-4`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stageColor.badge}`}>
                <Target size={14} className={stageColor.icon} />
              </div>
              <span className="font-bold text-theme-text-primary">{stage}</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stageColor.badge}`}>
              {stageCards.length}
            </span>
          </div>
          {totalValue > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-theme-text-secondary">
              <DollarSign size={10} />
              <span className="font-medium">{totalValue.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stage Content */}
      <div
        className={`min-h-[500px] p-3 rounded-b-2xl bg-theme-bg-primary border border-t-0 border-theme-sidebar-border space-y-3 transition-all duration-300 ${
          isDragOver ? "border-primary-button/50 bg-theme-bg-secondary" : ""
        }`}
      >
        {stageCards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onDragStart={onDragStart}
            isDragging={false}
          />
        ))}

        {/* Add Card Button */}
        <button
          onClick={() => onAddCard(stage)}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-theme-sidebar-border text-theme-text-secondary hover:border-primary-button hover:bg-primary-button/5 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <Plus
            size={18}
            className="group-hover:scale-110 group-hover:text-primary-button transition-all"
          />
          <span className="font-medium group-hover:text-theme-text-primary transition-colors">
            Add Opportunity
          </span>
        </button>
      </div>
    </div>
  );
}

// Enhanced Card Modal
function CardModal({ isOpen, onClose, card, onSave, stages }) {
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
    value: "",
    stage: stages[0] || "New",
    priority: "medium",
  });

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || "",
        name: card.name || "",
        email: card.email || "",
        phone: card.phone || "",
        company: card.company || "",
        notes: card.notes || "",
        value: card.value || "",
        stage: card.stage || stages[0] || "New",
        priority: card.priority || "medium",
      });
    } else {
      setFormData({
        title: "",
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
        value: "",
        stage: stages[0] || "New",
        priority: "medium",
      });
    }
  }, [card, stages]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    onSave(formData, card?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl transform transition-all">
        <div className="relative overflow-hidden rounded-3xl bg-theme-bg-secondary border border-theme-modal-border shadow-2xl">
          {/* Modal Header */}
          <div className="relative px-8 py-6 border-b border-theme-sidebar-border bg-gradient-to-r from-theme-bg-secondary to-theme-bg-primary">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-button/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-xl bg-primary-button/20">
                      <Target size={20} className="text-primary-button" />
                    </div>
                    <h3 className="text-2xl font-bold text-theme-text-primary">
                      {card ? "Edit Opportunity" : "New Opportunity"}
                    </h3>
                  </div>
                  <p className="text-theme-text-secondary text-sm ml-11">
                    Manage lead details and pipeline status
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title Section */}
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-theme-text-secondary flex items-center gap-2">
                <Zap size={14} className="text-primary-button" />
                Opportunity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-5 py-4 rounded-2xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-none focus:border-primary-button transition-all text-lg font-medium"
                placeholder="e.g. Enterprise License Deal - Acme Corp"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Info Section */}
              <div className="space-y-5">
                <h4 className="text-base font-bold text-theme-text-primary flex items-center gap-2 pb-2 border-b border-theme-sidebar-border">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <User size={16} className="text-blue-400" />
                  </div>
                  Contact Information
                </h4>
                <div className="space-y-4">
                  <div className="relative group">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                      placeholder="Contact Name"
                    />
                  </div>
                  <div className="relative group">
                    <Building
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="relative group">
                    <Mail
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="relative group">
                    <Phone
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              {/* Deal Settings Section */}
              <div className="space-y-5">
                <h4 className="text-base font-bold text-theme-text-primary flex items-center gap-2 pb-2 border-b border-theme-sidebar-border">
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <Settings size={16} className="text-purple-400" />
                  </div>
                  Deal Settings
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-theme-text-secondary">
                      Pipeline Stage
                    </label>
                    <div className="relative">
                      <select
                        value={formData.stage}
                        onChange={(e) =>
                          setFormData({ ...formData, stage: e.target.value })
                        }
                        className="w-full px-5 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none appearance-none cursor-pointer transition-all"
                      >
                        {stages.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-theme-text-secondary">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PRIORITY_LEVELS).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: key })}
                          className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.priority === key
                              ? `${config.color} border-current`
                              : "border-theme-sidebar-border text-theme-text-secondary hover:border-theme-chat-input-border"
                          }`}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-theme-text-secondary">
                      Est. Value ($)
                    </label>
                    <div className="relative group">
                      <DollarSign
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                      />
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({ ...formData, value: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-primary-button focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-theme-text-secondary">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:border-primary-button focus:outline-none resize-none min-h-[100px] transition-all"
                      placeholder="Add notes about this deal..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-4 pt-6 border-t border-theme-sidebar-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-theme-sidebar-border text-theme-text-secondary hover:bg-theme-action-menu-item-hover hover:text-theme-text-primary transition-all font-bold text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary-button to-primary-button/90 text-theme-bg-primary font-bold hover:opacity-90 transition-all text-base shadow-lg hover:shadow-xl"
              >
                {card ? "Save Changes" : "Create Opportunity"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main CRM Page
export default function CRMPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadCards(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  const loadPipelines = async () => {
    const res = await CRM.listPipelines();
    if (res.success && res.pipelines.length > 0) {
      setPipelines(res.pipelines);
      setSelectedPipeline(res.pipelines[0]);
    } else if (res.success && res.pipelines.length === 0) {
      const createRes = await CRM.createPipeline({
        name: "Sales Pipeline",
        description: "Track your sales leads",
        type: "custom",
      });
      if (createRes.success) {
        setPipelines([createRes.pipeline]);
        setSelectedPipeline(createRes.pipeline);
      }
    }
    setLoading(false);
  };

  const loadCards = async (pipelineId) => {
    const res = await CRM.listCards(pipelineId);
    if (res.success) {
      setCards(res.cards);
    }
  };

  const handleAddCard = (stage) => {
    setEditingCard({ stage });
    setShowCardModal(true);
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setShowCardModal(true);
  };

  const handleSaveCard = async (formData, cardId) => {
    if (cardId) {
      const res = await CRM.updateCard(cardId, formData);
      if (res.success) {
        setCards(
          cards.map((c) => (c.id === cardId ? { ...c, ...formData } : c))
        );
        showToast("Card updated", "success");
      }
    } else {
      const res = await CRM.createCard({
        ...formData,
        pipelineId: selectedPipeline.id,
      });
      if (res.success) {
        setCards([...cards, res.card]);
        showToast("Card created", "success");
      }
    }
    setShowCardModal(false);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId) => {
    const res = await CRM.deleteCard(cardId);
    if (res.success) {
      setCards(cards.filter((c) => c.id !== cardId));
      showToast("Card deleted", "success");
    }
  };

  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedCard || draggedCard.stage === newStage) {
      setDraggedCard(null);
      return;
    }

    setCards(
      cards.map((c) =>
        c.id === draggedCard.id ? { ...c, stage: newStage } : c
      )
    );

    const res = await CRM.moveCard(draggedCard.id, newStage);
    if (!res.success) {
      setCards(cards);
      showToast("Failed to move card", "error");
    }
    setDraggedCard(null);
  };

  const stages = selectedPipeline?.stages || [
    "New",
    "Contacted",
    "Qualified",
    "Proposal",
    "Won",
    "Lost",
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalValue = cards.reduce((sum, card) => sum + (Number(card.value) || 0), 0);
    const wonCards = cards.filter((c) => c.stage === "Won").length;
    const lostCards = cards.filter((c) => c.stage === "Lost").length;
    const conversionRate = totalCards > 0 ? ((wonCards / totalCards) * 100).toFixed(1) : 0;
    const avgDealSize = wonCards > 0 ? (totalValue / wonCards).toFixed(0) : 0;

    return {
      totalCards,
      totalValue,
      wonCards,
      lostCards,
      conversionRate,
      avgDealSize,
    };
  }, [cards]);

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = cards;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.title?.toLowerCase().includes(query) ||
          card.name?.toLowerCase().includes(query) ||
          card.company?.toLowerCase().includes(query) ||
          card.email?.toLowerCase().includes(query)
      );
    }

    if (filterStage !== "all") {
      filtered = filtered.filter((card) => card.stage === filterStage);
    }

    return filtered;
  }, [cards, searchQuery, filterStage]);

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        <Sidebar />
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex items-center justify-center"
        >
          <div className="animate-spin w-12 h-12 border-4 border-primary-button border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header Section */}
          <div className="w-full flex flex-col gap-y-4 pb-6 border-b border-theme-sidebar-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-button/20 to-primary-button/10">
                  <BarChart3 size={24} className="text-primary-button" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-theme-text-primary">
                    CRM Pipeline
                  </h1>
                  <p className="text-sm text-theme-text-secondary mt-1">
                    Track and manage your sales opportunities
                  </p>
                </div>

                {pipelines.length > 0 && (
                  <div className="relative ml-4">
                    <select
                      value={selectedPipeline?.id || ""}
                      onChange={(e) => {
                        const p = pipelines.find(
                          (p) => p.id === Number(e.target.value)
                        );
                        setSelectedPipeline(p);
                      }}
                      className="appearance-none px-5 py-2.5 pr-12 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-theme-text-primary focus:outline-none focus:border-primary-button font-medium transition-all"
                    >
                      {pipelines.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="p-2.5 rounded-xl border-2 border-theme-sidebar-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-action-menu-item-hover transition-all"
                  aria-label="CRM settings"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => handleAddCard(stages[0])}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-button to-primary-button/90 text-theme-bg-primary font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus size={18} />
                  Add Lead
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search opportunities..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-none focus:border-primary-button transition-all"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-theme-text-primary focus:outline-none focus:border-primary-button font-medium transition-all"
                >
                  <option value="all">All Stages</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Statistics Dashboard */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="Total Opportunities"
              value={stats.totalCards}
              color="bg-blue-500"
            />
            <StatCard
              icon={DollarSign}
              label="Total Pipeline Value"
              value={`$${stats.totalValue.toLocaleString()}`}
              color="bg-green-500"
            />
            <StatCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={`${stats.conversionRate}%`}
              trend="+2.5%"
              trendUp={true}
              color="bg-purple-500"
            />
            <StatCard
              icon={Activity}
              label="Avg. Deal Size"
              value={`$${Number(stats.avgDealSize).toLocaleString()}`}
              color="bg-orange-500"
            />
          </div>

          {/* Kanban Board */}
          <div className="mt-8 overflow-x-auto pb-8">
            <div className="flex gap-5">
              {stages.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  cards={filteredCards}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  onDragStart={handleDragStart}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDrop={handleDrop}
                  isDragOver={dragOverStage === stage}
                />
              ))}
            </div>
          </div>
        </div>

        <CardModal
          isOpen={showCardModal}
          onClose={() => {
            setShowCardModal(false);
            setEditingCard(null);
          }}
          card={editingCard}
          onSave={handleSaveCard}
          stages={stages}
        />
      </div>
    </div>
  );
}
