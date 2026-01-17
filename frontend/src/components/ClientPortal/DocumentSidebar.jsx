import React, { useState, useEffect, useRef } from "react";
import {
  List,
  ChatCircle,
  ClockCounterClockwise,
  CheckCircle,
  FileText,
  X,
  CaretRight,
} from "@phosphor-icons/react";

/**
 * DocumentSidebar - Navigation sidebar with TOC, quick links, activity
 */

export default function DocumentSidebar({
  sections = [],
  commentCount = 0,
  unreadComments = 0,
  version = "1.0",
  onSectionClick,
  currentSection = null,
}) {
  const [activeSection, setActiveSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [activeTab, setActiveTab] = useState("toc"); // "toc" | "activity"
  const scrollContainerRef = useRef(null);

  // Update active section based on scroll or props
  useEffect(() => {
    if (currentSection) {
      setActiveSection(currentSection);
    }
  }, [currentSection]);

  // Auto-expand all sections on mount
  useEffect(() => {
    const allSectionIds = new Set(sections.map((s) => s.id));
    setExpandedSections(allSectionIds);
  }, [sections]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSectionClick = (section) => {
    setActiveSection(section.id);
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("toc")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            activeTab === "toc"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <List size={18} weight="bold" />
          Contents
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
            activeTab === "activity"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ClockCounterClockwise size={18} weight="bold" />
          Activity
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "toc" ? (
          <TableOfContents
            sections={sections}
            activeSection={activeSection}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onSectionClick={handleSectionClick}
          />
        ) : (
          <ActivityFeed
            commentCount={commentCount}
            unreadComments={unreadComments}
            version={version}
          />
        )}
      </div>

      {/* Quick Actions Footer */}
      <QuickActions
        commentCount={commentCount}
        unreadComments={unreadComments}
        onJumpToComments={() => {
          setActiveTab("activity");
          // Scroll to comments
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop =
              scrollContainerRef.current.scrollHeight;
          }
        }}
      />
    </div>
  );
}

/**
 * Table of Contents - Auto-generated from headings
 */
function TableOfContents({
  sections,
  activeSection,
  expandedSections,
  toggleSection,
  onSectionClick,
}) {
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        Document Sections
      </h3>

      {sections.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>No sections detected</p>
        </div>
      ) : (
        <div className="space-y-1">
          {sections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => {
                  toggleSection(section.id);
                  onSectionClick(section);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                  activeSection === section.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`transition-transform ${
                      expandedSections.has(section.id) ? "rotate-90" : ""
                    }`}
                  >
                    <CaretRight size={14} weight="bold" />
                  </span>
                  <span className="font-medium text-sm truncate">
                    {section.title}
                  </span>
                </div>

                {/* Completion Badge */}
                {section.completed && (
                  <CheckCircle
                    size={16}
                    className="text-emerald-500 flex-shrink-0"
                  />
                )}
              </button>

              {/* Subsections (if expanded) */}
              {expandedSections.has(section.id) &&
                section.subsections?.length > 0 && (
                  <div className="ml-8 mt-1 space-y-1">
                    {section.subsections.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onSectionClick(sub)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          activeSection === sub.id
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="truncate">{sub.title}</span>
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Quick Actions - Footer with quick links
 */
function QuickActions({ commentCount, unreadComments, onJumpToComments }) {
  return (
    <div className="p-4 border-t border-slate-200 bg-slate-50">
      <button
        onClick={onJumpToComments}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <ChatCircle
            size={20}
            weight="bold"
            className={
              unreadComments > 0 ? "text-indigo-600" : "text-slate-500"
            }
          />
          <div className="text-left">
            <span className="text-sm font-semibold text-slate-700">
              Comments
            </span>
            {unreadComments > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                {unreadComments} new
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-500">{commentCount} total</span>
      </button>
    </div>
  );
}

/**
 * Activity Feed - Comments, changes, versions
 */
function ActivityFeed({ commentCount, unreadComments, version }) {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Recent Activity
      </h3>

      {/* Version Badge */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">
              Current Version
            </span>
          </div>
          <span className="px-2 py-1 bg-indigo-600 text-white text-xs font-bold rounded">
            v{version}
          </span>
        </div>
      </div>

      {/* Comment Preview */}
      {commentCount > 0 ? (
        <div className="space-y-3">
          {unreadComments > 0 && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-semibold text-red-700">
                {unreadComments} unread{" "}
                {unreadComments === 1 ? "comment" : "comments"}
              </p>
            </div>
          )}

          {/* Simulated Recent Comments */}
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      John Doe
                    </span>
                    <span className="text-xs text-slate-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    "Can we clarify the timeline for the third milestone?"
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  AS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      Alice Smith
                    </span>
                    <span className="text-xs text-slate-500">5 hours ago</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    "The pricing looks good. Ready to move forward!"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {commentCount > 2 && (
            <button className="w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all {commentCount} comments →
            </button>
          )}
        </div>
      ) : (
        <div className="text-sm text-slate-500 text-center py-8">
          <ChatCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p>No comments yet</p>
        </div>
      )}
    </div>
  );
}
