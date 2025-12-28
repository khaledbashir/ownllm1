import React, { useState, useEffect } from "react";
import { X, PlusCircle, Check, Warning, Info, FloppyDisk } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";
import { titleCase } from "text-case";

export default function EditServerModal({ server, onClose, onEdit }) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [originalName, setOriginalName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    connectionType: "stdio",
    command: "npx",
    args: [],
    env: [],
    autoStart: true,
  });

  const [validationResult, setValidationResult] = useState({
    valid: false,
    error: null,
    warnings: null,
  });

  // Initialize form with server data
  useEffect(() => {
    if (server) {
      setOriginalName(server.name);
      setFormData({
        name: server.name,
        connectionType: server.connectionType || "stdio",
        command: server.command || "npx",
        args: server.args || [],
        env: Object.entries(server.env || {}).map(([key, value]) => ({
          key,
          value,
          isSecret: key.toLowerCase().includes("key") ||
                    key.toLowerCase().includes("secret") ||
                    key.toLowerCase().includes("token") ||
                    key.toLowerCase().includes("password"),
        })),
        autoStart: server.autoStart !== false,
      });
    }
  }, [server]);

  // Add environment variable
  const addEnvVar = () => {
    setFormData((prev) => ({
      ...prev,
      env: [...prev.env, { key: "", value: "", isSecret: false }],
    }));
  };

  // Update environment variable
  const updateEnvVar = (index, field, value) => {
    const newEnv = [...formData.env];
    newEnv[index][field] = value;
    setFormData((prev) => ({ ...prev, env: newEnv }));
  };

  // Remove environment variable
  const removeEnvVar = (index) => {
    setFormData((prev) => ({
      ...prev,
      env: prev.env.filter((_, i) => i !== index),
    }));
  };

  // Validate configuration
  const handleValidate = async () => {
    setValidating(true);
    setValidationResult({ valid: false, error: null, warnings: null });

    const result = await MCPServers.validateServer(formData);
    setValidationResult(result);
    setValidating(false);

    if (result.valid) {
      showToast("Configuration is valid!", "success");
    } else {
      showToast(result.error || "Validation failed", "error");
    }

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warning) => {
        showToast(warning, "warning");
      });
    }
  };

  // Update server
  const handleSubmit = async () => {
    // Validate before submitting
    if (!validationResult.valid) {
      showToast("Please validate the configuration first", "error");
      return;
    }

    setLoading(true);

    // Prepare data for API (filter out empty env vars)
    const cleanEnv = {};
    formData.env.forEach((item) => {
      if (item.key && item.key.trim()) {
        cleanEnv[item.key] = item.value;
      }
    });

    // Prepare args (filter out empty strings)
    const cleanArgs = formData.args.filter((arg) => arg && arg.trim());

    const updates = {
      connectionType: formData.connectionType,
      command: formData.command.trim(),
      args: cleanArgs,
      env: cleanEnv,
      autoStart: formData.autoStart,
    };

    const { success, error } = await MCPServers.editServer(
      originalName,
      updates
    );

    setLoading(false);

    if (success) {
      showToast("MCP server updated successfully!", "success", { clear: true });
      onEdit();
      onClose();
    } else {
      showToast(error || "Failed to update MCP server", "error", { clear: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-bg-secondary rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-theme-bg-secondary border-b border-white/10 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <FloppyDisk className="w-6 h-6 text-white" weight="bold" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Edit MCP Server
                </h2>
                <p className="text-sm text-theme-text-secondary">
                  Update configuration for {titleCase(server?.name || "server")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-theme-text-secondary hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X className="w-6 h-6" weight="bold" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Server Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Server Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-custom-mcp"
              className="w-full bg-theme-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-theme-text-secondary focus:outline-none focus:border-cta-button focus:ring-1 focus:ring-cta-button transition-all"
            />
            <p className="text-xs text-theme-text-secondary mt-1">
              Unique identifier for this server (letters, numbers, hyphens, underscores only)
            </p>
          </div>

          {/* Connection Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Connection Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {["stdio", "http", "sse"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, connectionType: type })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.connectionType === type
                      ? "border-cta-button bg-cta-button/10 text-cta-button"
                      : "border-white/20 text-theme-text-secondary hover:border-white/40"
                  }`}
                >
                  <span className="font-medium">{type.toUpperCase()}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-theme-text-secondary mt-1">
              {formData.connectionType === "stdio" && "Command-line based (recommended for most MCP servers)"}
              {formData.connectionType === "http" && "REST API endpoint"}
              {formData.connectionType === "sse" && "Server-Sent Events (real-time streaming)"}
            </p>
          </div>

          {/* Command */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Command <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="npx"
              className="w-full bg-theme-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-theme-text-secondary focus:outline-none focus:border-cta-button focus:ring-1 focus:ring-cta-button transition-all font-mono"
            />
            <p className="text-xs text-theme-text-secondary mt-1">
              The command to execute (e.g., <code className="bg-white/10 px-1.5 py-0.5 rounded">npx</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded">node</code>)
            </p>
          </div>

          {/* Arguments */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Arguments</label>
            {formData.args.map((arg, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={arg}
                  onChange={(e) => {
                    const newArgs = [...formData.args];
                    newArgs[index] = e.target.value;
                    setFormData({ ...formData, args: newArgs });
                  }}
                  placeholder="-y @package/name"
                  className="flex-1 bg-theme-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-theme-text-secondary focus:outline-none focus:border-cta-button focus:ring-1 focus:ring-cta-button transition-all font-mono"
                />
                {index === formData.args.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, args: [...formData.args, "" ] })}
                    className="p-3 rounded-lg border-2 border-dashed border-white/30 text-theme-text-secondary hover:border-cta-button hover:text-cta-button transition-all"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Advanced Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-center gap-2 text-sm text-theme-text-secondary hover:text-white transition-colors py-2"
            >
              <Info className="w-4 h-4" />
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-white/10 mt-4">
                {/* Environment Variables */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">
                      Environment Variables
                    </label>
                    <button
                      type="button"
                      onClick={addEnvVar}
                      className="text-sm text-cta-button hover:text-cta-button/80 transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Variable
                    </button>
                  </div>

                  {formData.env.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-lg">
                      <p className="text-sm text-theme-text-secondary">
                        No environment variables set
                      </p>
                      <p className="text-xs text-theme-text-secondary mt-1">
                        Use this for API keys, tokens, or configuration values
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.env.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={item.key}
                            onChange={(e) =>
                              updateEnvVar(index, "key", e.target.value)
                            }
                            placeholder="API_KEY"
                            className="flex-1 bg-theme-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-theme-text-secondary focus:outline-none focus:border-cta-button focus:ring-1 focus:ring-cta-button transition-all font-mono"
                          />
                          <div className="flex-1 relative">
                            <input
                              type={item.isSecret ? "password" : "text"}
                              value={item.value}
                              onChange={(e) =>
                                updateEnvVar(index, "value", e.target.value)
                              }
                              placeholder="your-api-key"
                              className="w-full bg-theme-bg-primary border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-theme-text-secondary focus:outline-none focus:border-cta-button focus:ring-1 focus:ring-cta-button transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newEnv = [...formData.env];
                                newEnv[index].isSecret =
                                  !newEnv[index].isSecret;
                                setFormData({ ...formData, env: newEnv });
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-secondary hover:text-white transition-colors"
                              title={item.isSecret ? "Show" : "Hide"}
                            >
                              {item.isSecret ? "👁️" : "🔒"}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEnvVar(index)}
                            className="p-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Remove variable"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto Start */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.autoStart !== false}
                    onChange={(e) =>
                      setFormData({ ...formData, autoStart: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-2 border-white/30 bg-theme-bg-primary text-cta-button focus:outline-none focus:ring-2 focus:ring-cta-button cursor-pointer"
                  />
                  <div>
                    <label className="text-sm font-medium text-white cursor-pointer">
                      Auto-start this server
                    </label>
                    <p className="text-xs text-theme-text-secondary">
                      Server will start automatically when AnythingLLM boots
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation Result */}
          {validationResult.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Warning className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{validationResult.error}</p>
              </div>
            </div>
          )}

          {validationResult.warnings && validationResult.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-500 mb-1">Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-500">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validationResult.valid && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-500">
                  Configuration is valid and ready to save
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-theme-bg-secondary border-t border-white/10 px-6 py-4 rounded-b-2xl z-10">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-white/20 text-white hover:bg-white/5 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleValidate}
              disabled={validating || !formData.name}
              className="px-6 py-3 rounded-lg border-2 border-white/20 text-white hover:bg-white/5 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                  Validating...
                </span>
              ) : (
                "Test Configuration"
              )}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !validationResult.valid}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
