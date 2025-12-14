import React, { useState, useEffect } from "react";
import { CaretDown, GearSix } from "@phosphor-icons/react";
import System from "@/models/system";

const STORAGE_KEY = "flowBuilderChatModel";

/**
 * Model selector dropdown for Flow Builder Chat
 * @param {Object} props
 * @param {function} props.onModelChange - Callback when model changes
 * @param {string} props.selectedModel - Currently selected model
 */
export default function ModelSelector({ onModelChange, selectedModel }) {
    const [isOpen, setIsOpen] = useState(false);
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        async function fetchModels() {
            try {
                setLoading(true);
                const settings = await System.keys();
                const currentProvider = settings?.LLMProvider || "openai";
                setProvider(currentProvider);

                // Get custom models for current provider
                const { models: fetchedModels } = await System.customModels(currentProvider);
                setModels(fetchedModels || []);

                // Set initial model from localStorage or first available
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored && fetchedModels?.some(m => m.id === stored)) {
                    onModelChange?.(stored);
                } else if (fetchedModels?.length > 0) {
                    const defaultModel = settings?.[`${currentProvider}ModelPref`] || fetchedModels[0]?.id;
                    onModelChange?.(defaultModel);
                }
            } catch (error) {
                console.error("Error fetching models:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchModels();
    }, []);

    const handleSelect = (modelId) => {
        localStorage.setItem(STORAGE_KEY, modelId);
        onModelChange?.(modelId);
        setIsOpen(false);
    };

    const selectedModelName = models.find(m => m.id === selectedModel)?.name || selectedModel || "Default";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className="flex items-center gap-x-1.5 px-2 py-1 rounded-md bg-theme-action-menu-bg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary text-xs transition-all"
            >
                <GearSix size={12} weight="fill" />
                <span className="max-w-[100px] truncate">
                    {loading ? "Loading..." : selectedModelName}
                </span>
                <CaretDown
                    size={10}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && !loading && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-theme-bg-primary border border-theme-modal-border rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-theme-modal-border">
                            <p className="text-xs text-theme-text-secondary uppercase tracking-wider">
                                {provider} Models
                            </p>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {models.length === 0 ? (
                                <div className="px-3 py-4 text-center text-theme-text-secondary text-xs">
                                    No models available
                                </div>
                            ) : (
                                models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model.id)}
                                        className={`w-full flex items-center px-3 py-2 text-left text-sm transition-colors ${selectedModel === model.id
                                            ? "bg-primary-button/20 text-primary-button"
                                            : "text-theme-text-primary hover:bg-theme-action-menu-item-hover"
                                            }`}
                                    >
                                        <span className="truncate">{model.name || model.id}</span>
                                        {selectedModel === model.id && (
                                            <span className="ml-auto text-xs text-primary-button">✓</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
