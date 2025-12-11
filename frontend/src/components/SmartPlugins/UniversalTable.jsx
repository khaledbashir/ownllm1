import React from "react";

export default function UniversalTable({ schema, rows = [] }) {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  if (!fields.length) {
    return (
      <div className="text-xs text-theme-text-secondary">
        No fields defined in schema.
      </div>
    );
  }

  const safeRows = Array.isArray(rows) ? rows : [];
  const shownRows = safeRows.length ? safeRows.slice(0, 20) : [{}];

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-theme-bg-sidebar">
          <tr>
            {fields.map((f) => (
              <th
                key={f.key}
                className="text-left px-3 py-2 font-semibold text-theme-text-primary whitespace-nowrap"
              >
                {f.label || f.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {shownRows.map((row, idx) => (
            <tr key={idx} className="bg-theme-bg-secondary">
              {fields.map((f) => (
                <td key={f.key} className="px-3 py-2 text-theme-text-secondary">
                  {row?.[f.key] === undefined || row?.[f.key] === null
                    ? ""
                    : String(row?.[f.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
