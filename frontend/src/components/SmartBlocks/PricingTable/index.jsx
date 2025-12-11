import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash, DotsSixVertical as GripVertical, DownloadSimple as Download } from "@phosphor-icons/react";

const AVAILABLE_ROLES = [
    { name: "Account Management - (Senior Account Director)", rate: 365.00 },
    { name: "Account Management - (Account Director)", rate: 295.00 },
    { name: "Account Management - (Account Manager)", rate: 180.00 },
    { name: "Project Management - (Account Director)", rate: 295.00 },
    { name: "Tech - Delivery - Project Management", rate: 150.00 },
    { name: "Tech - Senior Developer", rate: 210.00 },
    { name: "Tech - Developer", rate: 180.00 },
    { name: "Design - Senior Designer", rate: 190.00 },
    { name: "Design - Designer", rate: 140.00 },
    { name: "Content - Copywriter", rate: 180.00 }
];

export default function PricingTable({ initialData = [], onUpdate }) {
    // Use initial data if provided, otherwise start with one empty row
    const [rows, setRows] = useState(initialData.length > 0 ? initialData : [
        { id: Date.now().toString(), role: '', description: '', hours: 0, rate: 0 }
    ]);
    const [discount, setDiscount] = useState(0);

    // Update parent when data changes (for saving state)
    useEffect(() => {
        if (onUpdate) {
            onUpdate({ rows, discount });
        }
    }, [rows, discount, onUpdate]);

    const addRow = () => {
        setRows([...rows, {
            id: Date.now().toString() + Math.random(),
            role: '',
            description: '',
            hours: 0,
            rate: 0
        }]);
    };

    const deleteRow = (id) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map(row => {
            if (row.id !== id) return row;

            const updates = { [field]: value };

            // Auto-update rate if role changes
            if (field === 'role') {
                const roleObj = AVAILABLE_ROLES.find(r => r.name === value);
                if (roleObj) updates.rate = roleObj.rate;
            }

            // Parse numbers
            if (field === 'hours' || field === 'rate') {
                updates[field] = parseFloat(value) || 0;
            }

            return { ...row, ...updates };
        }));
    };

    // Calculations
    const subtotal = rows.reduce((sum, row) => sum + (row.hours * row.rate), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const gst = afterDiscount * 0.1;
    const total = afterDiscount + gst;

    // Formatting
    const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="pricing-table-container bg-theme-bg-secondary rounded-lg border border-theme-border p-6 my-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-theme-text-primary m-0">Project Pricing</h3>
                <button
                    onClick={addRow}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm font-medium border-none cursor-pointer"
                >
                    <Plus size={16} /> Add Role
                </button>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-theme-bg-container border-b border-theme-border text-left">
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider w-8"></th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider min-w-[200px]">Role</th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider min-w-[200px]">Description</th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider text-center w-24">Hours</th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider text-center w-24">Rate/Hr</th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider text-right w-32">Cost</th>
                            <th className="p-3 text-xs font-semibold text-theme-text-secondary uppercase tracking-wider w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b border-white/10 hover:bg-theme-bg-container transition-colors group">
                                <td className="p-3 text-theme-text-secondary cursor-move">
                                    <GripVertical size={14} />
                                </td>
                                <td className="p-2">
                                    <select
                                        value={row.role}
                                        onChange={(e) => updateRow(row.id, 'role', e.target.value)}
                                        className="w-full p-2 border border-theme-border rounded text-sm bg-theme-bg-secondary text-theme-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select role...</option>
                                        {AVAILABLE_ROLES.map(r => (
                                            <option key={r.name} value={r.name}>{r.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        value={row.description}
                                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                        placeholder="Task details"
                                        className="w-full p-2 border border-theme-border rounded text-sm bg-theme-bg-secondary text-theme-text-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0" step="0.5"
                                        value={row.hours}
                                        onChange={(e) => updateRow(row.id, 'hours', e.target.value)}
                                        className="w-full p-2 border border-theme-border rounded text-sm text-center bg-theme-bg-secondary text-theme-text-primary focus:border-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={row.rate}
                                        onChange={(e) => updateRow(row.id, 'rate', e.target.value)}
                                        className="w-full p-2 border border-theme-border rounded text-sm text-center bg-theme-bg-secondary text-theme-text-primary focus:border-blue-500 outline-none"
                                    />
                                </td>
                                <td className="p-3 text-right font-mono font-medium text-theme-text-primary">
                                    {fmt(row.hours * row.rate)}
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => deleteRow(row.id)}
                                        disabled={rows.length === 1}
                                        className="text-theme-text-secondary hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer p-1"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end bg-theme-bg-container rounded-lg p-4 max-w-sm ml-auto border border-theme-border">
                <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-theme-text-secondary">Discount (%):</span>
                        <input
                            type="number"
                            min="0" max="100"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-20 p-1 border border-theme-border rounded text-right text-sm bg-theme-bg-secondary text-theme-text-primary"
                        />
                    </div>

                    <div className="border-b border-white/10 my-2"></div>

                    <div className="flex justify-between text-sm text-theme-text-secondary">
                        <span>Subtotal:</span>
                        <span className="font-medium text-theme-text-primary">{fmt(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                            <span>Discount ({discount}%):</span>
                            <span>-{fmt(discountAmount)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm text-theme-text-secondary">
                        <span>GST (10%):</span>
                        <span className="text-theme-text-primary">{fmt(gst)}</span>
                    </div>

                    <div className="flex justify-between text-lg font-bold text-theme-text-primary pt-2 border-t border-white/10 mt-2">
                        <span>Total:</span>
                        <span className="text-blue-400 text-xl">{fmt(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
