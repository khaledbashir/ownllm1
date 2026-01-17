# Implementation Strategy: ANC Proposal Engine for OwnLLM1

Based on demo project analysis, here's what to build for your system.

---

## 🎯 THE LOGIC WE LEARNED

From the demo project, the core pattern is:

1. **Left Panel** = Conversational AI asking questions
2. **Live Updates** = As user answers, preview on right updates in real-time
3. **Contextual Buttons** = System detects what's needed and renders buttons
4. **File Generation** = Backend endpoints generate Excel & PDF on-demand
5. **Direct Downloads** = Files download immediately to browser
6. **Real-time Recalculation** = Each answer updates pricing instantly

---

## 🏗️ HOW THIS APPLIES TO OWNLLM1 (OUR VERSION)

Since you already have:
- ✅ Chat interface
- ✅ BlockSuite editor
- ✅ proposals.js endpoint
- ✅ AncPricingEngine.js pricing

Your workflow should be:

### **Phase 1: Conversational Collection** (Chat Left Panel)
```
User: "I need a 40x20 outdoor LED scoreboard"
AI (ONE QUESTION): "Got it. What's your viewing distance? (helps determine pixel pitch)"
User: "150 feet from bleachers"
AI (NEXT QUESTION): "Is this a new installation or an upgrade?"
User: "New installation"
AI (NEXT QUESTION): "Do you need full installation service?"
... continues until all 11-15 fields filled
```

### **Phase 2: Generate Proposal Preview** (Still in Chat)
```
AI: [Generates the Proposal Preview Text with all specs & costs]
AI: "Ready to generate the audit? Click the button below."

[BUTTON: "Generate Excel Audit"] <- Appears in chat or below
```

### **Phase 3: Excel Downloads**
```
User clicks [Generate Excel Audit]
Backend calls /workspace/:slug/generate-proposal
Excel downloads immediately with loading state
```

### **Phase 4: Insert into BlockSuite**
```
User manually copies the proposal preview text from chat
Pastes into BlockSuite editor
Text appears as markdown/block in editor
```

### **Phase 5: PDF Download from BlockSuite**
```
User clicks PDF download in BlockSuite editor
[OR: Separate button "Download Client PDF" in chat]
PDF downloads with ANC branding
```

---

## 🔧 WHAT TO BUILD

### **COMPONENT 1: Chat Handler for "Generate Excel" Button**

**Location**: `frontend/src/components/CPQWizard/ChatInterface.tsx`

```typescript
// When AI response contains proposal preview text, show button
{proposalPreviewGenerated && (
  <button 
    onClick={handleGenerateExcel}
    disabled={isGenerating}
    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
  >
    {isGenerating ? "Generating..." : "Generate Excel Audit"}
  </button>
)}

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
          clientName: quoteData.clientName,
          // ... all other fields
        })
      }
    );
    
    const data = await response.json();
    
    // Download Excel
    window.open(data.files.excel.downloadUrl, '_blank');
    
    // Show toast
    showNotification(`Excel audit ready: ${data.files.excel.filename}`);
  } finally {
    setIsGenerating(false);
  }
};
```

### **COMPONENT 2: Detection of "Proposal Complete"**

The AI should output the proposal preview text in a specific format so your UI knows to show the button:

```markdown
## 📋 ANC Proposal Preview: [Client Name] — [Project Name]
### System Specifications
- **Display Dimensions:** 40 × 20 feet (800 sq ft)
...
### Next Steps
**Click [Generate Excel Audit]** → Review...
```

When chat detects this pattern, it renders the button below the message.

### **COMPONENT 3: Backend Endpoint** (Already Created ✅)

Your `/server/endpoints/proposals.js` already does:
- Calculate pricing via AncPricingEngine
- Generate Excel with formulas
- Generate PDF (if you have ancPdfExport.js)
- Return download URLs

**No changes needed here.**

### **COMPONENT 4: BlockSuite Text Insertion**

User manually copies proposal text and pastes into BlockSuite.

To make it easier, you could add a button:

```typescript
<button 
  onClick={() => copyToClipboard(proposalPreviewText)}
  className="text-sm text-gray-500 hover:text-gray-700"
>
  📋 Copy for BlockSuite
</button>
```

### **COMPONENT 5: PDF Download from BlockSuite**

**Option A: Separate Button in Chat**
```typescript
<button 
  onClick={handleDownloadClientPDF}
  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
>
  Download Client PDF
</button>
```

