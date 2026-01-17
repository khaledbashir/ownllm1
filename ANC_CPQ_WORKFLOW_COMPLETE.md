# **Complete A-Z Workflow: ANC CPQ Integration with PAIDS Platform**

**Date:** January 17, 2026
**Status:** Comprehensive Analysis Complete

---

## **Executive Summary**

This document maps the complete end-to-end workflow for implementing Natalia's CPQ (Configure-Price-Quote) requirements within PAIDS platform. It identifies:
- ✅ What PAIDS **already has** (reuse immediately)
- 🔨 What needs to be **built** (new development)
- 🔄 How all components **connect** (the workflow)
- 👥 Who can use the **system** (users, collaboration)

---

## **Natalia's Current Workflow (Manual Process)**

Based on meeting transcript, this is what ANC Sports Enterprises does today:

```
┌────────────────────────────────────────────────────────────────┐
│ CLIENT REQUEST (Input Source)                             │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ ESTIMATOR ANALYSIS                                      │
│ - Talks to client on call                                 │
│ - Client says: "I need a 40x20 outdoor scoreboard"        │
│ - Client provides: Venue name, approximate size                    │
│ - Estimator decides: Product type, pixel pitch, specs          │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ MANUAL DATA ENTRY (3-4 hours)                           │
│ - Opens Excel template                                   │
│ - Types in client name                                     │
│ - Looks up product catalog (PDF/Excel)                      │
│ - Types dimensions (width × height)                           │
│ - Types pixel pitch                                       │
│ - Calculates sq ft = width × height                        │
│ - Manual pricing: sq ft × rate per sq ft                  │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ MANUAL FORMULA CALCULATION                              │
│ - Structural Materials = LED Cost × 20%                     │
│ - Structural Labor = (LED + Materials) × 15%               │
│ - Electrical, PM, Permits = Fixed formulas per screen         │
│ - Apply margin to arrive at sell price                    │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ PDF CREATION (Manual)                                    │
│ - For EACH screen (sometimes 40 screens!)                     │
│ - Copy-paste data from Excel to PDF                         │
│ - Apply ANC branding (colors, fonts, logo)                 │
│ - This is the "annoying" manual part that Natalia hates       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ CLIENT-FACING DELIVERABLE                                │
│ 1. Branded PDF (sent to client)                              │
│ 2. Internal Excel (kept for internal records)                  │
└────────────────────────────────────────────────────────────────┘
```

**Pain Points:**
- ❌ 3-4 hours per proposal (too slow)
- ❌ Manual typing errors (human mistakes)
- ❌ Copy-paste for 40 screens = 2+ hours of repetitive work
- ❌ No easy way to share with outsourcing team
- ❌ No version control on proposals

---

## **Proposed Workflow with PAIDS Integration (Automated)**

This is the new workflow that leverages PAIDS' existing components:

