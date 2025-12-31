import React, { useState, useEffect, useRef } from "react";
import { X, FilePdf, CircleNotch, Gear, CaretDown, Check } from "@phosphor-icons/react";
import PdfTemplates from "@/models/pdfTemplates";
import showToast from "@/utils/toast";

export default function ExportPdfModal({ isOpen, onClose, onExport, onExportCarbone }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("standard"); // 'standard' or 'carbone'
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const result = await PdfTemplates.list();
      setTemplates(result);
      // Auto-select default template if exists, or first one
      const defaultTemplate = result.find((t) => t.isDefault) || result[0];
      if (defaultTemplate) setSelectedTemplate(defaultTemplate);
    } catch (e) {
      console.error("Failed to fetch templates", e);
      showToast("Failed to load templates.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    if (exportType === "carbone") {
      await onExportCarbone();
    } else {
      await onExport(selectedTemplate);
    }
    setExporting(false);
    onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-theme-bg-secondary w-[500px] max-h-[80vh] rounded-xl shadow-2xl border border-theme-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg">
              <FilePdf size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-theme-text-primary">
                Export as PDF
              </h3>
              <p className="text-xs text-theme-text-secondary">
                Select a branding template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-text-secondary hover:text-theme-text-primary"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotch className="animate-spin text-blue-400" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Template List */}
              {templates.length === 0 ? (
                <div className="text-center py-6 bg-theme-bg-primary rounded-lg border border-dashed border-theme-border">
                  <p className="text-sm text-theme-text-secondary mb-3">
                    No templates found.
                  </p>
                  <a
                    href="/settings/document-templates"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-theme-bg-secondary hover:bg-white/5 text-blue-400 rounded-lg text-sm border border-theme-border transition-colors"
                  >
                    <Gear size={16} />
                    Manage Templates
                  </a>
                </div>
              ) : (
                <>
                  <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                    <div
                      onClick={() => setSelectedTemplate(null)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTemplate === null
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-theme-border hover:border-theme-border-hover"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-theme-bg-primary flex items-center justify-center border border-theme-border">
                          <FilePdf
                            size={16}
                            className="text-theme-text-secondary"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-theme-text-primary">
                            No Template
                          </p>
                        </div>
                      </div>
                    </div>

                    {templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplate?.id === template.id
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-theme-border hover:border-theme-border-hover"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor:
                                template.primaryColor || "#3b82f6",
                            }}
                          >
                            {template.logoPath ? (
                              <img
                                src={template.logoPath}
                                alt=""
                                className="w-full h-full object-contain rounded p-0.5"
                              />
                            ) : (
                              <span className="text-white text-xs font-bold">
                                {template.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-theme-text-primary truncate">
                              {template.name}
                            </p>
                            <p className="text-xs text-theme-text-secondary truncate">
                              {template.headerText || "No header"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-theme-border flex justify-center">
                    <a
                      href="/settings/document-templates"
                      target="_blank"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Gear size={12} />
                      Manage Templates in Settings
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-4 border-t border-theme-border bg-theme-bg-primary/50">
          {/* Export Type Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-theme-bg-primary hover:bg-white/5 border border-theme-border rounded-lg transition-colors text-sm"
            >
              {exportType === 'standard' ? (
                <>
                  <FilePdf size={16} className="text-red-400" />
                  <span>Standard Export</span>
                </>
              ) : (
                <>
                  <FilePdf size={16} className="text-blue-400" />
                  <span>Carbone PDF</span>
                </>
              )}
              <CaretDown size={14} className="text-theme-text-secondary" />
            </button>

            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-theme-bg-secondary border border-theme-border rounded-lg shadow-xl overflow-hidden z-10">
                <div
                  onClick={() => {
                    setExportType('standard');
                    setShowDropdown(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    exportType === 'standard'
                      ? 'bg-blue-500/10 border-l-2 border-blue-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <FilePdf size={20} className="text-red-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-theme-text-primary">Standard Export</p>
                    <p className="text-xs text-theme-text-secondary">Using existing template engine</p>
                  </div>
                  {exportType === 'standard' && <Check size={16} className="text-blue-400" />}
                </div>
                <div
                  onClick={() => {
                    setExportType('carbone');
                    setShowDropdown(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    exportType === 'carbone'
                      ? 'bg-blue-500/10 border-l-2 border-blue-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <FilePdf size={20} className="text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-theme-text-primary">Carbone PDF</p>
                    <p className="text-xs text-theme-text-secondary">Professional Carbone rendering</p>
                  </div>
                  {exportType === 'carbone' && <Check size={16} className="text-blue-400" />}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-lg transition-all font-medium text-sm ${
                exportType === 'carbone'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20'
              }`}
            >
              {exporting ? (
                <>
                  <CircleNotch className="animate-spin" size={16} />
                  Exporting...
                </>
              ) : (
                <>
                  <FilePdf size={16} />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
