import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BlockModel, Text } from "@blocksuite/store";
import { createEmbedBlockSchema, defineEmbedModel } from "@blocksuite/blocks";
import { BlockElement } from "@blocksuite/block-std";
import { html } from "lit";
import { literal } from "lit/static-html.js";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FileCsv, Plus, Trash, CaretUp, CaretDown, Flag } from "@phosphor-icons/react";

const defineOnce = (tag, ctor) => {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

const DEFAULT_HOTEL_ROWS = [
  {
    id: "row-1",
    season: "High Season (Jul-Aug)",
    roomType: "Deluxe Garden View",
    mealPlan: "BB",
    singleRate: 0,
    doubleRate: 0,
    remarks: "",
  },
  {
    id: "row-2",
    season: "High Season (Jul-Aug)",
    roomType: "Premium Sea View",
    mealPlan: "HB",
    singleRate: 0,
    doubleRate: 0,
    remarks: "",
  },
];

const MEAL_PLANS = [
  { value: "BB", label: "BB (Bed & Breakfast)" },
  { value: "HB", label: "HB (Half Board)" },
  { value: "FB", label: "FB (Full Board)" },
  { value: "AI", label: "AI (All Inclusive)" },
  { value: "RO", label: "RO (Room Only)" },
];

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "EGP", label: "EGP - Egyptian Pound" },
  { value: "TRY", label: "TRY - Turkish Lira" },
];

