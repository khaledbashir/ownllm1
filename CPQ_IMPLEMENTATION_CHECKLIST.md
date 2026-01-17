# PAIDS CPQ Implementation Checklist

**Target:** Implement Natalia CPQ (Configure-Price-Quote) features into PAIDS platform

**Priority:** High - Client has been using manual Excel process, this directly impacts revenue
**Estimated Effort:** 3-5 weeks for full implementation
**Dependencies:** PAIDS existing components, Puppeteer, Next.js, Python backend

---

## 📋 Phase 0: Prerequisites & Setup

### Setup Tasks
- [x] Review natalia's pricing formulas with PAIDS team
- [x] Confirm PAIDS existing BlockSuite math engine compatibility
- [x] Verify Puppeteer is installed and working for PDF generation
- [x] Set up environment variables for CPQ module
- [x] Create dedicated branch: `feature/cpq-wizard`

### File Structure Planning
```
frontend/src/
├── components/
│   ├── CPQWizard/                    # NEW - Main CPQ container
│   │   ├── index.jsx               # Wizard entry point
│   │   ├── ConversationalInput.tsx   # Chat interface
│   │   ├── VisualConfirmation.tsx    # Amperage/dimensions review
│   │   ├── DocumentPreview.tsx      # Live PDF preview
│   │   └── ProgressIndicator.tsx     # Step completion tracking
│   └── landing/
│       └── hero.jsx                   # Update with CPQ CTA
├── utils/
│   ├── cpqCalculator.ts             # NEW - Port pricing rules
│   ├── calculationMiddleware.ts       # NEW - Formula validation
│   └── proposalExporter.ts           # NEW - Dual export handler
└── pages/
    ├── cpq/                             # NEW - CPQ main page
    │   ├── index.tsx                  # CPQ wizard page
    │   └── share/[id]/page.tsx       # Shared proposals
```

---

## 🚀 Phase 1: CPQ Wizard Component (Week 1)

### Objective: Create conversational AI interface for proposal configuration

### Component: `ConversationalInput.tsx` (NEW)
**File:** `frontend/src/components/CPQWizard/ConversationalInput.tsx`

**Requirements:**
- Chat-style interface (not forms)
- MessageSquare icon from existing `lucide-react`
- Natural language user input
- Auto-scroll to latest messages
- Input validation (dimensions must be positive numbers)

**Implementation Checklist:**
- [x] Create component with chat interface
- [x] Add message history state
- [x] Integrate with PAIDS AI chat endpoint (`/api/chat`)
- [x] Add loading states for AI responses
- [x] Style with Tailwind to match PAIDS theme (slate-950)
- [x] Handle structured JSON extraction from AI responses
- [x] Add "typing" indicator during AI processing
- [x] Support multi-line user input (pasted briefs)

---

### Component: `VisualConfirmation.tsx` (NEW)
**File:** `frontend/src/components/CPQWizard/VisualConfirmation.tsx`

**Requirements:**
- Display final specs before PDF generation
- Show amperage calculation
- Show dimensions (width × height)
- Confirm/Reject workflow (cannot proceed without approval)
- Prevent PDF generation until user confirms

**Implementation Checklist:**
- [x] Create confirmation card component
- [x] Display calculated fields: Amperage, Sq Ft, Pixel Pitch
- [x] Add "Regenerate Configuration" button if user disagrees
- [x] Show warning icons for high power draws (>50A)
- [x] Integrate with CPQInput state
- [x] Add "Confirm & Generate PDF" CTA button

---

### Component: `ProgressIndicator.tsx` (NEW)
**File:** `frontend/src/components/CPQWizard/ProgressIndicator.tsx`

**Requirements:**
- Visual progress bar showing `filled_fields_count / 10 × 100%`
- Step labels (e.g., "Step 2: Pricing Configuration")
- Reinforce momentum to keep user engaged

