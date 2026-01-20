import React, { useState, useEffect, useMemo } from 'react';
import { CaretLeft, Download, FileText, X, CurrencyDollar, Screwdriver, Wrench, ChartLineUp, Calculator } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { calculateANCQuote } from '@/utils/ancCalculator';

const DetailRow = ({ label, value, subtext }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="border-b border-gray-100 last:border-0 pb-2 mb-2 last:mb-0">
      <label className="text-xs uppercase text-gray-400 font-bold tracking-wider block mb-0.5">
        {label}
      </label>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-1 border-b border-gray-200">
    {Icon && <Icon size={16} className="text-blue-600" />}
    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{title}</h4>
  </div>
);

export const ProposalPreviewSlider = ({
  quoteData: externalQuoteData = {},
  isOpen = false,
  onToggle = () => { },
  onGenerateExcel = async () => { },
  onDownloadPdf = async () => { },
  isGenerating = false,
  onUpdateQuoteData = (data) => { }, // Callback to sync overrides
}) => {
  const [activeTab, setActiveTab] = useState('specs');
  const [generating, setGenerating] = useState(false);
  const [localOverrides, setLocalOverrides] = useState({});
  const [isManualMode, setIsManualMode] = useState(false);

  // Merge external data with local overrides and re-calculate
  const quoteData = useMemo(() => {
    const base = { ...externalQuoteData, ...localOverrides };
    return calculateANCQuote(base);
  }, [externalQuoteData, localOverrides]);

  const handleOverride = (field, value) => {
    setLocalOverrides(prev => ({ ...prev, [field]: value }));
    onUpdateQuoteData({ ...localOverrides, [field]: value });
  };

  const handleGenerateExcel = async () => {
    setGenerating(true);
    try {
      await onGenerateExcel();
    } catch (err) {
      console.error('Excel generation error:', err);
      toast.error('Failed to generate Excel');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      await onDownloadPdf();
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    } finally {
      setGenerating(false);
    }
  };

  const hasQuoteData = quoteData && Object.keys(quoteData).length > 0;
  // Consider 'complete' if we have a calculated price
  const isComplete = quoteData?.finalPrice > 0;

  // Formatting helper
  const fmtCurrency = (val) => val ? `$${val.toLocaleString()}` : '-';

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => onToggle()}
        />
      )}

      {/* Floating Toggle Button (Always visible logic) */}
      <button
        onClick={() => onToggle()}
        className={`fixed right-0 top-32 transition-all duration-300 z-[41] shadow-lg flex items-center gap-2
          ${isOpen ? 'right-[450px] bg-slate-800 text-white rounded-l-lg p-2' : 'bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-lg'}
        `}
        title={isOpen ? "Close preview" : "Open proposal preview"}
      >
        <CaretLeft size={20} weight="bold" className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        {!isOpen && <span className="text-xs font-bold hidden md:inline">QUOTE</span>}
      </button>

      {/* Main Drawer */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 
          bg-white border-l border-gray-200 shadow-2xl 
          transition-all duration-300 z-40
          ${isOpen ? 'w-full md:w-[450px]' : 'w-0'}
          overflow-hidden flex flex-col font-sans
        `}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-5 border-b border-slate-700 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500 p-1.5 rounded-lg">
                    <FileText size={20} weight="fill" className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg tracking-tight">Proposal Engine</h3>
                </div>
                <button
                  onClick={() => onToggle()}
                  className="hover:bg-slate-700 p-1.5 rounded-full transition-colors text-slate-300 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-400 pl-11 truncate">
                {quoteData?.clientName || 'New Project'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
              {['specs', 'logistics', 'pricing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2
                    ${activeTab === tab
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {!hasQuoteData && !isManualMode ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-full">
                    <Screwdriver size={48} className="text-gray-300" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-600 uppercase tracking-widest text-xs">Awaiting Data Extraction</p>
                      <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
                        The AI will extract specs from your chat.
                        Or, initialize the quote engine manually.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsManualMode(true);
                        setActiveTab('pricing');
                        handleOverride('width', 20);
                        handleOverride('height', 10);
                        handleOverride('pixelPitch', 4);
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <Calculator size={14} weight="bold" />
                      Initialize Manual Quote
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">

                  {/* --- SPECS TAB --- */}
                  {activeTab === 'specs' && (
                    <div className="animate-fadeIn">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <SectionHeader title="Display Configuration" icon={Screwdriver} />
                        <div className="grid grid-cols-2 gap-4">
                          <DetailRow label="Dimensions" value={`${quoteData.width || 0}' × ${quoteData.height || 0}'`} />
                          <DetailRow label="Total Area" value={`${Number(quoteData.screenArea || 0).toLocaleString()} sq ft`} />
                          <DetailRow label="Pixel Pitch" value={quoteData.pixelPitch ? `${quoteData.pixelPitch}mm` : null} />
                          <DetailRow label="Shape" value={quoteData.shape} />
                          <DetailRow label="Product Type" value={quoteData.productClass} />
                          <DetailRow label="Aspect Ratio" value={quoteData.width && quoteData.height ? (quoteData.width / quoteData.height).toFixed(2) : null} />
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <SectionHeader title="Environment & Access" icon={Wrench} />
                        <div className="grid grid-cols-2 gap-4">
                          <DetailRow label="Environment" value={quoteData.environment} />
                          <DetailRow label="Mounting" value={quoteData.mountingType} />
                          <DetailRow label="Service Access" value={quoteData.serviceAccess} />
                          <DetailRow label="Service Level" value={quoteData.serviceLevel} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- LOGISTICS TAB --- */}
                  {activeTab === 'logistics' && (
                    <div className="animate-fadeIn">
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                        <SectionHeader title="Site Conditions" icon={Wrench} />
                        <div className="space-y-1">
                          <DetailRow label="Structure Status" value={quoteData.steelType} subtext={quoteData.steelType === 'New' ? '+ Structure Cost Included' : null} />
                          <DetailRow label="Labor Jurisdiction" value={quoteData.laborType} subtext={quoteData.laborType === 'Union' ? '+ Premium Rate Applied' : null} />
                          <DetailRow label="Power Distance" value={quoteData.powerDistance} />
                          <DetailRow label="Install Complexity" value={quoteData.installComplexity} />
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <SectionHeader title="Commercial Terms" icon={FileText} />
                        <div className="space-y-1">
                          <DetailRow label="Permits" value={quoteData.permits} />
                          <DetailRow label="Surety Bond" value={quoteData.bondRequired} />
                          <DetailRow label="Warranty" value="5 Year Standard" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- PRICING TAB --- */}
                  {activeTab === 'pricing' && (
                    <div className="animate-fadeIn space-y-6">
                      {/* Interactive Controls (The "Vibe") */}
                      <div className="bg-gray-900 border border-slate-700 rounded-xl p-6 text-white shadow-xl space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-700" />

                        <div className="relative z-10 space-y-4">
                          <header className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <ChartLineUp size={16} className="text-blue-400" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Precision Scaling</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Manual Overrides</span>
                          </header>

                          {/* Pixel Pitch Slider */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                              <span>Pixel Pitch (mm)</span>
                              <span className="text-blue-200">Level {quoteData.pixelPitch || 4}</span>
                            </div>
                            <input
                              type="range" min="1.0" max="10.0" step="0.5"
                              value={quoteData.pixelPitch || 4}
                              onChange={(e) => handleOverride('pixelPitch', parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                          </div>

                          {/* Margin Slider */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                              <span>Target Margin (%)</span>
                              <span className="text-emerald-400">{quoteData.marginPercent || 30}%</span>
                            </div>
                            <input
                              type="range" min="10" max="60" step="1"
                              value={quoteData.marginPercent || 30}
                              onChange={(e) => handleOverride('marginPercent', parseInt(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>

                          {/* Base Dimensions (Quick Toggles) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase text-slate-500">Width (ft)</label>
                              <input
                                type="number"
                                value={quoteData.width || 0}
                                onChange={(e) => handleOverride('width', parseFloat(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase text-slate-500">Height (ft)</label>
                              <input
                                type="number"
                                value={quoteData.height || 0}
                                onChange={(e) => handleOverride('height', parseFloat(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Price Display (The "Vibe" result) */}
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-2xl relative overflow-hidden transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <CurrencyDollar size={120} weight="fill" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center py-2">
                          <label className="text-[10px] uppercase text-blue-100 font-extrabold tracking-[0.3em] block mb-4">
                            Estimated Client Price
                          </label>
                          <div className="flex items-baseline gap-1 animate-pulse-subtle">
                            <span className="text-6xl font-black tracking-tighter tabular-nums drop-shadow-lg">
                              {fmtCurrency(quoteData.finalPrice)}
                            </span>
                          </div>

                          <div className="mt-8 flex gap-3 w-full">
                            <div className="flex-1 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-[9px] font-bold text-blue-200 uppercase block mb-1">Gross Profit</span>
                              <span className="text-sm font-bold tabular-nums">{fmtCurrency(quoteData.grossProfit)}</span>
                            </div>
                            <div className="flex-1 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/5">
                              <span className="text-[9px] font-bold text-blue-200 uppercase block mb-1">Total sq ft</span>
                              <span className="text-sm font-bold tabular-nums">{Math.round(quoteData.screenArea || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                          <h5 className="text-xs font-bold text-gray-500 uppercase">Cost Breakdown (Waterfall)</h5>
                        </div>
                        <div className="divide-y divide-gray-100 p-4">
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Hardware (LED + Power)</span>
                            <span className="text-sm font-semibold">{fmtCurrency(quoteData.hardwareCost)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Structural Materials</span>
                            <span className="text-sm font-semibold">{fmtCurrency(quoteData.structuralCost)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Labor & Install</span>
                            <span className="text-sm font-semibold">{fmtCurrency(quoteData.laborCost)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">PM & Engineering</span>
                            <span className="text-sm font-semibold">{fmtCurrency(quoteData.pmFee)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Contingency & Bond</span>
                            <span className="text-sm font-semibold">
                              {fmtCurrency((quoteData.contingency || 0) + (quoteData.bondCost || 0))}
                            </span>
                          </div>
                          <div className="flex justify-between py-3 mt-2 bg-gray-50 -mx-4 px-4 border-t border-gray-200">
                            <span className="text-sm font-bold text-gray-800">Total Cost Basis</span>
                            <span className="text-sm font-bold text-gray-900">{fmtCurrency(quoteData.totalCost)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-white p-5 border-t border-gray-200 shrink-0 space-y-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button
                onClick={handleGenerateExcel}
                disabled={!isComplete || generating}
                className={`
                  w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2
                  transition-all duration-200 shadow-sm
                  ${!isComplete || generating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow hover:-translate-y-0.5 active:translate-y-0'}
                `}
              >
                <div className="bg-white/20 p-1 rounded">
                  <FileText size={18} weight="bold" />
                </div>
                {generating ? 'Processing...' : 'Generate Excel Cost Audit'}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={!isComplete || generating}
                className={`
                    w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2
                    transition-all duration-200 shadow-sm border
                    ${!isComplete || generating
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'}
                  `}
              >
                <Download size={18} weight="bold" />
                {generating ? 'Processing...' : 'Download Client PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProposalPreviewSlider;
