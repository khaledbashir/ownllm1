# ANC Proposal Engine: FINAL ARCHITECTURE
## Clear, Build-Ready Implementation Plan

---

## 🎯 THE EXACT SOLUTION

You're building a **Conversational Proposal Generator** with:
- **Chat on left** (asking ONE question at a time)
- **Live preview slider on right** (shows proposal updating in real-time)
- **Two download buttons** (Excel, PDF) in the slider
- **All data flows through your existing endpoints**

---

## 📐 VISUAL LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│  ANC Proposal Engine                                         │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│    CHAT INTERFACE        │    LIVE PREVIEW SLIDER           │
│    (Left Panel)          │    (Right Drawer - 35% width)    │
│                          │                                  │
│  AI: "What's your       │  📋 PROPOSAL PREVIEW            │
│  display width?"        │                                  │
│                          │  ✓ Width: 40 ft                 │
│  [User types: 40 ft]    │  ✓ Height: 20 ft                │
│                          │  ✓ Environment: Outdoor         │
│  [Instant update ↓]     │  ✓ Pixel Pitch: 10mm            │
│                          │                                  │
│  AI: "Height?"          │  💰 COST BREAKDOWN              │
│                          │  Hardware: $2,000,000          │
│  [User types: 20 ft]    │  Structural: $400,000           │
│                          │  Labor: $600,000                │
│  [Instant update ↓]     │  Total: $3,000,000              │
│                          │                                  │
│  AI: "Indoor or         │  [Generate Excel] [Download PDF]│
│  outdoor?"              │                                  │
│                          │                                  │
│  [User: Outdoor]        │                                  │
│                          │                                  │
│  [... more questions]   │                                  │
│                          │                                  │
│  AI: [Full proposal]    │  [Full proposal updates]         │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 🔧 WHAT TO BUILD

### **PART 1: Create a Live Preview Slider Component**

**File:** `frontend/src/components/ProposalPreviewSlider.tsx`

