import React from "react";
import { Warning, X } from "@phosphor-icons/react";

/**
 * Reusable confirmation dialog for destructive actions
 */
export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger", // danger, warning, info
}) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: "text-red-400",
            button: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: "text-yellow-400",
            button: "bg-yellow-600 hover:bg-yellow-700",
        },
        info: {
            icon: "text-blue-400",
            button: "bg-blue-600 hover:bg-blue-700",
        },
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="bg-theme-bg-secondary rounded-2xl border border-theme-sidebar-border shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-theme-sidebar-border">
                        <div className="flex items-center gap-3">
                            <Warning size={24} weight="fill" className={styles.icon} />
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-theme-bg-container text-theme-text-secondary hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-4">
                        <p className="text-theme-text-secondary">{message}</p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 bg-theme-bg-container/50">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-theme-sidebar-border text-theme-text-secondary hover:text-white hover:bg-theme-bg-container transition-all font-medium"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all ${styles.button}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
