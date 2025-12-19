import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BlockModel, Text } from "@blocksuite/store";
import { createEmbedBlockSchema, defineEmbedModel } from "@blocksuite/blocks";
import { BlockElement } from "@blocksuite/block-std";
import { html } from "lit";
import { literal } from "lit/static-html.js";

import Workspace from "@/models/workspace";
import ReactMarkdown from "react-markdown";

const defineOnce = (tag, ctor) => {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
};

const DEFAULT_ROWS = [
  {
    id: "project-setup",
    role: "Project Setup and Management",
    description:
      "Dedicated project manager to oversee onboarding, milestones, delivery against project goals",
    hours: 10,
    baseRate: 80,
  },
  {
    id: "discovery",
    role: "Discovery & Requirements Gathering",
    description:
      "Meetings and analysis to define scope, requirements, and solution design",
    hours: 15,
    baseRate: 80,
  },
  {
    id: "uiux",
    role: "UI/UX Design",
    description:
      "Wireframes, prototypes, concept design and iteration",
    hours: 20,
    baseRate: 80,
  },
  {
    id: "web-dev",
    role: "Web Application Development",
    description:
      "Frontend + backend development, integration, testing, deployment",
    hours: 100,
    baseRate: 80,
  },
  {
    id: "maintenance",
    role: "Maintenance & Support (3 Months)",
    description:
      "Post-launch support, bug fixes and minor enhancements",
    hours: 30,
    baseRate: 80,
  },
];

const clampNumber = (input, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const n = Number(input);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};

const formatCurrency = (value, currency = "AUD") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
};

const calcTotals = ({ rows, discountPercent, gstPercent }) => {
  const subtotal = (rows || []).reduce((sum, row) => {
    const hours = clampNumber(row.hours);
    const rate = clampNumber(row.baseRate);
    return sum + hours * rate;
  }, 0);

  const discount = subtotal * (clampNumber(discountPercent, { max: 100 }) / 100);
  const afterDiscount = subtotal - discount;
  const gst = afterDiscount * (clampNumber(gstPercent, { max: 100 }) / 100);
  const total = afterDiscount + gst;

  return { subtotal, discount, afterDiscount, gst, total };
};

// This is the block model (holds props) for BlockSuite.
export class PricingTableModel extends defineEmbedModel(BlockModel) { }

