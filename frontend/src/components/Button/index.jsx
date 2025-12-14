import React from "react";
import { SpinnerGap as Spinner } from "@phosphor-icons/react";

/**
 * Consistent button component with loading, disabled states
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {string} props.variant - primary, secondary, danger, ghost
 * @param {string} props.size - sm, md, lg
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional classes
 */
export default function Button({
    children,
    loading = false,
    disabled = false,
    variant = "primary",
    size = "md",
    onClick,
    className = "",
    type = "button",
    ...props
}) {
    const isDisabled = disabled || loading;

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
        secondary: "bg-theme-bg-secondary hover:bg-theme-bg-container text-white border-theme-sidebar-border",
        danger: "bg-red-600 hover:bg-red-700 text-white border-transparent",
        success: "bg-green-600 hover:bg-green-700 text-white border-transparent",
        ghost: "bg-transparent hover:bg-theme-bg-secondary text-theme-text-secondary hover:text-white border-transparent",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-5 py-2.5 text-base gap-2",
    };

    return (
        <button
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={`
                inline-flex items-center justify-center font-medium rounded-xl border
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                ${variants[variant] || variants.primary}
                ${sizes[size] || sizes.md}
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                ${className}
            `}
            {...props}
        >
            {loading && (
                <Spinner size={size === "sm" ? 14 : 18} className="animate-spin" />
            )}
            {children}
        </button>
    );
}
