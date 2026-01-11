# Proposal: Automated ANC Proposal & Logic System (Phase 1)

**Prepared For:** Natalia Kovaleva, ANC Sports Enterprises, LLC  
**Prepared By:** Ahmad Basheer  
**Date:** January 9, 2026

---

## 1. Project Background
ANC receives a high volume of LED display requests requiring rapid pricing and branded budget proposals. The current manual process involving multi-tab Excel files and manual PDF transcription is slow and prone to error. 

This project establishes the **EverythingLLM ANC Mode**: an AI-driven CPQ (Configure, Price, Quote) system that automates the "Ugly Math" for estimators and the "Pretty PDF" for clients.

---

## 2. Solution Architecture (Already Established)
We have already built the core engine, which includes:
*   **ANC Logic Module:** A workspace-level controller that forces the AI into "Interviewer Mode" until all required project variables (Environment, Service Access, Curvature) are collected.
*   **Smart Plugin Engine:** codified "Golden Formula" rules that the AI uses to calculate 7 key line items (Display, Structure, Labor, Electrical, PM, submittals, CMS).
*   **Dynamic Product Catalog:** A database-driven catalog of ANC LED products with specific pitches and base costs.
*   **Client Portal:** A modern, interactive dashboard where clients can view, comment on, and approve proposals digitally.

---

## 3. Implementation Plan (The Road to 100%)

### Phase 1: Knowledge Transfer (4 Hours)
*   **Estimator Deep-Dive (3 hrs):** Direct meeting with the Estimating team to swap my "Proxy Formulas" with the actual "Golden Formulas" for Structural/Labor math.
*   **Branding & Identity (1 hr):** Meeting with the Proposal team to finalize the "ABCDE" PDF template styling (Fonts, Colors, Logo placement).

### Phase 2: Logic Hardening
*   **Formula Migration:** Update the `ANC_ESTIMATOR_SMART_PLUGIN` with the real Excel logic.
*   **Conditional Scenarios:** Refine logic for "Wavy" vs "Straight" screens and "Front" vs "Rear" service access.

### Phase 3: The Dual-Output Engine
*   **The "Pretty" Output:** Automated generation of the ANC-branded PDF using our Playwright-based PDF engine.
*   **The "Ugly" Internal Audit:** Implementation of a "Download CSV/Excel" button that exports the hidden AI calculations (Base Cost, Margin, Markups) for internal validation.

### Phase 4: Salesforce Integration (Optional / Stage 2)
*   Mapping Salesforce Opportunity fields to the LLM input to trigger proposals directly from CRM creation.

---

## 4. Timeline & Investment

| Event | Status | Duration |
| :--- | :--- | :--- |
| **Framework Development** | ✅ Completed | 1 Week |
| **Formula & Branding Setup** | ⏳ Pending | 3 Days |
| **Output Engine (PDF/CSV)** | ⏳ Pending | 5 Days |
| **Final Testing & Validation** | ⏳ Pending | 3 Days |

**Total Estimated Timeline:** 2 - 3 Weeks (Inclusive of cushion).

**Investment:**
*   **Fixed Project Fee:** $3,500 (Covers Phase 1-3).
*   **Monthly Maintenance:** $500/mo (Includes logic updates, product catalog refreshes, and tech support).
*   **Hourly Rate (Ad-hoc):** $150/hr for features outside initial scope.

---

## 5. Next Steps
1.  **NDA Execution:** Signed to allow transfer of "Golden Formula" Excel sheets.
2.  **Kickoff Session:** Schedule the 3-hour estimator meeting.
3.  **Alpha Test:** deploy the Logic Module to the ANC workspace for user feedback.

---

## 🤝 Handover (Internal)
**What we did:** 
*   Analyzed the `natalia` transcript and `GAP Analysis`.
*   Verified the existence of `ANC Mode` logic in `server/utils/chats/stream.js`.
*   Inventory check: `Client Portal` is 20% complete, `PublicProposals` model is ready.
*   Mapped the PDF generation workflow using MCP servers.

**Next:** Present this proposal to Natalia and secure the "Golden Formula" Excel tabs.