**Implementation Checklist:**
- [ ] Create progress bar component
- [ ] Calculate percentage: `(completed_fields / total_fields) * 100`
- [ ] Map progress steps to required fields:
  1. Client Info (2 fields)
  2. Display Specs (3 fields)
  3. Installation (5 fields)
- [ ] Add smooth CSS transitions on progress changes
- [ ] Show completion message when 10/10 fields filled
- [ ] Style with PAIDS blue accent color for active steps

---

### Component: `DocumentPreview.tsx` (NEW)
**File:** `frontend/src/components/CPQWizard/DocumentPreview.tsx`

**Requirements:**
- Live preview of generated PDF
- Print button
- Download buttons (PDF, Excel)
- Real-time updates when state changes
- Branded header with ANC logo

**Implementation Checklist:**
- [ ] Create preview pane component
- [ ] Integrate with `usePdfGenerator` from existing PAIDS
- [ ] Add "Refresh Preview" button
- [ ] Add print-specific CSS (`@media print`)
- [ ] Show loading state during PDF generation
- [ ] Add "Download PDF" and "Download Excel" buttons
- [ ] Display estimated PDF file size

---

### Component: `index.jsx` (NEW)
**File:** `frontend/src/components/CPQWizard/index.jsx`

**Requirements:**
- Main container for CPQ wizard
- Import and compose all sub-components
- Shared state management
- Route to `/cpq` page

**Implementation Checklist:**
- [ ] Create main wizard container
- [ ] Import ConversationalInput, VisualConfirmation, DocumentPreview
- [ ] Import ProgressIndicator
- [ ] Set up state sharing between components
- [ ] Add CPQ logo header
- [ ] Create "Start New Proposal" button (reset wizard)
- [ ] Add "Save as Draft" button (persist to localStorage)
- [ ] Responsive layout (3-panel: chat, preview, actions)

---

### Page: `pages/cpq/index.tsx` (NEW)
**File:** `frontend/src/pages/cpq/index.tsx`

**Requirements:**
- Main CPQ wizard page
- Breadcrumb navigation
- Container for wizard component
- Mobile-responsive layout

**Implementation Checklist:**
- [ ] Create CPQ page
- [ ] Import CPQWizard component
- [ ] Add page metadata (title: "Configure, Price, Quote | PAIDS")
- [ ] Set up breadcrumbs
- [ ] Add mobile bottom navigation support
- [ ] Ensure page routes correctly (`/cpq`)

---

### Page: `pages/cpq/share/[id]/page.tsx` (NEW)
**File:** `frontend/src/pages/cpq/share/[id]/page.tsx`

**Requirements:**
- Client-facing proposal view page
- Read-only mode (no editing allowed)
- Download button
- Share information display (created date, expires if set)
- Comment/chat section for client questions

**Implementation Checklist:**
- [ ] Create share page component
- [ ] Fetch proposal data from database by ID
- [ ] Display proposal details (client name, total price)
- [ ] Add "Download PDF" button
- [ ] Add "Download Excel" button
- [ ] Add "Chat for Clarifications" button
- [ ] Show read-only warning badge
- [ ] Add expiration countdown if set

---

## 🧮 Phase 2: Pricing Calculation Engine (Week 1-2)

### Utility: `cpqCalculator.ts` (NEW)
**File:** `frontend/src/utils/cpqCalculator.ts`

**Requirements:**
- Port Natalia's pricing rules
- Support for manual override (`unit_cost`)
- Default industry pricing tables
- Multipliers for structural, labor modifiers
- Ribbon board surcharge (+20%)

**Implementation Checklist:**
- [ ] Create calculator utility file
- [ ] Port all PRICING_RULES from natalia:
  - [ ] Hardware base rates (10mm, 6mm, 4mm)
  - [ ] Ribbon surcharge (1.2x multiplier)
  - [ ] Fine pitch premium (+$400-$800)
  - [ ] Outdoor weatherproofing (+$200)
  - [ ] Structural modifiers (new steel +15%, rigging +10%, curved +5%)
  - [ ] Labor modifiers (base 15%, union +15%, prevailing +10%, rear +2%)
