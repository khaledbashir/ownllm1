import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/SettingsSidebar";
import {
  Building,
  ChevronDown,
  DollarSign,
  Edit3,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Settings,
  Trash2,
  User,
  X,
} from "lucide-react";
import CRM from "@/models/crm";
import showToast from "@/utils/toast";

// Default pipeline stages with colors
const STAGE_COLORS = {
  New: "bg-blue-500/15 border-blue-500/40 text-blue-300 light:text-blue-700",
  Contacted:
    "bg-yellow-500/15 border-yellow-500/40 text-yellow-300 light:text-yellow-700",
  Qualified:
    "bg-purple-500/15 border-purple-500/40 text-purple-300 light:text-purple-700",
  Proposal:
    "bg-orange-500/15 border-orange-500/40 text-orange-300 light:text-orange-700",
  Won: "bg-green-500/15 border-green-500/40 text-green-300 light:text-green-700",
  Lost: "bg-red-500/15 border-red-500/40 text-red-300 light:text-red-700",
};

function getStageColor(stage) {
  return (
    STAGE_COLORS[stage] ||
    "bg-theme-bg-container border-theme-sidebar-border text-theme-text-secondary"
  );
}

// Card Component
function KanbanCard({ card, onEdit, onDelete, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-sidebar-border hover:border-theme-chat-input-border cursor-grab active:cursor-grabbing transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-theme-text-primary font-medium truncate flex-1">
          {card.title}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(card)}
            className="p-1 rounded hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            className="p-1 rounded hover:bg-theme-button-delete-hover-bg text-theme-text-secondary hover:text-theme-button-delete-hover-text"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {(card.name || card.email || card.company) && (
        <div className="space-y-1 text-sm text-theme-text-secondary">
          {card.name && (
            <div className="flex items-center gap-2">
              <User size={12} />
              <span className="truncate">{card.name}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2">
              <Mail size={12} />
              <span className="truncate">{card.email}</span>
            </div>
          )}
          {card.company && (
            <div className="flex items-center gap-2">
              <Building size={12} />
              <span className="truncate">{card.company}</span>
            </div>
          )}
        </div>
      )}

      {card.value && (
        <div className="mt-2 flex items-center gap-1 text-green-400 light:text-green-700 text-sm font-medium">
          <DollarSign size={14} />
          {card.value.toLocaleString()}
        </div>
      )}

      {card.embedSessionId && (
        <div className="mt-2 flex items-center gap-1 text-blue-400 light:text-blue-700 text-xs">
          <MessageSquare size={12} />
          From embed chat
        </div>
      )}
    </div>
  );
}

// Stage Column Component
function StageColumn({
  stage,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const stageCards = cards.filter((c) => c.stage === stage);

  return (
    <div
      className="flex-shrink-0 w-72"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage)}
    >
      <div className={`px-3 py-2 rounded-t-xl border ${getStageColor(stage)}`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{stage}</span>
          <span className="text-xs opacity-70">{stageCards.length}</span>
        </div>
      </div>

      <div className="min-h-[400px] p-2 rounded-b-xl bg-theme-bg-primary border border-t-0 border-theme-sidebar-border space-y-2">
        {stageCards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onDragStart={onDragStart}
          />
        ))}

        <button
          onClick={() => onAddCard(stage)}
          className="w-full p-3 rounded-xl border border-dashed border-theme-sidebar-border text-theme-text-secondary hover:border-theme-chat-input-border hover:bg-theme-action-menu-item-hover transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Card
        </button>
      </div>
    </div>
  );
}

