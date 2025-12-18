import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import PdfTemplates from "@/models/pdfTemplates";
import { Plus, Trash, FloppyDisk, PencilSimple, X, ArrowLeft, Eye } from "@phosphor-icons/react";
import showToast from "@/utils/toast";

// --- LIVE PREVIEW COMPONENT ---
// This mimics the structure of the exported PDF to give a 1:1 preview
function TemplatePreview({ template }) {
    const {
        primaryColor = "#3b82f6",
        logoPath,
        headerText = "Company Name",
        footerText = "Footer Text",
        fontFamily = "Inter",
        cssOverrides
    } = template;

    // Parse overrides for preview
    const overrides = cssOverrides ? JSON.parse(cssOverrides) : {};
    const logoHeight = overrides.logoHeight || 40;
    const logoAlignment = overrides.logoAlignment || 'flex-start';

    // Alignment styles for the header container
    const headerStyle = {
        fontFamily,
        flexDirection: 'row', // Default
    };

    // If center aligned, we change layout strategy slightly for preview
    // Note: In PDF Flexbox works well, but we need to match the logic
    let logoContainerStyle = {};
    if (logoAlignment === 'center') {
        headerStyle.justifyContent = 'center';
        headerStyle.position = 'relative'; // so we can absolute position other items if needed? 
        // Actually for a simple center logo, often the text is also centered or logo is alone?
        // Let's assume standard "Logo left, Text right" but if Center, maybe Logo is middle?
        // User asked for "Logo adjustable in places".
        // Let's implement: Left (Default), Center (Logo in middle, text below?), Right (Logo on right)
    }

    // Simplification for the user request "Logo adjustable in places" & "Bigger/Smaller"
    // We will stick to the existing "Row" layout but allow growing the logo 
    // and flipping the order if "Right" is selected? 
    // Or just alignment of the whole block? 
    // Let's do: Logo Size (height) and Logo Position (Left, Right) in the flex row.

    const isRightAligned = logoAlignment === 'flex-end';

    return (
        <div className="w-full h-full bg-gray-500/10 rounded-xl overflow-hidden flex flex-col items-center justify-center p-8">
            <div className="bg-white text-gray-900 w-full max-w-[500px] aspect-[1/1.414] shadow-2xl rounded-sm flex flex-col relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02]">
                {/* PDF Header Simulation */}
                <div
                    className={`w-full h-[${Math.max(60, logoHeight + 20)}px] flex items-center px-5 border-b border-gray-200`}
                    style={{
                        fontFamily,
                        justifyContent: 'space-between',
                        flexDirection: isRightAligned ? 'row-reverse' : 'row',
                        height: Math.max(60, Number(logoHeight) + 20) + 'px'
                    }}
                >
                    <div className="flex items-center">
                        {logoPath ? (
                            <img
                                src={logoPath}
                                alt="Logo"
                                className="object-contain transition-all duration-200"
                                style={{
                                    height: logoHeight + 'px',
                                    marginRight: isRightAligned ? '0' : '10px',
                                    marginLeft: isRightAligned ? '10px' : '0'
                                }}
                            />
                        ) : (
                            <div
                                className="bg-gray-100 rounded flex items-center justify-center text-xs font-bold transition-all duration-200"
                                style={{
                                    color: primaryColor,
                                    height: logoHeight + 'px',
                                    width: logoHeight + 'px',
                                    marginRight: isRightAligned ? '0' : '10px',
                                    marginLeft: isRightAligned ? '10px' : '0'
                                }}
                            >
                                LOGO
                            </div>
                        )}
                        <span className="text-sm font-semibold">{template.name || 'Your Company'}</span>
                    </div>
                    <div className="text-gray-500 text-xs">{headerText}</div>
                </div>

                {/* Mock Content */}
                <div className="flex-1 p-10" style={{ fontFamily }}>
                    <h1 className="text-2xl font-bold mb-4 pb-2 border-b-2" style={{ color: '#111827', borderColor: '#e5e7eb' }}>
                        Proposal: Q1 Strategy
                    </h1>
                    <p className="text-sm text-gray-800 mb-4 leading-relaxed">
                        This is a preview of how your document body will look. The layout is optimized for A4 paper.
                    </p>

                    <div className="my-6 border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-900 font-semibold">
                                <tr>
                                    <td className="p-3 border-b border-gray-200">Item</td>
                                    <td className="p-3 border-b border-gray-200 text-right">Cost</td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-3 border-b border-gray-200">Consulting Services</td>
                                    <td className="p-3 border-b border-gray-200 text-right">$5,000</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border-b border-gray-200 text-blue-600">Total</td>
                                    <td className="p-3 border-b border-gray-200 text-right font-bold">$5,000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed">
                        The content here is automatically styled using your selected fonts and spacing.
                    </p>
                </div>

                {/* PDF Footer Simulation */}
                <div className="w-full h-[40px] flex items-center justify-between px-5 text-gray-400 text-[10px]" style={{ fontFamily }}>
                    <span>{footerText}</span>
                    <span>Page 1 of 5</span>
                </div>
            </div>
            <div className="mt-4 text-white/40 text-xs flex items-center gap-2">
                <Eye size={14} />
                Live PDF Preview (A4)
            </div>
        </div>
    );
}


