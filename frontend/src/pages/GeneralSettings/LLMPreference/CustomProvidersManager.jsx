import React, { useState, useEffect } from "react";
import { Plus, Trash, Gear, X } from "@phosphor-icons/react";
import System from "@/models/system";
import showToast from "@/utils/toast";
import AnythingLLMIcon from "@/media/logo/anything-llm-icon.png";
import GenericOpenAiLogo from "@/media/llmprovider/generic-openai.png";

/**
 * CustomProvidersManager - UI for managing multiple custom Generic OpenAI providers
 * Allows users to add, edit, and delete custom LLM providers
 */
export default function CustomProvidersManager() {
  const [customProviders, setCustomProviders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [newProvider, setNewProvider] = useState({
    name: "",
    basePath: "",
    apiKey: "",
    model: "",
    maxTokens: "",
    streamingDisabled: false,
  });

  // Load custom providers on mount
  useEffect(() => {
    loadCustomProviders();
  }, []);

  const loadCustomProviders = async () => {
    try {
      const res = await System.getCustomProviders();
      if (res?.success === false) {
        if (res.status === 401) {
          showToast("Unauthorized. Please sign in again.", "error");
          return;
        }
        showToast(res.error || "Failed to load custom providers", "error");
        return;
      }
      setCustomProviders(res.providers || []);
    } catch (error) {
      console.error("Failed to load custom providers:", error);
      showToast("Failed to load custom providers", "error");
    }
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();

    try {
      const data = await System.saveCustomProvider({
        action: editingProvider ? "update" : "add",
        id: editingProvider?.id,
        name: newProvider.name,
        baseUrl: newProvider.basePath,
        defaultModel: newProvider.model,
        apiKey: newProvider.apiKey || "",
        maxTokens: newProvider.maxTokens
          ? parseInt(newProvider.maxTokens)
          : null,
        streamingDisabled: !!newProvider.streamingDisabled,
      });

      if (data.success) {
        setCustomProviders(data.providers);
        setEditingProvider(null);
        setShowAddForm(false);
        setNewProvider({
          name: "",
          basePath: "",
          apiKey: "",
          model: "",
          maxTokens: "",
          streamingDisabled: false,
        });
        showToast(
          editingProvider
            ? "Provider updated successfully"
            : "Provider added successfully",
          "success"
        );
      } else {
        showToast(data.error || "Failed to save provider", "error");
      }
    } catch (error) {
      console.error("Failed to save provider:", error);
      showToast("Failed to save provider", "error");
    }
  };

  const handleDeleteProvider = async (providerId, providerName) => {
    if (!confirm(`Are you sure you want to delete "${providerName}"?`)) {
      return;
    }

    try {
      const data = await System.deleteCustomProvider(providerId);

      if (data.success) {
        setCustomProviders(data.providers);
        showToast("Provider deleted successfully", "success");
      } else {
        showToast(data.error || "Failed to delete provider", "error");
      }
    } catch (error) {
      console.error("Failed to delete provider:", error);
      showToast("Failed to delete provider", "error");
    }
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setNewProvider({
      name: provider.name,
      basePath: provider.basePath,
      apiKey: provider.apiKey,
      model: provider.model,
      maxTokens: provider.maxTokens || "",
      streamingDisabled: provider.streamingDisabled || false,
    });
    setShowAddForm(true);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setEditingProvider(null);
    setNewProvider({
      name: "",
      basePath: "",
      apiKey: "",
      model: "",
      maxTokens: "",
      streamingDisabled: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-white">
            Custom OpenAI Providers
          </div>
          <div className="text-sm text-white/60 mt-1">
            Add multiple custom OpenAI-compatible providers (LMStudio, Ollama,
            DeepSeek, etc.)
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-primary-button hover:bg-primary-button/90 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus size={18} weight="bold" />
          Add Provider
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-theme-settings-input-bg rounded-lg p-6 border border-white/10">
          <form onSubmit={handleSaveProvider}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-white">
                {editingProvider ? "Edit Provider" : "Add Custom Provider"}
              </div>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="text-white/60 hover:text-white"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Provider Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Provider Name
                </label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, name: e.target.value })
                  }
                  placeholder="e.g., LMStudio, Ollama, DeepSeek"
                  required
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={newProvider.basePath}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, basePath: e.target.value })
                  }
                  placeholder="e.g., http://localhost:1234/v1"
                  required
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
                <div className="text-xs text-white/50 mt-1">
                  The base URL of your OpenAI-compatible API (usually ends with
                  /v1)
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  API Key (Optional)
                </label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, apiKey: e.target.value })
                  }
                  placeholder="Enter API key if required"
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
              </div>

              {/* Default Model */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Default Model
                </label>
                <input
                  type="text"
                  value={newProvider.model}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, model: e.target.value })
                  }
                  placeholder="e.g., gpt-3.5-turbo, llama-2-7b"
                  required
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Max Tokens (Optional)
                </label>
                <input
                  type="number"
                  value={newProvider.maxTokens}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      maxTokens: e.target.value,
                    })
                  }
                  placeholder="e.g., 4096"
                  min="1"
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
              </div>

              {/* Disable Streaming */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="streamingDisabled"
                  checked={newProvider.streamingDisabled}
                  onChange={(e) =>
                    setNewProvider({
                      ...newProvider,
                      streamingDisabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-white/10 bg-theme-settings-input-bg text-purple-500 focus:ring-2 focus:ring-purple-500"
                />
                <label
                  htmlFor="streamingDisabled"
                  className="text-sm font-medium text-white/80"
                >
                  Disable streaming (for APIs that don't support it)
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-4 py-2 text-white/60 hover:text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-button hover:bg-primary-button/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {editingProvider ? "Update Provider" : "Add Provider"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Providers List */}
      {customProviders.length > 0 ? (
        <div className="space-y-3">
          {customProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-theme-settings-input-bg rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-start gap-4">
                {/* Provider Logo */}
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <img
                    src={GenericOpenAiLogo}
                    alt={provider.name}
                    className="w-8 h-8"
                  />
                </div>

                {/* Provider Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold text-white truncate">
                      {provider.name}
                    </div>
                    {provider.apiKey && (
                      <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Configured
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-white/60 mt-1 truncate">
                    {provider.basePath}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Model: {provider.model}
                    {provider.maxTokens &&
                      ` • Max tokens: ${provider.maxTokens}`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditProvider(provider)}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    title="Edit provider"
                  >
                    <Gear size={18} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteProvider(provider.id, provider.name)
                    }
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete provider"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showAddForm && (
          <div className="bg-theme-settings-input-bg rounded-lg p-8 border border-white/10 border-dashed">
            <div className="text-center">
              <img
                src={AnythingLLMIcon}
                alt="No custom providers"
                className="w-16 h-16 mx-auto mb-4 opacity-50"
              />
              <div className="text-base font-medium text-white mb-2">
                No custom providers configured
              </div>
              <div className="text-sm text-white/60 mb-4">
                Add multiple OpenAI-compatible providers like LMStudio, Ollama,
                or DeepSeek
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-6 py-2 bg-primary-button hover:bg-primary-button/90 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add Your First Provider
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
