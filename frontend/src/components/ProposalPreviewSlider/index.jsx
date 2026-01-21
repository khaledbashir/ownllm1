import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CaretLeft, Download, FileText, X, CurrencyDollar, ChartLineUp, Calculator, ShieldCheck, Clock, Lightning, Warning, CheckCircle, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { baseHeaders } from '@/utils/request';
import { calculateANCQuote } from '@/utils/ancCalculator';
import { ANCLogo } from './ANCLogo';

const BRAND_BLUE = "#003D82";

const InputField = ({ label, value, onChange, type = "text", unit = "", min, max, step }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{unit}</span>}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const SectionTitle = ({ children, icon: Icon }) => (
  <div className="flex items-center gap-3 mb-4 mt-6 first:mt-0">
    {Icon && <Icon size={16} className="text-blue-600" weight="fill" />}
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
  onUpdateQuoteData = (data) => { },
  editorRef = null, // BlockSuite editor ref for inserting pricing tables
}) => {
  // 4-tab workflow: project, specs, costs, output
  const [activeTab, setActiveTab] = useState('project');
  const [localGenerating, setLocalGenerating] = useState(false);

  // Live reactive calculation - recalculates instantly on any input change
  const quoteData = useMemo(() => {
    // Start with external data from AI
    const base = { ...externalQuoteData };
    
    // Recalculate with latest values using calculateANCQuote
    return calculateANCQuote(base);
  }, [externalQuoteData]);

  // Update parent callback when data changes
  useEffect(() => {
    if (quoteData.isAutoCalculated) {
      onUpdateQuoteData(quoteData);
    }
  }, [quoteData, onUpdateQuoteData]);

  // Handle field changes with instant recalculation
  const handleFieldChange = useCallback((field, value) => {
    onUpdateQuoteData({ ...externalQuoteData, [field]: value });
  }, [externalQuoteData, onUpdateQuoteData]);

  const handleGenerateExcel = async () => {
    setLocalGenerating(true);
    try {
      // Direct call to new endpoint
      const response = await fetch('/api/anc/generate-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...baseHeaders()
        },
        body: JSON.stringify({ quoteData })
      });

      if (!response.ok) throw new Error('Excel generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANC_Audit_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel audit generated successfully!');
    } catch (err) {
      console.error('Excel generation error:', err);
      toast.error('Failed to generate Excel');
    } finally {
      setLocalGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setLocalGenerating(true);
    try {
      // Direct call to new endpoint
      const response = await fetch('/api/anc/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...baseHeaders()
        },
        body: JSON.stringify({ quoteData })
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ANC_Quote_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF proposal downloaded successfully!');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    } finally {
      setLocalGenerating(false);
    }
  };

  const handleInsertToEditor = async () => {
    if (!editorRef?.current?.insertPricingTableWithData) {
      toast.error('Editor not available. Please open Thread Notes first.');
      return;
    }

    if (!isComplete) {
      toast.error('Please complete all required fields before inserting.');
      return;
    }

    setLocalGenerating(true);
    try {
      // Transform ANC quote data into pricing table format
      const pricingTableData = {
        title: `${quoteData.clientName || 'Project'} - ANC LED Quote`,
        currency: 'USD',
        discountPercent: 0,
        gstPercent: 0,
        tableType: 'anc',
        rows: [
          {
            id: 'hardware',
            role: 'Hardware & LED Display System',
            description: `${quoteData.width}' x ${quoteData.height}' @ ${quoteData.pixelPitch}mm pitch`,
            hours: 1,
            baseRate: quoteData.hardwareCost,
          },
          {
            id: 'structural',
            role: 'Structural Materials & Fabrication',
            description: quoteData.steelType === 'New' ? 'New steel fabrication' : 'Existing structure adaptation',
            hours: 1,
            baseRate: quoteData.structuralCost,
          },
          {
            id: 'labor',
            role: 'Installation Labor & Services',
            description: `${quoteData.laborType} labor, ${quoteData.installationType} installation`,
            hours: 1,
            baseRate: quoteData.laborCost,
          },
          {
            id: 'expenses',
            role: 'Electrical, Data & Shipping',
            description: 'Power distribution, data cabling, freight & logistics',
            hours: 1,
            baseRate: quoteData.expenseCost,
          },
          {
            id: 'pm',
            role: 'Project Management & Engineering',
            description: 'Contingency, performance bond, engineering oversight',
            hours: 1,
            baseRate: (quoteData.contingency || 0) + (quoteData.bondCost || 0),
          },
        ],
      };

      const success = await editorRef.current.insertPricingTableWithData(pricingTableData);
      if (success) {
        toast.success('✅ Pricing table inserted into Thread Notes!');
      } else {
        toast.error('Failed to insert pricing table');
      }
    } catch (err) {
      console.error('Insert to editor error:', err);
      toast.error('Failed to insert pricing table');
    } finally {
      setLocalGenerating(false);
    }
  };

  const hasQuoteData = useMemo(() => {
    return quoteData && (
      (quoteData.width > 0) ||
      (quoteData.height > 0) ||
      (quoteData.clientName && quoteData.clientName !== 'Unnamed Client') ||
      (quoteData.pixelPitch > 0)
    );
  }, [quoteData]);

  const isComplete = quoteData?.finalPrice > 0 && quoteData?.screenArea > 0;
  const fmtCurrency = (val) => val ? `$${val.toLocaleString()}` : '-';
  const isGeneratingTotal = isGenerating || localGenerating;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => onToggle()}
        />
      )}

      {/* Floating Toggle Button */}
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
            {/* Header section (Sticky) */}
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

            {/* Tabs section (Sticky) - 4-tab workflow */}
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
              {[
                { id: 'project', label: 'Project', icon: FileText },
                { id: 'specs', label: 'Specs', icon: Calculator },
                { id: 'costs', label: 'Costs', icon: ChartLineUp },
                { id: 'output', label: 'Output', icon: Download },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}
                  `}
                  title={tab.label}
                >
                  <tab.icon size={14} weight={activeTab === tab.id ? "fill" : "regular"} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Content section */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {!hasQuoteData ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-6">
                  <div className="bg-blue-50 p-6 rounded-full">
                    <Calculator size={48} className="text-blue-400" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-600 uppercase tracking-widest text-xs">Ready to Quote</p>
                      <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto mt-2 leading-relaxed">
                        The AI will extract specs from your chat. Check the Project tab to get started.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* TAB 1: PROJECT */}
                  {activeTab === 'project' && (
                    <div className="animate-fadeIn space-y-6">
                      <SectionTitle icon={FileText}>Project Information</SectionTitle>
                      <div className="space-y-4">
                        <InputField
                          label="Client Name"
                          value={quoteData.clientName || ''}
                          onChange={(val) => handleFieldChange('clientName', val)}
                        />
                        <InputField
                          label="Project Name"
                          value={quoteData.projectName || ''}
                          onChange={(val) => handleFieldChange('projectName', val)}
                        />
                        <InputField
                          label="Location / Address"
                          value={quoteData.address || ''}
                          onChange={(val) => handleFieldChange('address', val)}
                        />
                        <SelectField
                          label="Environment"
                          value={quoteData.environment || 'Indoor'}
                          onChange={(val) => handleFieldChange('environment', val)}
                          options={[
                            { value: 'Indoor', label: 'Indoor' },
                            { value: 'Outdoor', label: 'Outdoor' },
                            { value: 'Mixed', label: 'Mixed' },
                          ]}
                        />
                        <SelectField
                          label="Installation Type"
                          value={quoteData.installationType || 'Wall'}
                          onChange={(val) => handleFieldChange('installationType', val)}
                          options={[
                            { value: 'Wall', label: 'Wall Mount' },
                            { value: 'Roof', label: 'Roof Mount' },
                            { value: 'Ground', label: 'Ground Mount' },
                            { value: 'Rigging', label: 'Rigging/Suspended' },
                          ]}
                        />
                        <InputField
                          label="Quote Date"
                          type="date"
                          value={quoteData.quoteDate || new Date().toISOString().split('T')[0]}
                          onChange={(val) => handleFieldChange('quoteDate', val)}
                        />
                        <InputField
                          label="Estimator / Sales Rep"
                          value={quoteData.estimator || ''}
                          onChange={(val) => handleFieldChange('estimator', val)}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPECS */}
                  {activeTab === 'specs' && (
                    <div className="animate-fadeIn space-y-6">
                      <BrandingHeader quoteData={quoteData} />
                      <SectionTitle icon={Calculator}>Product & Display Specifications</SectionTitle>
                      <div className="space-y-4">
                        <SelectField
                          label="Product Class"
                          value={quoteData.productClass || 'Scoreboard'}
                          onChange={(val) => handleFieldChange('productClass', val)}
                          options={[
                            { value: 'Scoreboard', label: 'Scoreboard Display' },
                            { value: 'Ribbon Board', label: 'Ribbon Board' },
                            { value: 'Center Hung', label: 'Center Hung' },
                            { value: 'Vomitory', label: 'Vomitory Display' },
                            { value: 'Premium', label: 'Premium Display' },
                          ]}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="Width (ft)"
                            type="number"
                            value={quoteData.width || 0}
                            onChange={(val) => handleFieldChange('width', val)}
                            min="1"
                            max="500"
                            step="0.5"
                          />
                          <InputField
                            label="Height (ft)"
                            type="number"
                            value={quoteData.height || 0}
                            onChange={(val) => handleFieldChange('height', val)}
                            min="1"
                            max="500"
                            step="0.5"
                          />
                        </div>
                        {quoteData.screenArea > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Calculated Screen Area</p>
                            <p className="text-xl font-black text-blue-900 mt-1">{Math.round(quoteData.screenArea).toLocaleString()} sq ft</p>
                          </div>
                        )}
                        <SelectField
                          label="Pixel Pitch (mm)"
                          value={quoteData.pixelPitch || 4}
                          onChange={(val) => handleFieldChange('pixelPitch', parseFloat(val))}
                          options={[
                            { value: '1.5', label: '1.5mm (Ultra Fine)' },
                            { value: '2', label: '2.0mm (Fine)' },
                            { value: '3', label: '3.0mm' },
                            { value: '4', label: '4.0mm (Standard)' },
                            { value: '6', label: '6.0mm' },
                            { value: '8', label: '8.0mm' },
                            { value: '10', label: '10.0mm (Coarse)' },
                          ]}
                        />
                        <SelectField
                          label="Service Access"
                          value={quoteData.serviceAccess || 'Front'}
                          onChange={(val) => handleFieldChange('serviceAccess', val)}
                          options={[
                            { value: 'Front', label: 'Front Access' },
                            { value: 'Rear', label: 'Rear Access' },
                            { value: 'Both', label: 'Front & Rear' },
                          ]}
                        />
                        <SelectField
                          label="Steel Structure"
                          value={quoteData.steelType || 'Existing'}
                          onChange={(val) => handleFieldChange('steelType', val)}
                          options={[
                            { value: 'Existing', label: 'Existing Structure' },
                            { value: 'New', label: 'New Fabrication' },
                          ]}
                        />
                        <SelectField
                          label="Labor Type"
                          value={quoteData.laborType || 'Non-Union'}
                          onChange={(val) => handleFieldChange('laborType', val)}
                          options={[
                            { value: 'Non-Union', label: 'Non-Union' },
                            { value: 'Union', label: 'Union (Prevailing Wage)' },
                          ]}
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: COSTS */}
                  {activeTab === 'costs' && (
                    <div className="animate-fadeIn space-y-6">
                      <SectionTitle icon={ChartLineUp}>Cost Breakdown & Pricing</SectionTitle>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Margin Control</p>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">Target Margin</label>
                                <span className="text-sm font-black text-emerald-600">{quoteData.marginPercent || 30}%</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="60"
                                step="1"
                                value={quoteData.marginPercent || 30}
                                onChange={(e) => handleFieldChange('marginPercent', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                              />
                              <div className="flex justify-between text-[8px] text-slate-500 mt-1 font-bold">
                                <span>10%</span>
                                <span>30%</span>
                                <span>60%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Line Items Table */}
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          <table className="w-full text-[11px] border-collapse bg-white">
                            <thead>
                              <tr style={{ backgroundColor: BRAND_BLUE }} className="text-white uppercase tracking-[0.2em] font-black text-[9px]">
                                <th className="py-3 px-4 text-left border-r border-white/10">Line Item</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {[
                                { label: 'Hardware & LED Display System', value: quoteData.hardwareCost, bold: false },
                                { label: 'Structural Materials & Fabrication', value: quoteData.structuralCost, bold: false },
                                { label: 'Installation Labor & Services', value: quoteData.laborCost, bold: false },
                                { label: 'Electrical, Data & Shipping', value: quoteData.expenseCost, bold: false },
                                { label: 'Project Management & Engineering', value: (quoteData.contingency || 0) + (quoteData.bondCost || 0), bold: false },
                              ].map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className={`py-3 px-4 border-r border-slate-100 text-slate-600 font-bold uppercase text-[9px] tracking-wide`}>
                                    {row.label}
                                  </td>
                                  <td className={`py-3 px-4 text-right ${row.bold ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                    {fmtCurrency(row.value)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100 font-black text-slate-900">
                                <td className="py-3 px-4 border-r border-slate-300 uppercase text-[10px] tracking-widest">Subtotal (Cost Basis)</td>
                                <td className="py-3 px-4 text-right text-base">{fmtCurrency(quoteData.totalCost)}</td>
                              </tr>
                              <tr className="bg-emerald-50 font-black text-emerald-900">
                                <td className="py-3 px-4 border-r border-emerald-200 uppercase text-[10px] tracking-widest">Gross Profit Margin</td>
                                <td className="py-3 px-4 text-right text-base">{fmtCurrency(quoteData.grossProfit)}</td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-900 text-white">
                                <td className="py-4 px-4 border-r border-white/10 uppercase text-[10px] font-black tracking-[0.3em]">Final Quote Price</td>
                                <td className="py-4 px-4 text-right font-black text-2xl tracking-tighter">{fmtCurrency(quoteData.finalPrice)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: OUTPUT */}
                  {activeTab === 'output' && (
                    <div className="animate-fadeIn space-y-6">
                      <SectionTitle icon={Download}>Export & Download</SectionTitle>
                      
                      {!isComplete && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                          <Warning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" weight="fill" />
                          <div>
                            <p className="text-sm font-bold text-amber-900 mb-1">Incomplete Quote</p>
                            <p className="text-xs text-amber-800">Complete the Project and Specs tabs to generate files.</p>
                          </div>
                        </div>
                      )}

                      {isComplete && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                          <div>
                            <p className="text-sm font-bold text-green-900 mb-1">Ready to Export</p>
                            <p className="text-xs text-green-800">All required fields are complete. Download your files below.</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 mt-6">
                        <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-xl border border-blue-200">
                          <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider mb-2">Client PDF Proposal</h3>
                          <p className="text-[10px] text-blue-700 mb-3 leading-relaxed">Professional, branded PDF for client presentation. Includes project summary, specifications, pricing, and payment schedule.</p>
                          <button
                            onClick={handleDownloadPdf}
                            disabled={!isComplete || isGeneratingTotal}
                            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm
                              ${!isComplete || isGeneratingTotal
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'}
                            `}
                          >
                            <Download size={16} weight="bold" />
                            {isGeneratingTotal ? 'Generating PDF...' : 'Download Client PDF'}
                          </button>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-slate-50 p-5 rounded-xl border border-emerald-200">
                          <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Internal Excel Audit</h3>
                          <p className="text-[10px] text-emerald-700 mb-3 leading-relaxed">Full transparency spreadsheet with all line items, formulas, and calculation details. For internal estimators and verification.</p>
                          <button
                            onClick={handleGenerateExcel}
                            disabled={!isComplete || isGeneratingTotal}
                            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm
                              ${!isComplete || isGeneratingTotal
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'}
                            `}
                          >
                            <FileText size={16} weight="bold" />
                            {isGeneratingTotal ? 'Generating Excel...' : 'Generate Excel Audit'}
                          </button>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-slate-50 p-5 rounded-xl border border-purple-200">
                          <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-2">Insert to Thread Notes</h3>
                          <p className="text-[10px] text-purple-700 mb-3 leading-relaxed">Insert this pricing table as a structured, editable block into your Thread Notes editor. Auto-calculates totals and supports inline editing.</p>
                          <button
                            onClick={handleInsertToEditor}
                            disabled={!isComplete || isGeneratingTotal || !editorRef}
                            className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm
                              ${!isComplete || isGeneratingTotal || !editorRef
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'}
                            `}
                          >
                            <ArrowRight size={16} weight="bold" />
                            {isGeneratingTotal ? 'Inserting...' : 'Insert to Editor'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Export Details</p>
                        <div className="space-y-1 text-[9px] text-slate-600 font-medium">
                          <p>📄 <strong>PDF:</strong> Clean client-facing document (ANC branded)</p>
                          <p>📊 <strong>Excel:</strong> Full audit with formulas and calculations</p>
                          <p>📝 <strong>Editor:</strong> Structured pricing table with auto-calculations</p>
                          <p>� <strong>Security:</strong> Files saved to server storage</p>
                          <p>⏱️ <strong>Processing:</strong> Usually under 30 seconds</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer section (Sticky) */}
            <div className="bg-white p-5 border-t border-gray-200 shrink-0 space-y-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {activeTab === 'output' ? (
                <>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={!isComplete || isGeneratingTotal}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm border
                      ${!isComplete || isGeneratingTotal ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5'}
                    `}
                  >
                    <Download size={18} weight="bold" />
                    {isGeneratingTotal ? 'Generating PDF...' : 'Download Client PDF'}
                  </button>

                  <button
                    onClick={handleGenerateExcel}
                    disabled={!isComplete || isGeneratingTotal}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm
                      ${!isComplete || isGeneratingTotal ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow hover:-translate-y-0.5'}
                    `}
                  >
                    <div className="bg-white/20 p-1 rounded">
                      <FileText size={18} weight="bold" />
                    </div>
                    {isGeneratingTotal ? 'Generating Excel...' : 'Generate Excel Audit'}
                  </button>

                  <button
                    onClick={handleInsertToEditor}
                    disabled={!isComplete || isGeneratingTotal || !editorRef}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm
                      ${!isComplete || isGeneratingTotal || !editorRef ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow hover:-translate-y-0.5'}
                    `}
                  >
                    <div className="bg-white/20 p-1 rounded">
                      <ArrowRight size={18} weight="bold" />
                    </div>
                    {isGeneratingTotal ? 'Inserting...' : 'Insert to Editor'}
                  </button>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-500 font-medium">💡 Go to <strong>Output</strong> tab to download files</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ProposalPreviewSlider;
