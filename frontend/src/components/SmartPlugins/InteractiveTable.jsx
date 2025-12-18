import React, { useState, useMemo, useCallback } from "react";
import { Trash, Plus, Calculator } from "@phosphor-icons/react";

/**
 * Safely evaluate a formula using only the provided row data.
 * Uses a simple parser to avoid eval() security risks.
 */
function evaluateFormula(formula, rowData) {
    if (!formula || typeof formula !== "string") return 0;

    try {
        // Replace field references with values
        let expression = formula;
        const fieldPattern = /[a-zA-Z_][a-zA-Z0-9_]*/g;
        const matches = formula.match(fieldPattern) || [];

        for (const field of matches) {
            const value = parseFloat(rowData[field]) || 0;
            expression = expression.replace(new RegExp(`\\b${field}\\b`, "g"), value.toString());
        }

        // Only allow safe math operations
        if (!/^[\d\s+\-*/.()]+$/.test(expression)) {
            return 0; // Invalid expression
        }

        // Use Function constructor with no access to external scope
        const result = new Function(`return (${expression})`)();
        return isNaN(result) ? 0 : result;
    } catch (e) {
        console.warn("[InteractiveTable] Formula evaluation failed:", e.message);
        return 0;
    }
}

/**
 * Format value based on field type
 */
function formatValue(value, type) {
    if (value === null || value === undefined || value === "") return "";

    switch (type) {
        case "currency":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
            }).format(value);
        case "percentage":
            return `${(parseFloat(value) * 100).toFixed(1)}%`;
        case "number":
            return parseFloat(value).toLocaleString();
        case "calculated":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
            }).format(value);
        default:
            return String(value);
    }
}

/**
 * Interactive data table with formula support for rate cards and calculations.
 */
export default function InteractiveTable({
    schema,
    rows = [],
    onChange,
    editable = true,
    showTotals = true,
}) {
    const fields = useMemo(() =>
        Array.isArray(schema?.fields) ? schema.fields : [],
        [schema]
    );

    const [localRows, setLocalRows] = useState(() =>
        rows.length ? rows : [{}]
    );

    // Recalculate all formulas for a row
    const calculateRow = useCallback((row) => {
        const calculated = { ...row };
        for (const field of fields) {
            if (field.type === "calculated" && field.formula) {
                calculated[field.key] = evaluateFormula(field.formula, calculated);
            }
        }
        return calculated;
    }, [fields]);

    // Handle cell value change
    const handleChange = useCallback((rowIndex, key, value) => {
        setLocalRows((prev) => {
            const newRows = [...prev];
            newRows[rowIndex] = calculateRow({ ...newRows[rowIndex], [key]: value });
            onChange?.(newRows);
            return newRows;
        });
    }, [calculateRow, onChange]);

    // Add new row
    const addRow = useCallback(() => {
        setLocalRows((prev) => {
            const newRows = [...prev, {}];
            onChange?.(newRows);
            return newRows;
        });
    }, [onChange]);

    // Remove row
    const removeRow = useCallback((index) => {
        setLocalRows((prev) => {
            const newRows = prev.filter((_, i) => i !== index);
            if (newRows.length === 0) newRows.push({}); // Keep at least one row
            onChange?.(newRows);
            return newRows;
        });
    }, [onChange]);

    // Calculate totals for numeric/calculated fields
    const totals = useMemo(() => {
        if (!showTotals) return null;
        const sums = {};
        for (const field of fields) {
            if (["number", "currency", "calculated"].includes(field.type)) {
                sums[field.key] = localRows.reduce((acc, row) => {
                    const val = calculateRow(row)[field.key];
                    return acc + (parseFloat(val) || 0);
                }, 0);
            }
        }
        return sums;
    }, [localRows, fields, showTotals, calculateRow]);

    if (!fields.length) {
        return (
            <div className="text-xs text-theme-text-secondary p-4 text-center">
                No fields defined in schema.
            </div>
        );
    }

    return (
        <div className="w-full rounded-xl border border-theme-sidebar-border bg-theme-bg-container overflow-hidden">
            <table className="min-w-full text-sm">
                <thead className="bg-theme-bg-sidebar">
                    <tr>
                        {fields.map((f) => (
                            <th
                                key={f.key}
                                className="text-left px-4 py-3 font-semibold text-theme-text-primary whitespace-nowrap border-b border-theme-sidebar-border"
                            >
                                <div className="flex items-center gap-2">
                                    {f.label || f.key}
                                    {f.type === "calculated" && (
                                        <Calculator size={12} className="text-blue-400" />
                                    )}
                                </div>
                            </th>
                        ))}
                        {editable && (
                            <th className="w-10 border-b border-theme-sidebar-border" />
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-theme-sidebar-border">
                    {localRows.map((row, rowIndex) => {
                        const calculatedRow = calculateRow(row);
                        return (
                            <tr key={rowIndex} className="hover:bg-theme-bg-secondary transition-colors">
                                {fields.map((f) => (
                                    <td key={f.key} className="px-4 py-2">
                                        {f.type === "calculated" ? (
                                            <span className="text-green-400 font-medium tabular-nums">
                                                {formatValue(calculatedRow[f.key], f.type)}
                                            </span>
                                        ) : editable ? (
                                            <input
                                                type={["number", "currency", "percentage"].includes(f.type) ? "number" : "text"}
                                                step={f.type === "percentage" ? "0.01" : "any"}
                                                value={row[f.key] ?? ""}
                                                onChange={(e) => handleChange(rowIndex, f.key, e.target.value)}
                                                placeholder={f.placeholder || f.label}
                                                className="w-full bg-transparent border-0 border-b border-transparent focus:border-blue-500 outline-none text-theme-text-primary placeholder:text-theme-text-secondary/50 py-1 transition-colors"
                                            />
                                        ) : (
                                            <span className="text-theme-text-secondary">
                                                {formatValue(row[f.key], f.type)}
                                            </span>
                                        )}
                                    </td>
                                ))}
                                {editable && (
                                    <td className="px-2">
                                        <button
                                            onClick={() => removeRow(rowIndex)}
                                            className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                {showTotals && totals && Object.keys(totals).length > 0 && (
                    <tfoot className="bg-theme-bg-sidebar border-t-2 border-theme-sidebar-border">
                        <tr>
                            {fields.map((f, idx) => (
                                <td key={f.key} className="px-4 py-3 font-bold">
                                    {idx === 0 ? (
                                        <span className="text-theme-text-primary">Total</span>
                                    ) : totals[f.key] !== undefined ? (
                                        <span className="text-green-400 tabular-nums">
                                            {formatValue(totals[f.key], f.type === "percentage" ? "number" : f.type)}
                                        </span>
                                    ) : null}
                                </td>
                            ))}
                            {editable && <td />}
                        </tr>
                    </tfoot>
                )}
            </table>

            {editable && (
                <div className="px-4 py-3 border-t border-theme-sidebar-border">
                    <button
                        onClick={addRow}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-theme-text-secondary hover:text-white hover:bg-theme-bg-secondary transition-colors"
                    >
                        <Plus size={14} />
                        Add Row
                    </button>
                </div>
            )}
        </div>
    );
}
