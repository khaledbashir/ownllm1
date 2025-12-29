import React, { useEffect, useState, useMemo } from "react";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/SettingsSidebar";
import {
  Activity,
  BarChart3,
  DollarSign,
  Filter,
  Plus,
  Search,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import CRM from "@/models/crm";
import showToast from "@/utils/toast";

// Components
import PipelineBoard from "./components/PipelineBoard";
import PipelineManager from "./components/PipelineManager";
import CardModal from "./components/CardModal";

// Stat Card Component (Local)
function StatCard({ icon: Icon, label, value, trend, trendUp, colorClass }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-theme-bg-secondary border border-theme-sidebar-border p-5 transition-all duration-300 group hover:border-theme-text-secondary/30">
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border ${colorClass}`}>
              <Icon size={20} />
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
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trendUp
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
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

export default function CRMPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPipelineManager, setShowPipelineManager] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  // Drag & Drop
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // Filters
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
      // Keep selected pipeline if it still exists, otherwise select first
      if (selectedPipeline) {
        const stillExists = res.pipelines.find(p => p.id === selectedPipeline.id);
        if (stillExists) setSelectedPipeline(stillExists);
        else setSelectedPipeline(res.pipelines[0]);
      } else {
        setSelectedPipeline(res.pipelines[0]);
      }
    } else if (res.success && res.pipelines.length === 0) {
      // Create default if none exist
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

  const handlePipelineUpdate = () => {
    loadPipelines();
  };

  // Card Actions
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
        setCards(cards.map((c) => (c.id === cardId ? { ...c, ...formData } : c)));
        showToast("Opportunity updated", "success");
      }
    } else {
      const res = await CRM.createCard({
        ...formData,
        pipelineId: selectedPipeline.id,
      });
      if (res.success) {
        setCards([...cards, res.card]);
        showToast("Opportunity created", "success");
      }
    }
    setShowCardModal(false);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?")) return;
    const res = await CRM.deleteCard(cardId);
    if (res.success) {
      setCards(cards.filter((c) => c.id !== cardId));
      showToast("Opportunity deleted", "success");
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedCard || draggedCard.stage === newStage) {
      setDraggedCard(null);
      return;
    }

    // Optimistic update
    const oldStage = draggedCard.stage;
    const updatedCards = cards.map((c) =>
      c.id === draggedCard.id ? { ...c, stage: newStage } : c
    );
    setCards(updatedCards);

    const res = await CRM.moveCard(draggedCard.id, newStage);
    if (!res.success) {
      // Revert on failure
      setCards(cards);
      showToast("Failed to move card", "error");
    }
    setDraggedCard(null);
  };

  const stages = selectedPipeline?.stages || [];

  // Statistics
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalValue = cards.reduce((sum, card) => sum + (Number(card.value) || 0), 0);
    const wonCards = cards.filter((c) => c.stage === "Won").length;

    // Calculate conversion rate properly: Won / (Total - Active) or just Won / Total
    // Simple verification check
    const conversionRate = totalCards > 0 ? ((wonCards / totalCards) * 100).toFixed(1) : 0;
    const avgDealSize = wonCards > 0 ? (totalValue / wonCards).toFixed(0) : 0;

    return {
      totalCards,
      totalValue,
      conversionRate,
      avgDealSize,
    };
  }, [cards]);

  // Filtering
  const filteredCards = useMemo(() => {
    let filtered = cards;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.title?.toLowerCase().includes(query) ||
          card.name?.toLowerCase().includes(query) ||
          card.company?.toLowerCase().includes(query)
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
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-theme-button-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex flex-col overflow-hidden"
      >
        <div className="flex flex-col w-full h-full">
          {/* Top Bar */}
          <div className="px-6 py-6 border-b border-theme-sidebar-border shrink-0 bg-theme-bg-secondary">
            <div className="flex flex-col gap-6">
              {/* Title & Actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-theme-bg-primary border border-theme-sidebar-border">
                    <BarChart3 size={24} className="text-theme-button-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-theme-text-primary tracking-tight">
                      CRM Pipeline
                    </h1>
                    <p className="text-sm text-theme-text-secondary mt-0.5 font-medium">
                      Manage opportunities and sales flow
                    </p>
                  </div>

                  {/* Pipeline Selector */}
                  {pipelines.length > 0 && (
                    <div className="relative ml-6 h-10 w-64">
                      <select
                        value={selectedPipeline?.id || ""}
                        onChange={(e) => {
                          const p = pipelines.find((p) => p.id === Number(e.target.value));
                          setSelectedPipeline(p);
                        }}
                        className="w-full h-full pl-4 pr-10 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border text-theme-text-primary focus:outline-none focus:border-theme-button-primary font-medium transition-all appearance-none cursor-pointer hover:border-theme-text-secondary/50"
                      >
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
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
                    onClick={() => setShowPipelineManager(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border text-theme-text-secondary hover:text-theme-text-primary hover:border-theme-text-secondary/50 transition-all text-sm font-medium"
                  >
                    <Settings size={18} />
                    <span>Pipelines</span>
                  </button>
                  <button
                    onClick={() => handleAddCard(stages[0])}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-theme-button-primary text-theme-bg-primary font-bold hover:opacity-90 transition-all text-sm shadow-lg shadow-theme-button-primary/20"
                  >
                    <Plus size={18} />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>

              {/* Stats & Search Row */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-end lg:items-center">
                {/* Quick Stats (Compact) */}
                <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto text-theme-text-primary">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Target size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-text-secondary uppercase font-bold">Opportunities</p>
                      <p className="text-lg font-bold leading-none">{stats.totalCards}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border">
                    <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-text-secondary uppercase font-bold">Pipeline Value</p>
                      <p className="text-lg font-bold leading-none">${stats.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] text-theme-text-secondary uppercase font-bold">Conv. Rate</p>
                      <p className="text-lg font-bold leading-none">{stats.conversionRate}%</p>
                    </div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-64">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search leads..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border text-theme-text-primary placeholder:text-theme-text-secondary/50 focus:outline-none focus:border-theme-button-primary transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Board Area */}
          <div className="flex-1 overflow-hidden bg-theme-bg-secondary p-2 lg:p-6">
            <PipelineBoard
              stages={stages}
              cards={filteredCards}
              onAddCard={handleAddCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              dragOverStage={dragOverStage}
              setDragOverStage={setDragOverStage}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
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

      <PipelineManager
        isOpen={showPipelineManager}
        onClose={() => setShowPipelineManager(false)}
        pipelines={pipelines}
        onUpdate={handlePipelineUpdate}
      />
    </div>
  );
}
