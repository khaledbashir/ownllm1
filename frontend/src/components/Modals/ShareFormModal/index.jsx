import React, { useState, useEffect } from "react";
import { X, Copy, Check, Lock, Globe, Code } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import Workspace from "@/models/workspace";
import { API_BASE } from "@/utils/constants";
import paths from "@/utils/paths";

export default function ShareFormModal({
    show,
    onClose,
    slug,
    form,
    onUpdate
}) {
    const [loading, setLoading] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedEmbed, setCopiedEmbed] = useState(false);
    const [isPublic, setIsPublic] = useState(form?.isPublic || false);

    useEffect(() => {
        if (form) {
            setIsPublic(form.isPublic);
        }
    }, [form]);

    if (!show || !form) return null;

    const publicUrl = `${window.location.origin}${paths.forms.public(form.uuid)}`;
    const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const handleTogglePublic = async () => {
        setLoading(true);
        try {
            const res = await Workspace.updateForm(slug, form.uuid, {
                isPublic: !isPublic,
                title: form.title, // Required by update endpoint currently?
                description: form.description
            });

            if (res.success) {
                setIsPublic(!isPublic);
                if (onUpdate) onUpdate({ ...form, isPublic: !isPublic });
                showToast(`Form is now ${!isPublic ? "public" : "private"}`, "success");
            } else {
                showToast("Failed to update settings", "error");
            }
        } catch (e) {
            showToast("An error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopiedLink(true);
        showToast("Link copied to clipboard", "success");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyEmbed = () => {
        navigator.clipboard.writeText(embedCode);
        setCopiedEmbed(true);
        showToast("Embed code copied to clipboard", "success");
        setTimeout(() => setCopiedEmbed(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-theme-bg-secondary w-full max-w-lg rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-semibold text-white">
                        Share Form
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isPublic ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{isPublic ? "Public Access Enabled" : "Private Form"}</h3>
                                <p className="text-slate-400 text-sm">{isPublic ? "Anyone with the link can view and submit." : "Only accessible in workspace."}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={handleTogglePublic} disabled={loading} />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    {isPublic && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Public Link</label>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={publicUrl}
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                        title="Copy Link"
                                    >
                                        {copiedLink ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-300 text-sm font-medium mb-1.5 block">Embed Code</label>
                                <div className="relative">
                                    <textarea
                                        readOnly
                                        value={embedCode}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none h-24 resize-none font-mono"
                                    />
                                    <button
                                        onClick={handleCopyEmbed}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"
                                        title="Copy Embed Code"
                                    >
                                        {copiedEmbed ? <Check size={16} /> : <Code size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center pt-2">
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:underline">
                                    Open public form in new tab ↗
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
