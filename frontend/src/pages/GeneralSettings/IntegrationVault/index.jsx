import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import showToast from "@/utils/toast";
import {
  Key,
  Plus,
  Trash,
  PencilSimple,
  Eye,
  EyeSlash,
  FloppyDisk,
  X,
  MagnifyingGlass,
  Shield,
} from "@phosphor-icons/react";

// API client for vault
const VaultAPI = {
  async getAll() {
    const res = await fetch("/api/v1/vault", {
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },
  async save(data) {
    const res = await fetch("/api/v1/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async delete(id) {
    const res = await fetch(`/api/v1/vault/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },
};

// Category types (automation-focused)
const CATEGORIES = {
  api_keys: { label: "API Keys", color: "bg-purple-500/20 text-purple-400" },
  login_credentials: {
    label: "Login Credentials",
    color: "bg-blue-500/20 text-blue-400",
  },
  endpoints: {
    label: "Endpoints / URLs",
    color: "bg-green-500/20 text-green-400",
  },
  oauth_tokens: {
    label: "OAuth Tokens",
    color: "bg-orange-500/20 text-orange-400",
  },
  webhooks: { label: "Webhooks", color: "bg-pink-500/20 text-pink-400" },
  database: { label: "Database", color: "bg-cyan-500/20 text-cyan-400" },
  ssh_server: { label: "SSH / Server", color: "bg-red-500/20 text-red-400" },
  custom: { label: "Custom", color: "bg-gray-500/20 text-gray-400" },
};

// Common service presets
const SERVICE_PRESETS = [
  {
    service: "openai",
    name: "OpenAI",
    category: "api_keys",
    fields: ["api_key"],
  },
  {
    service: "anthropic",
    name: "Anthropic",
    category: "api_keys",
    fields: ["api_key"],
  },
  { service: "groq", name: "Groq", category: "api_keys", fields: ["api_key"] },
  {
    service: "stripe",
    name: "Stripe",
    category: "api_keys",
    fields: ["api_key", "webhook_secret"],
  },
  {
    service: "twilio",
    name: "Twilio",
    category: "api_keys",
    fields: ["account_sid", "auth_token", "phone_number"],
  },
  {
    service: "slack",
    name: "Slack",
    category: "webhooks",
    fields: ["webhook_url", "bot_token"],
  },
  {
    service: "github",
    name: "GitHub",
    category: "oauth_tokens",
    fields: ["access_token"],
  },
  { service: "custom", name: "Custom", category: "custom", fields: [] },
];

function AddEditModal({ isOpen, onClose, onSave, editingEntry }) {
  const [service, setService] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const [config, setConfig] = useState({});
  const [customFields, setCustomFields] = useState([{ key: "", value: "" }]);
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingEntry) {
      setService(editingEntry.service || "");
      setName(editingEntry.name || "");
      setCategory(editingEntry.category || "other");
      setConfig(editingEntry.config || {});
      // Convert config to custom fields
      const fields = Object.entries(editingEntry.config || {}).map(
        ([key, value]) => ({ key, value })
      );
      setCustomFields(fields.length > 0 ? fields : [{ key: "", value: "" }]);
    } else {
      setService("");
      setName("");
      setCategory("other");
      setConfig({});
      setCustomFields([{ key: "", value: "" }]);
    }
  }, [editingEntry, isOpen]);

  const handlePresetSelect = (preset) => {
    setService(preset.service);
    setName(preset.name);
    setCategory(preset.category);
    if (preset.fields.length > 0) {
      setCustomFields(preset.fields.map((f) => ({ key: f, value: "" })));
    }
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const addField = () => {
    setCustomFields([...customFields, { key: "", value: "" }]);
  };

  const removeField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!service || !name) {
      showToast("Service and name are required", "error");
      return;
    }

    // Build config from custom fields
    const configObj = {};
    customFields.forEach((f) => {
      if (f.key && f.value) {
        configObj[f.key] = f.value;
      }
    });

    setSaving(true);
    try {
      const result = await onSave({
        service,
        name,
        category,
        config: configObj,
      });
      if (result.success) {
        showToast("Credential saved!", "success");
        onClose();
      } else {
        showToast(result.error || "Failed to save", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-medium text-white">
            {editingEntry ? "Edit Credential" : "Add Credential"}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick Presets (only for new) */}
          {!editingEntry && (
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
                Quick Add
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_PRESETS.slice(0, 7).map((preset) => (
                  <button
                    key={preset.service}
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      service === preset.service
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Service ID */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Service ID
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) =>
                setService(e.target.value.toLowerCase().replace(/\s/g, "_"))
              }
              placeholder="e.g. stripe, openai, custom_api"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe Production"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
            >
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <option key={key} value={key} className="bg-theme-bg-secondary">
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Credentials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/50 uppercase tracking-wider">
                Credentials
              </label>
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-xs text-white/50 hover:text-white flex items-center gap-1"
              >
                {showSecrets ? <EyeSlash size={14} /> : <Eye size={14} />}
                {showSecrets ? "Hide" : "Show"}
              </button>
            </div>
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      handleFieldChange(idx, "key", e.target.value)
                    }
                    placeholder="Key (e.g. api_key)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30"
                  />
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={field.value}
                    onChange={(e) =>
                      handleFieldChange(idx, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/30 font-mono"
                  />
                  {customFields.length > 1 && (
                    <button
                      onClick={() => removeField(idx)}
                      className="p-2 text-white/30 hover:text-red-400"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addField}
              className="mt-2 text-xs text-white/50 hover:text-white flex items-center gap-1"
            >
              <Plus size={14} /> Add field
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !service || !name}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-white/90"
          >
            <FloppyDisk size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationVault() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const result = await VaultAPI.getAll();
      if (result.success) {
        setEntries(result.entries || []);
      }
    } catch (e) {
      console.error("Failed to load vault:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSave = async (data) => {
    const result = await VaultAPI.save(data);
    if (result.success) {
      await fetchEntries();
    }
    return result;
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.name}"? This cannot be undone.`))
      return;
    const result = await VaultAPI.delete(entry.id);
    if (result.success) {
      showToast("Deleted", "success");
      await fetchEntries();
    } else {
      showToast(result.error || "Failed to delete", "error");
    }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const filtered = entries.filter(
    (e) =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.service?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-white/10">
              <Shield size={20} className="text-white/70" weight="fill" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">
                Integration Vault
              </h1>
              <p className="text-xs text-white/40">
                Secure credentials for your AI agents
              </p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-white/90 transition-all"
          >
            <Plus size={16} weight="bold" />
            Add Credential
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search credentials..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-white/50">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <Key size={48} className="mb-4" />
              <p className="text-sm">No credentials saved yet</p>
              <p className="text-xs mt-1">
                Add API keys for your agents to use
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((entry) => {
                const cat = CATEGORIES[entry.category] || CATEGORIES.other;
                const fieldCount = Object.keys(entry.config || {}).length;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Key size={18} className="text-white/50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {entry.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/40 font-mono">
                            {entry.service}
                          </span>
                          <span className="text-xs text-white/30">
                            • {fieldCount} field{fieldCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(entry)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingEntry={editingEntry}
      />
    </div>
  );
}