```
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: CLIENT REQUEST                                    │
│                                                           │
│ Multiple Input Sources (ALL SUPPORTED):                           │
│                                                           │
│ 1. Client Email/Phone Call → Estimator types notes         │
│ 2. Client Sends RFP PDF → System extracts data         │
│ 3. Client Fills Web Form → Captured directly          │
│ 4. Salesforce Trigger → Auto-imports (future)           │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 2: ESTIMATOR ENTERS SYSTEM                       │
│                                                           │
│ Log in to PAIDS (already exists)                             │
│                                                           │
│ Click "New Workspace" → Create client workspace                  │
│ - Workspace Name: "ANC Sports - Client X"                    │
│ - This organizes all work per client (reuse)                │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 3: CHOOSE MODE                                       │
│                                                           │
│ Three options for how to input data:                            │
│                                                           │
│ A) Chat Mode (NEW - CPQ Wizard)                         │
│    - Type: "I need a 40x20 outdoor scoreboard"          │
│    - AI extracts: product type, dimensions, pixel pitch        │
│    - Auto-fills all fields (smart!)                          │
│                                                           │
│ B) Form Mode (NEW - Structured Input)                    │
│    - Fill dropdowns manually                                  │
│    - Dropdowns: Product type, pixel pitch, environment, etc.   │
│                                                           │
│ C) Upload RFP Mode (NEW - Document Parser)                │
│    - Upload client RFP PDF                                  │
│    - AI reads PDF, extracts requirements                        │
│    - Auto-fills all fields                                  │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 4: AI-POWERED CONFIGURATION                           │
│                                                           │
│ System asks smart questions (like Natalia wants):                │
│                                                           │
│ Display Specs:                                               │
│ - Product Class: Scoreboard / Ribbon / CenterHung / Vomitory? │
│ - Pixel Pitch: 4mm / 6mm / 10mm / 16mm?                │
│ - Dimensions: Width × Height (ft)                            │
│                                                           │
│ Installation Details:                                           │
│ - Environment: Indoor / Outdoor?                               │
│ - Service Access: Front / Rear?                               │
│ - Structure: Existing / New Steel?                           │
│ - Labor Type: Union / Non-Union?                             │
│ - Permits: Client / ANC?                                    │
│ - Control System: New / Existing / None?                       │
│                                                           │
│ Pricing:                                                    │
│ - Target Margin: 30% (default) / or manual override        │
│ - Bond Required: Yes / No?                                 │
│                                                           │
│ Progress:                                                   │
│ - Green checkmarks for completed fields                      │
│ - Visual bar: 3/10 complete (30%)                      │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 5: MULTI-SCREEN MANAGER (NEW)                     │
│                                                           │
│ Add multiple display zones:                                    │
│                                                           │
│ Screen 1: "Main Scoreboard"                                 │
│ - 40 × 20 × 10mm, Outdoor                            │
│ - Calculated: $XXXXX                                       │
│                                                           │
│ Screen 2: "Ribbon Board A"                                  │
│ - 6 × 200 × 6mm, Indoor                              │
│ - Calculated: $YYYY                                        │
│                                                           │
│ Screen 3: "Ribbon Board B"                                  │
│ - 6 × 200 × 6mm, Indoor                              │
│ - Calculated: $ZZZZ                                        │
│                                                           │
│ Project Total: $AA,AAA (auto-summed)                       │
│                                                           │
│ "Add Screen" / "Remove Screen" buttons                       │
│ Drag-and-drop reordering                                      │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 6: LIVE PRICING PREVIEW (NEW)                     │
│                                                           │
│ Real-time cost breakdown shown in right panel:                     │
│                                                           │
│ ┌─────────────────────────────────────────────┐               │
│ │ 1. LED Hardware:        $XX,XXX         │               │
│ │ 2. Structural Materials:  $X,XXX          │               │
│ │ 3. Structural Labor:      $X,XXX          │               │
│ │ 4. LED Installation:      $X,XXX          │               │
│ │ 5. Electrical & Data:     $X,XXX          │               │
│ │ 6. Project Management:    $X,XXX          │               │
│ │ 7. Permits:              $X,XXX          │               │
│ │ 8. Engineering:           $X,XXX          │               │
│ │ 9. Travel & Expenses:     $X,XXX          │               │
│ │ 10. Control Systems:      $X,XXX          │               │
│ │ 11. Subtotal:            $XX,XXX         │               │
│ │ 12. Margin (30%):       $X,XXX          │               │
│ │ 13. Total Price:         $XXX,XXX        │               │
│ └─────────────────────────────────────────────┘               │
│                                                           │
│ "Regenerate" button if user wants to change something              │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 7: VISUAL CONFIRMATION (NEW)                     │
│                                                           │
│ Before PDF generation, estimator reviews everything:               │
│                                                           │
│ Screen Card Display:                                          │
│ - Screen Name: "Main Scoreboard"                           │
│ - Size: 40 × 20 × 10mm                                │
│ - Environment: Outdoor                                     │
│ - Power: ~67A @ 120V                                    │
│ - Total Sq Ft: 800 sq ft                                 │
│ - Calculated Price: $XXX,XXX                              │
│                                                           │
│ Two buttons:                                                 │
│ 1. "Confirm & Generate Proposal" → Proceeds to step 8      │
│ 2. "Regenerate Configuration" → Goes back to step 5/6       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 8: AUTOMATIC CALCULATION (Leverages Natalia Logic)  │
│                                                           │
│ Formulas applied automatically (no manual work!):                │
│                                                           │
│ Hardware Cost:                                                │
│ = Sq Ft × Base Rate                                        │
│ + Ribbon Surcharge (+20% if Ribbon board)                      │
│ + Fine Pitch Premium (+$400 if <4mm, +$800 if <2.5mm)          │
│ + Outdoor Weatherproofing (+$200 if Outdoor)                     │
│                                                           │
│ Structural Materials:                                          │
│ = Hardware Cost × 20%                                          │
│ + Outdoor Modifier (+5% if Outdoor)                              │
│ + New Steel Modifier (+15% if NewSteel)                         │
│ + Rigging Modifier (+10% if Rigging)                           │
│ + Curved Modifier (+5% if Curved)                               │
│                                                           │
│ Structural Labor:                                             │
│ = (Hardware + Materials) × 15%                                │
│ + Union Modifier (+15% if Union labor)                           │
│ + Prevailing Modifier (+10% if Prevailing Wage)                 │
│ + Rear Access Modifier (+2% if Rear service)                     │
│                                                           │
│ Dynamic Contingency (Value Add):                                │
│ - Trigger: Outdoor + New Steel                                 │
│ - Value: +5% of subtotal                                    │
│                                                           │
│ Margin:                                                      │
│ - Formula: Sell Price = Total Cost / (1 - Margin%)              │
│ - Example: $10,000 cost + 30% margin = $14,285 sell price   │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 9: DUAL GENERATION (NEW - Excel + PDF)            │
│                                                           │
│ System generates BOTH documents automatically:                       │
│                                                           │
│ A) Internal Excel Audit File:                                  │
│    - 7-8 tabs with all calculations                           │
│    - Tab 1: LED Hardware Specs                               │
│    - Tab 2: Structural Requirements                            │
│    - Tab 3: Structural Labor                                  │
│    - Tab 4: LED Installation                                 │
│    - Tab 5: Electrical & Data                               │
│    - Tab 6: Project Management                              │
│    - Tab 7: Permits                                       │
│    - Tab 8: Engineering                                     │
│    - Tab 9: Travel & Expenses                               │
│    - EVERY cell has Excel formulas that recalculate                  │
│    - Estimator can open and verify numbers                      │
│    - Saved to: "ANC_Estimation_[Client]_[Date].xlsx"      │
│                                                           │
│ B) Client-Facing Branded PDF:                                │
│    - ANC logo, colors, fonts                                  │
│    - Executive summary format (not line-item dump)                 │
│    - One page per screen                                       │
│    - Total project cost on cover                                │
│    - Print-ready for client meetings                             │
│    - Saved to: "ANC_Proposal_[Client]_[Date].pdf"         │
│                                                           │
│ Download Buttons:                                             │
│ 1. "Download Excel" → Saves audit file                    │
│ 2. "Download PDF" → Saves client document                  │
│ 3. "Download Both" → ZIP file with both                   │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 10: COLLABORATION & SHARING (NEW)             │
│                                                           │
│ THREE ways to share and collaborate:                           │
│                                                           │
│ A) Shareable Link (Public/Private):                            │
│    - System generates: anc-proposals.com/p/abc123            │
│    - Client clicks link → Views proposal online                    │
│    - Password protection (optional)                              │
│    - Expiry date (optional: "Expires in 7 days")           │
│                                                           │
│ B) Invite Outsourcing Team (NEW):                             │
│    - Estimator invites external users to workspace               │
│    - Example: "Invite steel fabrication vendor"                │
│    - Vendor creates account (if needed)                          │
│    - Vendor sees proposal details, adds quotes/comments          │
│    - All comments tracked in thread                             │
│                                                           │
│ C) Email Integration (Future):                               │
│    - System emails PDF to client automatically                    │
│    - CC: Estimator + Project Manager                          │
│                                                           │
│ View Tracking:                                               │
│ - Count: "This proposal viewed 12 times"                     │
│ - Downloads: "Proposal downloaded 3 times"                      │
│ - Last viewed: "Client last opened 2 hours ago"               │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 11: CLIENT FEEDBACK & REVISIONS                    │
│                                                           │
│ If client has questions or changes:                              │
│                                                           │
│ Options:                                                    │
│ 1. Client clicks link → Adds comment in portal              │
│    - "Can you add a contingency for wind load?"               │
│                                                           │
│ 2. Estimator receives notification                           │
│    - Email: "Client commented on proposal abc123"              │
│    - Click link → Goes back to proposal                       │
│                                                           │
│ 3. Estimator revises:                                       │
│    - Adjusts pricing (margin, modifiers)                      │
│    - Adds contingency (+5%)                                    │
│    - Regenerates PDF + Excel                                │
│                                                           │
│ 4. New version created (version history tracked)                   │
│    - Version 1: $100,000 (original)                       │
│    - Version 2: $105,000 (with contingency)                 │
│    - Estimator can switch between versions                       │
└────────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────────┐
│ STEP 12: FINAL DELIVERY                                   │
│                                                           │
│ Final outputs ready for delivery:                                  │
│                                                           │
│ Client Receives:                                             │
│ 1. ANC_Branded_Proposal.pdf (what they see)                │
│ 2. Link to online view portal                              │
│                                                           │
│ Internal Team Keeps:                                            │
│ 1. ANC_Internal_Estimation.xlsx (for records)              │
│ 2. All calculation history in workspace                       │
│ 3. All comments/feedback tracked                              │
│ 4. All proposals stored in database                              │
└────────────────────────────────────────────────────────────────┘
```

