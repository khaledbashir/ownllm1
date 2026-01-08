import { useState, useEffect } from "react";
import {
  Sparkle,
  Plus,
  Trash,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { AVAILABLE_LLM_PROVIDERS } from "@/pages/GeneralSettings/LLMPreference";
import useGetProviderModels from "@/hooks/useGetProvidersModels";
import System from "@/models/system";
import AnythingLLMIcon from "@/media/logo/anything-llm-icon.png";
import GenericOpenAiLogo from "@/media/llmprovider/generic-openai.png";
import LogicModuleSelector from "../LogicModuleSelector";

// Some providers do not support model selection
const FREE_FORM_LLM_SELECTION = ["bedrock", "azure", "generic-openai"];
const NO_MODEL_SELECTION = ["default", "huggingface"];
const DISABLED_PROVIDERS = [];

const LLM_DEFAULT = {
  name: "Workspace default",
  value: "default",
  logo: AnythingLLMIcon,
  description: "Use the workspace LLM preference for Doc AI.",
};

const LLMS = [LLM_DEFAULT, ...AVAILABLE_LLM_PROVIDERS].filter(
  (llm) => !DISABLED_PROVIDERS.includes(llm.value)
);

// Inline AI Model Selection Component
function InlineAIModelSelection({ provider, workspace, setHasChanges, customProviders }) {
  // Check if this is a custom provider
  const customProvider = customProviders.find(p => p.id === provider);
  
  // For custom providers, show the configured model (no need to fetch)
  if (customProvider) {
    return (
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Model (from provider config)
        </label>
        <input
          type="text"
          name="inlineAiModel"
          defaultValue={workspace?.inlineAiModel || customProvider.model || ""}
          onChange={() => setHasChanges(true)}
          className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="text-xs text-white/50 mt-1">
          Using default model from provider configuration: {customProvider.model}
        </div>
      </div>
    );
  }

  // For standard providers, fetch models
  const { defaultModels, customModels, loading } = useGetProviderModels(provider);

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Model
        </label>
        <select
          name="inlineAiModel"
          disabled={true}
          className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none"
        >
          <option>-- waiting for models --</option>
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">
        Model
      </label>
      <select
        name="inlineAiModel"
        onChange={() => setHasChanges(true)}
        className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {defaultModels.length > 0 && (
          <optgroup label="General models">
            {defaultModels.map((model) => (
              <option
                key={model}
                value={model}
                selected={workspace?.inlineAiModel === model}
              >
                {model}
              </option>
            ))}
          </optgroup>
        )}
        {Array.isArray(customModels) && customModels.length > 0 && (
          <optgroup label="Discovered models">
            {customModels.map((model) => (
              <option
                key={model.id}
                value={model.id}
                selected={workspace?.inlineAiModel === model.id}
              >
                {model.id}
              </option>
            ))}
          </optgroup>
        )}
        {!Array.isArray(customModels) &&
          Object.keys(customModels).length > 0 && (
            <>
              {Object.entries(customModels).map(([organization, models]) => (
                <optgroup key={organization} label={organization}>
                  {models.map((model) => (
                    <option
                      key={model.id}
                      value={model.id}
                      selected={workspace?.inlineAiModel === model.id}
                    >
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </>
          )}
      </select>
    </div>
  );
}


/**
 * DocAISettings - Settings for the inline AI in the document editor
 * Allows users to customize:
 * - System prompt for Doc AI
 * - Custom actions with their own prompts
 */
export default function DocAISettings({ workspace, setHasChanges }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [customActions, setCustomActions] = useState([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState({
    name: "",
    prompt: "",
    icon: "✨",
  });
  
  // Provider/Model selection state
  const [selectedProvider, setSelectedProvider] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const [customProviders, setCustomProvidersState] = useState([]);
  const [availableProviders, setAvailableProviders] = useState(LLMS);

  // Load existing settings
  useEffect(() => {
    if (workspace) {
      setSystemPrompt(workspace.inlineAiSystemPrompt || "");
      setSelectedProvider(workspace.inlineAiProvider || "default");
      try {
        let actions = [];
        if (workspace.inlineAiActions) {
          const actionsStr = workspace.inlineAiActions;
          if (typeof actionsStr === 'string' && !actionsStr.startsWith('[object')) {
            actions = JSON.parse(actionsStr);
          }
        }
        setCustomActions(Array.isArray(actions) ? actions : []);
      } catch (e) {
        console.warn("[DocAISettings] Failed to parse inlineAiActions:", e);
        setCustomActions([]);
      }
    }
    // Load custom providers from system settings
    loadCustomProviders();
  }, [workspace]);

  const loadCustomProviders = async () => {
    try {
      const response = await System.getCustomProviders();
      if (response?.providers) {
        setCustomProvidersState(response.providers);
        // Add custom providers to available list
        const customProviderLLMs = response.providers.map((p) => ({
          name: p.name,
          value: p.id,
          logo: GenericOpenAiLogo,
          description: `Custom OpenAI-compatible provider`,
        }));
        setAvailableProviders([LLM_DEFAULT, ...AVAILABLE_LLM_PROVIDERS, ...customProviderLLMs]);
      }
    } catch (error) {
      console.error("Failed to load custom providers:", error);
    }
  };

  // Set custom providers changes to parent for form submission
  const setCustomProviders = (providers) => {
    setCustomProvidersState(providers);
    setHasChanges(true);
  };

  const handleSystemPromptChange = (e) => {
    setSystemPrompt(e.target.value);
    setHasChanges(true);
  };

  const handleAddAction = () => {
    if (!newAction.name.trim() || !newAction.prompt.trim()) return;

    const action = {
      id: `custom_${Date.now()}`,
      name: newAction.name.trim(),
      prompt: newAction.prompt.trim(),
      icon: newAction.icon || "✨",
    };

    setCustomActions([...customActions, action]);
    setNewAction({ name: "", prompt: "", icon: "✨" });
    setShowAddAction(false);
    setHasChanges(true);
  };

  const handleRemoveAction = (actionId) => {
    setCustomActions(customActions.filter((a) => a.id !== actionId));
    setHasChanges(true);
  };

  const handleActionChange = (actionId, field, value) => {
    setCustomActions(
      customActions.map((a) =>
        a.id === actionId ? { ...a, [field]: value } : a
      )
    );
    setHasChanges(true);
  };

  const filteredLLMs = LLMS.filter((llm) =>
    llm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add custom providers to the list
  const customProvidersList = customProviders.map((p) => ({
    name: p.name,
    value: p.id,
    logo: AnythingLLMIcon,
    description: `Custom: ${p.basePath}`,
    isCustom: true,
  }));

  const allProviders = [...LLMS, ...customProvidersList];
  const filteredAllProviders = allProviders.filter((llm) =>
    llm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLLMObject = allProviders.find((llm) => llm.value === selectedProvider);

  return (
    <div className="mt-4">
      {/* Hidden inputs to include in form submission */}
      <input type="hidden" name="inlineAiSystemPrompt" value={systemPrompt} />
      <input
        type="hidden"
        name="inlineAiActions"
        value={JSON.stringify(customActions)}
      />
      <input type="hidden" name="inlineAiProvider" value={selectedProvider} />
      <input
        type="hidden"
        name="customLlmProviders"
        value={JSON.stringify(customProviders)}
      />

      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left py-2 text-white/80 hover:text-white transition-colors"
      >
        {isExpanded ? (
          <CaretDown size={16} weight="bold" />
        ) : (
          <CaretRight size={16} weight="bold" />
        )}
        <Sparkle size={18} className="text-purple-400" />
        <span className="font-semibold">Doc AI Settings</span>
        <span className="text-xs text-white/50 ml-2">
          (Customize inline editor AI)
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pl-6 space-y-4 border-l-2 border-white/10 ml-2">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              LLM Provider
              <span className="text-xs text-white/50 ml-2">
                (Optional - falls back to workspace provider)
              </span>
            </label>
            <div className="relative">
              {searchMenuOpen && (
                <div
                  className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 backdrop-blur-sm z-10"
                  onClick={() => setSearchMenuOpen(false)}
                />
              )}
              {searchMenuOpen ? (
                <div className="relative">
                  <div className="absolute left-3 top-2.5 pointer-events-none">
                    <MagnifyingGlass size={16} className="text-white/50" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search LLM providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchMenuOpen(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-2.5 text-white/50 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute w-full mt-1 max-h-80 overflow-y-auto bg-theme-bg-secondary border border-white/10 rounded-lg shadow-lg z-20">
                    {filteredAllProviders.map((llm) => (
                      <button
                        key={llm.value}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(llm.value);
                          setSearchMenuOpen(false);
                          setSearchQuery("");
                          setHasChanges(true);
                        }}
                        className={`w-full p-3 text-left hover:bg-theme-bg-primary transition-colors ${
                          selectedProvider === llm.value ? "bg-theme-bg-primary" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={llm.logo}
                            alt={llm.name}
                            className="w-8 h-8 rounded"
                          />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {llm.name}
                            </div>
                            <div className="text-xs text-white/50">
                              {llm.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchMenuOpen(true)}
                  className="w-full flex items-center justify-between gap-3 p-3 bg-theme-settings-input-bg text-white rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedLLMObject?.logo}
                      alt={selectedLLMObject?.name}
                      className="w-8 h-8 rounded"
                    />
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {selectedLLMObject?.name}
                      </div>
                      <div className="text-xs text-white/50">
                        {selectedLLMObject?.description}
                      </div>
                    </div>
                  </div>
                  <CaretDown size={16} weight="bold" className="text-white/50" />
                </button>
              )}
            </div>
          </div>

          {/* Model Selection */}
          {selectedProvider !== "default" &&
            !NO_MODEL_SELECTION.includes(selectedProvider) &&
            !FREE_FORM_LLM_SELECTION.includes(selectedProvider) &&
            !selectedProvider.startsWith("custom_") && (
              <InlineAIModelSelection
                provider={selectedProvider}
                workspace={workspace}
                setHasChanges={setHasChanges}
                customProviders={customProviders}
              />
            )}

          {/* Free Form Model Input */}
          {selectedProvider !== "default" &&
            (FREE_FORM_LLM_SELECTION.includes(selectedProvider) ||
              selectedProvider.startsWith("custom_")) && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  name="inlineAiModel"
                  defaultValue={
                    selectedProvider.startsWith("custom_")
                      ? (customProviders.find((p) => p.id === selectedProvider)?.model ||
                        workspace?.inlineAiModel ||
                        "")
                      : (workspace?.inlineAiModel || "")
                  }
                  onChange={() => setHasChanges(true)}
                  placeholder="Enter model name exactly as referenced in the API"
                  className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
                />
              </div>
            )}

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              System Prompt
              <span className="text-xs text-white/50 ml-2">
                (Optional - falls back to workspace prompt)
              </span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="You are a helpful writing assistant..."
              rows={3}
              className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-white/30"
            />
          </div>

          {/* Active Logic Module */}
          <LogicModuleSelector workspace={workspace} setHasChanges={setHasChanges} />

          {/* Custom Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white/80">
                Custom Actions
              </label>
              <button
                type="button"
                onClick={() => setShowAddAction(true)}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus size={14} />
                Add Action
              </button>
            </div>

            {/* Existing Actions */}
            <div className="space-y-2">
              {customActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start gap-2 bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={action.icon}
                        onChange={(e) =>
                          handleActionChange(action.id, "icon", e.target.value)
                        }
                        className="w-10 bg-transparent text-center border border-white/10 rounded px-1 py-0.5 text-sm"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={action.name}
                        onChange={(e) =>
                          handleActionChange(action.id, "name", e.target.value)
                        }
                        placeholder="Action name"
                        className="flex-1 bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-white placeholder:text-white/30"
                      />
                    </div>
                    <textarea
                      value={action.prompt}
                      onChange={(e) =>
                        handleActionChange(action.id, "prompt", e.target.value)
                      }
                      placeholder="Prompt template... Use {{selectedText}}, {{context}}, {{prompt}}"
                      rows={2}
                      className="w-full bg-transparent border border-white/10 rounded px-2 py-1 text-sm text-white/80 placeholder:text-white/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(action.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Action Form */}
            {showAddAction && (
              <div className="mt-2 bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAction.icon}
                      onChange={(e) =>
                        setNewAction({ ...newAction, icon: e.target.value })
                      }
                      className="w-10 bg-white/10 text-center border border-white/10 rounded px-1 py-1 text-sm"
                      maxLength={2}
                      placeholder="✨"
                    />
                    <input
                      type="text"
                      value={newAction.name}
                      onChange={(e) =>
                        setNewAction({ ...newAction, name: e.target.value })
                      }
                      placeholder="Action name (e.g., 'Make Professional')"
                      className="flex-1 bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white placeholder:text-white/40"
                    />
                  </div>
                  <textarea
                    value={newAction.prompt}
                    onChange={(e) =>
                      setNewAction({ ...newAction, prompt: e.target.value })
                    }
                    placeholder="Rewrite the following text to be more professional:\n\n{{selectedText}}"
                    rows={3}
                    className="w-full bg-white/10 border border-white/10 rounded px-2 py-2 text-sm text-white placeholder:text-white/40"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAction(false)}
                      className="px-3 py-1 text-sm text-white/60 hover:text-white/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {customActions.length === 0 && !showAddAction && (
              <p className="text-xs text-white/40 mt-1">
                No custom actions. Add actions to extend Doc AI with your own
                prompts.
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-white/40 bg-white/5 rounded-lg p-3">
            <p className="font-medium text-white/60 mb-1">Prompt Variables:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                <code className="text-purple-300">{"{{selectedText}}"}</code> -
                Currently selected text
              </li>
              <li>
                <code className="text-purple-300">{"{{context}}"}</code> -
                Document content above cursor
              </li>
              <li>
                <code className="text-purple-300">{"{{prompt}}"}</code> - User's
                additional input
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
