import React, { useMemo, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BlockModel, Text } from "@blocksuite/store";
import { createEmbedBlockSchema, defineEmbedModel } from "@blocksuite/blocks";
import { BlockElement } from "@blocksuite/block-std";
import { html } from "lit";
import { literal } from "lit/static-html.js";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FileCsv } from "@phosphor-icons/react"; // Import CSV Icon

import Workspace from "@/models/workspace";
import ReactMarkdown from "react-markdown";

const defineOnce = (tag, ctor) => {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

const DEFAULT_ROLES = [
  { role: "Tech - Head Of- Senior Project Management", rate: 365 },
  { role: "Tech - Delivery - Project Coordination", rate: 110 },
  { role: "Account Management - (Account Manager)", rate: 180 },
  { role: "Tech - Integrations", rate: 170 },
  { role: "Strategy & Planning", rate: 250 },
  { role: "UX/UI Design", rate: 180 },
  { role: "Content & Copywriting", rate: 160 },
  { role: "Development", rate: 190 },
  { role: "QA & Testing", rate: 150 },
  { role: "Data & Analytics", rate: 210 },
];

const DEFAULT_ROWS = [
  {
    id: "header-1",
    role: "Project Management",
    isHeader: true,
  },
  {
    id: "pm-1",
    role: "Tech - Head Of- Senior Project Management",
    description: "Senior oversight and strategic direction",
    hours: 2,
    baseRate: 365,
  },
  {
    id: "pm-2",
    role: "Tech - Delivery - Project Coordination",
    description: "Daily coordination and status reporting",
    hours: 10,
    baseRate: 110,
  },
  {
    id: "header-2",
    role: "Implementation",
    isHeader: true,
  },
  {
    id: "dev-1",
    role: "Development",
    description: "Core platform development and configuration",
    hours: 40,
    baseRate: 190,
  },
];

const clampNumber = (
  input,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {}
) => {
  const n = Math.round(Number(input)); // Round all inputs to nearest dollar
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const formatCurrency = (value) => {
  const n = Math.round(Number(value)); // Round to nearest dollar
  if (!Number.isFinite(n)) return "$0";
  return "$" + n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
};

const calcTotals = ({ rows, discountPercent, gstPercent, tableType = "agency" }) => {
  const subtotal = (rows || []).reduce((sum, row) => {
    if (row.isHeader) return sum;
    
    // ANC: unitPrice * quantity
    if (tableType === "anc") {
      const unitPrice = Number(row.unitPrice) || 0;
      const quantity = Number(row.quantity) || 1;
      return sum + Math.round(unitPrice * quantity);
    }
    
    // Agency: hours * baseRate
    const hours = Number(row.hours) || 0;
    const rate = Number(row.baseRate) || 0;
    return sum + Math.round(hours * rate);
  }, 0);

  const discount = Math.round(
    subtotal * (clampNumber(discountPercent, { max: 100 }) / 100)
  );
  const afterDiscount = subtotal - discount;
  const gst = Math.round(
    afterDiscount * (clampNumber(gstPercent, { max: 100 }) / 100)
  );
  const total = afterDiscount + gst;

  return { subtotal, discount, afterDiscount, gst, total };
};

// This is the block model (holds props) for BlockSuite.
export class PricingTableModel extends defineEmbedModel(BlockModel) { }

// We implement as an embed block so affine:note allows it.
export const PricingTableBlockSchema = createEmbedBlockSchema({
  name: "pricing-table",
  version: 2, // Bumped version for tableType support
  toModel: () => new PricingTableModel(),
  props: (internal) => ({
    caption: null,
    style: "pricing-table",
    title: internal.Text("Project Pricing"),
    currency: "AUD",
    discountPercent: 0,
    gstPercent: 10,
    rows: DEFAULT_ROWS,
    showTotals: true, // "Total Price Toggle"
    tableType: "agency", // "agency" for hours/rate, "anc" for dimensions/price, "anc_estimate" for dual-table layout
    ancEstimateData: null, // Holds structured { specs: {}, pricing: {} } for ANC estimates
  }),
});

const onNumberInput = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const PricingTableWidget = ({ model }) => {
  const [localTick, setLocalTick] = useState(0);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [error, setError] = useState(null);
  const [rolePickerOpenIndex, setRolePickerOpenIndex] = useState(null);
  const closeRolePickerTimeoutRef = useRef(null);

  // ANC: Add Excel Export Function
  const exportToExcel = () => {
    // 1. Collect Data
    const rows = getProp("rows", []);
    const tableType = getProp("tableType", "agency"); // "anc" or "agency"
    const title = model.title?.toString?.() ?? "Project Pricing";
    
    // 2. Build CSV Content
    let csvContent = "";
    
    if (tableType === "anc") {
      // ANC Format: Product, Category, Description, W, H, Qty, Total
      csvContent += "Product,Category,Description,Width,Height,Quantity,Total\n";
      rows.forEach(row => {
        const lineTotal = (row.unitPrice || 0) * (row.quantity || 1);
        csvContent += `"${row.productName || ""}","${row.category || ""}","${(row.description || "").replace(/"/g, '""')}","${row.dimensions?.width}","${row.dimensions?.height}","${row.quantity}","${lineTotal}"\n`;
      });
    } else {
      // Agency Format: Role, Description, Hours, Rate, Total
      csvContent += "Role,Description,Hours,Rate,Total\n";
      rows.forEach(row => {
        const lineTotal = (row.hours || 0) * (row.baseRate || 0);
        csvContent += `"${row.role || ""}","${(row.description || "").replace(/"/g, '""')}","${row.hours}","${row.baseRate}","${lineTotal}"\n`;
      });
    }

    // Add Totals
    // calcTotals is defined later or imported, but we can reuse the logic here or access the calculated state if available.
    // Looking at the code below, 'totals' is a useMemo state.
    // However, 'totals' might not be available inside this callback if it's stale. 
    // Safest to recalculate or use the memoized value if exportToExcel is wrapped in useCallback/dep array.
    // For simplicity in this patch, we'll re-implement the basic math to avoid dependency issues.
    
    let subtotal = 0;
    if (tableType === "anc") {
      subtotal = rows.reduce((acc, row) => acc + ((row.unitPrice || 0) * (row.quantity || 1)), 0);
    } else {
      subtotal = rows.reduce((acc, row) => acc + ((row.hours || 0) * (row.baseRate || 0)), 0);
    }
    
    // Apply discount
    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    
    // Apply Tax
    const taxAmount = afterDiscount * (gstPercent / 100);
    const finalTotal = afterDiscount + taxAmount;

    csvContent += `\n,,,Subtotal,,${subtotal.toFixed(2)}\n`;
    if (discountPercent > 0) csvContent += `,,,Discount (${discountPercent}%),,-${discountAmount.toFixed(2)}\n`;
    csvContent += `,,,Tax (${gstPercent}%),,${taxAmount.toFixed(2)}\n`;
    csvContent += `,,,TOTAL,,${finalTotal.toFixed(2)}\n`;

    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}_Audit.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      try {
        const matches = window.location.pathname.match(/\/workspace\/([^\/]+)/);
        if (!matches) return;
        const slug = matches[1];

        const workspace = await Workspace.bySlug(slug);
        if (mounted && workspace?.rateCard) {
          const rates = JSON.parse(workspace.rateCard);
          setAvailableRoles(rates);
        }
      } catch (e) {
        console.error("[PricingTable] Failed to load roles", e);
      }
    };
    fetchRoles();
    return () => {
      mounted = false;
    };
  }, []);

  // Safe accessor for model props
  const getProp = (key, fallback) => {
    try {
      return model[key] ?? fallback;
    } catch (e) {
      return fallback;
    }
  };

  const title = model.title?.toString?.() ?? "Project Pricing";
  const currency = getProp("currency", "AUD");
  const discountPercent = onNumberInput(getProp("discountPercent", 0));
  const gstPercent = onNumberInput(getProp("gstPercent", 10));
  const showTotals = getProp("showTotals", true);
  const tableType = getProp("tableType", "agency"); // "agency", "anc", or "anc_estimate"
  const ancEstimateData = getProp("ancEstimateData", null);
  const rawRows = getProp("rows", []);
  const rows = Array.isArray(rawRows) ? rawRows : [];

  // Detect Readonly / Export mode (approximation)
  const isReadonly = model.doc?.readonly || false;

  const moveRow = ({ fromIndex, toIndex }) => {
    if (isReadonly) return;
    const from = Number(fromIndex);
    const to = Number(toIndex);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    if (from < 0 || to < 0) return;
    if (from >= rows.length || to >= rows.length) return;
    if (from === to) return;

    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateModel({ rows: next });
  };

  const totals = useMemo(
    () => calcTotals({ rows, discountPercent, gstPercent, tableType }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localTick, discountPercent, gstPercent, rows, tableType]
  );

  const rolesToUse = useMemo(() => {
    if (availableRoles && availableRoles.length > 0) return availableRoles;
    return DEFAULT_ROLES.map((r) => ({ name: r.role, rate: r.rate }));
  }, [availableRoles]);

  const updateModel = (partial) => {
    if (isReadonly) return;
    try {
      model.doc.updateBlock(model, partial);
      setLocalTick((t) => t + 1);
    } catch (e) {
      console.error("Failed to update pricing table model", e);
    }
  };

  const updateRow = (rowIndex, patch) => {
    if (isReadonly) return;
    const nextRows = rows.map((r, idx) =>
      idx === rowIndex ? { ...r, ...patch } : r
    );
    updateModel({ rows: nextRows });
  };

  const addRow = (isHeader = false) => {
    const newRow = tableType === "anc"
      ? {
          id: `new-${Date.now()}`,
          productName: isHeader ? "NEW SECTION" : "",
          category: "",
          description: "",
          dimensions: { width: 0, height: 0, area: 0 },
          unitPrice: 0,
          quantity: 1,
          isHeader,
        }
      : {
          id: `new-${Date.now()}`,
          role: isHeader ? "NEW SECTION" : "",
          description: "",
          hours: 0,
          baseRate: 0,
          isHeader,
        };
    updateModel({ rows: [...rows, newRow] });
  };

  const removeRow = (rowIndex) => {
    const nextRows = rows.filter((_, idx) => idx !== rowIndex);
    updateModel({ rows: nextRows });
  };

  const sortRows = () => {
    if (isReadonly) return;
    // "Account Management" to bottom rule
    const sorted = [...rows].sort((a, b) => {
      const roleA = (a.role || "").toLowerCase();
      const roleB = (b.role || "").toLowerCase();
      const isAccA = roleA.includes("account management");
      const isAccB = roleB.includes("account management");

      if (isAccA && !isAccB) return 1;
      if (!isAccA && isAccB) return -1;
      return 0; // Keep existing order for others
    });
    updateModel({ rows: sorted });
  };

  const downloadCSV = () => {
    const headers = tableType === "anc"
      ? ["Product", "Category", "Description", "Width", "Height", "Quantity", "Unit Price", "Total"]
      : ["Role", "Description", "Hours", "Rate", "Line Total"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      if (row.isHeader) {
        const name = tableType === "anc" ? (row.productName || row.role) : row.role;
        csvRows.push(`${name.toUpperCase()},${tableType === "anc" ? "" : ""}${tableType === "anc" ? ",,,,,,," : ",,,,"}`);
        return;
      }

      const clean = (text) =>
        `"${String(text || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ")}"`;

      if (tableType === "anc") {
        const width = row.dimensions?.width || 0;
        const height = row.dimensions?.height || 0;
        const quantity = row.quantity || 1;
        const unitPrice = row.unitPrice || 0;
        const lineTotal = unitPrice * quantity;
        csvRows.push([
          clean(row.productName || row.role),
          clean(row.category),
          clean(row.description),
          width,
          height,
          quantity,
          unitPrice.toFixed(2),
          lineTotal.toFixed(2),
        ].join(","));
      } else {
        const lineTotal = clampNumber(row.hours) * clampNumber(row.baseRate);
        csvRows.push([
          clean(row.role),
          clean(row.description),
          row.hours,
          row.baseRate,
          lineTotal.toFixed(2),
        ].join(","));
      }
    });

    // Add totals
    const totalCols = tableType === "anc" ? 8 : 5;
    const totalPrefix = ",".repeat(totalCols - 1);
    csvRows.push(totalPrefix);
    csvRows.push(`${totalPrefix},Subtotal,${totals.subtotal.toFixed(2)}`);
    if (discountPercent > 0) {
      csvRows.push(
        `${totalPrefix},Discount (-${discountPercent}%),-${totals.discount.toFixed(2)}`
      );
    }
    csvRows.push(`${totalPrefix},GST (${gstPercent}%),${totals.gst.toFixed(2)}`);
    csvRows.push(`${totalPrefix},Total Investment,${totals.total.toFixed(2)}`);

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pricing-table-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="p-4 text-red-400 bg-red-900/20 rounded">
        Error loading pricing table
      </div>
    );
  }

  return (
    <div
      className="pricing-table-wrapper pricing-table-widget"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        margin: "12px 0",
      }}
      contentEditable={false}
    >
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white/90 tracking-tight">{title}</div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/90 transition-colors text-xs font-medium"
              title="Download CSV"
              contentEditable={false}
              type="button"
            >
              <FileCsv size={16} weight="bold" />
              <span>CSV</span>
            </button>

            {!isReadonly && (
              <button
                onClick={() => updateModel({ showTotals: !showTotals })}
                className="text-white/40 hover:text-white/80 transition-colors"
                title={showTotals ? "Hide Totals" : "Show Totals"}
              >
                {showTotals ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 256 256"
                  >
                    <path
                      fill="currentColor"
                      d="M247.31 124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57 61.26 162.88 48 128 48S61.43 61.26 36.34 86.35C17.51 105.18 9 124 8.69 124.76a8 8 0 0 0 0 6.5c.35.79 8.82 19.57 27.65 38.4C61.43 194.74 93.12 208 128 208s66.57-13.26 91.66-38.34c18.83-18.83 27.3-37.61 27.65-38.4a8 8 0 0 0 0-6.5M128 192c-30.78 0-57.67-11.19-79.93-33.25A133.5 133.5 0 0 1 25 128a133.3 133.3 0 0 1 23.07-30.75C70.33 75.19 97.22 64 128 64s57.67 11.19 79.93 33.25A133.5 133.5 0 0 1 231 128c-7.21 13.46-38.62 64-103 64m0-112a48 48 0 1 0 48 48a48.05 48.05 0 0 0-48-48m0 80a32 32 0 1 1 32-32a32 32 0 0 1-32 32"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 256 256"
                  >
                    <path
                      fill="currentColor"
                      d="M53.92 34.62a8 8 0 1 0-11.84 10.76l34.86 38.35A132.8 132.8 0 0 0 25 128a133.5 133.5 0 0 0 79.93 33.25a137.6 137.6 0 0 0 28.59-1.93l69.1 76.02a8 8 0 0 0 11.84-.54a8 8 0 0 0-.54-11.3ZM128 192c-30.78 0-57.67-11.19-79.93-33.25A133.4 133.4 0 0 1 25 128a134.4 134.4 0 0 1 12.81-22.33l97.88 107.69A90 90 0 0 1 128 192m118.8-57.24C226 111.9 196.21 82.57 148.44 67.22a8 8 0 0 0-4.88 15.24c39.69 12.75 66.86 37.07 87.44 59.79a133.4 133.4 0 0 1-23.07 30.75a137 137 0 0 1-27.1 19.33a8 8 0 1 0 8.08 13.78a156 156 0 0 0 32-23.29C237.12 180.81 245.63 162 247.31 139.54a8 8 0 0 0-.51-4.78M99.63 84.9a48 48 0 0 1 65.58 72.15l-12.75-14A32 32 0 0 0 108 108.73Z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">
          All prices in {currency}, excluding GST
        </div>
      </div>

      {/* ANC ESTIMATE (PROPOSAL MODE) RENDERING */}
      {tableType === "anc_estimate" && ancEstimateData && (
        <div className="flex flex-col gap-8 mb-4">
          {/* Specs Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 shadow-xl">
            <div className="bg-[#0055b8] px-4 py-3 flex justify-between items-center border-b border-white/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Specifications</h3>
              <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                {ancEstimateData.specs?.productName || "LED Display"}
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-8 gap-6 text-xs">
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Item</span>
                <span className="text-white font-medium text-sm truncate" title={ancEstimateData.specs?.productName}>
                  {ancEstimateData.specs?.productName || "LED Display"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Pitch</span>
                <span className="text-white font-medium text-sm">
                  {ancEstimateData.specs?.pitch || "10mm"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Size (H'xW')</span>
                <span className="text-white font-medium text-sm">
                  {ancEstimateData.specs?.height}' x {ancEstimateData.specs?.width}'
                </span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Pixel Count</span>
                <span className="text-white font-medium text-sm">{ancEstimateData.specs?.resolution || "TBD"}</span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Service</span>
                <span className="text-white font-medium text-sm truncate">{ancEstimateData.specs?.service || "Front/Rear"}</span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Sq Ft</span>
                <span className="text-white font-medium text-sm">
                  {Math.round((ancEstimateData.specs?.height || 0) * (ancEstimateData.specs?.width || 0))}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 md:text-center">
                <span className="text-white/40 uppercase tracking-tighter font-bold">Qty</span>
                <span className="text-white font-medium text-sm">{ancEstimateData.specs?.qty || 1}</span>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20 shadow-xl">
            <div className="bg-white/10 px-4 py-3 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Pricing Breakdown</h3>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                Selling @ {formatCurrency(ancEstimateData.pricing?.total / ((ancEstimateData.specs?.height || 1) * (ancEstimateData.specs?.width || 1) * (ancEstimateData.specs?.qty || 1)))} /sqft
              </div>
            </div>
            <div className="p-0 divide-y divide-white/5">
              {[
                { label: "LED Display System (Materials)", value: ancEstimateData.pricing?.base },
                {
                  label: "Structural & Installation",
                  value: (ancEstimateData.pricing?.structural || 0) + (ancEstimateData.pricing?.labor || 0),
                },
                { label: "Engineering & Project Management", value: ancEstimateData.pricing?.pm },
                { label: "Shipping & Logistics", value: ancEstimateData.pricing?.shipping },
                { label: "Bonding Cost ($16.67/sf)", value: ancEstimateData.pricing?.bond },
                { label: "Strategic ANC Margin (10%)", value: ancEstimateData.pricing?.margin, isProfit: true },
              ].map((row, i) => (
                <div key={i} className={`px-6 py-4 flex justify-between items-center hover:bg-white/5 transition-colors ${row.isProfit ? "bg-emerald-500/5 whitespace-nowrap" : ""}`}>
                  <span className={`text-sm font-medium ${row.isProfit ? "text-emerald-400" : "text-white/70"}`}>{row.label}</span>
                  <span className={`font-mono text-sm font-semibold ${row.isProfit ? "text-emerald-400" : "text-white"}`}>{formatCurrency(row.value)}</span>
                </div>
              ))}
              <div className="px-6 py-6 bg-purple-500/10 flex justify-between items-center border-t border-purple-500/20">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Total Contract Value</span>
                  <span className="text-[9px] text-white/30 italic">Includes Margin & Bond ({currency})</span>
                </div>
                <span className="text-2xl font-black text-white tracking-tighter decoration-purple-500/50 underline underline-offset-8 decoration-4">
                  {formatCurrency(ancEstimateData.pricing?.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANC-SPECIFIC TABLE RENDERING */}
      {tableType === "anc" && (
        <div className="overflow-x-auto overflow-y-visible">
          {(() => {
            const readonlyColumns = "200px 100px minmax(0, 1fr) 80px 80px 80px 120px";
            const editColumns = "200px 100px minmax(0, 1fr) 80px 80px 80px 120px 44px";

            return (
              <>
                <div
                  className="grid text-left text-[10px] text-white/40 border-b border-white/5 py-3"
                  style={{
                    display: "grid",
                    gridTemplateColumns: !isReadonly ? editColumns : readonlyColumns,
                    width: "100%",
                  }}
                >
                  <div className="pr-3 font-bold uppercase tracking-wider">Product</div>
                  <div className="pr-3 font-bold uppercase tracking-wider">Category</div>
                  <div style={{ paddingRight: 15 }} className="font-bold uppercase tracking-wider">Description</div>
                  <div className="pr-3 text-right font-bold uppercase tracking-wider">W</div>
                  <div className="pr-3 text-right font-bold uppercase tracking-wider">H</div>
                  <div className="pr-3 text-right font-bold uppercase tracking-wider">Qty</div>
                  <div className="text-right font-bold uppercase tracking-wider">Total</div>
                  {!isReadonly && <div></div>}
                </div>

                <DragDropContext
                  onDragEnd={(result) => {
                    if (isReadonly) return;
                    const destinationIndex = result?.destination?.index;
                    if (destinationIndex === undefined || destinationIndex === null) return;
                    moveRow({
                      fromIndex: result.source.index,
                      toIndex: destinationIndex,
                    });
                  }}
                >
                  <Droppable droppableId="pricing-table-rows">
                    {(droppableProvided) => (
                      <div
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {(rows.length === 0 ? [] : rows).map((row, idx) => {
                          const isHeader = !!row.isHeader;

                          if (isHeader) {
                            return (
                              <Draggable
                                key={row.id || `row-${idx}`}
                                draggableId={String(row.id || `row-${idx}`)}
                                index={idx}
                                isDragDisabled={isReadonly}
                              >
                                {(draggableProvided, snapshot) => (
                                  <div
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 border-white/10 group ${snapshot.isDragging ? "opacity-60 bg-white/5" : ""}`}
                                    style={{
                                      ...draggableProvided.draggableProps.style,
                                      width: "100%",
                                      background: snapshot.isDragging ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                                      marginTop: idx === 0 ? 0 : 24,
                                      marginBottom: 8,
                                      borderRadius: "8px 8px 0 0",
                                    }}
                                  >
                                    {!isReadonly && (
                                      <div
                                        {...draggableProvided.dragHandleProps}
                                        className="drag-handle cursor-grab active:cursor-grabbing text-white/30 hover:text-white/70 px-2 select-none"
                                        title="Drag section"
                                      >
                                        ⋮⋮
                                      </div>
                                    )}
                                    <div className="flex-1 flex items-center gap-3">
                                      <div className="h-6 w-1 bg-blue-500 rounded-full" />
                                      {isReadonly ? (
                                        <span className="text-sm font-black tracking-[0.1em] uppercase text-white/95">
                                          {row.productName || row.role}
                                        </span>
                                      ) : (
                                        <input
                                          className="flex-1 bg-transparent border-none font-black tracking-[0.1em] uppercase text-white/95 focus:ring-0 p-0 placeholder:text-white/20"
                                          type="text"
                                          value={row.productName || row.role || ""}
                                          onChange={(e) =>
                                            updateRow(idx, {
                                              productName: e.target.value,
                                              role: e.target.value,
                                            })
                                          }
                                          placeholder="SECTION TITLE..."
                                        />
                                      )}
                                    </div>
                                    {!isReadonly && (
                                      <button
                                        onClick={() => removeRow(idx)}
                                        className="text-red-400/40 hover:text-red-400 px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove section"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          }

                          const width = clampNumber(row.dimensions?.width || 0);
                          const height = clampNumber(row.dimensions?.height || 0);
                          const quantity = clampNumber(row.quantity || 1);
                          const unitPrice = clampNumber(row.unitPrice || 0);
                          const lineTotal = unitPrice * quantity;

                          return (
                            <Draggable
                              key={row.id || `row-${idx}`}
                              draggableId={String(row.id || `row-${idx}`)}
                              index={idx}
                              isDragDisabled={isReadonly}
                            >
                              {(draggableProvided, snapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  className={`grid items-start border-b border-white/5 py-2 text-sm text-white/80 group ${snapshot.isDragging ? "opacity-60 bg-white/10 rounded" : ""}`}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: !isReadonly ? editColumns : readonlyColumns,
                                    width: "100%",
                                    ...draggableProvided.draggableProps.style,
                                    ...(snapshot.isDragging ? { display: "grid", background: "#252525", opacity: 0.9 } : {}),
                                  }}
                                >
                                  {/* Product Column */}
                                  <div className="pr-3">
                                    {isReadonly ? (
                                      <span className="font-medium">{row.productName || row.role}</span>
                                    ) : (
                                      <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                                        type="text"
                                        value={row.productName || row.role || ""}
                                        onChange={(e) =>
                                          updateRow(idx, {
                                            productName: e.target.value,
                                            role: e.target.value,
                                          })
                                        }
                                      />
                                    )}
                                  </div>

                                  {/* Category Column */}
                                  <div className="pr-3">
                                    {isReadonly ? (
                                      <span className="text-white/60">{row.category || ""}</span>
                                    ) : (
                                      <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/60"
                                        type="text"
                                        value={row.category || ""}
                                        onChange={(e) =>
                                          updateRow(idx, { category: e.target.value })
                                        }
                                      />
                                    )}
                                  </div>

                                  {/* Description Column */}
                                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word", paddingRight: 15, minWidth: 0 }}>
                                    {isReadonly ? (
                                      <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{row.description || ""}</ReactMarkdown>
                                      </div>
                                    ) : (
                                      <textarea
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 resize-vertical min-h-[40px]"
                                        value={row.description || ""}
                                        onChange={(e) =>
                                          updateRow(idx, { description: e.target.value })
                                        }
                                      />
                                    )}
                                  </div>

                                  {/* Width Column */}
                                  <div className="pr-3 text-right">
                                    {isReadonly ? (
                                      <span>{width}</span>
                                    ) : (
                                      <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 text-right"
                                        type="number"
                                        min={0}
                                        value={width}
                                        onChange={(e) => {
                                          const dims = row.dimensions || {};
                                          updateRow(idx, {
                                            dimensions: { ...dims, width: clampNumber(e.target.value) }
                                          });
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Height Column */}
                                  <div className="pr-3 text-right">
                                    {isReadonly ? (
                                      <span>{height}</span>
                                    ) : (
                                      <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 text-right"
                                        type="number"
                                        min={0}
                                        value={height}
                                        onChange={(e) => {
                                          const dims = row.dimensions || {};
                                          updateRow(idx, {
                                            dimensions: { ...dims, height: clampNumber(e.target.value) }
                                          });
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Quantity Column */}
                                  <div className="pr-3 text-right">
                                    {isReadonly ? (
                                      <span>{quantity}</span>
                                    ) : (
                                      <input
                                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 text-right"
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) =>
                                          updateRow(idx, { quantity: clampNumber(e.target.value) })
                                        }
                                      />
                                    )}
                                  </div>

                                  {/* Total Column */}
                                  <div className="text-right font-medium whitespace-nowrap">
                                    {formatCurrency(lineTotal, currency)}
                                  </div>

                                  {/* Actions Column */}
                                  {!isReadonly && (
                                    <div className="flex items-center justify-end">
                                      <button
                                        type="button"
                                        onClick={() => removeRow(idx)}
                                        className="text-red-400 hover:bg-red-900/30 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove row"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {droppableProvided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </>
            );
          })()}
        </div>
      )}

      {/* AGENCY TABLE RENDERING (Original) */}
      {tableType !== "anc" && (
        <div className="overflow-x-auto overflow-y-visible">
          {(() => {
            const readonlyColumns = "180px minmax(0, 1fr) 80px 100px 120px";
            const editColumns = "180px minmax(0, 1fr) 80px 100px 120px 44px";

          return (
            <>
              <div
                className="grid text-left text-[10px] text-white/40 border-b border-white/5 py-3"
                style={{
                  display: "grid",
                  gridTemplateColumns: !isReadonly
                    ? editColumns
                    : readonlyColumns,
                  width: "100%",
                }}
              >
                <div className="pr-3 font-bold uppercase tracking-wider">Role</div>
                <div style={{ paddingRight: 15 }} className="font-bold uppercase tracking-wider">Description</div>
                <div className="pr-3 text-right font-bold uppercase tracking-wider">Hours</div>
                <div className="pr-3 text-right font-bold uppercase tracking-wider">Rate</div>
                <div className="text-right font-bold uppercase tracking-wider">Total</div>
                {!isReadonly && <div></div>}
              </div>

              <DragDropContext
                onDragEnd={(result) => {
                  if (isReadonly) return;
                  const destinationIndex = result?.destination?.index;
                  if (
                    destinationIndex === undefined ||
                    destinationIndex === null
                  )
                    return;
                  moveRow({
                    fromIndex: result.source.index,
                    toIndex: destinationIndex,
                  });
                }}
              >
                <Droppable droppableId="pricing-table-rows">
                  {(droppableProvided) => (
                    <div
                      ref={droppableProvided.innerRef}
                      {...droppableProvided.droppableProps}
                    >
                      {(rows.length === 0 ? [] : rows).map((row, idx) => {
                        const isHeader = !!row.isHeader;

                        if (isHeader) {
                          return (
                            <Draggable
                              key={row.id || `row-${idx}`}
                              draggableId={String(row.id || `row-${idx}`)}
                              index={idx}
                              isDragDisabled={isReadonly}
                            >
                              {(draggableProvided, snapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  className={`flex items-center gap-2 py-4 px-2 border-b-2 border-white/10 group ${snapshot.isDragging ? "opacity-60 bg-white/5" : ""}`}
                                  style={{
                                    ...draggableProvided.draggableProps.style,
                                    width: "100%",
                                    background: snapshot.isDragging
                                      ? "rgba(255,255,255,0.05)"
                                      : "rgba(255,255,255,0.02)",
                                    marginTop: idx === 0 ? 0 : 24,
                                    marginBottom: 8,
                                    borderRadius: "8px 8px 0 0",
                                  }}
                                >
                                  {!isReadonly && (
                                    <div
                                      {...draggableProvided.dragHandleProps}
                                      className="drag-handle cursor-grab active:cursor-grabbing text-white/30 hover:text-white/70 px-2 select-none"
                                      title="Drag section"
                                    >
                                      ⋮⋮
                                    </div>
                                  )}
                                  <div className="flex-1 flex items-center gap-3">
                                    <div className="h-6 w-1 bg-purple-500 rounded-full" />
                                    {isReadonly ? (
                                      <span className="text-sm font-black tracking-[0.1em] uppercase text-white/95">
                                        {row.role}
                                      </span>
                                    ) : (
                                      <input
                                        className="flex-1 bg-transparent border-none font-black tracking-[0.1em] uppercase text-white/95 focus:ring-0 p-0 placeholder:text-white/20"
                                        type="text"
                                        value={row.role || ""}
                                        onChange={(e) =>
                                          updateRow(idx, {
                                            role: e.target.value,
                                          })
                                        }
                                        placeholder="SECTION TITLE..."
                                      />
                                    )}
                                  </div>
                                  {!isReadonly && (
                                    <button
                                      onClick={() => removeRow(idx)}
                                      className="text-red-400/40 hover:text-red-400 px-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Remove section"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        }

                        const hours = clampNumber(row.hours);
                        const rate = clampNumber(row.baseRate);
                        const lineTotal = hours * rate;
                        const roleQuery = (row.role || "").trim().toLowerCase();

                        const filteredRoles = (rolesToUse || [])
                          .filter((r) => {
                            const name = (r?.name || "").toLowerCase();
                            if (!roleQuery) return true;
                            return name.includes(roleQuery);
                          })
                          .sort((a, b) => {
                            const an = (a?.name || "").toLowerCase();
                            const bn = (b?.name || "").toLowerCase();
                            const aStarts =
                              roleQuery && an.startsWith(roleQuery);
                            const bStarts =
                              roleQuery && bn.startsWith(roleQuery);
                            if (aStarts && !bStarts) return -1;
                            if (!aStarts && bStarts) return 1;
                            return an.localeCompare(bn);
                          })
                          .slice(0, 50);

                        const selectRole = (role) => {
                          if (!role?.name) return;
                          updateRow(idx, {
                            role: role.name,
                            baseRate:
                              role?.rate !== undefined
                                ? clampNumber(role.rate)
                                : clampNumber(row.baseRate),
                          });
                          setRolePickerOpenIndex(null);
                        };

                        return (
                          <Draggable
                            key={row.id || `row-${idx}`}
                            draggableId={String(row.id || `row-${idx}`)}
                            index={idx}
                            isDragDisabled={isReadonly}
                          >
                            {(draggableProvided, snapshot) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                className={`grid items-start border-b border-white/5 py-2 text-sm text-white/80 group ${snapshot.isDragging ? "opacity-60 bg-white/10 rounded" : ""}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: !isReadonly
                                    ? editColumns
                                    : readonlyColumns,
                                  width: "100%",
                                  ...draggableProvided.draggableProps.style,
                                  // Ensure layout holds during drag
                                  ...(snapshot.isDragging
                                    ? {
                                      display: "grid",
                                      background: "#252525",
                                      opacity: 0.9,
                                    }
                                    : {}),
                                }}
                              >
                                {/* Role Column with Drag Handle */}
                                <div className="pr-3 flex items-start gap-2">
                                  {!isReadonly && (
                                    <div
                                      {...draggableProvided.dragHandleProps}
                                      className="drag-handle cursor-grab active:cursor-grabbing text-white/30 hover:text-white/70 select-none mt-1"
                                      title="Drag to reorder"
                                    >
                                      ⋮⋮
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    {isReadonly ? (
                                      <span className="font-medium">
                                        {row.role}
                                      </span>
                                    ) : (
                                      <div className="relative">
                                        <div className="flex items-stretch gap-1">
                                          <input
                                            className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                                            type="text"
                                            value={row.role || ""}
                                            onFocus={() => {
                                              setRolePickerOpenIndex(idx);
                                            }}
                                            onBlur={() => {
                                              if (
                                                closeRolePickerTimeoutRef.current
                                              ) {
                                                clearTimeout(
                                                  closeRolePickerTimeoutRef.current
                                                );
                                              }
                                              closeRolePickerTimeoutRef.current =
                                                setTimeout(() => {
                                                  setRolePickerOpenIndex(
                                                    (cur) =>
                                                      cur === idx ? null : cur
                                                  );
                                                }, 120);
                                            }}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updates = { role: val };
                                              const found = availableRoles.find(
                                                (r) => r.name === val
                                              );
                                              if (found) {
                                                updates.baseRate = found.rate;
                                              }
                                              updateRow(idx, updates);
                                              setRolePickerOpenIndex(idx);
                                            }}
                                          />
                                          <button
                                            type="button"
                                            className="bg-black/20 border border-white/10 rounded px-2 text-white/50 hover:text-white/80"
                                            onMouseDown={(e) =>
                                              e.preventDefault()
                                            }
                                            onClick={() =>
                                              setRolePickerOpenIndex((cur) =>
                                                cur === idx ? null : idx
                                              )
                                            }
                                            title="Choose role"
                                          >
                                            ▾
                                          </button>
                                        </div>
                                        {rolePickerOpenIndex === idx &&
                                          filteredRoles.length > 0 && (
                                            <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-auto bg-black/90 border border-white/10 rounded shadow-lg z-50">
                                              {filteredRoles.map((role) => (
                                                <div
                                                  key={role.id || role.name}
                                                  className="px-2 py-1 text-sm text-white/80 hover:bg-white/10 cursor-pointer flex items-center justify-between gap-3"
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selectRole(role);
                                                  }}
                                                >
                                                  <div className="min-w-0">
                                                    <div className="truncate">
                                                      {role.name}
                                                    </div>
                                                    {role.category && (
                                                      <div className="text-xs text-white/40 truncate">
                                                        {role.category}
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="text-xs text-white/50 whitespace-nowrap">
                                                    {formatCurrency(
                                                      role.rate,
                                                      currency
                                                    )}
                                                    /hr
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Description Column - Fixed Wrapping */}
                                <div
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    paddingRight: 15,
                                    minWidth: 0,
                                  }}
                                >
                                  {isReadonly ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                      <ReactMarkdown>
                                        {row.description || ""}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <textarea
                                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 resize-vertical min-h-[40px]"
                                      value={row.description || ""}
                                      onChange={(e) =>
                                        updateRow(idx, {
                                          description: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </div>

                                {/* Hours Column */}
                                <div className="pr-3 text-right">
                                  {isReadonly ? (
                                    <span>{hours}</span>
                                  ) : (
                                    <input
                                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 text-right"
                                      type="number"
                                      min={0}
                                      value={hours}
                                      onChange={(e) =>
                                        updateRow(idx, {
                                          hours: clampNumber(e.target.value),
                                        })
                                      }
                                    />
                                  )}
                                </div>

                                {/* Rate Column */}
                                <div className="pr-3 text-right">
                                  {isReadonly ? (
                                    <span>
                                      {formatCurrency(rate, currency)}
                                    </span>
                                  ) : (
                                    <input
                                      className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 text-right"
                                      type="number"
                                      min={0}
                                      value={rate}
                                      onChange={(e) =>
                                        updateRow(idx, {
                                          baseRate: clampNumber(e.target.value),
                                        })
                                      }
                                    />
                                  )}
                                </div>

                                {/* Total Column */}
                                <div className="text-right font-medium whitespace-nowrap">
                                  {formatCurrency(lineTotal, currency)}
                                </div>

                                {/* Actions Column */}
                                {!isReadonly && (
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeRow(idx)}
                                      className="text-red-400 hover:bg-red-900/30 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Remove row"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {droppableProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          );
        })()}
      </div>
    )}

      {
        !isReadonly && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => addRow(false)}
              className="text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
            >
              + New Item
            </button>
            <span className="text-white/20 text-xs">|</span>
            <button
              onClick={() => addRow(true)}
              className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300"
            >
              + New Section
            </button>
            <span className="text-white/20 text-xs">|</span>
            <button
              onClick={sortRows}
              className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
              title="Sort Accountant Management to bottom"
            >
              Sort Roles
            </button>
          </div>
        )
      }

      {
        !isReadonly && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Discount %</span>
              <input
                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) =>
                  updateModel({
                    discountPercent: clampNumber(e.target.value, { max: 100 }),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">GST %</span>
              <input
                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                type="number"
                min={0}
                max={100}
                value={gstPercent}
                onChange={(e) =>
                  updateModel({
                    gstPercent: clampNumber(e.target.value, { max: 100 }),
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-white/50">Title</span>
              <input
                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                type="text"
                value={title}
                onChange={(e) =>
                  updateModel({ title: new Text(e.target.value || "") })
                }
              />
            </label>
          </div>
        )
      }

      {
        showTotals && (
          <div className="mt-12 flex justify-end" contentEditable={false}>
            <div
              className="w-full max-w-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-black/20"
              style={{
                backdropFilter: "blur(10px)",
              }}
            >
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                  Investment Summary
                </h3>
              </div>

              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between items-center text-white/50">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-mono font-semibold text-white/80">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-60">−</span>
                      <span>Discount ({discountPercent}%)</span>
                    </div>
                    <span className="font-mono font-bold">
                      -{formatCurrency(totals.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-white/50">
                  <span className="font-medium">GST ({gstPercent}%)</span>
                  <span className="font-mono font-semibold text-white/80">
                    {formatCurrency(totals.gst)}
                  </span>
                </div>

                <div className="pt-4 mt-2 border-t-2 border-white/10">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
                        Total Investment
                      </span>
                      <span className="text-[9px] text-white/20 italic">
                        Commercial Rounding Applied
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter decoration-purple-500/50 underline underline-offset-8 decoration-4">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                </div>
                
                {/* ANC Audit Download Button */}
                <div className="pt-2 flex justify-end">
                   <button 
                     onClick={exportToExcel}
                     className="text-xs text-white/40 hover:text-white underline"
                     title="Download raw data for Excel audit"
                   >
                     Download Excel (CSV)
                   </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export class PricingTableBlockComponent extends BlockElement {
  constructor() {
    super();
    // React owns rendering; BlockSuite should treat as atomic.
    this.contentEditable = "false";
    this._reactRoot = null;
  }

  connectedCallback() {
    super.connectedCallback();
    // Model props changes should trigger re-render.
    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this.requestUpdate();
        if (this._reactRoot) this._reactRoot.rerender();
      })
    );
  }

  renderBlock() {
    // Render via a tiny bridging element that hosts the React root.
    return html`<pricing-table-react-root
      .block=${this}
    ></pricing-table-react-root>`;
  }

  updated() {
    // When lit updates, keep the react root in sync.
    this._reactRoot = this.querySelector("pricing-table-react-root");
    if (this._reactRoot) this._reactRoot.rerender();
  }
}

defineOnce("affine-embed-pricing-table-block", PricingTableBlockComponent);

class PricingTableReactRoot extends HTMLElement {
  set block(value) {
    this._block = value;
    this._render();
  }

  get block() {
    return this._block;
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    this._unmount();
  }

  rerender() {
    this._render();
  }

  _render() {
    if (!this.isConnected) return;
    if (!this._block) return;

    if (!this._root) {
      this._root = createRoot(this);
    }

    const model = this._block.model;
    this._root.render(<PricingTableWidget model={model} />);
  }

  _unmount() {
    try {
      this._root?.unmount();
    } catch {
      // ignore
    }
    this._root = null;
  }

  _block = null;
  _root = null;
}

defineOnce("pricing-table-react-root", PricingTableReactRoot);

export const PricingTableBlockSpec = {
  schema: PricingTableBlockSchema,
  view: {
    component: literal`affine-embed-pricing-table-block`,
  },
};