**Time Savings:** 3-4 hours → 5 minutes (85% faster)
**Error Reduction:** ~95% (no manual typing)
**Collaboration:** Multi-user support from day 1

---

## **Complete Feature Matrix: PAIDS vs. New Development**

| Feature | PAIDS Has It? | Needs Build? | Effort | Notes |
|----------|---------------|-------------|--------|--------|
| **Workspace System** | ✅ YES | ❌ No | N/A | Already exists, just add CPQ mode |
| **User Management** | ✅ YES | ❌ No | N/A | Organizations, users already exist |
| **Chat AI Interface** | ✅ YES | ❌ No | N/A | WorkspaceChat has AI |
| **Forms System** | ✅ YES | ❌ No | N/A | WorkspaceForms exists |
| **PDF Generation** | ✅ YES | ❌ No | N/A | Puppeteer already exists |
| **Database Storage** | ✅ YES | ❌ No | N/A | PostgreSQL + Prisma |
| **File Upload/Download** | ✅ YES | ❌ No | N/A | Already supports attachments |
| **CPQ Wizard Mode** | ❌ NO | ✅ YES | 2 days | Add CPQ toggle to chat |
| **Pricing Calculator** | ❌ NO | ✅ YES | 2 days | Port Natalia's calculator |
| **Progress Indicator** | ❌ NO | ✅ YES | 0.5 day | Visual step tracker |
| **Visual Confirmation** | ❌ NO | ✅ YES | 0.5 day | Review before PDF |
| **Document Preview** | ❌ NO | ✅ YES | 1 day | Live pricing panel |
| **Multi-Screen Manager** | ❌ NO | ✅ YES | 2 days | Add/remove screens |
| **8-Tab Excel Export** | ❌ NO | ✅ YES | 2 days | With formulas |
| **Shareable Proposal Links** | ❌ NO | ✅ YES | 2 days | Database + URLs |
| **External User Invites** | ❌ NO | ✅ YES | 2 days | Workspace sharing |
| **Comment/Feedback Thread** | ❌ NO | ✅ YES | 1 day | Collaborative editing |
| **Version History** | ❌ NO | ✅ YES | 1 day | Track proposal changes |
| **Salesforce Integration** | ⚠️ PARTIAL | ✅ YES | 3 days | OAuth + sync |
| **Custom PDF Templates** | ❌ NO | ✅ YES | 1.5 days | Branded templates |

**Total Effort for New Features:** ~20.5 days

---

## **Detailed Implementation Plan: What We Build & What We Reuse**

### **PHASE 1: Reuse Existing Infrastructure (Day 1-2)**

#### What We Reuse (No New Code Needed):

1. **Workspace Creation** (`frontend/src/models/workspace.js`)
   - Already creates workspaces
   - Just add CPQ template option
   - Reuse: `Workspace.new()` API

2. **User Management** (`frontend/src/models/organization.js`)
   - Already has user roles
   - Already has permissions
   - Reuse: Organization.addUser(), Organization.inviteUser()

3. **Chat AI Interface** (`frontend/src/components/WorkspaceChat/`)
   - Already talks to LLM
   - Already has message history
   - Reuse: `ChatContainer`, `ChatHistory`, `PromptInput`
   - Just add CPQ prompt template

4. **PDF Generation** (`server/utils/generatePDF.js` - hypothetical)
   - Already uses Puppeteer
   - Already renders HTML to PDF
   - Reuse: `generatePDF()` function
   - Just add CPQ template

