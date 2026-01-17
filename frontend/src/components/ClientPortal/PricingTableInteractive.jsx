import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash,
  PencilSimple,
  Check,
  X as XIcon,
  Calculator,
  CurrencyDollar,
} from "@phosphor-icons/react";

/**
 * PricingTableInteractive - Interactive pricing table with live calculations
 * Supports editing, tax calculation, row management
 */

export default function PricingTableInteractive({
  initialRows = [],
  currency = "USD",
  taxRate = 0,
  onRowUpdate,
  onRowDelete,
  onRowAdd,
  readOnly = false,
}) {
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Update rows when initialRows changes (prop change)
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      description: row.description,
      hours: row.hours,
      rate: row.rate,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedRows = rows.map((row) =>
      row.id === editingId
        ? {
            ...row,
            description: editForm.description,
            hours: parseFloat(editForm.hours) || 0,
            rate: parseFloat(editForm.rate) || 0,
            total:
              (parseFloat(editForm.hours) || 0) *
              (parseFloat(editForm.rate) || 0),
          }
        : row
    );

    setRows(updatedRows);
    setEditingId(null);
    setEditForm({});

    if (onRowUpdate) {
      const updatedRow = updatedRows.find((r) => r.id === editingId);
      onRowUpdate(updatedRow);
    }
  };

  const handleDelete = (id) => {
    if (!confirm("Are you sure you want to delete this row?")) return;

    const updatedRows = rows.filter((row) => row.id !== id);
    setRows(updatedRows);

    if (onRowDelete) {
      onRowDelete(id);
    }
  };

  const handleAddRow = () => {
    const newRow = {
      id: `new-${Date.now()}`,
      description: "New Item",
      hours: 0,
      rate: 0,
      total: 0,
    };

    const updatedRows = [...rows, newRow];
    setRows(updatedRows);

    if (onRowAdd) {
      onRowAdd(newRow);
    }

    // Start editing the new row
    handleEdit(newRow);
  };

  // Calculate totals
  const subtotal = rows.reduce((sum, row) => sum + (row.total || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Table Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Pricing Breakdown</h3>
          <div className="flex items-center gap-2 text-white/90">
            <Calculator size={20} weight="bold" />
            <span className="text-sm font-medium">Live Calculations</span>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider w-32">
                Hours
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider w-40">
                Rate ({currency})
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider w-40">
                Total
              </th>
              {!readOnly && (
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`transition-colors ${
                  editingId === row.id ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                {editingId === row.id ? (
                  // Edit Mode
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.hours}
                        onChange={(e) =>
                          setEditForm({ ...editForm, hours: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="1"
                        value={editForm.rate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, rate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-indigo-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-500">
                        {formatCurrency(
                          (parseFloat(editForm.hours) || 0) *
                            (parseFloat(editForm.rate) || 0)
                        )}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <Check size={16} weight="bold" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                          >
                            <XIcon size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                ) : (
                  // View Mode
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-900">
                          {row.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-700">
                        {row.hours?.toFixed(1) || "0.0"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatCurrency(row.rate || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-indigo-600">
                        {formatCurrency(row.total || 0)}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={readOnly ? 4 : 5}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <CurrencyDollar size={32} className="opacity-50" />
                    <p className="text-sm">No items added yet</p>
                    {!readOnly && (
                      <button
                        onClick={handleAddRow}
                        className="mt-2 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Add First Item
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
        <div className="max-w-sm ml-auto space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-600">Subtotal</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {taxRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">
                Tax ({taxRate}%)
              </span>
              <span className="text-lg font-semibold text-slate-700">
                {formatCurrency(taxAmount)}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">
                Grand Total
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Row Button (Footer) */}
      {!readOnly && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleAddRow}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold"
          >
            <Plus size={20} weight="bold" />
            Add Line Item
          </button>
        </div>
      )}
    </div>
  );
}