// --- EDITOR FORM ---
function TemplateEditor({ template: initialTemplate, onSave, onCancel }) {
    // Parse existing overrides or defaults
    const initialOverrides = initialTemplate?.cssOverrides
        ? JSON.parse(initialTemplate.cssOverrides)
        : { logoHeight: 40, logoAlignment: 'flex-start' };

    const [template, setTemplate] = useState(initialTemplate || {
        name: "",
        logoPath: "",
        headerText: "",
        footerText: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#1e293b",
        fontFamily: "Inter",
        cssOverrides: JSON.stringify({ logoHeight: 40, logoAlignment: 'flex-start' })
    });

    // Separate state for simpler UI handling, synced to template.cssOverrides on change
    const [logoHeight, setLogoHeight] = useState(initialOverrides.logoHeight || 40);
    const [logoAlignment, setLogoAlignment] = useState(initialOverrides.logoAlignment || 'flex-start');

    const [saving, setSaving] = useState(false);

    // Sync UI state to the storage JSON
    useEffect(() => {
        setTemplate(prev => ({
            ...prev,
            cssOverrides: JSON.stringify({ logoHeight, logoAlignment })
        }));
    }, [logoHeight, logoAlignment]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!template.name.trim()) return showToast("Template name is required", "error");

        setSaving(true);
        await onSave(template);
        setSaving(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <h2 className="text-lg font-bold text-white">
                        {initialTemplate?.id ? "Edit Template" : "New Template"}
                    </h2>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FloppyDisk size={18} />}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* LEFT: Inputs */}
                <div className="w-1/3 overflow-y-auto pr-2 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Template Name</label>
                            <input
                                type="text"
                                value={template.name}
                                onChange={e => setTemplate({ ...template, name: e.target.value })}
                                placeholder="e.g. Official Proposal"
                                className="w-full mt-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Brand Color</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="color"
                                        value={template.primaryColor}
                                        onChange={e => setTemplate({ ...template, primaryColor: e.target.value })}
                                        className="h-10 w-10 rounded cursor-pointer border-0 bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={template.primaryColor}
                                        onChange={e => setTemplate({ ...template, primaryColor: e.target.value })}
                                        className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Font</label>
                                <select
                                    value={template.fontFamily}
                                    onChange={e => setTemplate({ ...template, fontFamily: e.target.value })}
                                    className="w-full mt-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white h-[42px]"
                                >
                                    <option value="Inter">Inter</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Arial">Arial</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Logo Image</label>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="logo-upload"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        if (file.size > 2 * 1024 * 1024) { // 2MB limit
                                            alert("File too large. Please use an image under 2MB.");
                                            return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setTemplate({ ...template, logoPath: reader.result });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />

                            <div className="mt-2 flex items-center gap-3">
                                {template.logoPath ? (
                                    <div className="relative group">
                                        <div className="h-10 w-10 bg-white rounded border border-white/20 flex items-center justify-center p-1">
                                            <img src={template.logoPath} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <button
                                            onClick={() => setTemplate({ ...template, logoPath: "" })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            title="Remove Logo"
                                        >
                                            <X size={10} weight="bold" />
                                        </button>
                                    </div>
                                ) : null}

                                <label
                                    htmlFor="logo-upload"
                                    className="cursor-pointer px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} />
                                    {template.logoPath ? "Change Logo" : "Upload Logo"}
                                </label>
                            </div>
                            <p className="text-[10px] text-white/40 mt-2">Max 2MB. Stored directly in template.</p>
                        </div>

                        {/* Logo Customization */}
                        <div className="p-4 bg-white/5 rounded-lg space-y-4 border border-white/5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Logo Size</label>
                                    <span className="text-xs text-blue-400 font-mono">{logoHeight}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="120"
                                    value={logoHeight}
                                    onChange={(e) => setLogoHeight(Number(e.target.value))}
                                    className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white/60 uppercase tracking-wide block mb-2">Header Layout</label>
                                <div className="flex bg-black/20 p-1 rounded-lg">
                                    <button
                                        onClick={() => setLogoAlignment('flex-start')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${logoAlignment === 'flex-start' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        onClick={() => setLogoAlignment('flex-end')}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${logoAlignment === 'flex-end' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                                    >
                                        Reversed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Header Text</label>
                            <input
                                type="text"
                                value={template.headerText}
                                onChange={e => setTemplate({ ...template, headerText: e.target.value })}
                                placeholder="Company Name | Address"
                                className="w-full mt-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-white/60 uppercase tracking-wide">Footer Text</label>
                            <textarea
                                value={template.footerText}
                                onChange={e => setTemplate({ ...template, footerText: e.target.value })}
                                placeholder="Copyright 2024..."
                                rows={3}
                                className="w-full mt-2 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className="flex-1 bg-black/30 rounded-2xl border border-white/5 p-4 flex items-center justify-center relative">
                    <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">
                        Live Preview
                    </div>
                    <TemplatePreview template={template} />
                </div>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function DocumentTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list, {} = new, {id} = edit

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const list = await PdfTemplates.list();
        setTemplates(list || []);
        setLoading(false);
    };

    const handleSave = async (data) => {
        let result;
        if (data.id) result = await PdfTemplates.update(data.id, data);
        else result = await PdfTemplates.create(data);

        if (result?.success) {
            showToast("Template saved!", "success");
            await loadTemplates();
            setEditing(null);
        } else {
            showToast(result?.error || "Save failed", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this template?")) return;
        const result = await PdfTemplates.delete(id);
        if (result?.success) {
            showToast("Template deleted", "success");
            loadTemplates();
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-hidden p-4 md:p-6"
            >
                {editing ? (
                    <TemplateEditor
                        template={editing.id ? editing : null}
                        onSave={handleSave}
                        onCancel={() => setEditing(null)}
                    />
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-end mb-6 pb-6 border-b border-white/10">
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Document Templates</h1>
                                <p className="text-white/60 text-sm mt-1">Manage branding for your PDF exports.</p>
                            </div>
                            <button
                                onClick={() => setEditing({})}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} weight="bold" />
                                Create Template
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-white/40">Loading...</div>
                        ) : templates.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                                <FilePdf size={64} className="mb-4 opacity-20" />
                                <p>No templates found.</p>
                                <button onClick={() => setEditing({})} className="mt-4 text-blue-400 hover:text-blue-300">Create one now</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-10">
                                {templates.map(t => (
                                    <div key={t.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all hover:-translate-y-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-inner" style={{ backgroundColor: t.primaryColor || '#3b82f6' }}>
                                                {t.logoPath ? <img src={t.logoPath} className="h-full w-full object-contain rounded-lg" /> : t.name.charAt(0)}
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                                <button onClick={() => setEditing(t)} className="p-1.5 hover:bg-white/20 rounded text-white/70 hover:text-white"><PencilSimple size={14} /></button>
                                                <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-white truncate">{t.name}</h3>
                                        <p className="text-xs text-white/50 truncate mt-1">{t.headerText || 'No header'}</p>

                                        <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5 font-mono">
                                                {t.fontFamily}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
