import { CaretDown, Table, Info } from "@phosphor-icons/react";
import { useState } from "react";

export default function LogicModuleSelector({ workspace, setHasChanges }) {
  const activeModule = workspace?.activeLogicModule || "agency";
  const [showCatalog, setShowCatalog] = useState(false);

  return (
    <div className="mb-6 flex flex-col gap-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Active Logic Module
        </label>
        <div className="relative">
          <select
            name="activeLogicModule"
            defaultValue={activeModule}
            onChange={() => setHasChanges(true)}
            className="w-full bg-theme-settings-input-bg text-white text-sm rounded-lg border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
          >
            <option value="agency">Creative Agency (Rate Card)</option>
            <option value="anc">ANC Sports (LED Estimator)</option>
          </select>
          <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" weight="bold" />
        </div>
        <div className="text-xs text-white/50 mt-2">
          Selects which pricing logic and data context to use for this workspace.
        </div>
      </div>

      {activeModule === "anc" && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Table className="text-blue-400" size={20} />
              <h4 className="text-sm font-bold text-white">ANC Product Catalog</h4>
            </div>
            <button
              type="button"
              onClick={() => setShowCatalog(!showCatalog)}
              className="text-xs text-blue-400 hover:underline"
            >
              {showCatalog ? "Hide Editor" : "Edit Catalog"}
            </button>
          </div>

          {!showCatalog ? (
            <div className="text-xs text-white/40 italic">
              Click "Edit Catalog" to manage products using a Markdown table.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 bg-black/40 p-3 rounded-lg border border-white/5 mb-2">
                <Info size={16} className="text-blue-300 mt-0.5" />
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Paste a Markdown table here. The AI will use these prices as the "Base Cost" in the spreadsheet logic.
                </p>
              </div>
              <textarea
                name="ancProductCatalog"
                defaultValue={
                  workspace?.ancProductCatalog ||
                  `| Product Name | Pitch | Base Cost/sqft |\n| :--- | :--- | :--- |\n| Ribbon 10mm | 10mm | $325.00 |\n| Ribbon 6mm | 6mm | $550.00 |`
                }
                rows={8}
                onChange={() => setHasChanges(true)}
                className="w-full bg-black/20 text-blue-100 font-mono text-xs rounded-lg border border-white/10 p-3 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="| Product | Pitch | Cost/sf |\n|---|---|---|"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