- [ ] Export function: `calculateCPQ(input: CPQInput): CalculationResult`
- [ ] Implement margin calculation: `SellPrice = Cost / (1 - margin)`
- [ ] Add contingency logic: if Outdoor AND NewSteel, add 5%
- [ ] Implement ribbon surcharge check
- [ ] Test edge cases: missing values, zero dimensions, negative inputs
- [ ] Add TypeScript types for `CPQInput` and `CalculationResult`

---

### Utility: `calculationMiddleware.ts` (NEW)
**File:** `frontend/src/utils/calculationMiddleware.ts`

**Requirements:**
- Formula validation layer between AI and pricing
- Prevents invalid calculations from reaching PDF
- Returns structured breakdown with error checks

**Implementation Checklist:**
- [ ] Create middleware validation utility
- [ ] Add function: `validateCPQInput(input: CPQInput): ValidationResult`
- [ ] Check for invalid combinations (e.g., Ribbon but no ribbon rate)
- [ ] Validate dimensions are positive numbers
- [ ] Ensure margin is between 0-99%
- [ ] Return error messages for invalid fields
- [ ] Add data sanitization for client names (PII protection)
- [ ] Add fallback default values for missing fields
- [ ] Create unit tests for validation rules
- [ ] Integrate with wizard (call before `calculateCPQ`)

---

## 📄 Phase 3: Dual Export System (Week 2-3)

### Utility: `proposalExporter.ts` (NEW)
**File:** `frontend/src/utils/proposalExporter.ts`

**Requirements:**
- Handle PDF generation (existing)
- Add Excel export (8-tab workbook)
- Manage export state (loading, success, error)
- Provide unified interface for both formats

**Implementation Checklist:**

**PDF Export (Already Exists):**
- [ ] Verify Puppeteer PDF generation works
- [ ] Test ANC branding (colors, fonts, logo)
- [ ] Ensure multi-page proposals work correctly
- [ ] Add print-specific CSS handling

**Excel Export (NEW):**
- [ ] Create Python backend endpoint: `server/endpoints/cpqExcelExport.ts`
- [ ] Endpoint accepts `CPQInput` and `CalculationResult`
- [ ] Generate 8-tab workbook:
  1. LED Hardware Specs
  2. Structural Requirements
  3. Structural Labor
  4. LED Installation
  5. Electrical & Data
  6. Project Management
  7. General Conditions
  8. Travel & Expenses
  9. Submittals
  10. Engineering
  11. Permits
  12. Content Management System Equipment
  13. Installation & Commissioning
- [ ] Implement tab generation with `openpyxl`:
  ```python
  # Create workbook
  wb = Workbook()
  ws = wb.create_sheet("LED Hardware Specs")
  
  # Add headers
  headers = ["Screen Name", "Width (ft)", "Height (ft)", "Pixel Pitch", ...]
  
  # Write data rows with formulas
  for screen in screens:
      row = []
      row.append(screen.name)
      row.append(screen.width)
      # ... more columns
  
  # Save
  wb.save("anc_internal_estimation.xlsx")
  ```
- [ ] Ensure every cell with a formula has the formula (not value)
- [ ] Test that Excel recalculates when opened
- [ ] Add client metadata (name, address, project)
- [ ] Create download endpoint: `GET /api/cpq-excel-download`
- [ ] Add progress tracking during Excel generation
- [ ] Add export to frontend utility
- [ ] Test Excel opens correctly in LibreOffice, Google Sheets, Excel

**Unified Interface:**
- [ ] Create `ProposalExportOptions` interface
- [ ] Create `generateProposalPDF()` function
- [ ] Create `generateProposalExcel()` function
- [ ] Add error handling and retry logic
- [ ] Add file size optimization (compress large Excel)
- [ ] Add export format selection (PDF/Excel/CSV)
- [ ] Integrate with existing PAIDS loading/toast states

