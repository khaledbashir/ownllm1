import React, { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";

/**
 * HamburgerMenu Component
 * 
 * Mobile-optimized hamburger menu button:
- Touch-friendly tap target (48px)
- Smooth animation
- Accessible (ARIA labels)
- Only visible on mobile screens (< 768px)
 */

const HamburgerMenu = ({
  isOpen,
  onToggle,
  position = "top-left", // 'top-left' | 'top-right'
  showBadge = false,
  badgeCount = 0,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef(null);

  const handleClick = () => {
    setIsAnimating(true);
    onToggle?.();

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 200);
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onToggle?.();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onToggle]);

  const positionStyles = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`
        fixed ${positionStyles[position]}
        w-12 h-12 min-h-[48px] min-w-[48px]
        bg-white dark:bg-gray-800
        border-2 border-gray-300 dark:border-gray-600
        rounded-xl shadow-lg hover:shadow-xl
        flex items-center justify-center
        transform transition-all duration-200
        hover:scale-105 active:scale-95
        ${isAnimating ? "scale-95" : ""}
        focus:outline-none focus:ring-2 focus:ring-purple-500
        z-50 md:hidden
      `}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {/* Notification Badge */}
      {showBadge && badgeCount > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-[20px] h-[20px]
            bg-red-500 text-white text-xs font-bold
            rounded-full flex items-center justify-center
            animate-pulse
            px-0.5
          "
        >
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}

      {/* Menu Icon */}
      {isOpen ? (
        <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      ) : (
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
};

export default HamburgerMenu;
