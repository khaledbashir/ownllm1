import React, { useState } from "react";
import { X } from "@phosphor-icons/react";

export default function SaveTemplateModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name, description);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-theme-bg-secondary w-[500px] rounded-lg shadow-xl border border-theme-border p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-text-secondary hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-white mb-4">
          Save Layout as Template
        </h2>
        <p className="text-sm text-theme-text-secondary mb-6">
          Save the current document structure as a reusable template.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Report V2"
              className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-md text-white focus:outline-none focus:border-theme-primary transition-colors"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template structure..."
              className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-md text-white focus:outline-none focus:border-theme-primary transition-colors min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-theme-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
            >
              {loading ? "Saving..." : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