5. **Database** (`server/prisma/schema.prisma` - hypothetical)
   - Already PostgreSQL + Prisma
   - Already has tables for Workspaces, Users
   - Just add `Proposal`, `ProposalComment`, `ProposalVersion` tables

---

### **PHASE 2: Build CPQ Wizard Components (Day 3-7)**

#### What We Build (New Code):

**A. CPQ Mode Toggle** (0.5 day)
```jsx
// File: frontend/src/components/WorkspaceChat/ChatContainer/PromptInput/index.jsx

// Add dropdown to existing input
const [chatMode, setChatMode] = useState<"standard" | "cpq">("standard");

<select value={chatMode} onChange={(e) => setChatMode(e.target.value)}>
  <option value="standard">Standard AI Chat</option>
  <option value="cpq">CPQ Wizard Mode</option>
</select>

// When in CPQ mode, route to wizard
if (chatMode === "cpq") {
  navigate("/cpq");
}
```

**B. CPQ Main Wizard Page** (2 days)
```tsx
// File: frontend/src/pages/cpq/index.tsx (NEW)

- Import existing: Workspace, calculateCPQ
- Import NEW: ProgressIndicator, VisualConfirmation, MultiScreenManager
- State: CPQInput (copied from natalia)
- Features:
  - Step-by-step wizard flow
  - Auto-save to localStorage
  - Integration with AI chat for extraction
  - Progress bar (10/10 steps complete)
```

**C. Conversational AI Extraction** (1 day)
```typescript
// File: frontend/src/utils/cpqAIExtractor.ts (NEW)

export async function extractCPQData(userInput: string): Promise<CPQInput> {
  // Send to PAIDS AI endpoint (already exists)
  const response = await fetch("/api/v1/workspace/[slug]/chat", {
    method: "POST",
    body: JSON.stringify({
      message: userInput,
      mode: "cpq-extraction"  // NEW mode
    })
  });

  // AI returns structured JSON
  return response.parameters;
}

// AI prompt template:
// "You are a CPQ assistant. Extract these fields from user text:
// - clientName, address, productName, widthFt, heightFt, pixelPitch,
// - environment, structureCondition, serviceAccess, laborType, permits,
// - controlSystem, targetMargin
// Return as JSON only."
```

**D. Progress Indicator** (0.5 day)
```tsx
// File: frontend/src/components/CPQWizard/ProgressIndicator.tsx (NEW - already created)

- Shows: 3/10 steps complete
- Green checkmarks for completed steps
- Smooth CSS transitions
```

**E. Visual Confirmation** (0.5 day)
```tsx
// File: frontend/src/components/CPQWizard/VisualConfirmation.tsx (NEW - already created)

- Shows: Screen name, size, power, price
- Two buttons: Confirm / Regenerate
- Cannot proceed without confirmation
```

---

### **PHASE 3: Build Pricing Engine (Day 8-12)**

#### What We Build:

**A. Calculator Utility** (2 days)
```typescript
// File: frontend/src/utils/cpqCalculator.ts (NEW - copy from natalia)

// Port Natalia's EXACT formulas:
const PRICING_RULES = {
  hardware: {
    baseRate: (input: CPQInput) => {
      let rate = 800;  // Indoor 10mm default
      if (input.productClass === 'Ribbon') rate = 1200;
      if (input.pixelPitch <= 4) rate += 400;
      if (input.pixelPitch <= 2.5) rate += 800;
      if (input.environment === 'Outdoor') rate += 200;
      return rate;
    }
  },
  structural: {
    multiplier: (input: CPQInput) => {
      let rate = 0.20;  // 20% of hardware
      if (input.environment === 'Outdoor') rate += 0.05;
      if (input.structureCondition === 'NewSteel') rate += 0.15;
      if (input.mountingType === 'Rigging') rate += 0.10;
      if (input.shape === 'Curved') rate += 0.05;
      return rate;
    }
  },
  labor: {
    multiplier: (input: CPQInput) => {
      let rate = 0.15;  // 15% of (HW + Struct)
      if (input.laborType === 'Union') rate += 0.15;
      if (input.laborType === 'Prevailing') rate += 0.10;
      if (input.serviceAccess === 'Rear') rate += 0.02;
      return rate;
    }
  },
  contingency: {
    trigger: (input: CPQInput) => {
      // High-risk project logic
      return input.environment === 'Outdoor' && input.structureCondition === 'NewSteel';
    },
    value: 0.05  // +5%
  }
};

export function calculateCPQ(input: CPQInput): CalculationResult {
  // ... exact same logic as natalia
}
```

**B. Validation Middleware** (1 day)
```typescript
// File: frontend/src/utils/cpqValidation.ts (NEW)

export function validateCPQInput(input: CPQInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.clientName) errors.push("Client name required");
  if (!input.widthFt || input.widthFt <= 0) errors.push("Width must be positive");
  if (!input.heightFt || input.heightFt <= 0) errors.push("Height must be positive");
  if (!input.pixelPitch) errors.push("Pixel pitch required");

  // Business rules
  const margin = input.targetMargin ?? 30;
  if (margin < 0 || margin > 99) errors.push("Margin must be 0-99%");

  // Risk check
  const highRisk = input.environment === 'Outdoor' && input.structureCondition === 'NewSteel';
  if (highRisk && !input.bondRequired) {
    errors.push("High-risk projects require bond");
  }

  return { isValid: errors.length === 0, errors };
}
```

---

### **PHASE 4: Build Multi-Screen Manager (Day 13-17)**

#### What We Build:

