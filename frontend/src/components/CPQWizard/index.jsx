import React, { useState } from "react";
import { MessageSquare, Settings, Database } from "lucide-react";
import ConversationalInput from "./ConversationalInput";
import VisualConfirmation from "./VisualConfirmation";
import ProgressIndicator from "./ProgressIndicator";
import DocumentPreview from "./DocumentPreview";
import { CPQInput } from "@/utils/cpqCalculator";

export default function CPQWizard() {
  const [mode, setMode] = useState<"ai" | "form">("ai");
  const [activeProjectId, setActiveProjectId] = useState<number | undefined>(undefined);

  const [input, setInput] = useState<CPQInput>({
    clientName: "",
    address: "",
    projectName: "",
    productClass: "Scoreboard",
    widthFt: 0,
    heightFt: 0,
    pixelPitch: 0,
    environment: "Indoor",
    shape: "Flat",
    structureCondition: "Standard",
    serviceAccess: "Front",
    complexity: "Standard",
    laborType: "NonUnion",
    permits: "ANC",
    controlSystem: "New",
    bondRequired: false,
    screens: [],
    targetMargin: 30,
  });

  const PRICING_FIELDS = [
    "productClass",
    "pixelPitch",
    "environment",
    "shape",
    "structureCondition",
    "mountingType",
    "access",
    "laborType",
    "targetMargin",
    "bondRequired",
    "widthFt",
    "heightFt",
  ] as const;

  const pricingInput = {
    ...input,
    screens: input.screens || [],
  };

  const handleInputChange = (field: keyof CPQInput, value: any) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const handleWizardUpdate = (params: Partial<CPQInput>) => {
    if (params.clientName === "" && params.widthFt === 0) {
      setInput(params as CPQInput);
    } else {
      setInput((prev) => ({ ...prev, ...params }));
    }
  };

  const handleReset = () => {
    setInput({
      clientName: "",
      address: "",
      projectName: "",
      productClass: "Scoreboard",
      widthFt: 0,
      heightFt: 0,
      pixelPitch: 0,
      environment: "Indoor",
      shape: "Flat",
      structureCondition: "Standard",
      serviceAccess: "Front",
      complexity: "Standard",
      laborType: "NonUnion",
      permits: "ANC",
      controlSystem: "New",
      bondRequired: false,
      screens: [],
      targetMargin: 30,
    });
    setActiveProjectId(undefined);
  };

  const completedFields = PRICING_FIELDS.filter(
    (field) => input[field] !== undefined && input[field] !== null && input[field] !== ""
  ).length;

  const totalFields = PRICING_FIELDS.length;

  const progress = ((completedFields / totalFields) * 100).toFixed(0);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex border-b border-slate-800">
        <div className="w-full flex items-center justify-between py-4 px-6 bg-slate-900">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare size={32} className="text-blue-400" />
            Configure Your Proposal
          </h1>
        </div>

        <div className="flex">
          <div className="w-[40%] h-full shrink-0 z-10">
            <div className="flex flex-col h-full">
              {mode === "ai" && (
                <ConversationalInput
                  value={input.clientName}
                  onChange={(v) => handleInputChange("clientName", v)}
                  isLoading={false}
                />
              )}

              {mode === "form" && (
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-300 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={input.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={input.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={input.projectName}
                        onChange={(e) => handleInputChange("projectName", e.target.value)}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-lg font-bold mb-4">Display Configuration</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Product Class
                        </label>
                        <select
                          value={input.productClass}
                          onChange={(e) => handleInputChange("productClass", e.target.value)}
                          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select...</option>
                          <option value="Scoreboard">Scoreboard</option>
                          <option value="Ribbon">Ribbon Board</option>
                          <option value="CenterHung">Center Hung</option>
                          <option value="Vomitory">Vomitory</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Pixel Pitch (mm)
                        </label>
                        <select
                          value={input.pixelPitch}
                          onChange={(e) => handleInputChange("pixelPitch", parseInt(e.target.value))}
                          className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select...</option>
                          <option value={4}>4mm</option>
                          <option value={6}>6mm</option>
                          <option value={10}>10mm</option>
                          <option value={16}>16mm</option>
                          <option value={20}>20mm</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Width (ft)
                          </label>
                          <input
                            type="number"
                            value={input.widthFt}
                            onChange={(e) => handleInputChange("widthFt", parseFloat(e.target.value))}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Height (ft)
                          </label>
                          <input
                            type="number"
                            value={input.heightFt}
                            onChange={(e) => handleInputChange("heightFt", parseFloat(e.target.value))}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Environment
                          </label>
                          <select
                            value={input.environment}
                            onChange={(e) => handleInputChange("environment", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Indoor">Indoor</option>
                            <option value="Outdoor">Outdoor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Structure Condition
                          </label>
                          <select
                            value={input.structureCondition}
                            onChange={(e) => handleInputChange("structureCondition", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Existing">Existing</option>
                            <option value="NewSteel">New Steel</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Service Access
                          </label>
                          <select
                            value={input.serviceAccess}
                            onChange={(e) => handleInputChange("serviceAccess", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Front">Front Service</option>
                            <option value="Rear">Rear Service</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Labor Type
                          </label>
                          <select
                            value={input.laborType}
                            onChange={(e) => handleInputChange("laborType", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Union">Union Labor</option>
                            <option value="NonUnion">Non-Union</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Permits
                          </label>
                          <select
                            value={input.permits}
                            onChange={(e) => handleInputChange("permits", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="ANC">ANC Provides</option>
                            <option value="Client">Client Provides</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-1">
                            Control System
                          </label>
                          <select
                            value={input.controlSystem}
                            onChange={(e) => handleInputChange("controlSystem", e.target.value)}
                            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="New">New</option>
                            <option value="Existing">Existing</option>
                            <option value="None">None</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                              Bond Required
                            </label>
                            <select
                              value={input.bondRequired}
                              onChange={(e) => handleInputChange("bondRequired", e.target.value === "true")}
                              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                              Target Margin (%)
                            </label>
                            <input
                              type="number"
                              value={input.targetMargin}
                              onChange={(e) => handleInputChange("targetMargin", parseFloat(e.target.value))}
                              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min="0"
                              max="99"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">
                              Unit Cost Override ($)
                            </label>
                            <input
                              type="number"
                              value={input.unitCost}
                              onChange={(e) => handleInputChange("unitCost", parseFloat(e.target.value))}
                              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Optional manual override"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <VisualConfirmation
                data={input}
                onConfirm={() => console.log("Confirm proposal generation")}
              />
            </div>

          <div className="w-[60%] h-full">
            <DocumentPreview />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800">
          <ProgressIndicator
            completedFields={PRICING_FIELDS.filter((field) => input[field] !== undefined && input[field] !== null && input[field] !== "")}
            totalSteps={PRICING_FIELDS.length}
            currentStepIndex={0}
          />

          <div className="px-6 py-4 border-l border-slate-800">
            <div className="flex items-center justify-between">
              <button
                onClick={handleReset}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <Database size={16} className="mr-2" />
                Start New Proposal
              </button>

              <button
                onClick={() => setMode("form")}
                className={`text-sm text-zinc-400 hover:text-zinc-600 transition-colors ${
                  mode === "form" ? "text-blue-400" : ""
                }`}
              >
                <Settings size={16} className="mr-2" />
                Manual Form
              </button>

              <button
                onClick={() => console.log("Open Salesforce")}
                className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <Database size={16} className="mr-2" />
                Salesforce
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
