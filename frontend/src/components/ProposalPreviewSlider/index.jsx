import React, { useState } from 'react';
import { CaretLeft, Download, FileText, X } from '@phosphor-icons/react';
import { toast } from 'react-toastify';

export const ProposalPreviewSlider = ({
  quoteData = {},
  isOpen = false,
  onToggle = () => {},
  onGenerateExcel = async () => {},
  onDownloadPdf = async () => {},
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState('specs');
  const [generating, setGenerating] = useState(false);

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
  const isComplete = quoteData?.finalPrice > 0;

  return (
    <>
      {/* Overlay when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => onToggle()}
        />
      )}

      {/* Toggle Button (Always handle visibility) */}
      {!isOpen && (
        <button
          onClick={() => onToggle()}
          className="fixed right-0 top-24 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-lg transition-colors z-40 shadow-lg"
          title="Open proposal preview"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
      )}

      {/* Slider Container */}
      <div
        className={`
          fixed right-0 top-0 bottom-0 
          bg-white border-l border-gray-200 shadow-2xl 
          transition-all duration-300 z-40
          ${isOpen ? 'w-full md:w-96' : 'w-0'}
          overflow-hidden flex flex-col
        `}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 border-b border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">📋 Proposal Preview</h3>
                <button
                  onClick={() => onToggle()}
                  className="hover:bg-blue-500 p-1 rounded transition-colors md:hidden"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-blue-100">
                {quoteData?.clientName || 'ANC Project'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-gray-50">
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === 'specs'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className={`flex-1 py-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === 'pricing'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Pricing
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {!hasQuoteData ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <FileText size={48} className="mb-3 text-gray-300" />
                  <p className="text-sm">Start a conversation to see proposal details</p>
                </div>
              ) : (
                <>
                  {/* Specifications Tab */}
                  {activeTab === 'specs' && (
                    <div className="space-y-4">
                      {quoteData?.width && quoteData?.height && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Display Dimensions
                          </label>
                          <p className="text-2xl font-bold text-gray-900">
                            {quoteData.width} × {quoteData.height} ft
                          </p>
                          {quoteData.screenArea && (
                            <p className="text-sm text-gray-600 mt-1">
                              {quoteData.screenArea.toLocaleString()} sq ft
                            </p>
                          )}
                        </div>
                      )}

                      {quoteData?.environment && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Environment
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            {quoteData.environment}
                          </p>
                        </div>
                      )}

                      {quoteData?.pixelPitch && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Pixel Pitch
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            {quoteData.pixelPitch} mm
                          </p>
                        </div>
                      )}

                      {quoteData?.productCategory && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Product Category
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            {quoteData.productCategory}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing Tab */}
                  {activeTab === 'pricing' && (
                    <div className="space-y-3">
                      {quoteData?.hardwareCost !== undefined && (
                        <div className="border-b pb-3">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Hardware (Panels + Drivers)
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            ${quoteData.hardwareCost.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {quoteData?.structuralCost !== undefined && (
                        <div className="border-b pb-3">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Structural Materials (20%)
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            ${quoteData.structuralCost.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {quoteData?.laborCost !== undefined && (
                        <div className="border-b pb-3">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            Labor & Installation
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            ${quoteData.laborCost.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {quoteData?.pmFee !== undefined && (
                        <div className="border-b pb-3">
                          <label className="text-xs uppercase text-gray-500 font-semibold block mb-1">
                            PM & Engineering (8%)
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            ${quoteData.pmFee.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {quoteData?.totalCost !== undefined && (
                        <div className="bg-gray-100 rounded-lg p-3 border border-gray-300 mb-3">
                          <label className="text-xs uppercase text-gray-600 font-semibold block mb-1">
                            Total Cost Basis
                          </label>
                          <p className="text-xl font-bold text-gray-900">
                            ${quoteData.totalCost.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {quoteData?.finalPrice !== undefined && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                          <label className="text-xs uppercase text-blue-700 font-bold block mb-2">
                            Client Price ({quoteData.marginPercent || 30}% Margin)
                          </label>
                          <p className="text-3xl font-bold text-blue-900">
                            ${quoteData.finalPrice.toLocaleString()}
                          </p>
                          {quoteData?.grossProfit !== undefined && (
                            <p className="text-sm text-blue-700 mt-2">
                              Gross Profit: ${quoteData.grossProfit.toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {hasQuoteData && (
              <div className="border-t p-4 space-y-2 bg-gray-50">
                <button
                  onClick={handleGenerateExcel}
                  disabled={!isComplete || generating}
                  className={`
                    w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2
                    transition-all duration-200
                    ${
                      !isComplete || generating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                    }
                  `}
                >
                  <FileText size={18} />
                  {generating ? 'Generating...' : 'Generate Excel Audit'}
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={!isComplete || generating}
                  className={`
                    w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2
                    transition-all duration-200
                    ${
                      !isComplete || generating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
                    }
                  `}
                >
                  <Download size={18} />
                  {generating ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ProposalPreviewSlider;