**Option B: BlockSuite Editor Extension**
- Add a "Download PDF" button in BlockSuite toolbar
- When text is selected, allow PDF export
- Calls the same endpoint or a PDF generation function

---

## 📋 IMPLEMENTATION CHECKLIST

### **PHASE 1: Adaptive Questions in Chat** (2-3 hours)
- [ ] Update system prompt to ask ONE question at a time
- [ ] Track extracted fields in state
- [ ] Skip already-answered questions
- [ ] Detect when all critical fields are filled

### **PHASE 2: Proposal Preview Text Generation** (1 hour)
- [ ] AI generates formatted proposal preview (use template from ANC_SYSTEM_PROMPT.md)
- [ ] Format detection in chat UI (look for "## 📋 ANC Proposal Preview")
- [ ] Show button when pattern detected

### **PHASE 3: Excel Generation Button** (2 hours)
- [ ] Add click handler in chat component
- [ ] Call proposals endpoint with quote data
- [ ] Handle loading/error states
- [ ] Trigger download
- [ ] Show success toast

### **PHASE 4: Copy to BlockSuite Helper** (30 mins)
- [ ] Add "Copy for BlockSuite" button next to proposal text
- [ ] Copy proposal text to clipboard
- [ ] Show "Copied!" feedback

### **PHASE 5: PDF Download** (1-2 hours)
- [ ] Option A: Separate "Download PDF" button in chat
- [ ] Option B: BlockSuite editor button (requires extension)
- [ ] Call endpoint to generate PDF
- [ ] Trigger download

### **PHASE 6: Testing** (2 hours)
- [ ] Test Q&A flow with adaptive questions
- [ ] Test Excel generation and download
- [ ] Test PDF generation and download
- [ ] Test with BlockSuite insertion
- [ ] Verify formulas in Excel
- [ ] Verify branding in PDF

---

## 🚀 EXACT SEQUENCE (What User Will Do)

```
1. User: "I need a 40x20 outdoor LED scoreboard for a stadium"
2. AI: "Great! What's the viewing distance from the scoreboard? (helps me recommend pixel pitch)"
3. User: "About 150 feet"
4. AI: "Perfect. Is this a new installation or a replacement?"
5. User: "New installation"
6. AI: "Do you need full installation service or self-install?"
7. User: "Full installation"
8. AI: [continues asking remaining fields one at a time]
... [after 10-12 questions total] ...
9. AI: [Generates and displays Proposal Preview Text]
   Then: "Ready to get the detailed audit? Click the button below."
10. User clicks: [Generate Excel Audit]
11. System: Generates Excel file and downloads it
12. AI: "Excel downloaded! Copy the proposal text above and paste it into BlockSuite."
13. User: Copies proposal preview text
14. User: Opens BlockSuite editor, pastes text
15. User: In BlockSuite, clicks [Download Client PDF]
16. System: Generates and downloads branded PDF
17. User: Has both Excel (internal) and PDF (client-facing) ✅
```

---

## 📦 FILES TO MODIFY/CREATE

**Frontend Changes:**
- [ ] `frontend/src/components/CPQWizard/ChatInterface.tsx` - Add button handler
- [ ] `frontend/src/models/workspace.js` - Add generateProposal method (if not exists)
- [ ] `frontend/src/utils/clipboard.ts` (new) - Copy helper

**Backend Changes:**
- [x] `server/endpoints/proposals.js` - ✅ ALREADY DONE
- [x] `server/index.js` - ✅ ALREADY REGISTERED

**System Prompt:**
- [x] `ANC_SYSTEM_PROMPT.md` - ✅ ALREADY CREATED

---

## 🔑 KEY DIFFERENCES FROM DEMO

| Demo Project | OwnLLM1 Version |
|---|---|
| Live Preview panel on right | Proposal text in chat |
| All-in-one data extraction | One question at a time, adaptive |
| Custom React Preview | BlockSuite editor for insertion |
| Buttons in Preview toolbar | Buttons in chat interface |
| Real-time price recalculation | Static price after all Qs answered |
| Internal file storage | Direct browser download |

---

## ✅ READY TO BUILD?

Once you confirm this approach is correct, I can:

1. Wire the button in ChatInterface
2. Add the handler function
3. Test with your test data (P001-P004)
4. Verify Excel downloads with formulas
5. Verify PDF downloads with branding

Should I start building?
