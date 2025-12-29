import React from "react";
import { Plus } from "lucide-react";
import KanbanCard from "./KanbanCard";

// Simple color mapping for stage accents (bullet points only)
const STAGE_ACCENTS = [
    "bg-blue-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-pink-500",
];

export default function PipelineBoard({
    stages,
    cards,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onDragStart,
    onDrop,
    dragOverStage,
    setDragOverStage
}) {
    const getStageCards = (stage) => cards.filter((c) => c.stage === stage);

    const handleDragOver = (e, stage) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverStage(stage);
    };

    return (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full gap-4 px-4 pb-4 min-w-max">
                {stages.map((stage, index) => {
                    const stageCards = getStageCards(stage);
                    const accentColor = STAGE_ACCENTS[index % STAGE_ACCENTS.length];
                    const isDragOver = dragOverStage === stage;
                    const totalValue = stageCards.reduce((sum, card) => sum + (Number(card.value) || 0), 0);

                    return (
                        <div
                            key={stage}
                            onDragOver={(e) => handleDragOver(e, stage)}
                            onDrop={(e) => onDrop(e, stage)}
                            className={`flex flex-col w-[320px] rounded-2xl bg-theme-bg-primary border border-theme-sidebar-border transition-all duration-200 ${isDragOver ? "ring-2 ring-theme-button-primary ring-opacity-50 bg-theme-bg-primary/50" : ""
                                }`}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-theme-sidebar-border shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
                                        <h3 className="font-bold text-theme-text-primary text-sm tracking-wide">
                                            {stage}
                                        </h3>
                                    </div>
                                    <span className="text-xs font-semibold text-theme-text-secondary bg-theme-bg-secondary px-2 py-0.5 rounded-full border border-theme-sidebar-border">
                                        {stageCards.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                                    <span>Total Value</span>
                                    <span className="font-medium text-theme-text-primary">
                                        ${totalValue.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Column Body - Virtualized-ready container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {stageCards.map((card) => (
                                    <KanbanCard
                                        key={card.id}
                                        card={card}
                                        onEdit={onEditCard}
                                        onDelete={onDeleteCard}
                                        onDragStart={onDragStart}
                                        isDragging={false} // State logic handles global drag state, local effect handled purely by css class if passed
                                    />
                                ))}

                                <button
                                    onClick={() => onAddCard(stage)}
                                    className="w-full py-3 rounded-xl border border-dashed border-theme-sidebar-border text-theme-text-secondary hover:border-theme-button-primary hover:text-theme-button-primary hover:bg-theme-button-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                                >
                                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                                    Add Opportunity
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
