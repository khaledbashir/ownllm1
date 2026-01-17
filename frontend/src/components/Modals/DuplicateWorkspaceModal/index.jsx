import React, { useState, createContext, useCallback, useContext } from "react";
import { X, Copy } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

const DuplicateWorkspaceContext = createContext(null);

/**
 * Modal for duplicating a workspace with options for deep-cloning documents
 */
function DuplicateWorkspaceModal({
  isOpen,
  workspace,
  onClose,
  onSuccess,
}) {
  const [newName, setNewName] = useState("");
  const [deepClone, setDeepClone] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !workspace) return null;

  const handleDuplicate = async () => {
    if (!newName.trim()) {
      showToast("Please enter a workspace name", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { workspace: newWorkspace, message, copiedDocuments } = 
        await Workspace.replicate(workspace.slug, newName, deepClone);

      if (newWorkspace) {
        const successMsg = deepClone && copiedDocuments > 0
          ? `Workspace "${newName}" created with ${copiedDocuments} document(s) and their vector embeddings!`
          : `Workspace "${newName}" created successfully!`;
        
        showToast(successMsg, "success", { clear: true });
        
        if (onSuccess) {
          onSuccess(newWorkspace);
        }
        
        // Reset form and close
        setNewName("");
        setDeepClone(true);
        onClose();
      } else {
        showToast(`Failed to replicate workspace: ${message}`, "error", { clear: true });
      }
    } catch (error) {
      console.error("Error duplicating workspace:", error);
      showToast("An error occurred while duplicating the workspace", "error", { clear: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewName("");
    setDeepClone(true);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading && newName.trim()) {
      handleDuplicate();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg-secondary w-[480px] rounded-xl shadow-2xl border border-theme-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-theme-border">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Copy size={24} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-theme-text-primary flex-1">
            Duplicate Workspace
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Source Workspace Info */}
          <div className="bg-theme-bg-primary/50 p-3 rounded-lg">
            <p className="text-xs text-theme-text-secondary uppercase font-semibold mb-1">
              Source Workspace
            </p>
            <p className="text-theme-text-primary font-medium">{workspace.name}</p>
          </div>

          {/* New Workspace Name Input */}
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-semibold text-theme-text-primary mb-2">
              New Workspace Name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Miami Stadium Project"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              autoFocus
            />
          </div>

          {/* Deep Clone Option */}
          <div className="bg-theme-bg-primary/50 p-4 rounded-lg border border-theme-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deepClone}
                onChange={(e) => setDeepClone(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-4 h-4 rounded cursor-pointer disabled:opacity-50"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-theme-text-primary">
                  Copy Documents & Vector Embeddings
                </p>
                <p className="text-xs text-theme-text-secondary mt-1">
                  If enabled, all pinned and watched documents from the source workspace 
                  will be available in the new workspace. The AI will have immediate access 
                  to their content without requiring re-upload or re-processing.
                </p>
                <p className="text-xs text-blue-400 mt-2 font-medium">
                  ✓ Recommended for template workspaces with product catalogs
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-theme-bg-primary/50 border-t border-theme-border">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleDuplicate}
            disabled={isLoading || !newName.trim()}
            className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isLoading ? "Creating..." : "Create Duplicate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Provider component for the duplicate workspace modal
 */
export function DuplicateWorkspaceProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    workspace: null,
    onSuccess: null,
  });

  const open = useCallback((workspace, onSuccess) => {
    setState({
      isOpen: true,
      workspace,
      onSuccess,
    });
  }, []);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      workspace: null,
      onSuccess: null,
    });
  }, []);

  return (
    <DuplicateWorkspaceContext.Provider value={{ open, close }}>
      {children}
      <DuplicateWorkspaceModal
        isOpen={state.isOpen}
        workspace={state.workspace}
        onClose={close}
        onSuccess={state.onSuccess}
      />
    </DuplicateWorkspaceContext.Provider>
  );
}

/**
 * Hook to use the duplicate workspace modal
 */
export function useDuplicateWorkspaceModal() {
  const context = useContext(DuplicateWorkspaceContext);
  if (!context) {
    throw new Error(
      "useDuplicateWorkspaceModal must be used within DuplicateWorkspaceProvider"
    );
  }
  return context;
}

export default DuplicateWorkspaceModal;
