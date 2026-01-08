import { CaretDown } from "@phosphor-icons/react";

export default function LogicModuleSelector({ workspace, setHasChanges }) {
  const activeModule = workspace?.activeLogicModule || "agency";

  return (
    <div className="mb-6">
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
  );
}
