import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit3 } from "lucide-react";
import CRM from "@/models/crm";
import showToast from "@/utils/toast";

export default function PipelineManager({
  isOpen,
  onClose,
  pipelines,
  onUpdate,
}) {
  const [view, setView] = useState("list"); // list | create | edit
  const [editingPipeline, setEditingPipeline] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stages: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
  });

  useEffect(() => {
    if (editingPipeline) {
      setFormData({
        name: editingPipeline.name,
        description: editingPipeline.description || "",
        stages: editingPipeline.stages || [],
      });
      setView("edit");
    } else {
      setFormData({
        name: "",
        description: "",
        stages: ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"],
      });
    }
  }, [editingPipeline]);

  if (!isOpen) return null;

  const handleStageChange = (index, value) => {
    const newStages = [...formData.stages];
    newStages[index] = value;
    setFormData({ ...formData, stages: newStages });
  };

  const addStage = () => {
    setFormData({ ...formData, stages: [...formData.stages, "New Stage"] });
  };

  const removeStage = (index) => {
    if (formData.stages.length <= 1) {
      showToast("Pipeline must have at least one stage", "error");
      return;
    }
    const newStages = formData.stages.filter((_, i) => i !== index);
    setFormData({ ...formData, stages: newStages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Pipeline name is required", "error");
      return;
    }

    if (view === "create") {
      const res = await CRM.createPipeline(formData);
      if (res.success) {
        showToast("Pipeline created", "success");
        onUpdate();
        setView("list");
      }
    } else if (view === "edit") {
      const res = await CRM.updatePipeline(editingPipeline.id, formData);
      if (res.success) {
        showToast("Pipeline updated", "success");
        onUpdate();
        setEditingPipeline(null);
        setView("list");
      }
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure? This will delete all cards in this pipeline."
      )
    ) {
      const res = await CRM.deletePipeline(id);
      if (res.success) {
        showToast("Pipeline deleted", "success");
        onUpdate();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl transform transition-all">
        <div className="relative overflow-hidden rounded-3xl bg-theme-bg-secondary border border-theme-modal-border shadow-2xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-theme-sidebar-border bg-theme-bg-primary flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-2xl font-bold text-theme-text-primary">
                {view === "list"
                  ? "Manage Pipelines"
                  : view === "create"
                    ? "New Pipeline"
                    : "Edit Pipeline"}
              </h3>
              <p className="text-theme-text-secondary text-sm">
                {view === "list"
                  ? "Configure your sales processes"
                  : "Define stages and details"}
              </p>
            </div>
            <button
              onClick={() => {
                if (view === "list") onClose();
                else {
                  setView("list");
                  setEditingPipeline(null);
                }
              }}
              className="p-2 rounded-xl hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {view === "list" ? (
              <div className="space-y-4">
                <button
                  onClick={() => setView("create")}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-theme-sidebar-border text-theme-text-secondary hover:border-theme-button-primary hover:text-theme-button-primary hover:bg-theme-button-primary/5 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Create New Pipeline
                </button>

                <div className="space-y-3">
                  {pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-theme-bg-primary border border-theme-sidebar-border group hover:border-theme-text-secondary/30 transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-theme-text-primary">
                          {pipeline.name}
                        </h4>
                        <p className="text-xs text-theme-text-secondary mt-1">
                          {pipeline.stages?.length || 0} stages •{" "}
                          {pipeline.cardCount || 0} leads
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingPipeline(pipeline)}
                          className="p-2 rounded-lg hover:bg-theme-action-menu-item-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pipeline.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-theme-text-secondary hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-text-secondary">
                    Pipeline Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-theme-settings-input-bg border border-theme-sidebar-border text-theme-text-primary focus:outline-none focus:border-theme-button-primary transition-all"
                    placeholder="e.g. Enterprise Sales"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-theme-text-secondary">
                    Stages
                  </label>
                  <div className="space-y-3">
                    {formData.stages.map((stage, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1 flex items-center px-4 rounded-xl bg-theme-settings-input-bg border border-theme-sidebar-border">
                          <span className="text-xs text-theme-text-secondary mr-3 font-mono">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={stage}
                            onChange={(e) =>
                              handleStageChange(index, e.target.value)
                            }
                            className="bg-transparent border-none text-theme-text-primary focus:outline-none w-full py-3"
                            placeholder="Stage Name"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="p-3 rounded-xl hover:bg-red-500/10 text-theme-text-secondary hover:text-red-400 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addStage}
                      className="text-sm text-theme-button-primary hover:underline flex items-center gap-1 font-medium px-1"
                    >
                      <Plus size={14} /> Add Stage
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setView("list");
                      setEditingPipeline(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-theme-sidebar-border text-theme-text-secondary hover:bg-theme-bg-primary transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-theme-button-primary text-theme-bg-primary hover:opacity-90 transition-all font-bold"
                  >
                    {view === "create" ? "Create Pipeline" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
