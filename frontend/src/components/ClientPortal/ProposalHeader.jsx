import React, { useState } from "react";
import StatusBadge from "./StatusBadge";
import { ArrowDown, Printer, Download, Share2 } from "@phosphor-icons/react";

/**
 * Proposal Header - Hero section with company branding and metadata
 */

export default function ProposalHeader({
  proposalId,
  title,
  clientName,
  status = "sent",
  validUntil,
  onDownload,
  onPrint,
  onShare,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
      {/* Top Bar - Logo + Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Company Logo Placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {proposalId?.substring(0, 2).toUpperCase() || "CP"}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-700">
                Proposal Portal
              </h1>
              <p className="text-xs text-slate-500">
                Secure client view
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:block">
            <StatusBadge status={status} size="lg" />
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Proposal Title */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Proposal Title
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mt-1">
                  {title || "Untitled Proposal"}
                </h2>
              </div>

              {/* Mobile Status Badge */}
              <div className="sm:hidden">
                <StatusBadge status={status} size="md" />
              </div>
            </div>

            {/* Proposal ID */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Proposal ID
              </span>
              <span className="font-mono text-sm text-slate-700 bg-slate-200 px-3 py-1 rounded">
                #{proposalId || "N/A"}
              </span>
            </div>
          </div>

          {/* Prepared For Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Client Name */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prepared for
                </span>
                <p className="text-lg font-semibold text-slate-900">
                  {clientName || "Unknown Client"}
                </p>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date
                </span>
                <p className="text-lg font-semibold text-slate-900">
                  {formatDate(new Date())}
                </p>
              </div>

              {/* Valid Until */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Valid until
                </span>
                <p className="text-lg font-semibold text-slate-900">
                  {formatDate(validUntil)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Download size={20} weight="bold" />
                Download PDF
              </button>
            )}

            {onPrint && (
              <button
                onClick={onPrint}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border-2 border-slate-300 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-400 hover:text-indigo-600 active:scale-95"
              >
                <Printer size={20} weight="bold" />
                Print
              </button>
            )}

            {onShare && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border-2 border-slate-300 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-400 hover:text-indigo-600 active:scale-95"
                >
                  <Share2 size={20} weight="bold" />
                  Share Link
                  <ArrowDown size={16} className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Share Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50">
                    <div className="p-4 space-y-2">
                      <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-medium">
                        Copy Link
                      </button>
                      <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-medium">
                        Copy Embed Code
                      </button>
                      <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 font-medium">
                        Email Proposal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
