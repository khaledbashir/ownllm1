import React, { useState, useEffect } from "react";
import { X, MagnifyingGlass, Plus, Sparkle, NotePencil, CheckCircle } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { toast } from "react-toastify";

export default function FormSelectorModal({ isOpen, onClose, onSelect, workspaceSlug }) {
    const [loading, setLoading] = useState(true);
    const [forms, setForms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchForms();
        }
    }, [isOpen]);

    async function fetchForms() {
        setLoading(true);
        try {
            const fetchedForms = await Workspace.getForms(workspaceSlug);
            setForms(fetchedForms || []);
        } catch (e) {
            console.error("Failed to fetch forms:", e);
            toast.error("Failed to load forms");
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate(e) {
        e.preventDefault();
        if (!prompt.trim()) return;

        setGenerating(true);
        try {
            const result = await Workspace.generateForm(workspaceSlug, { prompt });
            if (result.success && result.form) {
                toast.success("Form generated successfully!");
                onSelect(result.form.uuid);
                onClose();
            } else {
                toast.error(result.error || "Failed to generate form");
            }
        } catch (e) {
            toast.error("An error occurred during generation");
        } finally {
            setGenerating(false);
        }
    }

    if (!isOpen) return null;

    const filteredForms = (forms || []).filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-theme-bg-secondary border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <NotePencil size={24} weight="duotone" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Embed a Form</h2>
                            <p className="text-sm text-slate-400">Select an existing form or generate a new one with AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* AI Generation Section */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Sparkle size={14} weight="fill" className="text-purple-400" />
                            Generate with AI
                        </h3>
                        <form onSubmit={handleGenerate} className="relative group">
                            <input
                                type="text"
                                placeholder="Describe the form you want to create (e.g., 'Customer feedback for my coffee shop')"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-16 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                disabled={generating}
                            />
                            <button
                                type="submit"
                                disabled={generating || !prompt.trim()}
                                className="absolute right-2 top-2 bottom-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                            >
                                {generating ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Sparkle size={16} weight="fill" />
                                )}
                                {generating ? "Generating..." : "Generate"}
                            </button>
                        </form>
                    </section>

                    {/* List Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle size={14} weight="fill" className="text-green-400" />
                                Select Existing Form
                            </h3>
                            <div className="relative">
                                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search forms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <p className="text-sm">Loading your forms...</p>
                                </div>
                            ) : filteredForms.length > 0 ? (
                                filteredForms.map((form) => (
                                    <button
                                        key={form.uuid}
                                        onClick={() => {
                                            onSelect(form.uuid);
                                            onClose();
                                        }}
                                        className="flex flex-col text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{form.title}</span>
                                            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-500 uppercase tracking-tighter">
                                                {(() => {
                                                    try {
                                                        const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : (form.fields || []);
                                                        return Array.isArray(fields) ? fields.length : 0;
                                                    } catch {
                                                        return 0;
                                                    }
                                                })()} fields
                                            </span>
                                        </div>
                                        {form.description && (
                                            <p className="text-xs text-slate-400 line-clamp-1">{form.description}</p>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-sm text-slate-500">
                                        {searchTerm ? "No forms matches your search" : "You haven't created any forms yet"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