const formatCurrency = (value, currency = "USD") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${currency} 0`;
  return `${currency} ${n.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

// This is the block model (holds props) for BlockSuite.
export class HotelRateModel extends defineEmbedModel(BlockModel) {}

// We implement as an embed block so affine:note allows it.
export const HotelRateBlockSchema = createEmbedBlockSchema({
  name: "hotel-rate",
  version: 1,
  toModel: () => new HotelRateModel(),
  props: (internal) => ({
    caption: null,
    style: "hotel-rate",
    title: internal.Text("Hotel Rate Block"),
    currency: "USD",
    rows: DEFAULT_HOTEL_ROWS,
    extractedAt: null, // Timestamp when AI extracted this data
    confidence: null, // Overall confidence score from extraction
  }),
});

const HotelRateWidget = ({ model }) => {
  const [localTick, setLocalTick] = useState(0);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showMealPlanDropdowns, setShowMealPlanDropdowns] = useState({});
  const dropdownRef = useRef(null);

  // Safe accessor for model props
  const getProp = (key, fallback) => {
    try {
      return model[key] ?? fallback;
    } catch (e) {
      return fallback;
    }
  };

  const title = model.title?.toString?.() ?? "Hotel Rate Block";
  const currency = getProp("currency", "USD");
  const extractedAt = getProp("extractedAt", null);
  const confidence = getProp("confidence", null);
  const rawRows = getProp("rows", []);
  const rows = Array.isArray(rawRows) ? rawRows : [];

  // Detect Readonly / Export mode (approximation)
  const isReadonly = model.doc?.readonly || false;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
        setShowMealPlanDropdowns({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateModel = (partial) => {
    if (isReadonly) return;
    try {
      model.doc.updateBlock(model, partial);
      setLocalTick((t) => t + 1);
    } catch (e) {
      console.error("Failed to update hotel rate model", e);
    }
  };

  const updateRow = (rowIndex, patch) => {
    if (isReadonly) return;
    const nextRows = rows.map((r, idx) =>
      idx === rowIndex ? { ...r, ...patch } : r
    );
    updateModel({ rows: nextRows });
  };

  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      season: "",
      roomType: "",
      mealPlan: "BB",
      singleRate: 0,
      doubleRate: 0,
      remarks: "",
    };
    updateModel({ rows: [...rows, newRow] });
  };

  const removeRow = (rowIndex) => {
    const nextRows = rows.filter((_, idx) => idx !== rowIndex);
    updateModel({ rows: nextRows });
  };

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

  const downloadCSV = () => {
    const headers = ["Season", "Room Type", "Meal Plan", "Single Rate", "Double Rate", "Remarks"];
    const csvRows = [headers.join(",")];

    rows.forEach((row) => {
      const clean = (text) =>
        `"${String(text || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ")}"`;

      csvRows.push([
        clean(row.season),
        clean(row.roomType),
        row.mealPlan,
        row.singleRate,
        row.doubleRate,
        clean(row.remarks),
      ].join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hotel-rates-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isLowConfidence = (row) => {
    const single = Number(row.singleRate);
    const double = Number(row.doubleRate);
    return (single === 0 || !Number.isFinite(single)) && 
           (double === 0 || !Number.isFinite(double));
  };

  return (
    <div
      className="hotel-rate-wrapper"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        margin: "12px 0",
      }}
      contentEditable={false}
    >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-white/90 tracking-tight">{title}</div>
          <div className="flex items-center gap-3">
            {extractedAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded">
                <Flag size={12} weight="fill" />
                <span>AI Extracted</span>
                {confidence && (
                  <span className="text-emerald-400">({Math.round(confidence * 100)}%)</span>
                )}
              </div>
            )}
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
          </div>
        </div>
        
        {/* Currency Selector */}
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30">
            Hotel contract rates
          </div>
          {!isReadonly && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                className="flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded border border-white/10 transition-colors"
              >
                <span>Currency: {currency}</span>
                {showCurrencyDropdown ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </button>
              {showCurrencyDropdown && (
                <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[200px]">
                  {CURRENCIES.map((cur) => (
                    <button
                      key={cur.value}
                      onClick={() => {
                        updateModel({ currency: cur.value });
                        setShowCurrencyDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${
                        currency === cur.value ? "text-emerald-400 bg-white/5" : "text-white/70"
                      }`}
                    >
                      {cur.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rate Table */}
      <DragDropContext onDragEnd={(result) => {
        if (!result.destination) return;
        moveRow({
          fromIndex: result.source.index,
          toIndex: result.destination.index,
        });
      }}>
        <Droppable droppableId="hotel-rates">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="overflow-x-auto"
            >
              {/* Table Header */}
              <div
                className="grid text-left text-[10px] text-white/40 border-b border-white/5 pb-3 mb-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: isReadonly 
                    ? "180px 200px 80px 100px 100px minmax(0, 1fr)"
                    : "180px 200px 80px 100px 100px minmax(0, 1fr) 44px",
                  width: "100%",
                }}
              >
                <div className="pr-3 font-bold uppercase tracking-wider">Season</div>
                <div className="pr-3 font-bold uppercase tracking-wider">Room Type</div>
                <div className="pr-3 font-bold uppercase tracking-wider">Meal Plan</div>
                <div className="pr-3 text-right font-bold uppercase tracking-wider">Single</div>
                <div className="pr-3 text-right font-bold uppercase tracking-wider">Double</div>
                <div className="pr-3 font-bold uppercase tracking-wider">Remarks</div>
                {!isReadonly && <div></div>}
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/5">
                {rows.map((row, index) => (
                  <Draggable
                    key={row.id}
                    draggableId={row.id}
                    index={index}
                    isDragDisabled={isReadonly}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`py-2 transition-colors ${
                          snapshot.isDragging ? "bg-white/5" : "hover:bg-white/2"
                        } ${isLowConfidence(row) ? "bg-red-500/5" : ""}`}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        <div
                          className="grid items-center text-xs"
                          style={{
                            display: "grid",
                            gridTemplateColumns: isReadonly 
                              ? "180px 200px 80px 100px 100px minmax(0, 1fr)"
                              : "180px 200px 80px 100px 100px minmax(0, 1fr) 44px",
                            width: "100%",
                          }}
                        >
                          {/* Season */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className="text-white/70">{row.season || "-"}</div>
                            ) : (
                              <input
                                type="text"
                                value={row.season}
                                onChange={(e) => updateRow(index, { season: e.target.value })}
                                placeholder="Season"
                                className="w-full bg-transparent text-white/90 placeholder-white/20 border border-transparent hover:border-white/10 focus:border-white/20 rounded px-2 py-1.5 transition-colors outline-none"
                              />
                            )}
                          </div>

                          {/* Room Type */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className="text-white/70">{row.roomType || "-"}</div>
                            ) : (
                              <input
                                type="text"
                                value={row.roomType}
                                onChange={(e) => updateRow(index, { roomType: e.target.value })}
                                placeholder="Room Type"
                                className="w-full bg-transparent text-white/90 placeholder-white/20 border border-transparent hover:border-white/10 focus:border-white/20 rounded px-2 py-1.5 transition-colors outline-none"
                              />
                            )}
                          </div>

                          {/* Meal Plan */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className="text-white/70 font-medium">{row.mealPlan}</div>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    setShowMealPlanDropdowns((prev) => ({
                                      ...prev,
                                      [index]: !prev[index],
                                    }));
                                  }}
                                  className="w-full text-left bg-white/5 hover:bg-white/10 text-white/90 px-2 py-1.5 rounded border border-white/10 transition-colors outline-none"
                                >
                                  {row.mealPlan}
                                </button>
                                {showMealPlanDropdowns[index] && (
                                  <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 min-w-[140px]">
                                    {MEAL_PLANS.map((mp) => (
                                      <button
                                        key={mp.value}
                                        onClick={() => {
                                          updateRow(index, { mealPlan: mp.value });
                                          setShowMealPlanDropdowns((prev) => ({
                                            ...prev,
                                            [index]: false,
                                          }));
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${
                                          row.mealPlan === mp.value ? "text-emerald-400 bg-white/5" : "text-white/70"
                                        }`}
                                      >
                                        {mp.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Single Rate */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className={`text-right font-mono ${isLowConfidence(row) ? "text-red-400" : "text-white/70"}`}>
                                {formatCurrency(row.singleRate, currency)}
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={row.singleRate === 0 ? "" : row.singleRate}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                                  updateRow(index, { singleRate: val });
                                }}
                                placeholder="0"
                                className={`w-full bg-transparent text-right font-mono placeholder-white/20 border ${
                                  isLowConfidence(row) ? "border-red-500/30 text-red-400" : "border-transparent hover:border-white/10 focus:border-white/20 text-white/90"
                                } rounded px-2 py-1.5 transition-colors outline-none`}
                              />
                            )}
                          </div>

                          {/* Double Rate */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className={`text-right font-mono ${isLowConfidence(row) ? "text-red-400" : "text-white/70"}`}>
                                {formatCurrency(row.doubleRate, currency)}
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={row.doubleRate === 0 ? "" : row.doubleRate}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : Number(e.target.value);
                                  updateRow(index, { doubleRate: val });
                                }}
                                placeholder="0"
                                className={`w-full bg-transparent text-right font-mono placeholder-white/20 border ${
                                  isLowConfidence(row) ? "border-red-500/30 text-red-400" : "border-transparent hover:border-white/10 focus:border-white/20 text-white/90"
                                } rounded px-2 py-1.5 transition-colors outline-none`}
                              />
                            )}
                          </div>

                          {/* Remarks */}
                          <div className="pr-3">
                            {isReadonly ? (
                              <div className={`text-[10px] ${row.remarks?.toLowerCase().includes("review") ? "text-amber-400" : "text-white/50"}`}>
                                {row.remarks || ""}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={row.remarks}
                                onChange={(e) => updateRow(index, { remarks: e.target.value })}
                                placeholder="Notes..."
                                className="w-full bg-transparent text-[10px] text-white/60 placeholder-white/20 border border-transparent hover:border-white/10 focus:border-white/20 rounded px-2 py-1.5 transition-colors outline-none"
                              />
                            )}
                          </div>

                          {/* Actions */}
                          {!isReadonly && (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => removeRow(index)}
                                className="text-white/20 hover:text-red-400 transition-colors p-1"
                                title="Remove row"
                              >
                                <Trash size={14} weight="bold" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>

              {/* Add Row Button */}
              {!isReadonly && (
                <div className="pt-3">
                  <button
                    onClick={() => addRow()}
                    className="inline-flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white/90 transition-colors px-3 py-2 rounded border border-dashed border-white/10 hover:border-white/30"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Add Rate Row</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Low Confidence Warning */}
      {rows.some(isLowConfidence) && (
        <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Flag size={14} weight="fill" className="text-red-400 mt-0.5" />
            <div className="text-[10px] text-red-300">
              <span className="font-bold">Low Confidence:</span> Some rows have no rate data. Review and complete manually.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export class HotelRateBlockComponent extends BlockElement {
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
    return html`<hotel-rate-react-root
      .block=${this}
    ></hotel-rate-react-root>`;
  }

  updated() {
    // When lit updates, keep the react root in sync.
    this._reactRoot = this.querySelector("hotel-rate-react-root");
    if (this._reactRoot) this._reactRoot.rerender();
  }
}

defineOnce("affine-embed-hotel-rate-block", HotelRateBlockComponent);

class HotelRateReactRoot extends HTMLElement {
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
    this._root.render(<HotelRateWidget model={model} />);
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

defineOnce("hotel-rate-react-root", HotelRateReactRoot);

export const HotelRateBlockSpec = {
  schema: HotelRateBlockSchema,
  view: {
    component: literal`affine-embed-hotel-rate-block`,
  },
};