**A. Screen Manager Component** (2 days)
```tsx
// File: frontend/src/components/CPQWizard/MultiScreenManager.tsx (NEW)

interface ScreenCardProps {
  screen: ScreenConfig;
  onUpdate: (index, data) => void;
  onRemove: (index) => void;
}

// Features:
// - Add Screen button
// - Screen cards in grid layout
// - Each card shows: name, size, pricing
// - Duplicate screen button
// - Remove screen button
// - Drag-and-drop reordering
// - Real-time total calculation
```

**B. Screen Data Model** (0.5 day)
```typescript
// File: frontend/src/types/cpq.ts (NEW)

export interface ScreenConfig {
  name: string;              // "Main Scoreboard"
  widthFt: number;
  heightFt: number;
  pixelPitch: number;
  environment: 'Indoor' | 'Outdoor';
  shape: 'Flat' | 'Curved';
  structureCondition: 'Existing' | 'NewSteel';
  serviceAccess: 'Front' | 'Rear';
  laborType: 'Union' | 'NonUnion';
  permits: 'ANC' | 'Client';
  controlSystem: 'New' | 'Existing' | 'None';
  targetMargin?: number;
  unitCost?: number;  // Manual override
  bondRequired?: boolean;
}
```

---

### **PHASE 5: Build Document Generation (Day 18-23)**

#### What We Build:

**A. Excel Export Backend** (2 days)
```python
# File: server/endpoints/cpqExcelExport.py (NEW)

from openpyxl import Workbook
from typing import List, Dict

def generate_anc_estimation_excel(input: CPQInput, calculation: CalculationResult):
    # Create workbook with 8+ tabs
    wb = Workbook()

    # Tab 1: LED Hardware Specs
    ws = wb.active
    ws.title = "LED Hardware"
    ws['A1'] = "Screen Name"
    ws['B1'] = "Width (ft)"
    ws['C1'] = "Height (ft)"
    ws['D1'] = "Pixel Pitch"
    ws['E1'] = "Sq Ft"
    ws['F1'] = "Base Rate"
    ws['G1'] = "Hardware Cost"  # =SUM(E2:E100) FORMULA!
    ws['G2'] = f"=E2*F2"  # Excel formula

    # Add all screens
    row = 2
    for screen in input.screens:
        ws[f'A{row}'] = screen.name
        ws[f'B{row}'] = screen.widthFt
        ws[f'C{row}'] = screen.heightFt
        ws[f'D{row}'] = screen.pixelPitch
        ws[f'E{row}'] = f"=B{row}*C{row}"  # Sq Ft formula
        ws[f'F{row}'] = calculation.hardwareRate
        ws[f'G{row}'] = f"=E{row}*F{row}"  # Cost formula
        row += 1

    # Tab 2: Structural Requirements
    ws2 = wb.create_sheet("Structural")
    ws2['A1'] = "Screen Name"
    ws2['B1'] = "Structure Type"
    ws2['C1'] = "Materials Cost"  # =SUM(B2:B100) FORMULA!
    ws2['D1'] = "Labor Cost"  # =SUM(C2:C100) FORMULA!
    ws2['E1'] = "Total Structural"  # =B2+D2 FORMULA!

    # ... tabs 3-8 similar pattern ...

    # Save
    filename = f"ANC_Estimation_{input.clientName}_{datetime.now()}.xlsx"
    wb.save(filename)
    return filename
```

**B. PDF Template** (1.5 days)
```tsx
// File: frontend/src/pages/cpq/print/page.tsx (NEW)

// Leverage PAIDS' existing Puppeteer
// Just add ANC branding

export default function CPQPrintTemplate({ data, calculation }: Props) {
  return (
    <div className="p-8 bg-white text-black">
      {/* ANC Header */}
      <div className="flex items-center gap-4 mb-8 border-b pb-4">
        <img src="/anc-logo.png" alt="ANC Sports" className="h-16" />
        <div>
          <h1 className="text-2xl font-bold text-blue-900">
            ANC Sports Enterprises, LLC
          </h1>
          <p className="text-sm text-gray-600">
            LED Display Solutions
          </p>
        </div>
      </div>

      {/* Proposal Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Project Proposal</h2>
        <p>
          <strong>Client:</strong> {data.clientName}
        </p>
        <p>
          <strong>Project:</strong> {data.projectName}
        </p>
        <p>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Screens Table */}
      <table className="w-full border-collapse border border-black mb-8">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="p-2 text-left">Screen Name</th>
            <th className="p-2 text-right">Dimensions</th>
            <th className="p-2 text-right">Sq Ft</th>
            <th className="p-2 text-right">Price</th>
          </tr>
        </thead>
        <tbody>
          {data.screens.map((screen, idx) => (
            <tr key={idx}>
              <td className="p-2 border-t">{screen.name}</td>
              <td className="p-2 text-right border-t">
                {screen.widthFt}' × {screen.heightFt}'
              </td>
              <td className="p-2 text-right border-t">
                {(screen.widthFt * screen.heightFt).toFixed(0)}
              </td>
              <td className="p-2 text-right border-t font-bold">
                ${screen.price.toLocaleString()}
              </td>
            </tr>
          ))}
          <tr className="bg-blue-100 font-bold">
            <td className="p-2 border-t" colSpan="3">
              TOTAL PROJECT PRICE
            </td>
            <td className="p-2 text-right border-t">
              ${calculation.totalPrice.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms & Conditions */}
      <div className="mt-8 text-sm text-gray-600">
        <p>Proposal valid for 30 days from date of issue.</p>
        <p>Subject to change without notice.</p>
      </div>
    </div>
  );
}
```

