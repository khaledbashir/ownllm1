import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Workspace from "@/models/workspace";
import { FullScreenLoader } from "@/components/Preloader";
import {
    Plus,
    NotePencil,
    Trash,
    ChartBar,
    ShareNetwork,
    MagicWand
} from "@phosphor-icons/react";
import paths from "@/utils/paths";
import CreateFormModal from "@/components/Modals/CreateFormModal";
import AIFormModal from "@/components/Modals/AIFormModal";

export default function WorkspaceForms({ workspace }) {
    const slug = workspace?.slug;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [apps, setApps] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!slug) return;
            const _forms = await Workspace.getForms(slug);
            setApps(_forms);
            setLoading(false);
        }
        fetchData();
    }, [slug]);

    const handleCreateForm = async ({ title, description }) => {
        const res = await Workspace.createForm(slug, { title, description });
        if (res.success) {
            navigate(paths.forms.builder(slug, res.form.uuid));
        }
    };

    const handleAIGenerate = async (prompt) => {
        const res = await Workspace.generateForm(slug, { prompt });
        if (res.success) {
            navigate(paths.forms.builder(slug, res.form.uuid));
        }
    };

    const handleDelete = async (uuid) => {
        if (!confirm("Are you sure you want to delete this form?")) return;
        const success = await Workspace.deleteForm(slug, uuid);
        if (success.success) {
            setApps(apps.filter(a => a.uuid !== uuid));
        }
    };

    if (loading) return <div className="p-8"><FullScreenLoader /></div>;

    return (
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Workspace Forms</h2>
                        <p className="text-slate-400 text-sm">Create and manage AI-powered forms for this workspace.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <Plus weight="bold" />
                            New Form
                        </button>
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-white text-sm font-medium hover:bg-slate-600 transition-all"
                            onClick={() => setShowAIModal(true)}
                        >
                            <MagicWand weight="fill" className="text-yellow-400" />
                            AI Builder
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {apps.map(form => (
                        <div key={form.uuid} className="bg-theme-bg-secondary rounded-xl p-5 border border-white/5 hover:border-blue-500/30 transition-all group relative">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                                    <NotePencil size={20} className="text-blue-400" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={paths.forms.builder(slug, form.uuid)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                                        <NotePencil size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(form.uuid)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-md font-semibold text-white mb-1 truncate">{form.title}</h3>
                            <p className="text-slate-400 text-xs mb-4 line-clamp-2 h-8">{form.description || "No description provided."}</p>

                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <ChartBar size={14} />
                                        <span>Responses</span>
                                    </div>
                                </div>
                                {form.isPublic && (
                                    <Link to={paths.forms.public(form.uuid)} target="_blank" className="flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                        <ShareNetwork size={12} />
                                        Public
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {apps.length === 0 && (
                        <div
                            className="col-span-full py-10 text-center border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus size={24} className="text-slate-400" />
                            </div>
                            <h3 className="text-md font-semibold text-white mb-1">Create your first form</h3>
                            <p className="text-slate-400 text-xs">Start from scratch or use AI to generate one.</p>
                        </div>
                    )}
                </div>
            </div>

            <CreateFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateForm}
            />

            <AIFormModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleAIGenerate}
            />
        </div>
    );
}
