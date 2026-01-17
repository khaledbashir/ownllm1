import React, { useState } from "react";
import { Menu, X } from "@phosphor-icons/react";

/**
 * ClientPortalLayout - Main wrapper with sidebar and content area
 * Provides responsive layout for client-facing proposal viewing
 */

export default function ClientPortalLayout({
  children,
  sidebarContent = null,
  hideSidebar = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!hideSidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {sidebarOpen ? (
                  <X size={24} weight="bold" />
                ) : (
                  <Menu size={24} weight="bold" />
                )}
              </button>
            )}
            <span className="text-lg font-semibold text-slate-900">
              Proposal Portal
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && !hideSidebar && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div
        className={`flex flex-1 pt-16 lg:pt-0 ${hideSidebar ? "" : "lg:pl-72"}`}
      >
        {/* Sidebar - Desktop */}
        {!hideSidebar && (
          <aside
            className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 ${
              sidebarCollapsed ? "w-20" : "w-72"
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {!sidebarCollapsed && (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    CP
                  </div>
                )}
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-sm font-bold text-slate-900">
                      Client Portal
                    </h1>
                    <p className="text-xs text-slate-500">Proposal Viewer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-20 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
            >
              <X
                size={14}
                weight="bold"
                className={`text-slate-500 transition-transform ${
                  sidebarCollapsed ? "rotate-0" : "rotate-180"
                }`}
              />
            </button>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarContent && sidebarContent(sidebarCollapsed)}
            </div>
          </aside>
        )}

        {/* Mobile Sidebar */}
        {!hideSidebar && sidebarOpen && (
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 overflow-y-auto">
            {/* Mobile Sidebar Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  CP
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900">
                    Client Portal
                  </h1>
                  <p className="text-xs text-slate-500">Proposal Viewer</p>
                </div>
              </div>
            </div>

            {/* Mobile Sidebar Content */}
            <div className="p-4">{sidebarContent && sidebarContent(false)}</div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