**C. Export Endpoints** (1.5 days)
```typescript
// File: server/endpoints/cpqExport.ts (NEW)

// Excel export
app.post("/api/cpq/excel", async (req, res) => {
  const { input } = req.body;
  const calculation = calculateCPQ(input);
  const filename = generate_anc_estimation_excel(input, calculation);
  res.download(filename);
});

// PDF export
app.post("/api/cpq/pdf", async (req, res) => {
  const { input } = req.body;
  const calculation = calculateCPQ(input);
  const pdf = await generate_puppeteer_pdf(input, calculation);
  res.set('Content-Type', 'application/pdf');
  res.send(pdf);
});
```

---

### **PHASE 6: Build Collaboration Features (Day 24-30)**

#### What We Build:

**A. Database Models** (1 day)
```prisma
// File: server/prisma/schema.prisma (UPDATE)

model Proposal {
  id           String   @id @default(cuid())
  workspaceId  String
  clientId     String
  projectName  String
  cpqData      Json     // Full CPQInput
  calculation  Json     // CalculationResult
  pdfUrl       String?
  excelUrl     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  version      Int      @default(1)
  status       String   @default("draft")  // draft, sent, approved, rejected

  @@index([workspaceId, createdAt])
  @@relation(fields: [workspace], references: [Workspace])
}

model ProposalComment {
  id        String   @id @default(cuid())
  proposalId String
  userId    String   // who commented
  text      String
  createdAt DateTime @default(now())

  @@index([proposalId, createdAt])
  @@relation(fields: [proposal], references: [Proposal])
}

model SharedProposal {
  id          String   @id @default(cuid())
  proposalId  String
  uniqueUrl   String   @unique  // e.g., "abc123"
  password    String?  // optional
  expiresAt   DateTime?
  viewCount   Int      @default(0)
  downloadCount Int      @default(0)

  @@index([uniqueUrl])
}
```

**B. Share Link Backend** (1.5 days)
```typescript
// File: server/endpoints/proposalSharing.ts (NEW)

// Generate shareable link
app.post("/api/proposals/:id/share", async (req, res) => {
  const { password, expiresDays } = req.body;
  const uniqueUrl = generateRandomString(12);  // "abc123xyz..."

  const shared = await prisma.sharedProposal.create({
    proposalId: req.params.id,
    uniqueUrl,
    password: password ? hash(password) : null,
    expiresAt: expiresDays ? addDays(new Date(), expiresDays) : null
  });

  res.json({ url: `${BASE_URL}/p/${uniqueUrl}` });
});

// Track views
app.get("/p/:url", async (req, res) => {
  const shared = await prisma.sharedProposal.findUnique({ where: { uniqueUrl: req.params.url }});

  if (!shared) return res.status(404).send("Not found");
  if (shared.expiresAt && shared.expiresAt < new Date()) {
    return res.status(410).send("Expired");
  }
  if (shared.password && !verifyPassword(req.body.password, shared.password)) {
    return res.status(401).send("Wrong password");
  }

  // Increment view count
  await prisma.sharedProposal.update({
    where: { uniqueUrl: req.params.url },
    data: { viewCount: { increment: 1 } }
  });

  // Get full proposal data
  const proposal = await prisma.proposal.findUnique({ where: { id: shared.proposalId }});

  res.render("proposal-view", { proposal, shared });
});
```

