import React, { useRef, useState } from "react";
import { Plus, X, CaretDown } from "@phosphor-icons/react";

function normalizeKeyValueRows(input) {
  // Always return an array
  if (input === null || input === undefined) return [];
  if (typeof input !== "object" && typeof input !== "string") return [];

  // Expected shape: [{ key: string, value: string }]
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          const parts = item.split(":");
          if (parts.length < 2) return null;
          const key = parts.shift()?.trim();
          const value = parts.join(":").trim();
          if (!key) return null;
          return { key, value };
        }
        if (Array.isArray(item) && item.length >= 2) {
          const [key, value] = item;
          if (!key) return null;
          return {
            key: String(key),
            value: value == null ? "" : String(value),
          };
        }
        if (typeof item === "object") {
          const key = item.key ?? item.name ?? item.header ?? item[0];
          const value = item.value ?? item.val ?? item[1];
          if (!key) return null;
          return {
            key: String(key),
            value: value == null ? "" : String(value),
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  // Common AI output: { Authorization: "Bearer ..." }
  if (typeof input === "object") {
    return Object.entries(input)
      .map(([key, value]) => ({
        key: String(key),
        value: value == null ? "" : String(value),
      }))
      .filter((h) => h.key);
  }

  // Also accept a newline-delimited string of headers
  if (typeof input === "string") {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return null;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!key) return null;
        return { key, value };
      })
      .filter(Boolean);
  }

  return [];
}

