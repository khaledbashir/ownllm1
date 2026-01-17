import React, { useState } from "react";
import { X, MagicWand } from "@phosphor-icons/react";

export default function AIFormModal({ isOpen, onClose, onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      await onGenerate(prompt.trim());
      setPrompt("");
      onClose();
    } catch (error) {
      console.error("Failed to generate form:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-theme-bg-secondary border border-white/10 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MagicWand size={24} className="text-yellow-400" weight="fill" />
            <h2 className="text-xl font-bold text-white">AI Form Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Describe the form you want to create, and AI will generate it for you.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe your form
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a customer feedback form with name, email, rating (1-5 stars), and comments"
              rows={5}
              className="w-full px-4 py-3 bg-theme-bg-container border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-white font-medium hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                "Generating..."
              ) : (
                <>
                  <MagicWand weight="fill" />
                  Generate Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