// Card Modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl transform transition-all">
        <div className="relative overflow-hidden rounded-2xl bg-theme-bg-secondary border border-theme-modal-border shadow-2xl">
          <div className="relative px-6 py-4 border-b border-theme-sidebar-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-theme-text-primary">
                  {card ? "Edit Opportunity" : "New Opportunity"}
                </h3>
                <p className="text-theme-text-secondary text-sm mt-1">
                  Manage lead details and pipeline status
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
                Opportunity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-theme-settings-input-bg border border-theme-sidebar-border text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-none focus:border-primary-button transition-colors"
                placeholder="e.g. Enterprise License Deal - Acme Corp"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-theme-text-primary flex items-center gap-2">
                  <User size={14} className="text-primary-button" />
                  Contact Info
                </h4>
                <div className="space-y-3">
                  <div className="relative group">
                    <User
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none transition-colors placeholder:text-theme-settings-input-placeholder"
                      placeholder="Contact Name"
                    />
                  </div>
                  <div className="relative group">
                    <Building
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none transition-colors placeholder:text-theme-settings-input-placeholder"
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="relative group">
                    <Mail
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none transition-colors placeholder:text-theme-settings-input-placeholder"
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="relative group">
                    <Phone
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none transition-colors placeholder:text-theme-settings-input-placeholder"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-theme-text-primary flex items-center gap-2">
                  <Settings size={14} className="text-primary-button" />
                  Deal Settings
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-theme-text-secondary">
                      Pipeline Stage
                    </label>
                    <div className="relative">
                      <select
                        value={formData.stage}
                        onChange={(e) =>
                          setFormData({ ...formData, stage: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none appearance-none cursor-pointer"
                      >
                        {stages.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-theme-text-secondary">
                      Est. Value ($)
                    </label>
                    <div className="relative group">
                      <DollarSign
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-primary-button transition-colors"
                      />
                      <input
                        type="number"
                        value={formData.value}
                        onChange={(e) =>
                          setFormData({ ...formData, value: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary focus:border-primary-button focus:outline-none transition-colors placeholder:text-theme-settings-input-placeholder"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-theme-text-secondary">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-theme-settings-input-bg border border-theme-sidebar-border text-sm text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:border-primary-button focus:outline-none resize-none min-h-[88px]"
                      placeholder="Add notes about this deal..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/10 light:border-theme-sidebar-border border-opacity-10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-theme-sidebar-border text-theme-text-secondary hover:bg-theme-action-menu-item-hover hover:text-theme-text-primary transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl bg-primary-button text-theme-bg-primary font-bold hover:opacity-90 transition-opacity"
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
      // Create default pipeline
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
      // Update
      const res = await CRM.updateCard(cardId, formData);
      if (res.success) {
        setCards(
          cards.map((c) => (c.id === cardId ? { ...c, ...formData } : c))
        );
        showToast("Card updated", "success");
      }
    } else {
      // Create
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

  // Drag and Drop
  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.stage === newStage) {
      setDraggedCard(null);
      return;
    }

    // Optimistic update
    setCards(
      cards.map((c) =>
        c.id === draggedCard.id ? { ...c, stage: newStage } : c
      )
    );

    // API call
    const res = await CRM.moveCard(draggedCard.id, newStage);
    if (!res.success) {
      // Revert on failure
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

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        <Sidebar />
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex items-center justify-center"
        >
          <div className="animate-spin w-8 h-8 border-2 border-primary-button border-t-transparent rounded-full" />
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
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 light:border-theme-sidebar-border border-b-2 border-opacity-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <p className="text-lg leading-6 font-bold text-theme-text-primary">
                  CRM Pipeline
                </p>

                {pipelines.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedPipeline?.id || ""}
                      onChange={(e) => {
                        const p = pipelines.find(
                          (p) => p.id === Number(e.target.value)
                        );
                        setSelectedPipeline(p);
                      }}
                      className="appearance-none px-4 py-2 pr-10 rounded-xl bg-theme-settings-input-bg border border-theme-sidebar-border text-theme-text-primary focus:outline-none focus:border-primary-button"
                    >
                      {pipelines.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="p-2 rounded-xl border border-theme-sidebar-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-action-menu-item-hover transition-colors"
                  aria-label="CRM settings"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => handleAddCard(stages[0])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-button text-theme-bg-primary font-bold hover:opacity-90 transition-opacity"
                >
                  <Plus size={18} />
                  Add Lead
                </button>
              </div>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
              Organize leads by stage, drag cards across columns, and quickly edit
              opportunity details.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto pb-8">
            <div className="flex gap-4">
              {stages.map((stage) => (
                <StageColumn
                  key={stage}
                  stage={stage}
                  cards={cards}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
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
