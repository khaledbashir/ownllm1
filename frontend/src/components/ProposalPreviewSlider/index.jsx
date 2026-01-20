import React, { useState, useEffect, useMemo } from 'react';
import { CaretLeft, Download, FileText, X, CurrencyDollar, Screwdriver, Wrench, ChartLineUp, Calculator, ShieldCheck, Clock, Zap } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { calculateANCQuote } from '@/utils/ancCalculator';
import { ANCLogo } from './ANCLogo';

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

const BRAND_BLUE = "#003D82";

const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
    <h3 className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase whitespace-nowrap">{children}</h3>
    <div className="flex-1 h-[1px] bg-slate-100" />
  </div>
);

const BrandingHeader = ({ quoteData }) => (
  <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-100">
    <div className="space-y-6">
      <ANCLogo className="h-[36px] w-auto" color={BRAND_BLUE} />
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
          {quoteData?.clientName || 'NEW PROJECT'}
        </h1>
        <p className="text-[10px] text-slate-400 font-bold tracking-tight">
          {quoteData?.address || 'PROJECT LOCATION DETAILS'}
        </p>
      </div>
    </div>
    <div className="text-right flex flex-col items-end">
      <h2 className="text-[9px] font-black tracking-[0.3em] mb-4 text-slate-300 uppercase">Document Information</h2>
      <div className="space-y-1 text-[9px] font-bold uppercase tracking-wider text-slate-700">
        <p><span className="text-slate-300 mr-2">DATE:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><span className="text-slate-300 mr-2">REF:</span> ANC-{Math.floor(100000 + Math.random() * 900000)}</p>
        <div className="mt-2 px-2 py-1 bg-slate-50 rounded inline-block text-[9px] text-blue-800 border border-blue-100/50">
          SALES QUOTATION
        </div>
      </div>
    </div>
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

  // Check if we have real data from the AI or if user is interacting manually
  const hasAidata = useMemo(() => {
    return externalQuoteData && (
      (externalQuoteData.width > 0) ||
      (externalQuoteData.height > 0) ||
      (externalQuoteData.clientName && externalQuoteData.clientName !== 'Unnamed Client') ||
      (externalQuoteData.pixelPitch > 0)
    );
  }, [externalQuoteData]);

  const hasQuoteData = hasAidata || isManualMode;

  // Consider 'complete' if we have a calculated price and area
  const isComplete = quoteData?.finalPrice > 0 && quoteData?.screenArea > 0;

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
                    <div className="animate-fadeIn font-inter">
                      <BrandingHeader quoteData={quoteData} />

                      <div className="mb-8 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                        <p className="text-[11px] text-slate-600 leading-relaxed text-justify font-medium">
                          This memorandum sets forth the summary terms and technical specifications by which <strong>{quoteData.clientName || 'Purchaser'}</strong> and ANC Sports Enterprises, LLC agree to proceed with the procurement and installation of the LED Display Systems described herein.
                        </p>
                      </div>

                      <SectionTitle>Technical Specifications</SectionTitle>
                      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-6">
                        <table className="w-full text-[11px] border-collapse bg-white">
                          <thead>
                            <tr style={{ backgroundColor: BRAND_BLUE }} className="text-white uppercase tracking-widest font-black text-[9px]">
                              <th className="py-3 px-4 text-left border-r border-white/10">Parameter</th>
                              <th className="py-3 px-4 text-right">Technical Specification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { label: 'Product Category', value: quoteData.productClass ? `${quoteData.productClass} Display` : null },
                              { label: 'Pixel Pitch', value: quoteData.pixelPitch ? `${quoteData.pixelPitch}mm (SMD LED)` : null },
                              { label: 'Active Dimensions', value: quoteData.width && quoteData.height ? `${quoteData.width}' W x ${quoteData.height}' H` : null },
                              { label: 'Screen Area', value: quoteData.screenArea ? `${Math.round(quoteData.screenArea).toLocaleString()} sq ft` : null },
                              { label: 'Environment', value: quoteData.environment },
                              { label: 'Shape', value: quoteData.shape ? `${quoteData.shape} Configuration` : null },
                              { label: 'Service Access', value: quoteData.serviceAccess ? `${quoteData.serviceAccess} Access` : null },
                            ].map((row, i) => row.value ? (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="py-3 px-4 font-black text-slate-900 border-r border-slate-100 uppercase text-[9px] tracking-wide">{row.label}</td>
                                <td className="py-3 px-4 text-right font-semibold text-slate-600">{row.value}</td>
                              </tr>
                            ) : null)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* --- LOGISTICS TAB --- */}
                  {activeTab === 'logistics' && (
                    <div className="animate-fadeIn space-y-8 font-inter">
                      <div>
                        <SectionTitle>Site & Installation</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Structure Condition</label>
                            <p className="text-sm font-bold text-slate-900">{quoteData.steelType === 'New' ? 'New Structural Fabrication' : 'Existing Steel Infrastructure'}</p>
                            <p className="text-[9px] text-slate-500 font-medium mt-1 italic">{quoteData.steelType === 'New' ? '+ Full Engineering Submittals Included' : 'Subject to site survey & load verification'}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Labor Jurisdiction</label>
                            <p className="text-sm font-bold text-slate-900">{quoteData.laborType || 'Non-Union'} Installation</p>
                            <p className="text-[9px] text-slate-500 font-medium mt-1 italic">{quoteData.laborType === 'Union' ? 'Certified Prevailing Wage' : 'Standard ANC Deployment'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <SectionTitle>Payment Schedule</SectionTitle>
                        <div className="space-y-4 mt-4">
                          {[
                            { pct: "50%", label: "Execution Deposit", detail: "Required for procurement kick-off" },
                            { pct: "40%", label: "Shipping Milestone", detail: "Due prior to logistics departure" },
                            { pct: "10%", label: "Commissioning", detail: "Net 15 upon final acceptance" }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                              <div className="text-xl font-black text-[#003D82] w-12">{item.pct}</div>
                              <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.label}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{item.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <SectionTitle>Clarifications</SectionTitle>
                        <div className="space-y-3 mt-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-1 leading-tight">Project Exclusions</p>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">Primary power feed, structural reinforcement (unless 'New' specified), and data conduit infrastructure.</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter mb-1 leading-tight">Validity</p>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">This estimate is valid for 30 days from document date. Final pricing subject to site survey.</p>
                          </div>
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
                      <div className="bg-gradient-to-br from-[#003D82] to-blue-900 rounded-xl p-6 text-white shadow-2xl relative overflow-hidden transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <CurrencyDollar size={120} weight="fill" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center py-2">
                          <label className="text-[10px] uppercase text-blue-100 font-extrabold tracking-[0.3em] block mb-4 italic opacity-80">
                            Estimated Project Investment
                          </label>
                          <div className="flex items-baseline gap-1 animate-pulse-subtle">
                            <span className="text-6xl font-black tracking-tighter tabular-nums drop-shadow-xl">
                              {fmtCurrency(quoteData.finalPrice)}
                            </span>
                          </div>

                          <div className="mt-8 flex gap-3 w-full">
                            <div className="flex-1 bg-white/10 backdrop-blur-md px-3 py-3 rounded-xl border border-white/10 shadow-inner">
                              <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1">Gross Profit</span>
                              <span className="text-sm font-black tabular-nums">{fmtCurrency(quoteData.grossProfit)}</span>
                            </div>
                            <div className="flex-1 bg-white/10 backdrop-blur-md px-3 py-3 rounded-xl border border-white/10 shadow-inner">
                              <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-1">Target Margin</span>
                              <span className="text-sm font-black tabular-nums">{quoteData.marginPercent || 30}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Breakdown (Natalia Style Table) */}
                      <SectionTitle>Investment Breakout</SectionTitle>
                      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-6">
                        <table className="w-full text-[11px] border-collapse bg-white">
                          <thead>
                            <tr style={{ backgroundColor: BRAND_BLUE }} className="text-white uppercase tracking-[0.2em] font-black text-[9px]">
                              <th className="py-3 px-4 text-left border-r border-white/10">Category Description</th>
                              <th className="py-3 px-4 text-right">Investment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 italic">
                            {[
                              { label: 'ANC Digital Display Hardware', value: quoteData.hardwareCost, bold: true },
                              { label: 'Structural Materials & Fabrication', value: quoteData.structuralCost },
                              { label: 'Installation & Professional Services', value: quoteData.laborCost },
                              { label: 'Shipping, Logistics & Project Expenses', value: quoteData.expenseCost },
                              { label: 'Engineering, Bonds & Submittals', value: (quoteData.contingency || 0) + (quoteData.bondCost || 0) },
                            ].map((row, i) => (
                              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                <td className={`py-3.5 px-4 border-r border-slate-100 ${row.bold ? 'font-black text-slate-900' : 'text-slate-500 font-bold'} uppercase text-[9px] tracking-wide`}>
                                  {row.label}
                                </td>
                                <td className={`py-3.5 px-4 text-right font-black ${row.bold ? 'text-slate-900 border-b-2 border-slate-900/5' : 'text-slate-600'}`}>
                                  {fmtCurrency(row.value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-900 text-white shadow-inner">
                              <td className="py-4 px-4 border-r border-white/10 uppercase text-[10px] font-black tracking-[0.3em] text-center italic">Project Grand Total</td>
                              <td className="py-4 px-4 text-right font-black text-lg tracking-tighter">{fmtCurrency(quoteData.finalPrice)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Professional Badges */}
                      <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-center gap-1 group">
                          <Zap size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Professional<br />Grade</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-center gap-1 group">
                          <ShieldCheck size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Full Warranty<br />Included</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-center gap-1 group">
                          <Clock size={16} className="text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none">Quote Valid<br />30 Days</span>
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
    </div >
    </>
  );
};

export default ProposalPreviewSlider;
