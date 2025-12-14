import React, { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import PdfTemplates from "@/models/pdfTemplates";
import CTAButton from "@/components/lib/CTAButton";
import { FloppyDisk, MagicWand } from "@phosphor-icons/react";
import showToast from "@/utils/toast";

export default function BrandManager() {
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState({
        name: "My Business Brand",
        logoPath: "",
        headerText: "",
        footerText: "",
        primaryColor: "#3b82f6",
        secondaryColor: "#1e293b",
        fontFamily: "Inter",
        isDefault: true,
        backgroundImage: "",
        cssOverrides: "",
    });
    const [prompt, setPrompt] = useState("abstract business pattern, blue and white, minimal");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDefaultTemplate();
    }, []);

    const fetchDefaultTemplate = async () => {
        const templates = await PdfTemplates.list();
        const defaultTemplate = templates.find((t) => t.isDefault);
        if (defaultTemplate) {
            setTemplate(defaultTemplate);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        // Timeout wrapper - don't hang forever
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out. Please check your connection and try again.")), 8000)
        );

        try {
            let apiCall;
            if (template.id) {
                apiCall = PdfTemplates.update(template.id, template);
            } else {
                apiCall = PdfTemplates.create(template);
            }

            // Race between API call and timeout
            const res = await Promise.race([apiCall, timeoutPromise]);

            if (res?.template && !template.id) {
                setTemplate(res.template);
            }

            if (res && (res.success || res.template)) {
                showToast("Brand settings saved!", "success");
            } else {
                showToast(res?.error || "Failed to save. Please try again.", "error");
            }
        } catch (e) {
            console.error("[BrandManager] Save error:", e);
            showToast(e.message || "Save failed. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    const generateBackground = async () => {
        if (!prompt) return;
        setGenerating(true);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
        // We set the URL directly. Pollinations is real-time.
        setTemplate((prev) => ({ ...prev, backgroundImage: url }));
        setGenerating(false);
    };

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
            >
                <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">

                    {/* Header */}
                    <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
                        <div className="items-center flex gap-x-4">
                            <p className="text-lg leading-6 font-bold text-theme-text-primary">
                                Brand Manager
                            </p>
                        </div>
                        <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
                            Manage your business identity, colors, and assets for PDF reports and tools.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="flex flex-col gap-y-6 mt-6">

                        {/* Logo */}
                        <div>
                            <label className="text-sm font-bold text-theme-text-primary">Logo URL</label>
                            <input
                                type="text"
                                placeholder="https://example.com/logo.png"
                                value={template.logoPath || ""}
                                onChange={(e) => setTemplate({ ...template, logoPath: e.target.value })}
                                className="w-full mt-2 bg-theme-bg-primary border border-theme-border-primary rounded px-3 py-2 text-white"
                            />
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-theme-text-primary">Primary Color</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="color"
                                        value={template.primaryColor}
                                        onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                                        className="h-10 w-20 cursor-pointer"
                                    />
                                    <span className="text-white">{template.primaryColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-theme-text-primary">Secondary Color</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="color"
                                        value={template.secondaryColor}
                                        onChange={(e) => setTemplate({ ...template, secondaryColor: e.target.value })}
                                        className="h-10 w-20 cursor-pointer"
                                    />
                                    <span className="text-white">{template.secondaryColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Generator (Pollinations.AI) */}
                        <div className="p-4 bg-theme-bg-primary rounded-lg border border-theme-border-primary">
                            <label className="text-sm font-bold text-theme-text-primary flex items-center gap-2">
                                <MagicWand size={18} />
                                Background Asset Generator (Pollinations.AI)
                            </label>
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    placeholder="Describe your texture (e.g., 'abstract geometric blue')"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="flex-1 bg-theme-bg-secondary border border-theme-border-primary rounded px-3 py-2 text-white"
                                />
                                <button
                                    onClick={generateBackground}
                                    disabled={generating}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                                >
                                    {generating ? "Generating..." : "Generate"}
                                </button>
                            </div>

                            {/* Preview */}
                            {template.backgroundImage && (
                                <div className="mt-4 relative h-32 w-full rounded-lg overflow-hidden border border-white/10 group">
                                    <img
                                        src={template.backgroundImage}
                                        alt="Background Asset"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => setTemplate({ ...template, backgroundImage: "" })}
                                        className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Typography */}
                        <div>
                            <label className="text-sm font-bold text-theme-text-primary">Font Family</label>
                            <select
                                value={template.fontFamily}
                                onChange={(e) => setTemplate({ ...template, fontFamily: e.target.value })}
                                className="w-full mt-2 bg-theme-bg-primary border border-theme-border-primary rounded px-3 py-2 text-white"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Roboto">Roboto</option>
                                <option value="Open Sans">Open Sans</option>
                                <option value="Lato">Lato</option>
                                <option value="Montserrat">Montserrat</option>
                            </select>
                        </div>

                        {/* CSS Overrides */}
                        <div>
                            <label className="text-sm font-bold text-theme-text-primary">CSS Overrides (Advanced)</label>
                            <textarea
                                rows={4}
                                placeholder=".my-class { color: red; }"
                                value={template.cssOverrides || ""}
                                onChange={(e) => setTemplate({ ...template, cssOverrides: e.target.value })}
                                className="w-full mt-2 bg-theme-bg-primary border border-theme-border-primary rounded px-3 py-2 text-white font-mono text-sm"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6">
                            <CTAButton onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FloppyDisk size={18} className="mr-2" />
                                        Save Brand Settings
                                    </>
                                )}
                            </CTAButton>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
