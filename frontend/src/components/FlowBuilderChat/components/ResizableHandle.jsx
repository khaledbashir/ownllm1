import React, { useState, useCallback, useEffect } from "react";

/**
 * Resizable handle component for drag-to-resize functionality
 * @param {Object} props
 * @param {function} props.onResize - Callback with new width
 * @param {string} props.position - 'left' or 'right' 
 * @param {number} props.minWidth - Minimum width in pixels
 * @param {number} props.maxWidth - Maximum width in pixels
 */
export default function ResizableHandle({
    onResize,
    position = "left",
    minWidth = 320,
    maxWidth = 700
}) {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        // Calculate new width based on mouse position
        const viewportWidth = window.innerWidth;
        let newWidth;

        if (position === "left") {
            // For left handle, width = distance from right edge
            newWidth = viewportWidth - e.clientX;
        } else {
            // For right handle, width = distance from left edge of panel
            newWidth = e.clientX;
        }

        // Clamp to min/max
        newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        onResize(newWidth);
    }, [isDragging, position, minWidth, maxWidth, onResize]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "ew-resize";
            document.body.style.userSelect = "none";
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`absolute ${position}-0 top-0 bottom-0 w-2 cursor-ew-resize group z-10 flex items-center justify-center`}
        >
            {/* Visual indicator */}
            <div
                className={`h-12 w-1 rounded-full transition-all duration-200 ${isDragging
                    ? "bg-primary-button shadow-lg"
                    : "bg-theme-text-secondary/20 group-hover:bg-theme-text-secondary/40"
                    }`}
            />
        </div>
    );
}
