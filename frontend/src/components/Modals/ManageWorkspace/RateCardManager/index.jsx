import React, { useState, useEffect, useRef } from "react";
import {
  CurrencyDollar,
  Plus,
  Trash,
  PencilSimple,
  FloppyDisk,
  X,
  FileCsv,
  SpinnerGap,
} from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { read, utils } from "xlsx";
import levenshtein from "js-levenshtein";

const ROLE_CATEGORIES = [
  "Account Management",
  "Project Management",
  "Tech - Head Of",
  "Tech - Sr. Architect",
  "Tech - Sr. Consultant",
  "Tech - Specialist",
  "Tech - Producer",
  "Tech - Delivery",
  "Content",
  "Design",
  "Development",
  "Other",
];

export default function RateCardManager({ workspace }) {
  const [rateCard, setRateCard] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newEntry, setNewEntry] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (workspace?.rateCard) {
      try {
        setRateCard(JSON.parse(workspace.rateCard));
      } catch {
        setRateCard([]);
      }
    }
  }, [workspace]);

  const saveRateCard = async (updatedRateCard) => {
    setSaving(true);
    try {
      await Workspace.update(workspace.slug, {
        rateCard: JSON.stringify(updatedRateCard),
      });
      setRateCard(updatedRateCard);
    } catch (error) {
      console.error("Failed to save rate card:", error);
    }
    setSaving(false);
  };

  const addEntry = () => {
    setNewEntry({
      id: `role_${Date.now()}`,
      name: "",
      rate: 0,
      category: "Other",
    });
    setEditingId(null);
  };

  const saveNewEntry = async () => {
    if (!newEntry.name.trim()) return;
    const updatedRateCard = [...rateCard, newEntry];
    await saveRateCard(updatedRateCard);
    setNewEntry(null);
  };

  const updateEntry = async (id) => {
    const entry = rateCard.find((r) => r.id === id);
    if (!entry?.name?.trim()) return;
    await saveRateCard(rateCard);
    setEditingId(null);
  };

  const deleteEntry = async (id) => {
    const updatedRateCard = rateCard.filter((r) => r.id !== id);
    await saveRateCard(updatedRateCard);
  };

  // Smart Import Logic
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get data as array of arrays to find header row
      const config = { header: 1 };
      const rawRows = utils.sheet_to_json(worksheet, config);

      if (!rawRows || rawRows.length === 0) {
        alert("Spreadsheet appears to be empty.");
        setImporting(false);
        return;
      }

      // Define targets and aliases for smart mapping
      const TARGETS = {
        name: [
          "role",
          "role name",
          "rolename",
          "title",
          "position",
          "item",
          "name",
          "job",
        ],
        rate: [
          "rate",
          "price",
          "cost",
          "hourly",
          "amount",
          "$/hr",
          "usd",
          "eur",
        ],
        category: ["category", "cat", "group", "department", "type", "track"],
      };

      // 1. Find the best header row (scan first 10 rows)
      let bestHeaderRowIndex = 0;
      let maxMatchScore = -1;

      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const row = rawRows[i];
        let score = 0;
        row.forEach((cell) => {
          const strCell = String(cell).toLowerCase().trim();
          for (const key of Object.keys(TARGETS)) {
            if (
              TARGETS[key].some(
                (alias) =>
                  strCell.includes(alias) || levenshtein(strCell, alias) <= 2
              )
            ) {
              score++;
            }
          }
        });

        if (score > maxMatchScore) {
          maxMatchScore = score;
          bestHeaderRowIndex = i;
        }
      }

      // 2. Map columns from the identified header row
      const headerRow = rawRows[bestHeaderRowIndex];
      const columnMap = { name: -1, rate: -1, category: -1 };

      headerRow.forEach((cell, colIndex) => {
        const strCell = String(cell).toLowerCase().trim();
        let bestKey = null;
        let minDistance = Infinity;

        for (const [key, aliases] of Object.entries(TARGETS)) {
          // Exact match takes precedence
          if (aliases.includes(strCell)) {
            columnMap[key] = colIndex;
            return;
          }

          // Fuzzy match check
          for (const alias of aliases) {
            const dist = levenshtein(strCell, alias);
            if (dist < minDistance && dist <= 3) {
              minDistance = dist;
              bestKey = key;
            }
          }
        }

        // Assign best fuzzy match if no exact match found yet for this key
        if (bestKey && columnMap[bestKey] === -1) {
          columnMap[bestKey] = colIndex;
        }
      });

      // 3. Process data rows
      const newRoles = [];
      for (let i = bestHeaderRowIndex + 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        // Must have at least a name or role
        if (!row[columnMap.name]) continue;

        // Clean Rate
        let rateVal = row[columnMap.rate];
        if (typeof rateVal === "string") {
          rateVal = parseFloat(rateVal.replace(/[^0-9.]/g, ""));
        }

        // Clean Category
        let catVal = row[columnMap.category];
        // Match to existing categories or default to "Other"
        if (catVal) {
          const match = ROLE_CATEGORIES.find(
            (c) =>
              c.toLowerCase() === String(catVal).toLowerCase() ||
              String(catVal).toLowerCase().includes(c.toLowerCase())
          );
          catVal = match || "Other";
        } else {
          catVal = "Other";
        }

        newRoles.push({
          id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: String(row[columnMap.name]).trim(),
          rate: isNaN(rateVal) ? 0 : rateVal,
          category: catVal,
        });
      }

      if (newRoles.length > 0) {
        const combined = [...rateCard, ...newRoles];
        await saveRateCard(combined);
        // Simple toast or alert
        // We don't have a toast prop passed here usually, but we can assume standard behavior or just use updated state
      } else {
        alert(
          "Could not find any valid roles to import. Please check your column headers."
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group by category
  const groupedRoles = rateCard.reduce((acc, role) => {
    const cat = role.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(role);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".csv, .xlsx, .xls"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CurrencyDollar className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Rate Card</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving || importing}
            className="flex items-center gap-2 px-4 py-2 bg-theme-bg-secondary hover:bg-theme-bg-secondary/80 text-white border border-theme-border rounded-lg text-sm font-medium transition-colors"
          >
            {importing ? (
              <SpinnerGap className="w-4 h-4 animate-spin" />
            ) : (
              <FileCsv className="w-4 h-4" />
            )}
            Import Excel
          </button>
          <button
            onClick={addEntry}
            disabled={saving || newEntry || importing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>
      </div>

      <p className="text-white/60 text-sm">
        Define roles and hourly rates. The AI will use these when generating
        time & materials proposals.
      </p>

      {/* New Entry Form */}
      {newEntry && (
        <div className="bg-theme-bg-primary border border-theme-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">New Role</span>
            <div className="flex gap-2">
              <button
                onClick={saveNewEntry}
                disabled={!newEntry.name.trim() || saving}
                className="p-2 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50"
              >
                <FloppyDisk className="w-5 h-5" />
              </button>
              <button
                onClick={() => setNewEntry(null)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <RoleForm
            entry={newEntry}
            onChange={(updates) => setNewEntry({ ...newEntry, ...updates })}
          />
        </div>
      )}

      {/* Rate Card List */}
      <div className="space-y-4">
        {rateCard.length === 0 && !newEntry && (
          <div className="text-center py-12 text-white/40">
            <CurrencyDollar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No rate card entries yet.</p>
            <p className="text-sm">
              Add your first role, or import an Excel sheet.
            </p>
          </div>
        )}

        {Object.entries(groupedRoles).map(([category, roles]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-white/40 text-sm font-medium uppercase tracking-wider">
              {category}
            </h3>
            {roles.map((entry) => (
              <div
                key={entry.id}
                className="bg-theme-bg-primary border border-theme-border rounded-lg p-3"
              >
                {editingId === entry.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Edit Role</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateEntry(entry.id)}
                          disabled={saving}
                          className="p-2 text-green-400 hover:bg-green-400/10 rounded disabled:opacity-50"
                        >
                          <FloppyDisk className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 text-white/60 hover:bg-white/10 rounded"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <RoleForm
                      entry={entry}
                      onChange={(updates) => {
                        const idx = rateCard.findIndex(
                          (r) => r.id === entry.id
                        );
                        const updated = [...rateCard];
                        updated[idx] = { ...entry, ...updates };
                        setRateCard(updated);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-white">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-green-400">
                        ${entry.rate?.toLocaleString()}/hr
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(entry.id)}
                          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          disabled={saving}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded disabled:opacity-50"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleForm({ entry, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-3 sm:col-span-2">
        <label className="block text-white/60 text-sm mb-1">Role Name</label>
        <input
          type="text"
          value={entry.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Tech - Sr. Consultant - Strategy"
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div>
        <label className="block text-white/60 text-sm mb-1">Rate ($/hr)</label>
        <input
          type="number"
          value={entry.rate}
          onChange={(e) => onChange({ rate: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          min="0"
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="col-span-3">
        <label className="block text-white/60 text-sm mb-1">Category</label>
        <select
          value={entry.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="w-full px-3 py-2 bg-theme-bg-secondary border border-theme-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {ROLE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
