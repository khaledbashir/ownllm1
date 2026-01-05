import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Workspace from "@/models/workspace";
import Sidebar from "@/components/Sidebar";
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
import { isMobile } from "react-device-detect";
import CreateFormModal from "@/components/Modals/CreateFormModal";
import AIFormModal from "@/components/Modals/AIFormModal";

export default function WorkspaceFormsDashboard() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [apps, setApps] = useState([]);
    const [workspace, setWorkspace] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const _workspace = await Workspace.bySlug(slug);
            if (!_workspace) return;
            setWorkspace(_workspace);

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

    if (loading) return <FullScreenLoader />;

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            {!isMobile && <Sidebar />}
            <div className="flex-1 h-full overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">My Forms</h1>
                            <p className="text-slate-400">Manage and create AI-powered forms for your workspace.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-all"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <Plus weight="bold" />
                                New Form
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-white font-medium hover:bg-slate-600 transition-all"
                                onClick={() => setShowAIModal(true)}
                            >
                                <MagicWand weight="fill" className="text-yellow-400" />
                                AI Builder
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {apps.map(form => (
                            <div key={form.uuid} className="bg-theme-bg-secondary rounded-xl p-6 border border-white/5 hover:border-blue-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <NotePencil size={24} className="text-blue-400" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link to={paths.forms.builder(slug, form.uuid)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white">
                                            <NotePencil />
                                        </Link>
                                        <button onClick={() => handleDelete(form.uuid)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400">
                                            <Trash />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2">{form.title}</h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{form.description || "No description provided."}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <ChartBar />
                                            <span>0 Responses</span>
                                        </div>
                                    </div>
                                    {form.isPublic && (
                                        <Link to={paths.forms.public(form.uuid)} target="_blank" className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                            <ShareNetwork />
                                            Public
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {apps.length === 0 && (
                            <div
                                className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                                onClick={() => setShowCreateModal(true)}
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Create your first form</h3>
                                <p className="text-slate-400">Start from scratch or use AI to generate one.</p>
                            </div>
                        )}
                    </div>
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
