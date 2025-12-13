import React, { useState, useEffect } from "react";
import {
    Plus,
    GripVertical,
    MoreHorizontal,
    User,
    Mail,
    Phone,
    Building,
    X,
    Trash2,
    Edit3,
    DollarSign,
    MessageSquare,
    ChevronDown,
    Settings
} from "lucide-react";
import CRM from "@/models/crm";
import showToast from "@/utils/toast";

// Default pipeline stages with colors
const STAGE_COLORS = {
    "New": "bg-blue-500/20 border-blue-500/50 text-blue-300",
    "Contacted": "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
    "Qualified": "bg-purple-500/20 border-purple-500/50 text-purple-300",
    "Proposal": "bg-orange-500/20 border-orange-500/50 text-orange-300",
    "Won": "bg-green-500/20 border-green-500/50 text-green-300",
    "Lost": "bg-red-500/20 border-red-500/50 text-red-300",
};

function getStageColor(stage) {
    return STAGE_COLORS[stage] || "bg-slate-500/20 border-slate-500/50 text-slate-300";
}

// Card Component
function KanbanCard({ card, onEdit, onDelete, onDragStart }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, card)}
            className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 cursor-grab active:cursor-grabbing transition-all duration-200 group"
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-medium truncate flex-1">{card.title}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(card)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(card.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {(card.name || card.email || card.company) && (
                <div className="space-y-1 text-sm text-slate-400">
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
                <div className="mt-2 flex items-center gap-1 text-green-400 text-sm font-medium">
                    <DollarSign size={14} />
                    {card.value.toLocaleString()}
                </div>
            )}

            {card.embedSessionId && (
                <div className="mt-2 flex items-center gap-1 text-blue-400 text-xs">
                    <MessageSquare size={12} />
                    From embed chat
                </div>
            )}
        </div>
    );
}

// Stage Column Component
function StageColumn({ stage, cards, onAddCard, onEditCard, onDeleteCard, onDragStart, onDragOver, onDrop }) {
    const stageCards = cards.filter(c => c.stage === stage);

    return (
        <div
            className="flex-shrink-0 w-72"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stage)}
        >
            <div className={`px-3 py-2 rounded-t-xl border-b-2 ${getStageColor(stage)}`}>
                <div className="flex items-center justify-between">
                    <span className="font-semibold">{stage}</span>
                    <span className="text-xs opacity-70">{stageCards.length}</span>
                </div>
            </div>

            <div className="min-h-[400px] p-2 rounded-b-xl bg-slate-900/50 border border-t-0 border-slate-700/30 space-y-2">
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
                    className="w-full p-3 rounded-xl border border-dashed border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-all duration-200 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl transform transition-all">
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                    {/* Header with gradient */}
                    <div className="relative px-8 py-6 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent border-b border-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    {card ? "Edit Opportunity" : "New Opportunity"}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">Manage lead details and pipeline status</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Main Title Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Opportunity Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                placeholder="e.g. Enterprise License Deal - Acme Corp"
                                autoFocus
                            />
                        </div>

                        {/* Contact Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <User size={14} className="text-blue-400" />
                                    Contact Info
                                </h4>
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                            placeholder="Contact Name"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                            placeholder="Company Name"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-blue-500/50 focus:outline-none transition-colors"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <Settings size={14} className="text-purple-400" />
                                    Deal Settings
                                </h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Pipeline Stage</label>
                                        <div className="relative">
                                            <select
                                                value={formData.stage}
                                                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-purple-500/50 focus:outline-none appearance-none cursor-pointer"
                                            >
                                                {stages.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Est. Value ($)</label>
                                        <div className="relative group">
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                                            <input
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white focus:border-green-500/50 focus:outline-none transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500">Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-lg bg-slate-950/30 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none resize-none min-h-[88px]"
                                            placeholder="Add notes about this deal..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-slate-800/50">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500 transition-all duration-200"
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
                setCards(cards.map(c => c.id === cardId ? { ...c, ...formData } : c));
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
            setCards(cards.filter(c => c.id !== cardId));
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
        setCards(cards.map(c =>
            c.id === draggedCard.id ? { ...c, stage: newStage } : c
        ));

        // API call
        const res = await CRM.moveCard(draggedCard.id, newStage);
        if (!res.success) {
            // Revert on failure
            setCards(cards);
            showToast("Failed to move card", "error");
        }
        setDraggedCard(null);
    };

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-950">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const stages = selectedPipeline?.stages || ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="border-b border-slate-800 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">Pipeline</h1>

                        {/* Pipeline Selector */}
                        {pipelines.length > 0 && (
                            <div className="relative">
                                <select
                                    value={selectedPipeline?.id || ""}
                                    onChange={(e) => {
                                        const p = pipelines.find(p => p.id === Number(e.target.value));
                                        setSelectedPipeline(p);
                                    }}
                                    className="appearance-none px-4 py-2 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                                >
                                    {pipelines.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => handleAddCard(stages[0])}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                        >
                            <Plus size={18} />
                            Add Lead
                        </button>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="p-6 overflow-x-auto">
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

            {/* Card Modal */}
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
    );
}