---

### Backend Endpoints (NEW)

#### Excel Export: `server/endpoints/cpqExcelExport.ts`
**File:** New file

**Implementation Checklist:**
- [ ] Create route handler
- [ ] Import `CPQInput` from shared types
- [ ] Import `calculationMiddleware.validateCPQInput()`
- [ ] Import `cpqCalculator.calculateCPQ()`
- [ ] Validate input before generation
- [ ] Generate 8-tab workbook using `openpyxl`
- [ ] Set proper MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- [ ] Add CORS headers
- [ ] Add error logging
- [ ] Add file naming: `ANC_Estimation_[CLIENT]_[DATE].xlsx`
- [ ] Test with actual CPQInput data

---

## 🔄 Phase 4: Document Preview Pane (Week 3)

### Component: `components/CPQWizard/DocumentPreview.tsx`
**Refer to Phase 1**

**Additional Features:**
- [ ] Add collapsible sections for each line item
- [ ] Add hover effects on line items
- [ ] Add edit capability (before final generation)
- [ ] Add "Lock Configuration" mode (prevent changes)
- [ ] Add "Approve & Sign" workflow (optional)
- [ ] Show total price prominently
- [ ] Add ANC logo placeholder
- [ ] Add proposal summary section (executive style)

---

## 🔗 Phase 5: Shareable Proposal Links (Week 3-4)

### Database Model: `SharedProposal` (NEW)
**File:** `server/models/SharedProposal.ts`

**Requirements:**
- Store proposal metadata
- Unique URL generation
- Access control (password, expiry)
- Track views and downloads
- Client comments/chat integration

**Implementation Checklist:**
- [ ] Create Prisma schema:
  ```prisma
  model SharedProposal {
    id          String   @id @default(cuid())
    clientName   String
    projectName  String
    totalPrice   Float
    cpqData      Json  // Full CPQInput
    pdfData       Json  // CalculationResult
    createdAt     DateTime @default(now())
    expiresAt     DateTime?
    password      String?   // Optional read protection
    allowComments  Boolean  @default(true)
    sharedUrl     String?  @unique
  }
  ```
- [ ] Create Prisma migration: `add_shared_proposals`
- [ ] Create database repository: `server/repositories/sharedProposalRepository.ts`
- [ ] Implement CRUD operations:
  - [ ] Create proposal with unique URL
  - [ ] Get proposal by ID
  - [ ] List proposals by client
  - [ ] Add comment to proposal
  - [ ] Delete proposal (soft delete)
