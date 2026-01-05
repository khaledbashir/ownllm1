import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Workspace from "@/models/workspace";
import Sidebar from "@/components/Sidebar";
import { FullScreenLoader } from "@/components/Preloader";
import {
    Plus,
    Trash,
    GripVertical,
    Eye,
    FloppyDisk,
    ShareNetwork,
    Table,
    PencilSimple,
    FilePdf
} from "@phosphor-icons/react";
import { isMobile } from "react-device-detect";
import ShareFormModal from "@/components/Modals/ShareFormModal";
import ExportPdfModal from "@/components/Modals/ExportPdfModal";

export default function WorkspaceFormBuilder() {
    const { slug, uuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [workspace, setWorkspace] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [responses, setResponses] = useState([]);
    const [activeTab, setActiveTab] = useState("builder"); // builder | responses

    // AI & Modals
    const [showShareModal, setShowShareModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const _workspace = await Workspace.bySlug(slug);
            if (!_workspace) return;
            setWorkspace(_workspace);

            const _form = await Workspace.getForm(slug, uuid);
            if (!_form) return;
            setForm(_form);
            if (_form.fields) {
                try {
                    setFields(typeof _form.fields === 'string' ? JSON.parse(_form.fields) : _form.fields);
                } catch (e) {
                    console.error("Failed to parse form fields", e);
                    setFields([]);
                }
            }

            if (activeTab === "responses") {
                const _responses = await Workspace.getFormResponses(slug, uuid);
                setResponses(_responses);
            }

            setLoading(false);
        }
        fetchData();
    }, [slug, uuid, activeTab]);

    const loadResponses = async () => {
        const res = await Workspace.getFormResponses(slug, uuid);
        if (res.responses) {
            setResponses(res.responses);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await Workspace.updateForm(slug, uuid, {
            fields: JSON.stringify(fields),
            title: form.title,
            description: form.description
        });
        setSaving(false);
        if (res.success) {
            showToast("Form saved successfully", "success");
        } else {
            showToast("Failed to save form", "error");
        }
    };

    const handleAddField = (type) => {
        const newField = {
            id: `field_${Date.now()}`,
            label: "New Field",
            type,
            required: false,
            placeholder: "",
            options: type === "select" || type === "radio" ? ["Option 1", "Option 2"] : []
        };
        setFields([...fields, newField]);
    };

    const handleDeleteField = (index) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const handleUpdateField = (index, key, value) => {
        const newFields = [...fields];
        newFields[index][key] = value;
        setFields(newFields);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newFields = Array.from(fields);
        const [reorderedItem] = newFields.splice(result.source.index, 1);
        newFields.splice(result.destination.index, 0, reorderedItem);
        setFields(newFields);
    };

    const handleAiGenerate = async () => {
        setAiLoading(true);
        try {
            const res = await fetch(`/api/workspace/${slug}/forms/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.localStorage.getItem("anythingllm_auth_token")}`
                },
                body: JSON.stringify({ prompt: aiPrompt })
            }).then(r => r.json());

            if (res.success) {
                window.location.href = paths.forms.builder(slug, res.form.uuid);
            } else {
                showToast(res.error || "Failed to generate form", "error");
            }
        } catch (e) {
            showToast("An error occurred", "error");
        } finally {
            setAiLoading(false);
            setShowAiModal(false);
        }
    };

    if (loading) return <FullScreenLoader />;

    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            {!isMobile && <Sidebar />}
            <div className="flex-1 h-full flex flex-col">
                {/* Header */}
                <div className="bg-theme-bg-secondary border-b border-white/5 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(paths.forms.dashboard())} className="text-slate-400 hover:text-white">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="bg-transparent text-white font-bold text-lg border-none focus:ring-0 p-0"
                            />
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs font-mono text-slate-500 bg-black/20 px-2 py-0.5 rounded">ID: {uuid}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Tab Switcher */}
                        <div className="bg-black/20 p-1 rounded-lg flex mr-4">
                            <button
                                onClick={() => setActiveTab("builder")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "builder" ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                <span className="flex items-center gap-2"><PencilSimple /> Builder</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("responses")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "responses" ? "bg-slate-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                <span className="flex items-center gap-2"><Table /> Responses</span>
                            </button>
                        </div>

                        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-all">
                            <ShareNetwork size={20} />
                            Share
                        </button>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500">
                            <FloppyDisk />
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* BUILDER TAB */}
                    {activeTab === "builder" && (
                        <>
                            {/* Sidebar / Toolbox */}
                            <div className="w-64 bg-theme-bg-secondary border-r border-white/5 p-4 overflow-y-auto hidden md:block">
                                <h3 className="text-slate-400 font-semibold mb-4 text-sm uppercase tracking-wider">Fields</h3>
                                <div className="space-y-2">
                                    {['text', 'textarea', 'email', 'number', 'select', 'checkbox', 'radio', 'date'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleAddField(type)}
                                            className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 capitalize flex items-center gap-2 transition-colors"
                                        >
                                            <Plus size={16} />
                                            {type}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowAiModal(true)}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 p-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-all font-medium"
                                >
                                    <MagicWand size={20} />
                                    AI Builder
                                </button>
                            </div>

                            {/* Canvas */}
                            <div className="flex-1 bg-theme-bg-container p-8 overflow-y-auto">
                                <div className="max-w-3xl mx-auto">
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="form-fields">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 min-h-[200px]">
                                                    {fields.length === 0 && (
                                                        <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                                                            <p className="text-slate-500">Drag fields here or select from sidebar</p>
                                                        </div>
                                                    )}
                                                    {fields.map((field, index) => (
                                                        <Draggable key={field.id} draggableId={field.id} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className="bg-theme-bg-secondary p-4 rounded-xl border border-white/5 group hover:border-blue-500/50 transition-colors"
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div {...provided.dragHandleProps} className="cursor-grab text-slate-500 hover:text-white">
                                                                            <DotsSixVertical size={24} />
                                                                        </div>
                                                                        <button onClick={() => handleDeleteField(index)} className="text-slate-500 hover:text-red-400">
                                                                            <Trash size={20} />
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <input
                                                                            type="text"
                                                                            value={field.label}
                                                                            onChange={(e) => handleUpdateField(index, 'label', e.target.value)}
                                                                            className="w-full bg-transparent border-b border-slate-700 focus:border-blue-500 text-white p-1"
                                                                            placeholder="Field Label"
                                                                        />
                                                                        <div className="flex gap-4">
                                                                            <label className="flex items-center gap-2 text-slate-400 text-sm cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={field.required}
                                                                                    onChange={(e) => handleUpdateField(index, 'required', e.target.checked)}
                                                                                    className="rounded bg-slate-800 border-slate-700"
                                                                                />
                                                                                Required
                                                                            </label>
                                                                        </div>
                                                                        {/* Options editor for select/radio etc */}
                                                                        {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 mb-1">Options (comma separated)</p>
                                                                                <input
                                                                                    type="text"
                                                                                    value={(field.options || []).join(', ')}
                                                                                    onChange={(e) => handleUpdateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                                                                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>
                            </div>
                        </>
                    )}

                    {/* RESPONSES TAB */}
                    {activeTab === "responses" && (
                        <div className="flex-1 overflow-y-auto p-6 bg-theme-bg-container w-full">
                            <div className="max-w-6xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Form Responses ({responses.length})</h2>
                                </div>

                                {responses.length === 0 ? (
                                    <div className="text-center py-12 bg-theme-bg-secondary rounded-xl border border-white/5">
                                        <Table size={48} className="mx-auto text-slate-600 mb-4" />
                                        <p className="text-slate-400">No responses yet.</p>
                                        <p className="text-sm text-slate-500 mt-2">Share your form to start collecting data.</p>
                                    </div>
                                ) : (
                                    <div className="bg-theme-bg-secondary rounded-xl border border-white/5 overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/5 text-sm text-slate-400">
                                                    <th className="p-4 font-medium">ID</th>
                                                    <th className="p-4 font-medium">Submitted At</th>
                                                    <th className="p-4 font-medium">Data Preview</th>
                                                    <th className="p-4 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {responses.map(response => {
                                                    const data = typeof response.response === 'string' ? JSON.parse(response.response) : response.response;
                                                    // Get first 2 fields for preview
                                                    const preview = Object.entries(data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(", ");

                                                    return (
                                                        <tr key={response.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-4 text-slate-400 text-sm font-mono">#{response.id}</td>
                                                            <td className="p-4 text-slate-300 text-sm">{new Date(response.createdAt).toLocaleString()}</td>
                                                            <td className="p-4 text-slate-400 text-sm truncate max-w-xs">{preview}...</td>
                                                            <td className="p-4 text-right">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedResponseId(response.id);
                                                                        setShowExportModal(true);
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors ml-auto"
                                                                >
                                                                    <FilePdf size={16} />
                                                                    Export PDF
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Prompt Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-theme-bg-secondary w-full max-w-lg p-6 rounded-xl border border-white/10 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Generate with AI</h3>
                        <p className="text-slate-400 mb-4">Describe the form you want to create and let AI build the structure for you.</p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g. A job application form with name, email, resume upload, and experience details..."
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-slate-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAiGenerate}
                                disabled={aiLoading || !aiPrompt.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {aiLoading ? (
                                    <>Building...</>
                                ) : (
                                    <>
                                        <MagicWand weight="fill" />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareFormModal
                show={showShareModal}
                onClose={() => setShowShareModal(false)}
                slug={slug}
                form={form}
                onUpdate={(updatedForm) => setForm(updatedForm)}
            />

            {/* Export PDF Modal */}
            <ExportPdfModal
                show={showExportModal}
                onClose={() => setShowExportModal(false)}
                slug={slug}
                formUuid={uuid}
                responseId={selectedResponseId}
            />
        </div>
    );
}
