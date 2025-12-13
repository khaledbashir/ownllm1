import React, { useState, useEffect } from "react";
import { X, FilePdf, CircleNotch, Palette, TextT, Image } from "@phosphor-icons/react";
import PdfTemplates from "@/models/pdfTemplates";
import showToast from "@/utils/toast";

export default function ExportPdfModal({ isOpen, onClose, onExport, htmlContent }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // New template form state
    const [newTemplate, setNewTemplate] = useState({
        name: "",
        headerText: "",
        footerText: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#1e293b",
        fontFamily: "Inter",
    });

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const result = await PdfTemplates.list();
            setTemplates(result);
            // Auto-select default template if exists
            const defaultTemplate = result.find(t => t.isDefault);
            if (defaultTemplate) setSelectedTemplate(defaultTemplate);
        } catch (e) {
            console.error("Failed to fetch templates", e);
            showToast("Failed to load templates. You may need to redeploy to apply database migrations.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.name) {
            showToast("Please enter a template name", "error");
            return;
        }

        const result = await PdfTemplates.create(newTemplate);
        if (result.success) {
            showToast("Template created!", "success");
            setShowCreateForm(false);
            setNewTemplate({
                name: "",
                headerText: "",
                footerText: "",
                primaryColor: "#3b82f6",
                secondaryColor: "#1e293b",
                fontFamily: "Inter",
            });
            fetchTemplates();
        } else {
            showToast("Failed to create template", "error");
        }
    };

    const handleExport = async () => {
        setExporting(true);
        await onExport(selectedTemplate);
        setExporting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-theme-bg-secondary w-[600px] max-h-[80vh] rounded-xl shadow-2xl border border-theme-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-theme-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                            <FilePdf size={24} className="text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-theme-text-primary">Export as PDF</h3>
                            <p className="text-xs text-theme-text-secondary">Select a template for branding</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-theme-text-secondary hover:text-theme-text-primary">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <CircleNotch className="animate-spin text-blue-400" size={32} />
                        </div>
                    ) : showCreateForm ? (
                        /* Create Template Form */
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-theme-text-primary">Create New Template</h4>

                            <div>
                                <label className="text-xs text-theme-text-secondary">Template Name *</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    placeholder="e.g., Social Garden Template"
                                    className="w-full mt-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-theme-text-secondary">Header Text</label>
                                <input
                                    type="text"
                                    value={newTemplate.headerText}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, headerText: e.target.value })}
                                    placeholder="Company tagline or document title"
                                    className="w-full mt-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-theme-text-secondary">Footer Text</label>
                                <input
                                    type="text"
                                    value={newTemplate.footerText}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, footerText: e.target.value })}
                                    placeholder="Contact info, address, website"
                                    className="w-full mt-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-theme-text-secondary flex items-center gap-1">
                                        <Palette size={12} /> Primary Color
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={newTemplate.primaryColor}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, primaryColor: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={newTemplate.primaryColor}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, primaryColor: e.target.value })}
                                            className="flex-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-theme-text-secondary flex items-center gap-1">
                                        <Palette size={12} /> Secondary Color
                                    </label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="color"
                                            value={newTemplate.secondaryColor}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, secondaryColor: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={newTemplate.secondaryColor}
                                            onChange={(e) => setNewTemplate({ ...newTemplate, secondaryColor: e.target.value })}
                                            className="flex-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-theme-text-secondary flex items-center gap-1">
                                    <TextT size={12} /> Font Family
                                </label>
                                <select
                                    value={newTemplate.fontFamily}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, fontFamily: e.target.value })}
                                    className="w-full mt-1 p-2 rounded-lg bg-theme-bg-primary text-theme-text-primary border border-theme-border"
                                >
                                    <option value="Inter">Inter</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="Lato">Lato</option>
                                    <option value="Georgia">Georgia (Serif)</option>
                                    <option value="Times New Roman">Times New Roman (Serif)</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 text-theme-text-secondary hover:bg-theme-bg-primary rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTemplate}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                                >
                                    Create Template
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Template Selection */
                        <div className="space-y-3">
                            {/* No template option */}
                            <div
                                onClick={() => setSelectedTemplate(null)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTemplate === null
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-theme-border hover:border-theme-border-hover"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-theme-bg-primary flex items-center justify-center">
                                        <FilePdf size={20} className="text-theme-text-secondary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-theme-text-primary">No Template</p>
                                        <p className="text-xs text-theme-text-secondary">Export without branding</p>
                                    </div>
                                </div>
                            </div>

                            {/* Saved templates */}
                            {templates.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-theme-text-secondary mb-3">No templates found.</p>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
                                    >
                                        Create First Template
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {templates.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-theme-border hover:border-theme-border-hover"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded flex items-center justify-center"
                                                    style={{ backgroundColor: template.primaryColor + "20" }}
                                                >
                                                    <div
                                                        className="w-6 h-6 rounded"
                                                        style={{ backgroundColor: template.primaryColor }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-theme-text-primary flex items-center gap-2">
                                                        {template.name}
                                                        {template.isDefault && (
                                                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-theme-text-secondary">
                                                        {template.footerText || "No footer text"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Create new template button */}
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="w-full p-3 rounded-lg border border-dashed border-theme-border hover:border-blue-500 hover:bg-blue-500/5 text-theme-text-secondary hover:text-blue-400 transition-all"
                                    >
                                        + Create New Template
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showCreateForm && (
                    <div className="flex justify-end gap-3 p-4 border-t border-theme-border">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {exporting ? (
                                <>
                                    <CircleNotch className="animate-spin" size={16} />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FilePdf size={16} />
                                    Export PDF
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
