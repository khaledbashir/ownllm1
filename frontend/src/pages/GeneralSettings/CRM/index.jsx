import React, { useEffect, useState, useMemo, useCallback } from "react";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/SettingsSidebar";
import {
  Activity,
  BarChart3,
  DollarSign,
  Plus,
  Search,
  Settings,
  Target,
  ChevronDown,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Filter,
  X,
  Sparkles
} from "lucide-react";
import CRM from "@/models/crm";
import Workspace from "@/models/workspace";
import WorkspaceThread from "@/models/workspaceThread";
import showToast from "@/utils/toast";
import paths from "@/utils/paths";
import { useIsAgentSessionActive } from "@/utils/chat/agent";

// Chat
import WorkspaceChatContainer from "@/components/WorkspaceChat";

// Components
import PipelineBoard from "./components/PipelineBoard";
import PipelineManager from "./components/PipelineManager";
import CardModal from "./components/CardModal";

export default function CRMPage() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWorkspace, setChatWorkspace] = useState(null);
  const [crmThreadSlug, setCrmThreadSlug] = useState(null);
  const [crmThreads, setCrmThreads] = useState([]);
  const isAgentActive = useIsAgentSessionActive();

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
    loadWorkspace();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      loadCards(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  const handleNewThread = async () => {
    if (!chatWorkspace) return;
    try {
      const { thread, error } = await WorkspaceThread.new(chatWorkspace.slug);
      if (thread) {
        // Automatically name it so it's not "Untitled"
        await WorkspaceThread.update(chatWorkspace.slug, thread.slug, { name: `Assistant Session ${new Date().toLocaleDateString()}` });
        const { threads } = await WorkspaceThread.all(chatWorkspace.slug);
        setCrmThreads(threads);
        setCrmThreadSlug(thread.slug);
        showToast("New assistant thread started", "success");
      } else {
        showToast(error || "Failed to create thread", "error");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadWorkspace = async () => {
    try {
      // Try to get the dedicated CRM workspace
      let ws = await Workspace.bySlug("crm");

      if (!ws) {
        // Create it if it doesn't exist (mirroring Lab pattern)
        const { workspace: newWs, message } = await Workspace.new({
          name: "CRM",
          openAiTemp: 0.2, // Lower temp for more consistent data handling
        });

        if (newWs) {
          ws = newWs;
        } else {
          console.error("[CRM] Failed to create CRM workspace:", message);
          // Fallback to first available if CRM creation fails
          const workspaces = await Workspace.all();
          if (workspaces.length > 0) {
            ws = await Workspace.bySlug(workspaces[0].slug);
          }
        }
      }

      if (ws) {
        setChatWorkspace(ws);

        // Update system prompt to enforce CRM focus
        const CRM_PROMPT = `You are the AI Sales Assistant. Your primary goal is to help manage leads, pipelines, and opportunities in the CRM.
Use the crm-manager tools to create, update, move, or list leads. 
Always aim for accuracy in data entry.`;

        // Only update if prompt is different to avoid unnecessary writes
        if (ws.openAiPrompt !== CRM_PROMPT) {
          await Workspace.update(ws.slug, { openAiPrompt: CRM_PROMPT });
        }

        // Find or create a dedicated CRM thread
        const { threads } = await WorkspaceThread.all(ws.slug);
        const resolvedThreads = Array.isArray(threads) ? threads : [];
        setCrmThreads(resolvedThreads);

        const crmThread = resolvedThreads.find(t => t.name === "CRM Assistant");
        if (crmThread) {
          setCrmThreadSlug(crmThread.slug);
        } else {
          // Create a new CRM thread if none exist or specific one not found
          const { thread: newThread } = await WorkspaceThread.new(ws.slug);
          if (newThread) {
            await WorkspaceThread.update(ws.slug, newThread.slug, { name: "CRM Assistant" });
            setCrmThreadSlug(newThread.slug);
            // Refresh threads list
            const { threads: updatedThreads } = await WorkspaceThread.all(ws.slug);
            setCrmThreads(Array.isArray(updatedThreads) ? updatedThreads : []);
          }
        }

        // Ensure the workspace has an LLM provider set if it's currently 'none' or null
        // inheriting from system defaults if possible.
        if (!ws.chatProvider || ws.chatProvider === "none") {
          await Workspace.update(ws.slug, {
            chatProvider: process.env.LLM_PROVIDER,
            chatModel: process.env.OPEN_MODEL_PREF,
            agentProvider: process.env.LLM_PROVIDER,
            agentModel: process.env.OPEN_MODEL_PREF,
          });
        }
      }
    } catch (e) {
      console.error("[CRM] Failed to load workspace context:", e);
    }
  };

  const loadPipelines = async () => {
    try {
      const res = await CRM.listPipelines();
      if (res.success && res.pipelines.length > 0) {
        setPipelines(res.pipelines);
        if (selectedPipeline) {
          const stillExists = res.pipelines.find(p => p.id === selectedPipeline.id);
          if (stillExists) setSelectedPipeline(stillExists);
          else setSelectedPipeline(res.pipelines[0]);
        } else {
          setSelectedPipeline(res.pipelines[0]);
        }
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
    } catch (e) {
      console.error("[CRM] Failed to load pipelines:", e);
      showToast("Failed to load CRM pipelines", "error");
    } finally {
      setLoading(false);
    }
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

    const updatedCards = cards.map((c) =>
      c.id === draggedCard.id ? { ...c, stage: newStage } : c
    );
    setCards(updatedCards);

    const res = await CRM.moveCard(draggedCard.id, newStage);
    if (!res.success) {
      setCards(cards);
      showToast("Failed to move card", "error");
    }
    setDraggedCard(null);
  };

  // PRAGMATIC TOOL HANDLER FOR CHAT
  const handleToolCall = useCallback(async (tool, args) => {
    console.log("[CRM] Chat invoking tool:", tool, args);
    try {
      if (tool === "create_lead" || tool === "create_opportunity") {
        const { title, value, stage, company, name, email } = args;
        if (!title) throw new Error("Title is required");

        const targetStage = stage || selectedPipeline?.stages[0] || "New";

        const res = await CRM.createCard({
          pipelineId: selectedPipeline?.id,
          title,
          value: value || 0,
          stage: targetStage,
          company,
          name,
          email
        });

        if (res.success) {
          showToast(`Agent created lead: ${title}`, "success");
          loadCards(selectedPipeline?.id);
          return "Successfully created lead.";
        } else {
          throw new Error(res.error);
        }
      }

      if (tool === "list_leads") {
        const stage = args.stage;
        let found = cards;
        if (stage) found = cards.filter(c => c.stage.toLowerCase() === stage.toLowerCase());
        return JSON.stringify(found.map(c => ({ id: c.id, title: c.title, value: c.value, stage: c.stage })));
      }

    } catch (e) {
      console.error(e);
      showToast(`Agent failed to execute ${tool}: ${e.message}`, "error");
    }
  }, [selectedPipeline, cards]);

  const stages = selectedPipeline?.stages || [];

  // Statistics
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const totalValue = cards.reduce((sum, card) => sum + (Number(card.value) || 0), 0);
    const wonCards = cards.filter((c) => c.stage === "Won").length;
    const conversionRate = totalCards > 0 ? ((wonCards / totalCards) * 100).toFixed(1) : 0;

    return {
      totalCards,
      totalValue,
      conversionRate,
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
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-theme-button-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#141414] text-white flex">
      {/* Sidebar Panel */}
      {sidebarVisible && !isMobile && (
        <div className="flex-shrink-0 z-20 h-full relative">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">

        {/* Modern Glass Header */}
        <div className="px-8 py-5 border-b border-white/5 bg-[#141414]/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center justify-between gap-6">

            <div className="flex items-center gap-6">
              <button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="p-2 -ml-2 rounded-xl text-white hover:bg-white/10 transition-all font-bold"
              >
                {sidebarVisible ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                    <LayoutDashboard size={24} className="text-[#007AFF]" />
                    CRM
                  </h1>
                  {pipelines.length > 0 && (
                    <div className="relative group">
                      <select
                        value={selectedPipeline?.id || ""}
                        onChange={(e) => {
                          const p = pipelines.find((p) => p.id === Number(e.target.value));
                          setSelectedPipeline(p);
                        }}
                        className="bg-transparent text-xl font-bold text-white hover:text-[#007AFF] cursor-pointer appearance-none pl-0 pr-8 focus:outline-none transition-colors"
                      >
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-white pointer-events-none group-hover:text-[#007AFF] transition-colors" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick StatsRow */}
              <div className="hidden lg:flex items-center gap-8 text-sm mx-6 px-6 border-l border-r border-white/10">
                <div className="flex flex-col items-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Total Value</span>
                  <span className="text-lg font-mono font-bold text-white tracking-wide">${stats.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Deals</span>
                  <span className="text-lg font-mono font-bold text-white tracking-wide">{stats.totalCards}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Win Rate</span>
                  <span className="text-lg font-mono font-bold text-green-400 tracking-wide">{stats.conversionRate}%</span>
                </div>
              </div>

              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`
                     relative overflow-hidden group flex items-center gap-2 px-5 py-3 rounded-xl border-2 transition-all duration-300
                     ${chatOpen
                    ? "bg-white/10 border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] font-bold"
                    : "bg-transparent border-white/10 text-white/80 hover:text-white hover:border-white/40 font-semibold"
                  }
                   `}
              >
                <MessageSquare size={20} />
                <span className="text-sm">Assistant</span>
              </button>

              <div className="h-8 w-[1px] bg-white/10" />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPipelineManager(true)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/15 transition-all shadow-md"
                  title="Manage Pipelines"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => handleAddCard(stages[0])}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#007AFF] text-white font-bold hover:bg-[#0062cc] hover:scale-105 transition-all text-sm shadow-[0_4px_14px_rgba(0,122,255,0.4)]"
                >
                  <Plus size={20} />
                  <span className="hidden md:inline">Add Lead</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white focus:border-[#007AFF]/50 focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/30 shadow-inner"
              />
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setFilterStage("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStage === 'all' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
              >
                All
              </button>
              {stages.slice(0, 3).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStage(s)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStage === s ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Board & Chat Container */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Pipeline Board */}
          <div className="flex-1 overflow-hidden bg-[#141414] p-6 flex flex-col">
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

          {/* Sliding Chat Panel */}
          <div
            className={`
               absolute right-0 top-0 bottom-0 z-30
               transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] 
               bg-[#1a1a1a]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl
               ${chatOpen ? "w-[450px] translate-x-0" : "w-[450px] translate-x-full pointer-events-none opacity-0"}
             `}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#007AFF] to-blue-600">
                  <MessageSquare size={16} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Assistant
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/10 text-white/50">Active Session</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {crmThreads.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={crmThreadSlug}
                          onChange={(e) => setCrmThreadSlug(e.target.value)}
                          className="bg-transparent text-[10px] text-blue-400 font-bold hover:text-blue-300 cursor-pointer appearance-none border-none outline-none p-0 m-0"
                        >
                          {crmThreads.map(t => (
                            <option key={t.slug} value={t.slug} className="bg-[#1a1a1a]">
                              {t.name === "CRM Assistant" ? "Main Assistant" : t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewThread}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-all"
                title="New Assistant Session"
              >
                <Plus size={12} />
                New Session
              </button>
              <a
                href={paths.workspace.settings.generalAppearance(chatWorkspace?.slug)}
                target="_blank"
                className="p-2 text-white/30 hover:text-white transition-colors"
                title="Session Settings"
              >
                <Settings size={14} />
              </a>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 text-white/30 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Agent Status Indicator */}
          {isAgentActive && (
            <div className="px-6 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping absolute inset-0" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 relative" />
                </div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  Agent Executing Skill
                </span>
              </div>
              <Sparkles size={12} className="text-blue-400 animate-pulse" />
            </div>
          )}

          {/* Chat Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {chatWorkspace ? (
              <WorkspaceChatContainer
                workspace={chatWorkspace}
                externalToolHandler={handleToolCall}
                chatOnly={false}
                threadSlug={crmThreadSlug}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white/40">
                <Settings size={48} className="mb-4 text-white/10" />
                <p className="mb-2">No workspace selected</p>
                <p className="text-xs max-w-[200px]">Please configure at least one workspace to enable the AI assistant.</p>
              </div>
            )}
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
