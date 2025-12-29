import React, { useState, useEffect } from "react";
import { X, Target, User, Building, Mail, Phone, Settings, DollarSign, ChevronDown, Zap } from "lucide-react";
import showToast from "@/utils/toast";

const PRIORITY_LEVELS = {
    high: { label: "High", color: "bg-red-500/10 text-red-500 border-red-500/20" },
    medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    low: { label: "Low", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

export default function CardModal({ isOpen, onClose, card, onSave, stages }) {
    const [formData, setFormData] = useState({
        title: "",
        name: "",
        email: "",
        phone: "",
        company: "",
        notes: "",
        value: "",
        stage: stages[0] || "New",
        priority: "medium",
    });

    useEffect(() => {
        if (card) {
            setFormData({
                title: card.title || "",
                name: card.name || "",
                email: card.email || "",
                phone: card.phone || "",
                company: card.company || "",
                notes: card.notes || "",
                value: card.value || "",
                stage: card.stage || stages[0] || "New",
                priority: card.priority || "medium",
            });
        } else {
            setFormData({
                title: "",
                name: "",
                email: "",
                phone: "",
                company: "",
                notes: "",
                value: "",
                stage: stages[0] || "New",
                priority: "medium",
            });
        }
    }, [card, stages]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast("Title is required", "error");
            return;
        }
        onSave(formData, card?.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl transform transition-all flex flex-col max-h-[90vh]">
                <div className="relative flex flex-col overflow-hidden rounded-3xl bg-theme-bg-secondary border border-theme-modal-border shadow-2xl h-full">
                    {/* Modal Header */}
                    <div className="relative px-8 py-6 border-b border-theme-sidebar-border bg-theme-bg-primary shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="p-2 rounded-xl bg-theme-button-primary/20">
                                        <Target size={20} className="text-theme-button-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-theme-text-primary">
                                        {card ? "Edit Opportunity" : "New Opportunity"}
                                    </h3>
                                </div>
                                <p className="text-theme-text-secondary text-sm ml-11">
                                    Manage lead details and pipeline status
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                type="button"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                        <form id="card-form" onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-theme-text-secondary flex items-center gap-2">
                                    <Zap size={14} className="text-theme-button-primary" />
                                    Opportunity Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                    className="w-full px-5 py-4 rounded-2xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-none focus:border-theme-button-primary transition-all text-lg font-medium"
                                    placeholder="e.g. Enterprise License Deal - Acme Corp"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Contact Info Section */}
                                <div className="space-y-5">
                                    <h4 className="text-base font-bold text-theme-text-primary flex items-center gap-2 pb-2 border-b border-theme-sidebar-border">
                                        <User size={16} className="text-theme-button-primary" />
                                        Contact Information
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <User
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-theme-button-primary transition-colors"
                                            />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, name: e.target.value })
                                                }
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                                                placeholder="Contact Name"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Building
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-theme-button-primary transition-colors"
                                            />
                                            <input
                                                type="text"
                                                value={formData.company}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, company: e.target.value })
                                                }
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Mail
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-theme-button-primary transition-colors"
                                            />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, email: e.target.value })
                                                }
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                                                placeholder="Email Address"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Phone
                                                size={16}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-theme-button-primary transition-colors"
                                            />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phone: e.target.value })
                                                }
                                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                                                placeholder="Phone Number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Deal Settings Section */}
                                <div className="space-y-5">
                                    <h4 className="text-base font-bold text-theme-text-primary flex items-center gap-2 pb-2 border-b border-theme-sidebar-border">
                                        <Settings size={16} className="text-theme-button-primary" />
                                        Deal Settings
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Pipeline Stage
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.stage}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, stage: e.target.value })
                                                    }
                                                    className="w-full px-5 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none appearance-none cursor-pointer transition-all"
                                                >
                                                    {stages.map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={18}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-text-secondary pointer-events-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Priority Level
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {Object.entries(PRIORITY_LEVELS).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, priority: key })}
                                                        className={`px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formData.priority === key
                                                                ? `${config.color} border-current`
                                                                : "border-theme-sidebar-border text-theme-text-secondary hover:border-theme-chat-input-border"
                                                            }`}
                                                    >
                                                        {config.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Est. Value ($)
                                            </label>
                                            <div className="relative group">
                                                <DollarSign
                                                    size={16}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-secondary group-focus-within:text-theme-button-primary transition-colors"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.value}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, value: e.target.value })
                                                    }
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary focus:border-theme-button-primary focus:outline-none transition-all placeholder:text-theme-settings-input-placeholder"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Notes
                                            </label>
                                            <textarea
                                                value={formData.notes}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, notes: e.target.value })
                                                }
                                                className="w-full px-4 py-3.5 rounded-xl bg-theme-settings-input-bg border-2 border-theme-sidebar-border text-base text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:border-theme-button-primary focus:outline-none resize-none min-h-[100px] transition-all"
                                                placeholder="Add notes about this deal..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-4 p-6 border-t border-theme-sidebar-border shrink-0 bg-theme-bg-secondary">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-xl border border-theme-sidebar-border text-theme-text-secondary hover:bg-theme-bg-primary hover:text-theme-text-primary transition-all font-bold text-base"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="card-form"
                            className="flex-1 px-6 py-4 rounded-xl bg-theme-button-primary text-theme-bg-primary font-bold hover:opacity-90 transition-all text-base shadow-lg hover:shadow-xl"
                        >
                            {card ? "Save Changes" : "Create Opportunity"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