- [ ] Add view tracking (increment views counter)
- [ ] Add download tracking (increment downloads counter)
- [ ] Create database indexes on `clientName` and `createdAt`
- [ ] Implement soft delete (don't actually delete, mark as deleted)

---

### Backend Endpoints: `server/endpoints/proposalSharing.ts`
**File:** New file

**Implementation Checklist:**
- [ ] Create route handler: `GET /api/proposals/:id`
- [ ] Fetch proposal by ID from database
- [ ] Check if expired (if `expiresAt < now`)
- [ ] Check if password protected (if `password` exists, verify)
- [ ] Increment view counter on successful access
- [ ] Return proposal data with metadata
- [ ] Create route handler: `POST /api/proposals`
- [ ] Generate unique URL: `proposal-[random-id]` or use sequential
- [ ] Validate CPQInput before saving
- [ ] Calculate pricing using `cpqCalculator`
- [ ] Generate PDF using existing `pdfGenerator`
- [ ] Generate Excel using new `cpqExcelExport` endpoint
- [ ] Save to database with `createdAt`
- [ ] Create route handler: `POST /api/proposals/:id/comments`
- [ ] Allow client to add comments/clarifications
- [ ] Store comments in database (new table: `ProposalComment`)
- [ ] Create route handler: `DELETE /api/proposals/:id`
- [ ] Mark as deleted (add `deletedAt` timestamp)
- [ ] Return 404 for non-existent IDs

---

### Frontend Page: `pages/cpq/share/[id]/page.tsx`
**Refer to Phase 1**

**Additional Implementation:**
- [ ] Fetch proposal data by ID on page load
- [ ] Show "View Only" badge prominently
- [ ] Display proposal metadata (created date, expiry if set)
- [ ] If expired, show "This proposal has expired" message
- [ ] If password protected, show password input form
- [ ] Add "Request Changes" button (client can ask to modify)
- [ ] Display client comments section (read-only)
- [ ] Add client comment form (new comment submission)
- [ ] Comment section auto-updates on new submission
- [ ] Show view/download count in footer
- [ ] Add share URL copy button
- [ ] Add "Send to Client Email" button (optional)
- [ ] Style with ANC branding

---

## 🏗️ Phase 6: Multi-Screen Projects (Week 4)

### Utility Update: `cpqCalculator.ts`
**Refer to Phase 2**

**Additional Requirements:**
- [ ] Update `CPQInput` interface to support `screens?: ScreenConfig[]`
- [ ] Update `ScreenConfig` interface:
  ```typescript
  interface ScreenConfig {
    name: string;
    widthFt: number;
    heightFt: number;
    pixelPitch: number;
    environment: 'Indoor' | 'Outdoor';
    shape: 'Flat' | 'Curved';
    access: 'Front' | 'Rear';
    structureCondition: 'Existing' | 'NewSteel';
    serviceAccess: 'Front' | 'Rear';
    laborType: 'Union' | 'NonUnion';
    permits: 'Client' | 'ANC';
    controlSystem?: 'New' | 'Existing' | 'None';
    targetMargin?: number;
  }
  ```
- [ ] Update `calculateCPQ()` to handle screens array
- [ ] Calculate each screen separately
- [ ] Sum all screen costs for project total
- [ ] Return `ScreenResult[]` in CalculationResult
- [ ] Add per-screen cost breakdown display

---

### Component: `MultiScreenManager.tsx` (NEW)
**File:** `frontend/src/components/CPQWizard/MultiScreenManager.tsx`

**Requirements:**
- Add/remove screens dynamically
- Screen cards in grid layout
- Each card shows individual screen configuration
- Edit mode for existing screens
- Collapse/expand for details

**Implementation Checklist:**
- [ ] Create screen management component
- [ ] Add "Add Another Screen" button
- [ ] Create screen card component:
  - [ ] Screen name input
  - [ ] Width/Height inputs
  - [ ] Pixel pitch dropdown
  - [ ] Environment toggle (Indoor/Outdoor)
  - [ ] Remove screen button
- [ ] Implement screen reordering (drag & drop if possible)
- [ ] Show screen-specific pricing in card
- [ ] Add screen-specific modifiers (per-screen contingency)
- [ ] Calculate project total in real-time
- [ ] Add "Duplicate Screen" button
- [ ] Add "Clear All Screens" button

---

### Page Update: `pages/cpq/index.tsx`
**Refer to Phase 1**

**Additional Implementation:**
- [ ] Integrate MultiScreenManager component
- [ ] Add "Manage Screens" step to wizard flow
- [ ] Create screen configuration step (#4)
- [ ] Add project summary section (total all screens)
- [ ] Update progress bar to account for 4 steps:
  1. Client Info
  2. First Screen Specs
  3. Installation Details
  4. Additional Screens
  5. Review & Generate
- [ ] Add screen validation (must have at least one screen)

---

## 🎨 Phase 7: Visual Polish & UX (Week 2-3, ongoing)

### Landing Page Update
**File:** `frontend/src/components/landing/hero.jsx`

**Implementation Checklist:**
- [ ] Update "Start Your Workspace" CTA to "Configure Your Proposal"
- [ ] Add subtext: "AI-powered CPQ wizard for LED display projects"
- [ ] Add "Try Demo" button (links to `/cpq?demo=true`)
- [ ] Update hero image to show multi-screen setup
- [ ] Add feature icons (Chat Wizard, Multi-Screen, PDF Export)

---

### Global UX Improvements
- [ ] Add loading spinners for all async operations
- [ ] Add toast notifications for:
  - [ ] PDF generation started
  - [ ] PDF generation completed
  - [ ] Excel generation completed
  - [ ] Proposal saved
  - [ ] Proposal shared
  - [ ] Calculation errors
- [ ] Add error boundaries for CPQ components
- [ ] Implement keyboard navigation (Tab between screens, Enter to confirm)
- [ ] Add mobile bottom sheet navigation for CPQ wizard
- [ ] Add responsive design testing (375px, 768px, 1024px, 1440px breakpoints)
- [ ] Add dark mode support (use PAIDS existing theme)
- [ ] Add tooltips for complex fields (margin, contingency triggers)

---

## 🧪 Phase 8: Testing & QA (Week 4-5)

### Unit Testing
**File:** `frontend/src/utils/cpqCalculator.test.ts` (NEW)

**Implementation Checklist:**
- [ ] Create test suite for cpqCalculator
- [ ] Test all pricing rules:
  - [ ] Base rates by pixel pitch
  - [ ] Ribbon surcharge multiplier
  - [ ] Outdoor weatherproofing
  - [ ] Structural modifiers (all combinations)
  - [ ] Labor modifiers (all combinations)
  - [ ] Contingency triggers
- [ ] Test edge cases:
  - [ ] Zero/negative dimensions
  - [ ] Missing required fields
  - [ ] Margin = 100% (free)
  - [ ] Margin = 0% (infinite price)
- [ ] Test multi-screen summation
- [ ] Test Excel generation with realistic data
- [ ] Test PDF generation with multi-screen projects
- [ ] Test shared proposal URLs (404, expired, password)
- [ ] Achieve >80% code coverage for CPQ module

### Integration Testing
**Implementation Checklist:**
- [ ] Test full wizard flow:
  1. Client info → Display specs → Installation → Generate
  2. Multi-screen wizard flow (add 5+ screens)
  3. Shared proposal view and download
  4. Proposal modification workflow (client requests change)
- [ ] Test AI chat with actual user queries:
  - "I need a 40x20 outdoor scoreboard"
  - "What's the ribbon board pricing?"
  - "Can you add a contingency for this project?"
- [ ] Test calculation middleware with invalid inputs
- [ ] Test PDF generation speed (should be <10 seconds for single screen)
- [ ] Test Excel export (should open and recalculate correctly)
- [ ] Test shared proposal links across browsers (Chrome, Safari, Firefox)
- [ ] Test mobile responsive design
- [ ] Test print layout (CSS `@media print`)

### Client Acceptance Testing
**Implementation Checklist:**
- [ ] UAT with ANC pricing team (review formulas match Excel)
- [ ] UAT with sales team (review workflow usability)
- [ ] UAT with management (review internal audit trail)
- [ ] Document any discovered issues
- [ ] Create training materials (screenshot walkthroughs)
- [ ] Gather feedback and iterate (estimated 1-2 weeks of refinement)

---

## 📊 Phase 9: Deployment & Launch (Week 5)

### Production Setup
**Implementation Checklist:**
- [ ] Set up production database for `SharedProposal` model
- [ ] Configure CDN for proposal files
- [ ] Set up database backups (daily backups of proposal data)
- [ ] Configure monitoring (Sentry for errors, logging for performance)
- [ ] Set up performance monitoring (APM - response times)
- [ ] Configure SSL/TLS (HTTPS only)
- [ ] Review CORS settings (whitelist client domains)
- [ ] Add rate limiting for public proposal endpoints
- [ ] Set up cache (Redis for calculation memoization)
- [ ] Configure environment variables for production

### Documentation
**Implementation Checklist:**
- [ ] Create CPQ user guide: `docs/CPQ_USER_GUIDE.md`
- [ ] Create API documentation: `docs/CPQ_API_REFERENCE.md`
- [ ] Create admin guide: `docs/CPQ_ADMINISTRATION.md`
- [ ] Update main README.md with CPQ features
- [ ] Create integration guide for existing WorkspaceChat
- [ ] Create troubleshooting guide: `docs/CPQ_TROUBLESHOOTING.md`

### Launch Plan
**Implementation Checklist:**
- [ ] Schedule deployment window (low-traffic hours)
- [ ] Pre-warm CDN cache (proposal templates)
- [ ] Notify internal team of upcoming CPQ feature
- [ ] Create support ticket channel for CPQ issues
- [ ] Monitor error rates post-launch (first 48 hours critical)
- [ ] Gather initial feedback from sales team
- [ ] Schedule refinement sprint (Week 6-7)

---

## 📝 Post-Launch (Ongoing)

### Monitoring
- [ ] Track proposal generation success rate (target: >95%)
- [ ] Track PDF generation time (target: <10 seconds avg)
- [ ] Track Excel export success rate (target: >99%)
- [ ] Track shared proposal views (engagement metric)
- [ ] Track AI chat response time (target: <5 seconds avg)
- [ ] Monitor database query performance (target: <200ms avg)
- [ ] Set up alerts for:
  - [ ] Error rate >5%
  - [ ] PDF generation failures
  - [ ] Database connection issues
  - [ ] High response times

### Maintenance
- [ ] Weekly code review of CPQ module
- [ ] Review and update pricing tables quarterly (with ANC team)
- [ ] Security patches and dependency updates
- [ ] Performance optimization (caching, memoization)
- [ ] Address client feedback (2-week turnaround)
- [ ] Plan Phase 2 features:
  - [ ] Salesforce integration (OAuth + webhook)
  - [ ] Custom PDF templates (client-specific branding)
  - [ ] CRM push notifications
  - [ ] Advanced formula evaluation (pycel for complex math)

---

## 🎯 Success Criteria

**Definition of "Done":**
- [ ] All 9 phases completed
- [ ] All unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Client UAT approved
- [ ] Production deployed
- [ ] Documentation complete
- [ ] Support team trained

**Final Deliverables:**
- [ ] Fully functional CPQ wizard
- [ ] Real-time pricing calculation engine
- [ ] Dual export system (PDF + Excel with formulas)
- [ ] Shareable proposal links
- [ ] Multi-screen project support
- [ ] Professional branded proposals
- [ ] Internal audit trail for estimators
- [ ] Production-ready deployment

---

## 📚 Appendix

### Reference Files
- Natalia CPQ: `/root/natalia/`
- PAIDS Base: `/root/everythingllm/ownllm1/frontend/src/`
- Implementation Guide: This checklist

### Key Contacts
- PAIDS Development Team
- ANC Pricing Team (for formula verification)
- ANC Sales Team (for UAT)
- ANC Management (for launch approval)

### Technology Stack Notes
- **Frontend:** Next.js 14, React 18, TypeScript 5, Tailwind CSS
- **Backend:** FastAPI, Python 3.11, openpyxl (Excel), reportlab (PDF)
- **Database:** PostgreSQL (Prisma), Redis (caching)
- **PDF Generation:** Puppeteer (Chrome headless)
- **AI:** GLM-4 (existing integration)

### Risk Mitigation
- **High Risk:** Excel formula mismatch between CPQ and ANC manual
  - **Mitigation:** Have ANC team verify all formulas before launch
- **Medium Risk:** Puppeteer CSS rendering issues
  - **Mitigation:** Simple CSS, extensive testing, fallback to browser-native PDF
- **Low Risk:** Performance on multi-screen projects
  - **Mitigation:** Lazy loading, pagination, memoize calculations

---

**Last Updated:** 2026-01-17
**Status:** Ready for Implementation
**Next Review:** 2026-01-24
