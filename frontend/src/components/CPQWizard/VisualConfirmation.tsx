import { CPQInput } from "@/utils/cpqCalculator";

interface VisualConfirmationProps {
  data: CPQInput;
  onConfirm: () => void;
  onRegenerate?: () => void;
}

export default function VisualConfirmation({
  data,
  onConfirm,
  onRegenerate,
}: VisualConfirmationProps) {
  const {
    clientName,
    address,
    productName,
    widthFt,
    heightFt,
    pixelPitch,
    environment,
    shape,
    structureCondition,
    serviceAccess,
    laborType,
    permits,
    controlSystem,
    targetMargin,
    unitCost,
  } = data;

  const sqFt = (widthFt || 0) * (heightFt || 0);
  const totalSqFt = sqFt * (data.screens?.length || 1);

  return (
    <div className="bg-slate-900 border-l border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Confirm Your Configuration
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Display Specifications</h4>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-300">Product Class:</span>
                <span className="text-white font-medium">{productName || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Pixel Pitch:</span>
                <span className="text-white font-medium">{pixelPitch ? `${pixelPitch}mm` : "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Dimensions:</span>
                <span className="text-white font-medium">
                  {widthFt ? `${widthFt}' × ${heightFt}'` : "Not specified"} ({totalSqFt.toFixed(0)} sq ft)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Environment:</span>
                <span className="text-white font-medium">{environment || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Shape:</span>
                <span className="text-white font-medium">{shape || "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Installation Details</h4>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-300">Structure:</span>
                <span className="text-white font-medium">{structureCondition || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Service Access:</span>
                <span className="text-white font-medium">{serviceAccess || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Labor Type:</span>
                <span className="text-white font-medium">{laborType || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Permits:</span>
                <span className="text-white font-medium">{permits || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Control System:</span>
                <span className="text-white font-medium">{controlSystem || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Target Margin:</span>
                <span className="text-white font-medium">{targetMargin ? `${targetMargin}%` : "Not specified"}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-semibold text-white mb-2">Power Requirements</h4>
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-300">Estimated Amperage:</span>
                <span className="text-white font-medium">
                  {environment === "Outdoor"
                    ? `~${Math.round((sqFt * 60) / 120)}A`
                    : `~${Math.round((sqFt * 30) / 120)}A`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">Voltage:</span>
                <span className="text-white font-medium">120V</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Send size={16} className="mr-2" />
              Confirm & Generate Proposal
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Send size={16} className="mr-2" />
                Regenerate Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
