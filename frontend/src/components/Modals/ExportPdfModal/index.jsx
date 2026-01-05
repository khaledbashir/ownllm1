import React, { useState, useEffect } from "react";
import { X, FilePdf, Spinner } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import PdfTemplates from "@/models/pdfTemplates";
import { API_BASE } from "@/utils/constants";
import Workspace from "@/models/workspace";

export default function ExportPdfModal({
    show,
    onClose,
    slug,
    formUuid,
    responseId
}) {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (show) {
            loadTemplates();
        }
    }, [show]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const list = await PdfTemplates.list();
            setTemplates(list || []);
            if (list && list.length > 0) setSelectedTemplate(list[0]);
        } catch (e) {
            showToast("Failed to load templates", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!selectedTemplate) return;
        setExporting(true);
        try {
            const token = window.localStorage.getItem("anythingllm_auth_token");
            const response = await fetch(`${API_BASE}/workspace/${slug}/forms/${formUuid}/responses/${responseId}/export`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ templateId: selectedTemplate.id })
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `submission-${responseId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast("PDF exported successfully", "success");
            onClose();
        } catch (e) {
            showToast("Export failed", "error");
        } finally {
            setExporting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-theme-bg-secondary w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FilePdf size={20} className="text-red-400" />
                        Export to PDF
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Spinner className="animate-spin text-white" size={24} />
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center p-4 text-slate-400">
                            <p>No document templates found.</p>
                            <p className="text-sm mt-2">Create templates in Settings &gt; Document Templates first.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Select Template</label>
                                <select
                                    value={selectedTemplate?.id}
                                    onChange={(e) => setSelectedTemplate(templates.find(t => t.id === parseInt(e.target.value)))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                >
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    Form fields matching <code>{"{{field_id}}"}</code> in the template will be auto-populated.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {exporting && <Spinner className="animate-spin" />}
                                    Export PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
