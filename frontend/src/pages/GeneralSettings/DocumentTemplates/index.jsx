import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import PdfTemplates from "@/models/pdfTemplates";
import { Plus, Trash, FloppyDisk, PencilSimple, X } from "@phosphor-icons/react";
import showToast from "@/utils/toast";

// Template Form Component
function TemplateForm({ template, onSave, onCancel }) {
    const [form, setForm] = useState({
        name: template?.name || "",
        logoPath: template?.logoPath || "",
        headerText: template?.headerText || "",
        footerText: template?.footerText || "",
        primaryColor: template?.primaryColor || "#3b82f6",
        secondaryColor: template?.secondaryColor || "#1e293b",
        fontFamily: template?.fontFamily || "Inter",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            showToast("Template name is required", "error");
            return;
        }
        setSaving(true);
        try {
            const result = await onSave(form);
            if (result?.success) {
                showToast("Template saved successfully", "success");
            } else {
                showToast(result?.error || "Failed to save template", "error");
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-theme-bg-secondary rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                    {template?.id ? "Edit Template" : "New Template"}
                </h3>
                <button type="button" onClick={onCancel} className="text-white/50 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Name */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Template Name *
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g., Formal Letterhead, Invoice"
                        className="w-full px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Primary Color */}
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Brand Color
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={form.primaryColor}
                            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                            type="text"
                            value={form.primaryColor}
                            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Logo URL */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Logo URL
                    </label>
                    <input
                        type="text"
                        value={form.logoPath}
                        onChange={(e) => setForm({ ...form, logoPath: e.target.value })}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Header Text (Company Name / Title) */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Header Text
                    </label>
                    <input
                        type="text"
                        value={form.headerText}
                        onChange={(e) => setForm({ ...form, headerText: e.target.value })}
                        placeholder="Your Company Inc. | 123 Business Rd, City"
                        className="w-full px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>


                {/* Secondary Color */}
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={form.secondaryColor}
                            onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                        />
                        <input
                            type="text"
                            value={form.secondaryColor}
                            onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Font Family */}
                <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Font Family
                    </label>
                    <select
                        value={form.fontFamily}
                        onChange={(e) => setForm({ ...form, fontFamily: e.target.value })}
                        className="w-full px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Roboto">Roboto (Tech)</option>
                        <option value="Open Sans">Open Sans (Neutral)</option>
                        <option value="Lato">Lato (Friendly)</option>
                        <option value="Montserrat">Montserrat (Bold)</option>
                        <option value="Georgia">Georgia (Serif)</option>
                        <option value="Times New Roman">Times New Roman (Classic)</option>
                    </select>
                </div>

                {/* Footer Text */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-white/70 mb-2">
                        Footer Text
                    </label>
                    <textarea
                        value={form.footerText}
                        onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                        placeholder="© 2025 Company Name. All rights reserved. Confidentiality notice..."
                        rows={3}
                        className="w-full px-4 py-2 bg-theme-bg-primary border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="border border-white/10 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between border-b-2 pb-4 mb-4" style={{ borderColor: form.primaryColor }}>
                    <div className="flex items-center gap-3">
                        {form.logoPath ? (
                            <img src={form.logoPath} alt="Logo" className="w-12 h-12 object-contain rounded" />
                        ) : (
                            <div className="w-12 h-12 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: form.primaryColor }}>
                                LOGO
                            </div>
                        )}
                        <div>
                            <div className="font-bold text-gray-900" style={{ fontFamily: form.fontFamily }}>
                                {form.headerText || "Company Name | Address"}
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                        <div>{new Date().toLocaleDateString()}</div>
                        <div>Ref: DOC-001</div>
                    </div>
                </div>
                <div className="text-gray-300 text-sm italic mb-4" style={{ fontFamily: form.fontFamily }}>[Document content goes here]</div>
                <div className="border-t-2 pt-4 text-center text-xs text-gray-400" style={{ borderColor: form.primaryColor }}>
                    {form.footerText || "Footer text"}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    <FloppyDisk size={18} />
                    {saving ? "Saving..." : "Save Template"}
                </button>
            </div>
        </form>
    );
}

// Template Card Component
function TemplateCard({ template, onEdit, onDelete }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Delete template "${template.name}"?`)) return;
        setDeleting(true);
        await onDelete(template.id);
        setDeleting(false);
    };

    return (
        <div className="p-4 bg-theme-bg-secondary rounded-xl border border-white/10 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: template.primaryColor || "#3b82f6" }}
                    >
                        {template.logoPath ? (
                            <img src={template.logoPath} alt="" className="w-full h-full object-contain rounded" />
                        ) : (
                            "L"
                        )}
                    </div>
                    <div>
                        <div className="font-medium text-white">{template.name}</div>
                        <div className="text-xs text-white/50">{template.headerText || "No header set"}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(template)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <PencilSimple size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Trash size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Page Component
export default function DocumentTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list view, {} = new, {id:...} = edit

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const list = await PdfTemplates.list();
        setTemplates(list);
        setLoading(false);
    };

    const handleSave = async (formData) => {
        let result;
        if (editing?.id) {
            result = await PdfTemplates.update(editing.id, formData);
        } else {
            result = await PdfTemplates.create(formData);
        }
        if (result?.success) {
            await loadTemplates();
            setEditing(null);
        }
        return result;
    };

    const handleDelete = async (id) => {
        const result = await PdfTemplates.delete(id);
        if (result?.success) {
            showToast("Template deleted", "success");
            await loadTemplates();
        } else {
            showToast(result?.error || "Failed to delete", "error");
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
            >
                <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16 h-full">
                    {/* Header */}
                    <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg leading-6 font-bold text-white">
                                    Document Templates
                                </p>
                                <p className="text-xs leading-[18px] font-base text-white/60 mt-2">
                                    Create branded templates for your documents. Apply them in the note editor.
                                </p>
                            </div>
                            {!editing && (
                                <button
                                    onClick={() => setEditing({})}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    New Template
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    {editing !== null ? (
                        <TemplateForm
                            template={editing}
                            onSave={handleSave}
                            onCancel={() => setEditing(null)}
                        />
                    ) : loading ? (
                        <div className="text-white/50 text-center py-12">Loading templates...</div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-white/50 mb-4">No templates yet</p>
                            <button
                                onClick={() => setEditing({})}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Create Your First Template
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((t) => (
                                <TemplateCard
                                    key={t.id}
                                    template={t}
                                    onEdit={setEditing}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
