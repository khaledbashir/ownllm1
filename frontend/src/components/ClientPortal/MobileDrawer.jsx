import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Menu,
  FileText,
  MessageSquare,
  Clock,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

/**
 * MobileDrawer Component
 * 
 * Mobile-optimized drawer with swipe gestures:
- Slide-in from left
- Swipe gesture detection
- Hamburger menu toggle
- Touch-friendly navigation
 */

const MobileDrawer = ({
  isOpen,
  onClose,
  contents = [],
  recentActivity = [],
  onSectionClick
}) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const drawerRef = useRef(null);
  const touchStartRef = useRef(null);

  // Handle swipe gestures
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current || !isOpen) return;

    const touchCurrent = e.touches[0].clientX;
    const diff = touchCurrent - touchStartRef.current;

    // Swipe left to close
    if (diff < -50) {
      onClose();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSectionClick = (section) => {
    if (section.subsections && section.subsections.length > 0) {
      setExpandedSection(expandedSection === section.id ? null : section.id);
    } else {
      onSectionClick?.(section);
      onClose();
    }
  };

  const handleSubsectionClick = (subsection) => {
    onSectionClick?.(subsection);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="
            fixed inset-0 bg-black/50 backdrop-blur-sm z-50
            transition-opacity duration-300
            md:hidden
          "
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm
          bg-white dark:bg-gray-800 z-50
          transform transition-transform duration-300 ease-in-out
          flex flex-col md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Contents
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tap to navigate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Table of Contents */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Contents
            </h3>

            <nav className="space-y-1">
              {contents.map((section) => (
                <div key={section.id}>
                  {/* Section Button */}
                  <button
                    onClick={() => handleSectionClick(section)}
                    className="
                      w-full flex items-center justify-between px-3 py-2.5
                      rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                      transition-colors text-left
                    "
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {section.title}
                      </span>
                    </div>

                    {section.subsections && section.subsections.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {section.subsections.length}
                        </span>
                        {expandedSection === section.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Subsections */}
                  {expandedSection === section.id && section.subsections && (
                    <div className="ml-8 mt-1 space-y-1">
                      {section.subsections.map((subsection) => (
                        <button
                          key={subsection.id}
                          onClick={() => handleSubsectionClick(subsection)}
                          className="
                            w-full flex items-center gap-2 px-3 py-2
                            rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                            transition-colors text-left
                          "
                        >
                          <span className="w-1 h-1 bg-purple-500 rounded-full" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subsection.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Recent Activity
              </h3>

              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div
                      className={`
                        p-1.5 rounded-lg flex-shrink-0
                        ${activity.type === 'comment'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                        }
                      `}
                    >
                      {activity.type === 'comment' ? (
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Swipe left to close
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;