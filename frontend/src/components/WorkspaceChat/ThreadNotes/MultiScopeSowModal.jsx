import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, CircleNotch } from "@phosphor-icons/react";

function toNumber(value, fallback = null) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : fallback;
}

export default function MultiScopeSowModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  defaultBudget = "22000",
  defaultDiscountPercent = "5",
}) {
  const inputRef = useRef(null);
  const [budget, setBudget] = useState(defaultBudget);
  const [discountPercent, setDiscountPercent] = useState(defaultDiscountPercent);

  useEffect(() => {
    if (isOpen) {
      setBudget(defaultBudget);
      setDiscountPercent(defaultDiscountPercent);
      setTimeout(() => inputRef.current?.focus?.(), 0);
    }
  }, [isOpen, defaultBudget, defaultDiscountPercent]);

  const parsedBudget = useMemo(() => toNumber(budget, null), [budget]);
  const parsedDiscount = useMemo(
    () => toNumber(discountPercent, null),
    [discountPercent]
  );

  const canSubmit =
    !loading &&
    parsedBudget != null &&
    parsedBudget > 0 &&
    parsedDiscount != null &&
    parsedDiscount >= 0 &&
    parsedDiscount <= 100;

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    onSubmit?.({
      targetAfterDiscountExGst: parsedBudget,
      discountPercent: parsedDiscount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-theme-bg-secondary border border-theme-sidebar-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme-sidebar-border">
          <div className="text-theme-text-primary font-medium">
            Multi-Scope SOW Settings
          </div>
          <button
            onClick={() => !loading && onClose?.()}
            className="p-1 text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-theme-text-secondary mb-1">
              Budget (AUD, ex GST, after discount)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="22000"
              className="w-full px-3 py-2 bg-theme-bg-container border border-theme-sidebar-border rounded-lg text-theme-text-primary placeholder-theme-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs text-theme-text-secondary mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="5"
              min={0}
              max={100}
              step={0.5}
              className="w-full px-3 py-2 bg-theme-bg-container border border-theme-sidebar-border rounded-lg text-theme-text-primary placeholder-theme-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              disabled={loading}
            />
          </div>

          <div className="text-xs text-theme-text-secondary">
            This scales option hours to meet your budget while keeping mandatory roles.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => !loading && onClose?.()}
              className="px-4 py-2 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <CircleNotch size={18} className="animate-spin" /> : null}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
