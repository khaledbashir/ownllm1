import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash,
  PencilSimple,
  FloppyDisk,
  Globe,
  Brain,
  ArrowSquareOut,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

export default function FormsManager({ workspace }) {
  const [forms, setForms] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectUrl, setConnectUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (workspace?.forms) {
      try {
        const parsedForms = workspace.forms.map((f) => ({
          ...f,
          aiAnalysis: f.aiAnalysis !== undefined ? f.aiAnalysis : false,
        }));
        setForms(parsedForms);
      } catch {
        setForms([]);
      }
    }
  }, [workspace]);

  const handleConnectForm = async () => {
    if (!connectUrl) return;
    setIsConnecting(true);

    try {
      // Parse OpenForm URL
      const urlMatch = connectUrl.match(/forms\/([a-z0-9-]+)/);
      if (!urlMatch) {
        showToast("Invalid OpenForm URL", "error");
        setIsConnecting(false);
        return;
      }

      const formSlug = urlMatch[1];

      // Call OwnLLM API to connect form
      const response = await fetch(
        `${window.location.origin}/api/workspace/${workspace.slug}/forms`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: formSlug,
            formTitle: formSlug.replace(/-/g, " ").toUpperCase(),
            formUrl: connectUrl,
            aiAnalysis: true,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to connect form");
      }

      setForms([...forms, data.form]);
      setConnectUrl("");
      setShowConnectModal(false);
      showToast("Form connected successfully!", "success");
    } catch (error) {
      console.error("Error connecting form:", error);
      showToast(error.message || "Failed to connect form", "error");
    }

    setIsConnecting(false);
  };

  const saveForms = async (updatedForms) => {
    setSaving(true);
    try {
      await Workspace.update(workspace.slug, {
        forms: JSON.stringify(updatedForms),
      });
      setForms(updatedForms);
    } catch (error) {
      console.error("Failed to save forms:", error);
      showToast("Failed to save forms", "error");
    }
    setSaving(false);
  };

  const updateFormSettings = async (formId, updates) => {
    const updatedForms = forms.map((f) =>
      f.formId === formId ? { ...f, ...updates } : f
    );
    await saveForms(updatedForms);
  };

  const disconnectForm = async (formId) => {
    const updatedForms = forms.filter((f) => f.formId !== formId);
    await saveForms(updatedForms);
    showToast("Form disconnected", "success");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Forms</h2>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Connect Form
        </button>
      </div>

      <p className="text-white/60 text-sm">
        Connect OpenForm instances to this workspace. Responses will be added to the
        knowledge base for AI analysis.
      </p>

      {/* Connect Form Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-bg-secondary border border-theme-modal-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Connect OpenForm
              </h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-white/60 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs uppercase font-bold mb-2">
                  Form URL
                </label>
                <input
                  type="url"
                  value={connectUrl}
                  onChange={(e) => setConnectUrl(e.target.value)}
                  placeholder="https://your-domain.com/forms/form-slug"
                  className="w-full bg-theme-bg-primary text-white text-sm rounded-lg px-3 py-2 border border-theme-border focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex items-start gap-2 text-sm text-white/60">
                <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Paste the edit URL of any form from your OpenForm instance.
                  Responses will automatically be sent to this workspace.
                </p>
              </div>
              <button
                onClick={handleConnectForm}
                disabled={!connectUrl || isConnecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Connect Form
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className="bg-theme-bg-secondary border border-theme-border border-dashed rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-white font-medium mb-2">No forms connected</h3>
          <p className="text-white/60 text-sm mb-4">
            Connect your OpenForm instances to start collecting responses and using them
            in AI conversations.
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
          >
            Connect Your First Form
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <div
              key={form.formId}
              className="bg-theme-bg-secondary border border-theme-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-medium">
                      {form.formTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>Responses: {form.responseCount || 0}</span>
                    {form.connectedAt && (
                      <span>
                        Connected:{" "}
                        {new Date(form.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateFormSettings(form.formId, {
                        aiAnalysis: !form.aiAnalysis,
                      })
                    }
                    className={`p-2 rounded-lg transition-colors ${
                      form.aiAnalysis
                        ? "bg-purple-600 text-white"
                        : "bg-theme-bg-primary text-white/60 hover:text-white"
                    }`}
                    title={form.aiAnalysis ? "AI Analysis ON" : "AI Analysis OFF"}
                  >
                    <Brain className="w-4 h-4" />
                  </button>
                  <a
                    href={form.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-theme-bg-primary text-white/60 hover:text-white transition-colors"
                    title="Open Form"
                  >
                    <ArrowSquareOut className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => disconnectForm(form.formId)}
                    className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                    title="Disconnect Form"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Info */}
      {forms.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h4 className="text-white font-medium mb-1">AI Analysis</h4>
              <p className="text-white/70 text-sm">
                When enabled, form responses are automatically added to your workspace
                documents. You can then chat with the AI about any form response,
                and it will use RAG to provide insights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