export default function ApiCallNode({
  config = {},
  onConfigChange,
  renderVariableSelect,
}) {
  const urlInputRef = useRef(null);
  const [showVarMenu, setShowVarMenu] = useState(false);
  const varButtonRef = useRef(null);

  const headers = normalizeKeyValueRows(config?.headers);
  const formData = normalizeKeyValueRows(config?.formData);

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    onConfigChange({ headers: newHeaders });
  };

  const addHeader = () => {
    const newHeaders = [...headers, { key: "", value: "" }];
    onConfigChange({ headers: newHeaders });
  };

  const removeHeader = (index) => {
    const newHeaders = [...headers].filter((_, i) => i !== index);
    onConfigChange({ headers: newHeaders });
  };

  const insertVariableAtCursor = (variableName) => {
    if (!urlInputRef.current) return;

    const input = urlInputRef.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = config.url;

    const newValue =
      currentValue.substring(0, start) +
      "${" +
      variableName +
      "}" +
      currentValue.substring(end);

    onConfigChange({ url: newValue });
    setShowVarMenu(false);

    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newPosition = start + variableName.length + 3; // +3 for ${}
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          URL
        </label>
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="text"
            placeholder="https://api.example.com/endpoint"
            value={config.url}
            onChange={(e) => onConfigChange({ url: e.target.value })}
            className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="relative">
            <button
              ref={varButtonRef}
              onClick={() => setShowVarMenu(!showVarMenu)}
              className="h-full px-3 rounded-lg border-none bg-theme-settings-input-bg text-theme-text-primary hover:bg-theme-action-menu-item-hover transition-colors duration-300 flex items-center gap-1"
              title="Insert variable"
            >
              <Plus className="w-4 h-4" />
              <CaretDown className="w-3 h-3" />
            </button>
            {showVarMenu && (
              <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-theme-settings-input-bg border-none rounded-lg shadow-lg z-10">
                {renderVariableSelect(
                  "",
                  insertVariableAtCursor,
                  "Select variable to insert",
                  true
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Method
        </label>
        <select
          value={config.method}
          onChange={(e) => onConfigChange({ method: e.target.value })}
          className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
        >
          {["GET", "POST", "DELETE", "PUT", "PATCH"].map((method) => (
            <option
              key={method}
              value={method}
              className="bg-theme-settings-input-bg"
            >
              {method}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-theme-text-primary">
            Headers
          </label>
          <button
            onClick={addHeader}
            className="p-1.5 rounded-lg border-none bg-theme-settings-input-bg text-theme-text-primary hover:bg-theme-action-menu-item-hover transition-colors duration-300"
            title="Add header"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Header name"
                value={header.key}
                onChange={(e) =>
                  handleHeaderChange(index, "key", e.target.value)
                }
                className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                autoComplete="off"
                spellCheck={false}
              />
              <input
                type="text"
                placeholder="Value"
                value={header.value}
                onChange={(e) =>
                  handleHeaderChange(index, "value", e.target.value)
                }
                className="flex-1 border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-2.5 rounded-lg border-none bg-theme-settings-input-bg text-theme-text-primary hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/10 transition-colors duration-300"
                title="Remove header"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {["POST", "PUT", "PATCH"].includes(config.method) && (
        <div>
          <label className="block text-sm font-medium text-theme-text-primary mb-2">
            Request Body
          </label>
          <div className="space-y-2">
            <select
              value={config.bodyType || "json"}
              onChange={(e) => onConfigChange({ bodyType: e.target.value })}
              className="w-full p-2.5 text-sm rounded-lg bg-theme-bg-primary border border-white/5 text-theme-text-primary focus:border-primary-button focus:ring-1 focus:ring-primary-button outline-none light:bg-theme-settings-input-bg light:border-black/10"
            >
              <option
                value="json"
                className="bg-theme-bg-primary light:bg-theme-settings-input-bg"
              >
                JSON
              </option>
              <option
                value="text"
                className="bg-theme-bg-primary light:bg-theme-settings-input-bg"
              >
                Raw Text
              </option>
              <option
                value="form"
                className="bg-theme-bg-primary light:bg-theme-settings-input-bg"
              >
                Form Data
              </option>
            </select>
            {config.bodyType === "json" ? (
              <textarea
                placeholder='{"key": "value"}'
                value={config.body}
                onChange={(e) => onConfigChange({ body: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg bg-theme-bg-primary border border-white/5 text-theme-text-primary placeholder:text-theme-text-secondary/20 focus:border-primary-button focus:ring-1 focus:ring-primary-button outline-none light:bg-theme-settings-input-bg light:border-black/10 font-mono"
                rows={4}
                autoComplete="off"
                spellCheck={false}
              />
            ) : config.bodyType === "form" ? (
              <div className="space-y-2">
                {formData.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Key"
                      value={item.key}
                      onChange={(e) => {
                        const newFormData = [...formData];
                        newFormData[index] = { ...item, key: e.target.value };
                        onConfigChange({ formData: newFormData });
                      }}
                      className="flex-1 p-2.5 text-sm rounded-lg bg-theme-bg-primary border border-white/5 text-theme-text-primary placeholder:text-theme-text-secondary/20 focus:border-primary-button focus:ring-1 focus:ring-primary-button outline-none light:bg-theme-settings-input-bg light:border-black/10"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={item.value}
                      onChange={(e) => {
                        const newFormData = [...formData];
                        newFormData[index] = { ...item, value: e.target.value };
                        onConfigChange({ formData: newFormData });
                      }}
                      className="flex-1 p-2.5 text-sm rounded-lg bg-theme-bg-primary border border-white/5 text-theme-text-primary placeholder:text-theme-text-secondary/20 focus:border-primary-button focus:ring-1 focus:ring-primary-button outline-none light:bg-theme-settings-input-bg light:border-black/10"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      onClick={() => {
                        const newFormData = [...formData].filter(
                          (_, i) => i !== index
                        );
                        onConfigChange({ formData: newFormData });
                      }}
                      className="p-2.5 rounded-lg bg-theme-bg-primary border border-white/5 text-theme-text-primary hover:text-red-500 hover:border-red-500/20 hover:bg-red-500/10 transition-colors duration-300 light:bg-theme-settings-input-bg light:border-black/10"
                      title="Remove field"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newFormData = [...formData, { key: "", value: "" }];
                    onConfigChange({ formData: newFormData });
                  }}
                  className="w-full p-2.5 rounded-lg border-none bg-theme-settings-input-bg text-theme-text-primary hover:bg-theme-action-menu-item-hover transition-colors duration-300 text-sm"
                >
                  Add Form Field
                </button>
              </div>
            ) : (
              <textarea
                placeholder="Raw request body..."
                value={config.body}
                onChange={(e) => onConfigChange({ body: e.target.value })}
                className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                rows={4}
                autoComplete="off"
                spellCheck={false}
              />
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Store Response In
        </label>
        {renderVariableSelect(
          config.responseVariable,
          (value) => onConfigChange({ responseVariable: value }),
          "Select or create variable"
        )}
      </div>
    </div>
  );
}
