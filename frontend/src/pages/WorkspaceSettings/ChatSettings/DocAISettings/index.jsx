import { useState, useEffect } from "react";
import {
  Sparkle,
  Plus,
  Trash,
  CaretDown,
  CaretRight,
} from "@phosphor-icons/react";

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

  // Load existing settings
  useEffect(() => {
    if (workspace) {
      setSystemPrompt(workspace.inlineAiSystemPrompt || "");
      try {
        const actions = workspace.inlineAiActions
          ? JSON.parse(workspace.inlineAiActions)
          : [];
        setCustomActions(actions);
      } catch (e) {
        setCustomActions([]);
      }
    }
  }, [workspace]);

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

  return (
    <div className="mt-4">
      {/* Hidden inputs to include in form submission */}
      <input type="hidden" name="inlineAiSystemPrompt" value={systemPrompt} />
      <input
        type="hidden"
        name="inlineAiActions"
        value={JSON.stringify(customActions)}
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