```typescript
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';

interface ProposalPreviewSliderProps {
  quoteData: {
    width?: number;
    height?: number;
    environment?: string;
    pixelPitch?: string;
    clientName?: string;
    screenArea?: number;
    hardwareCost?: number;
    structuralCost?: number;
    laborCost?: number;
    totalCost?: number;
    finalPrice?: number;
  };
  isOpen: boolean;
  onToggle: () => void;
  onGenerateExcel: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  isGenerating: boolean;
}

export const ProposalPreviewSlider: React.FC<ProposalPreviewSliderProps> = ({
  quoteData,
  isOpen,
  onToggle,
  onGenerateExcel,
  onDownloadPdf,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'pricing'>('specs');

  return (
    <div
      className={`fixed right-0 top-0 bottom-0 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 z-40 ${
        isOpen ? 'w-96' : 'w-0'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -left-10 top-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-lg"
        title={isOpen ? 'Close preview' : 'Open preview'}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {isOpen && (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 border-b">
            <h3 className="font-bold text-lg">📋 Proposal Preview</h3>
            <p className="text-sm text-blue-100">
              {quoteData.clientName || 'Unnamed Project'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'specs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'pricing'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pricing
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'specs' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Display Dimensions
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.width && quoteData.height
                      ? `${quoteData.width} × ${quoteData.height} ft`
                      : '—'}
                  </p>
                  {quoteData.screenArea && (
                    <p className="text-sm text-gray-600">
                      ({quoteData.screenArea} sq ft)
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Environment
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.environment || '—'}
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Pixel Pitch
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.pixelPitch || '—'} mm
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Hardware Cost
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.hardwareCost
                      ? `$${quoteData.hardwareCost.toLocaleString()}`
                      : '—'}
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Structural Materials
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.structuralCost
                      ? `$${quoteData.structuralCost.toLocaleString()}`
                      : '—'}
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Labor Cost
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.laborCost
                      ? `$${quoteData.laborCost.toLocaleString()}`
                      : '—'}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <label className="text-xs uppercase text-gray-500 font-semibold">
                    Total Cost Basis
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {quoteData.totalCost
                      ? `$${quoteData.totalCost.toLocaleString()}`
                      : '—'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <label className="text-xs uppercase text-blue-700 font-semibold">
                    Client Price (30% margin)
                  </label>
                  <p className="text-2xl font-bold text-blue-900">
                    {quoteData.finalPrice
                      ? `$${quoteData.finalPrice.toLocaleString()}`
                      : '—'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t p-4 space-y-2 bg-gray-50">
            <button
              onClick={onGenerateExcel}
              disabled={isGenerating || !quoteData.finalPrice}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              {isGenerating ? 'Generating...' : 'Generate Excel'}
            </button>

            <button
              onClick={onDownloadPdf}
              disabled={isGenerating || !quoteData.finalPrice}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### **PART 2: Update Chat Component to Track Quote Data**

**File:** `frontend/src/components/Chat/ChatInterface.tsx`

Add this state at the top of your chat component:

```typescript
import { ProposalPreviewSlider } from '../ProposalPreviewSlider';

const ChatInterface = () => {
  // ... existing state ...

  // NEW: Live quote data
  const [quoteData, setQuoteData] = useState({
    width: undefined,
    height: undefined,
    environment: undefined,
    pixelPitch: undefined,
    clientName: undefined,
    screenArea: undefined,
    hardwareCost: undefined,
    structuralCost: undefined,
    laborCost: undefined,
    totalCost: undefined,
    finalPrice: undefined,
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // NEW: Parse AI responses to extract data
  const extractQuoteData = (userMessage: string, assistantMessage: string) => {
    // Pattern 1: Width
    const widthMatch = userMessage.match(/(\d+)\s*(?:ft|feet|x)/i);
    if (widthMatch) {
      setQuoteData(prev => ({
        ...prev,
        width: parseInt(widthMatch[1]),
      }));
    }

    // Pattern 2: Height (after "x")
    const heightMatch = userMessage.match(/x\s*(\d+)/i);
    if (heightMatch) {
      setQuoteData(prev => ({
        ...prev,
        height: parseInt(heightMatch[1]),
        screenArea: (prev.width || 0) * parseInt(heightMatch[1]),
      }));
    }

    // Pattern 3: Environment
    if (/outdoor/i.test(userMessage)) {
      setQuoteData(prev => ({ ...prev, environment: 'Outdoor' }));
    }
    if (/indoor/i.test(userMessage)) {
      setQuoteData(prev => ({ ...prev, environment: 'Indoor' }));
    }

    // Pattern 4: Pixel Pitch
    const pitchMatch = userMessage.match(/(\d+\.?\d*)\s*mm/i);
    if (pitchMatch) {
      setQuoteData(prev => ({ ...prev, pixelPitch: pitchMatch[1] }));
    }

    // Pattern 5: Client Name
    const nameMatch = userMessage.match(/(?:for|client|company|stadium):\s*([A-Za-z\s]+)/i);
    if (nameMatch) {
      setQuoteData(prev => ({ ...prev, clientName: nameMatch[1].trim() }));
    }
  };

  // NEW: When user sends a message, extract data and open slider
  const handleSendMessage = async (message: string) => {
    extractQuoteData(message, ''); // Parse immediately
    setPreviewOpen(true); // Auto-open slider

    // ... existing send logic ...
  };

  // NEW: Generate Excel handler
  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/workspace/${slug}/generate-proposal`,
        {
          method: 'POST',
          headers: baseHeaders(),
          body: JSON.stringify({
            width: quoteData.width,
            height: quoteData.height,
            pixelPitch: quoteData.pixelPitch,
            environment: quoteData.environment,
            clientName: quoteData.clientName || 'Unnamed Project',
            margin: 0.30, // Default 30% margin
            // Add other required fields
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Download Excel
        window.location.href = data.files.excel.downloadUrl;

        // Show success message
        showNotification(`Excel audit generated: ${data.files.excel.filename}`);
      }
    } catch (error) {
      showNotification('Error generating Excel', 'error');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // NEW: Download PDF handler
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/workspace/${slug}/generate-proposal`,
        {
          method: 'POST',
          headers: baseHeaders(),
          body: JSON.stringify({
            width: quoteData.width,
            height: quoteData.height,
            pixelPitch: quoteData.pixelPitch,
            environment: quoteData.environment,
            clientName: quoteData.clientName || 'Unnamed Project',
            margin: 0.30,
            // Add other required fields
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.files.pdf) {
        // Download PDF
        window.location.href = data.files.pdf.downloadUrl;

        // Show success message
        showNotification(`PDF proposal downloaded: ${data.files.pdf.filename}`);
      }
    } catch (error) {
      showNotification('Error downloading PDF', 'error');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat Panel (left) */}
      <div className="flex-1 flex flex-col">
        {/* Your existing chat UI */}
      </div>

      {/* Live Preview Slider (right) */}
      <ProposalPreviewSlider
        quoteData={quoteData}
        isOpen={previewOpen}
        onToggle={() => setPreviewOpen(!previewOpen)}
        onGenerateExcel={handleGenerateExcel}
        onDownloadPdf={handleDownloadPdf}
        isGenerating={isGenerating}
      />
    </div>
  );
};
```

---

### **PART 3: System Prompt (You Already Have This)**

Your `ANC_SYSTEM_PROMPT.md` stays the same. AI asks ONE question at a time.

---

## 🔄 THE FLOW

```
1. User: "I need a 40x20 outdoor LED scoreboard"
   ↓
   Chat parses: width=40, height=20, environment=outdoor
   Slider opens automatically (or user clicks to open)
   Slider shows: "Width: 40 ft | Height: 20 ft | Environment: Outdoor"

2. AI: "What's your preferred pixel pitch?"
   ↓
   User: "10mm"
   Chat parses: pixelPitch=10mm
   Slider updates: "Pixel Pitch: 10mm"

3. AI: "New installation or upgrade?"
   ↓
   User: "New"
   [Slider has all critical data]

4. [Slider shows live cost breakdown from AncPricingEngine]
   ↓
   User clicks: "Generate Excel"
   Backend generates both files
   Excel downloads

5. User clicks: "Download PDF"
   PDF downloads with ANC branding
   ✅ DONE
```

---

## 📋 BUILD CHECKLIST

- [ ] Create `ProposalPreviewSlider.tsx` component
- [ ] Add state to ChatInterface (quoteData, previewOpen, isGenerating)
- [ ] Add extractQuoteData function with regex patterns
- [ ] Add handleGenerateExcel function
- [ ] Add handleDownloadPdf function
- [ ] Import and render ProposalPreviewSlider in chat component
- [ ] Update system prompt (already done)
- [ ] Test with your test data
- [ ] Deploy to EasyPanel

---

## 🚀 READY?

This is the EXACT solution. No split screen (like demo), no BlockSuite (you don't need it), just:
- Clean chat interface
- Live preview slider on the right
- Download buttons when you have data
- Two files: Excel + PDF

Should I start building this now, or do you need clarification?
