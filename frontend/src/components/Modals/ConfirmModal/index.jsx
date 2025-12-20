import React, { useState, useContext, createContext, useCallback } from "react";
import { Warning, Trash, X } from "@phosphor-icons/react";

// Context for the confirmation modal
const ConfirmContext = createContext(null);

/**
 * Modern styled confirmation modal to replace native window.confirm()
 */
function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "info"
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <Trash size={24} className="text-red-400" />,
      iconBg: "bg-red-500/20",
      confirmBtn: "bg-red-600 hover:bg-red-500 shadow-red-500/20",
    },
    warning: {
      icon: <Warning size={24} className="text-amber-400" />,
      iconBg: "bg-amber-500/20",
      confirmBtn: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20",
    },
    info: {
      icon: <Warning size={24} className="text-blue-400" />,
      iconBg: "bg-blue-500/20",
      confirmBtn: "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20",
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-theme-bg-secondary w-[420px] rounded-xl shadow-2xl border border-theme-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-theme-border">
          <div className={`p-2 rounded-lg ${style.iconBg}`}>{style.icon}</div>
          <h3 className="text-lg font-semibold text-theme-text-primary flex-1">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-theme-text-secondary text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-theme-bg-primary/50 border-t border-theme-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-white rounded-lg font-medium shadow-lg transition-all text-sm ${style.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Provider component that wraps the app and provides confirm functionality
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "danger",
    resolve: null,
  });

  const confirm = useCallback(
    ({
      title = "Confirm Action",
      message = "Are you sure?",
      confirmText = "Confirm",
      cancelText = "Cancel",
      variant = "danger",
    } = {}) => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title,
          message,
          confirmText,
          cancelText,
          variant,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, isOpen: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, isOpen: false }));
  }, [state.resolve]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}

/**
 * Hook to use the confirmation modal
 *
 * Usage:
 * const confirm = useConfirm();
 * const result = await confirm({
 *   title: "Delete Template?",
 *   message: "This action cannot be undone.",
 *   confirmText: "Delete",
 *   variant: "danger"
 * });
 * if (result) { // user clicked confirm }
 */
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

export default ConfirmModal;