// We implement as an embed block so affine:note allows it.
export const PricingTableBlockSchema = createEmbedBlockSchema({
  name: "pricing-table",
  version: 1,
  toModel: () => new PricingTableModel(),
  props: (internal) => ({
    caption: null,
    style: "pricing-table",
    title: internal.Text("Project Pricing"),
    currency: "AUD",
    discountPercent: 20,
    gstPercent: 10,
    rows: DEFAULT_ROWS,
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
    return () => { mounted = false; };
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
  const rawRows = getProp("rows", []);
  const rows = Array.isArray(rawRows) ? rawRows : [];

  // Detect Readonly / Export mode (approximation)
  const isReadonly = model.doc?.readonly || false;

  const totals = useMemo(
    () => calcTotals({ rows, discountPercent, gstPercent }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localTick, discountPercent, gstPercent, rows]
  );

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
    const nextRows = rows.map((r, idx) => (idx === rowIndex ? { ...r, ...patch } : r));
    updateModel({ rows: nextRows });
  };

  const addRow = () => {
    const newRow = {
      id: `new-${Date.now()}`,
      role: "",
      description: "",
      hours: 0,
      baseRate: 0
    };
    updateModel({ rows: [...rows, newRow] });
  };

  const removeRow = (rowIndex) => {
    const nextRows = rows.filter((_, idx) => idx !== rowIndex);
    updateModel({ rows: nextRows });
  };

  if (error) {
    return <div className="p-4 text-red-400 bg-red-900/20 rounded">Error loading pricing table</div>;
  }

  return (
    <div
      className="pricing-table-widget"
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        padding: 16,
        margin: "12px 0",
      }}
      contentEditable={false}
    >
      <datalist id="available-roles">
        {availableRoles.map((role) => (
          <option key={role.id} value={role.name}>
            {role.category ? `${role.category} - ` : ""}{formatCurrency(role.rate)}/hr
          </option>
        ))}
      </datalist>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-lg font-semibold text-white/90">{title}</div>
        <div className="text-xs text-white/50">{currency}</div>
      </div>

      {!isReadonly && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Discount %</span>
            <input
              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
              type="number"
              min={0}
              max={100}
              value={discountPercent}
              onChange={(e) => updateModel({ discountPercent: clampNumber(e.target.value, { max: 100 }) })}
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
              onChange={(e) => updateModel({ gstPercent: clampNumber(e.target.value, { max: 100 }) })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-white/50">Title</span>
            <input
              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
              type="text"
              value={title}
              onChange={(e) => updateModel({ title: new Text(e.target.value || "") })}
            />
          </label>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-white/80">
          <thead>
            <tr className="text-left text-xs text-white/60 border-b border-white/10">
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Hours</th>
              <th className="py-2 pr-3">Rate</th>
              <th className="py-2">Total</th>
              {!isReadonly && <th className="py-2 w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {(rows.length === 0 ? [] : rows).map((row, idx) => {
              const hours = clampNumber(row.hours);
              const rate = clampNumber(row.baseRate);
              const lineTotal = hours * rate;

              return (
                <tr key={row.id || idx} className="border-b border-white/5 align-top group">
                  <td className="py-2 pr-3 w-56">
                    {isReadonly ? (
                      <span className="font-medium">{row.role}</span>
                    ) : (
                      <input
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                        type="text"
                        list="available-roles"
                        value={row.role || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updates = { role: val };
                          const found = availableRoles.find(r => r.name === val);
                          if (found) {
                            updates.baseRate = found.rate;
                          }
                          updateRow(idx, updates);
                        }}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {isReadonly ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{row.description || ""}</ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80 resize-vertical min-h-[40px]"
                        value={row.description || ""}
                        onChange={(e) => updateRow(idx, { description: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-3 w-24">
                    {isReadonly ? <span>{hours}</span> : (
                      <input
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                        type="number"
                        min={0}
                        value={hours}
                        onChange={(e) => updateRow(idx, { hours: clampNumber(e.target.value) })}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-3 w-28">
                    {isReadonly ? <span>{formatCurrency(rate, currency)}</span> : (
                      <input
                        className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white/80"
                        type="number"
                        min={0}
                        value={rate}
                        onChange={(e) => updateRow(idx, { baseRate: clampNumber(e.target.value) })}
                      />
                    )}
                  </td>
                  <td className="py-2 text-right font-medium whitespace-nowrap">
                    {formatCurrency(lineTotal, currency)}
                  </td>
                  {!isReadonly && (
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeRow(idx)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/30 p-1 rounded"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isReadonly && (
        <button
          onClick={addRow}
          className="mt-2 text-xs flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
        >
          + New Item
        </button>
      )}

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-sm text-sm text-white/80">
          <div className="flex justify-between py-1">
            <span className="text-white/60">Subtotal</span>
            <span className="font-medium">{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-white/60">Discount {discountPercent > 0 && `(${discountPercent}%)`}</span>
            <span className="font-medium">-{formatCurrency(totals.discount, currency)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-white/60">After discount</span>
            <span className="font-medium">{formatCurrency(totals.afterDiscount, currency)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-white/60">GST {gstPercent > 0 && `(${gstPercent}%)`}</span>
            <span className="font-medium">{formatCurrency(totals.gst, currency)}</span>
          </div>
          <div className="flex justify-between py-2 mt-2 border-t border-white/10">
            <span className="text-white/80 font-semibold">Total</span>
            <span className="text-white/90 font-semibold">{formatCurrency(totals.total, currency)}</span>
          </div>
        </div>
      </div>
    </div>
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
    return html`<pricing-table-react-root .block=${this}></pricing-table-react-root>`;
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
