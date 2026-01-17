import React, { useState } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Sparkles,
  User,
  Menu,
} from "lucide-react";

/**
 * MobileNavBar Component
 * 
 * Bottom navigation bar for mobile devices:
- Tab bar style navigation
- Active state indicators
- Touch-friendly tap targets (48px)
- Only visible on mobile screens (< 768px)
 */

const MobileNavBar = ({
  activeTab = "overview",
  onTabChange,
  showNotification = false,
  notificationCount = 0,
}) => {
  const [ripple, setRipple] = useState(null);

  const tabs = [
    { id: "overview", icon: Home, label: "Overview" },
    { id: "document", icon: FileText, label: "Document" },
    { id: "comments", icon: MessageSquare, label: "Comments" },
    { id: "ai", icon: Sparkles, label: "AI" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const handleTabClick = (tab, e) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    // Clear ripple after animation
    setTimeout(() => setRipple(null), 300);

    // Call parent callback
    if (onTabChange) {
      onTabChange(tab.id);
    }
  };

  return (
    <>
      {/* Ripple Effect */}
      {ripple && (
        <div
          className="
            fixed w-8 h-8 bg-purple-500 rounded-full
            animate-ping opacity-50 pointer-events-none
          "
          style={{
            left: ripple.x - 16,
            top: ripple.y - 16,
            zIndex: 50,
          }}
        />
      )}

      {/* Mobile Navigation Bar */}
      <nav
        className="
          fixed bottom-0 left-0 right-0
          md:hidden
          bg-white dark:bg-gray-800
          border-t border-gray-200 dark:border-gray-700
          z-40
          shadow-lg shadow-black/5
        "
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            const showBadge = tab.id === "comments" && showNotification;

            return (
              <button
                key={tab.id}
                onClick={(e) => handleTabClick(tab, e)}
                className="
                  relative flex flex-col items-center justify-center
                  w-full min-h-[48px] px-2 py-1
                  rounded-lg transition-all duration-200
                  active:scale-95
                  group
                "
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active Background */}
                {isActive && (
                  <div
                    className="
                      absolute inset-0 bg-purple-100 dark:bg-purple-900/20
                      rounded-lg -mx-1 my-1
                    "
                  />
                )}

                {/* Icon with Badge */}
                <div className="relative">
                  <Icon
                    className={`
                      w-6 h-6 transition-colors
                      ${
                        isActive
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }
                    `}
                  />

                  {/* Notification Badge */}
                  {showBadge && notificationCount > 0 && (
                    <span
                      className="
                        absolute -top-1 -right-1
                        min-w-[18px] h-[18px]
                        bg-red-500 text-white text-xs font-bold
                        rounded-full flex items-center justify-center
                        px-0.5
                      "
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-1 text-[10px] font-medium transition-colors
                    ${
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Safe Area for iOS Home Indicator */}
        <div className="h-4 bg-white dark:bg-gray-800" />
      </nav>
    </>
  );
};

export default MobileNavBar;