**C. Frontend Share Page** (1 day)
```tsx
// File: frontend/src/pages/p/[id]/page.tsx (NEW)

export default function SharedProposalView({ params }: PageProps) {
  const [proposal, setProposal] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchProposal(params.id);  // Load from backend
    fetchComments(params.id);
  }, [params.id]);

  const handleAddComment = async (text: string) => {
    await fetch(`/api/proposals/${params.id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    // Reload comments
    fetchComments(params.id);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* View-Only Badge */}
      <div className="bg-yellow-500 text-black px-4 py-2 text-center">
        VIEW ONLY - Do not modify without permission
      </div>

      {/* Proposal Details */}
      <ProposalView proposal={proposal} />

      {/* Download Buttons */}
      <div className="flex gap-4 justify-center p-6">
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={downloadExcel}>Download Excel</button>
      </div>

      {/* Comments Section */}
      <div className="border-t p-6">
        <h3>Questions & Feedback</h3>
        <textarea placeholder="Add your comments here..."
          onChange={handleAddComment}
        />
        <div className="mt-4 space-y-4">
          {comments.map(c => (
            <Comment key={c.id} comment={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**D. Workspace User Invites** (2 days)
```typescript
// File: server/endpoints/workspaceSharing.ts (NEW)

// Reuse existing Organization.addUser()
// Just add CPQ-specific permission

app.post("/api/workspace/:slug/invite-cpq-user", async (req, res) => {
  const { email, role } = req.body;

  // Send email invite
  const invite = await prisma.invite.create({
    workspaceId: req.params.slug,
    email,
    role,  // "estimator", "viewer", "editor"
    token: generateInviteToken(),
    expiresAt: addDays(new Date(), 7)
  });

  await sendEmail({
    to: email,
    subject: "Invited to ANC CPQ Workspace",
    body: `Click to join: ${BASE_URL}/invite/${token}`
  });

  res.json({ success: true });
});

// Handle invite acceptance
app.get("/invite/:token", async (req, res) => {
  const invite = await prisma.invite.findUnique({ where: { token: req.params.token }});

  if (!invite || invite.expiresAt < new Date()) {
    return res.redirect("/invite-expired");
  }

  // Add user to organization (reuse existing)
  await Organization.addUser({
    organizationId: invite.workspaceId,
    email: invite.email,
    role: invite.role
  });

  // Redirect to workspace
  res.redirect(`/workspace/${invite.workspaceId}/cpq`);
});
```

**E. Comment/Feedback Thread** (1.5 days)
```typescript
// File: server/endpoints/proposalComments.ts (NEW)

app.post("/api/proposals/:id/comments", async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;  // From session

  const comment = await prisma.proposalComment.create({
    proposalId: req.params.id,
    userId,
    text,
    createdAt: new Date()
  });

  // Notify stakeholders (estimator, client)
  await sendNotifications({
    to: getProposalStakeholders(req.params.id),
    subject: `New comment on proposal`,
    body: `Comment added: "${text.substring(0, 100)}..."`
  });

  res.json({ comment });
});

app.get("/api/proposals/:id/comments", async (req, res) => {
  const comments = await prisma.proposalComment.findMany({
    where: { proposalId: req.params.id },
    include: { user: true },  // Include author info
    orderBy: { createdAt: 'desc' }
  });

  res.json({ comments });
});
```

---

## **User Roles & Permissions**

### Who Can Use The System:

| Role | What They Can Do | How They Access |
|------|-----------------|-----------------|
| **ANC Estimator** (Primary User) | - Create workspaces<br>- Configure proposals<br>- Chat with AI<br>- Generate PDF/Excel<br>- Share with client<br>- Invite external users<br>- View all comments<br>- Finalize and send proposals | Log in to PAIDS<br/>Select ANC workspace<br/>Go to CPQ page |
| **ANC Project Manager** | - View all proposals<br>- Approve/reject proposals<br>- Add comments<br>- Download internal Excel<br>- See pricing breakdown<br>- Track version history | Log in to PAIDS<br/>Navigate to workspace<br/>See all proposals in list |
| **External Vendor** (Outsourcing Partner) | - View shared proposals<br>- Add quotes/comments<br>- Upload their own cost data<br>- See only what's shared with them | Click email invite link<br/>Create account (or sign in)<br/>Access specific proposal<br/>Add comments |
| **Client** (Read-Only) | - View shared proposal link<br>- Download PDF<br>- Add questions/comments<br>- See only client-facing data<br/>Cannot modify pricing | Click link from email<br/>No login required<br/>View in browser<br/>Download PDF if needed |

---

## **Complete File Structure After Implementation**

```
frontend/src/
├── components/
│   ├── CPQWizard/                    # NEW - All CPQ components
│   │   ├── index.jsx                 # Main wizard container
│   │   ├── ConversationalInput.tsx   # Chat interface
│   │   ├── VisualConfirmation.tsx    # Review before PDF
│   │   ├── ProgressIndicator.tsx     # Step tracker
│   │   ├── DocumentPreview.tsx       # Live pricing panel
│   │   ├── MultiScreenManager.tsx   # Add/remove screens
│   │   └── ExportOptions.tsx        # Download buttons
│   ├── WorkspaceChat/               # EXISTING - Just add CPQ mode
│   │   ├── ChatContainer/
│   │   │   └── PromptInput/
│   │   │       └── index.jsx   # ADD: CPQ mode dropdown
│   │   └── ThreadNotes/          # Reuse for proposal drafting
│   └── ClientPortal/              # EXISTING - Add CPQ tab
├── pages/
│   ├── cpq/                            # NEW - CPQ main page
│   │   ├── index.tsx                  # Wizard flow
│   │   ├── share/[id]/page.tsx       # Shared proposals
│   │   └── print/page.tsx           # PDF template
│   └── p/[id]/page.tsx               # Public proposal view
├── utils/
│   ├── cpqCalculator.ts            # NEW - Pricing engine
│   ├── cpqValidation.ts           # NEW - Input validation
│   ├── cpqAIExtractor.ts          # NEW - AI extraction
│   └── proposalExporter.ts        # NEW - Export handlers
├── types/
│   └── cpq.ts                     # NEW - TypeScript interfaces
└── models/
    └── workspace.js              # EXISTING - Just add CPQ methods

server/
├── prisma/
│   └── schema.prisma               # UPDATE - Add Proposal, Comment, SharedProposal
├── endpoints/
│   ├── cpqExcelExport.py          # NEW - Excel generation
│   ├── cpqExport.ts               # NEW - PDF/Excel endpoints
│   ├── proposalSharing.ts          # NEW - Share links
│   ├── proposalComments.ts         # NEW - Feedback thread
│   └── workspaceSharing.ts         # NEW - User invites
└── utils/
    └── openpyxl_helpers.py        # NEW - Excel formula helpers
```

---

## **Testing & QA Plan (Day 31-35)**

### Test Scenarios:

1. **Single Screen Proposal**
   - Create workspace
   - Chat: "40x20 outdoor scoreboard"
   - Verify AI extraction
   - Check pricing calculation
   - Generate PDF
   - Generate Excel
   - Download both
   - Verify formulas in Excel

2. **Multi-Screen Proposal (5+ screens)**
   - Add 5 screens via MultiScreenManager
   - Verify per-screen pricing
   - Verify project total
   - Generate multi-page PDF
   - Verify Excel tabs have all screens
   - Reorder screens
   - Remove 1 screen
   - Verify total updates

3. **Shareable Link Workflow**
   - Share proposal
   - Open link in new browser (incognito)
   - Verify view-only mode
   - Add password protection
   - Test expiry date
   - Client adds comment
   - Estimator sees notification

4. **External User Invite**
   - Invite external vendor
   - Vendor receives email
   - Vendor creates account
   - Vendor accesses workspace
   - Vendor adds comment/quote
   - Estimator sees vendor input

5. **RFP Upload**
   - Upload sample RFP PDF
   - Verify AI extraction
   - Check all fields populated
   - Manually adjust if needed

6. **Version History**
   - Create proposal v1
   - Save
   - Make changes (add contingency)
   - Create v2
   - Verify both versions accessible
   - Switch between versions
   - Delete v1

---

## **Deployment Checklist (Day 36)**

### Before Go-Live:

- [ ] Add CPQ to main navigation menu
- [ ] Create "ANC CPQ Workspace" template (default workspace settings)
- [ ] Configure backup strategy for proposals (daily DB backups)
- [ ] Set CDN for shared proposal links (optional, use domain)
- [ ] Configure email server for user invites (SMTP)
- [ ] Add monitoring (Sentry for errors, NewRelic for performance)
- [ ] Rate limiting (prevent abuse of share links)
- [ ] SSL/TLS (HTTPS only)
- [ ] Database indexes on `Proposal.uniqueUrl`, `Proposal.workspaceId`
- [ ] Performance testing (100 concurrent users)
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Mobile responsive design (375px breakpoint)
- [ ] Accessibility testing (screen readers, keyboard nav)

---

## **Documentation Requirements**

Create these docs for ANC team:

1. **User Guide:** `docs/ANC_CPQ_USER_GUIDE.md`
   - How to create workspace
   - How to use CPQ wizard
   - How to generate proposals
   - How to share with clients
   - How to invite external users
   - Troubleshooting common issues

2. **Admin Guide:** `docs/ANC_CPQ_ADMINISTRATION.md`
   - How to manage users
   - How to reset passwords
   - How to export all proposals (CSV)
   - How to view system logs
   - How to configure email settings

3. **API Reference:** `docs/ANC_CPQ_API_REFERENCE.md`
   - All CPQ endpoints
   - Request/response formats
   - Authentication required
   - Rate limits

4. **Training Deck:** `docs/ANC_CPQ_TRAINING_SLIDES.md`
   - Screenshot walkthroughs (Step-by-step)
   - Video tutorial links
   - FAQ section
   - Contact information for support

---

## **Success Metrics (Definition of Done)**

### Before Launch:
- [ ] All Phases 1-6 complete
- [ ] All test scenarios passing
- [ ] Performance <5 seconds for PDF generation
- [ ] Performance <10 seconds for Excel generation
- [ ] Mobile responsive on all devices
- [ ] Cross-browser compatible
- [ ] Documentation complete

### After Launch (Week 1):
- [ ] >10 proposals generated successfully
- [ ] Zero critical errors (500s)
- [ ] <3% user-reported bugs
- [ ] >95% PDF accuracy (vs. manual process)
- [ ] >99% Excel formula accuracy

### Month 1:
- [ ] >50 proposals generated
- [ ] >20 shared proposals created
- [ ] >10 external users invited
- [ ] >90% user satisfaction rating

---

## **Estimated Cost Breakdown**

Based on ~20.5 days of development @ $150/hour:

| Phase | Days | Hours | Cost |
|--------|-------|-------|-------|
| Phase 1: Reuse Infrastructure | 2 days | 16 hrs | $2,400 |
| Phase 2: CPQ Wizard Components | 5 days | 40 hrs | $6,000 |
| Phase 3: Pricing Engine | 5 days | 40 hrs | $6,000 |
| Phase 4: Multi-Screen Manager | 5 days | 40 hrs | $6,000 |
| Phase 5: Document Generation | 6 days | 48 hrs | $7,200 |
| Phase 6: Collaboration | 7 days | 56 hrs | $8,400 |
| Testing & QA | 5 days | 40 hrs | $6,000 |
| Deployment | 1 day | 8 hrs | $1,200 |
| **TOTAL** | **36 days** | **288 hrs** | **$43,200** |

**Fixed Price:** $43,200 (complete implementation)
**Includes:** All development, testing, documentation, deployment
**Excludes:** Monthly maintenance retainer (optional $500/month)

---

## **Milestone-Based Payment**

| Milestone | Deliverable | Cost | Due |
|-----------|-------------|-------|------|
| **Milestone 1** | Phase 1-2 Complete | $15,000 | Day 15 |
| **Milestone 2** | Phase 3-4 Complete | $18,000 | Day 30 |
| **Milestone 3** | Phase 5-6 Complete + Testing | $10,200 | Day 45 |

**Total Fixed Price:** $43,200

---

## **Risk Mitigation**

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Excel formula mismatch with ANC manual | MEDIUM | Have ANC team verify ALL formulas in week 1 before proceeding |
| Performance on multi-screen projects (50+ screens) | LOW | Implement pagination, lazy loading, test with 100 screens |
| AI extraction failures | LOW | Fallback to manual form entry (always available) |
| Puppeteer PDF rendering issues | LOW | Use simple CSS, test extensively, fallback to browser-generated PDF |
| Database scaling with many proposals | LOW | Use indexes, implement caching (Redis) |
| External user security concerns | MEDIUM | Implement role-based permissions, audit logs |

---

## **Next Steps for ANC Team**

1. **Review This Document** - Verify workflow matches requirements
2. **Approve Fixed Price** - Confirm $43,200 budget acceptable
3. **Provide Master Excel** - Unredacted file with ALL formulas
4. **Provide Brand Assets** - ANC logo (PNG/SVG), hex color codes
5. **Provide Pricing Rules** - Document all modifiers (structural, labor, contingency)
6. **Schedule Kickoff** - Week 1 logic mapping workshop (2 hours)
7. **Approve Timeline** - 5-6 week implementation acceptable?

---

## **Final Recommendation**

This plan maximizes PAIDS' existing proven infrastructure while delivering ANC's sophisticated CPQ requirements. The hybrid approach:

- **Reduces development time** by ~40% (reuse existing components)
- **Reduces risk** by building on tested PAIDS platform
- **Delivers all Natalia features** - Chat wizard, pricing, Excel export, PDF, sharing, collaboration
- **Scales with ANC growth** - Database-first, modular design
- **Maintainable** - Clean separation of concerns, documented code

**Verdict:** ✅ **PROCEED WITH THIS PLAN**

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Next Review:** When ANC team provides feedback
