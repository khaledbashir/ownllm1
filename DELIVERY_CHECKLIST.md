# ANC Proposal System: Delivery Checklist

**Target:** Natalia (ANC Sports Enterprises)
**Current Status:** Ready for Demo (MVP Phase)

## 1. Core Logic & Architecture
- [x] **Logic Module Switching**: `activeLogicModule` implemented in backend `server/utils/chats`.
- [x] **System Prompts**: `server/prompts/systemPrompts.js` updated with ANC-specific rules ("ABCDE" template structure).
- [x] **Guardrails**: `stream.js` updated to force "Interviewer Mode" if critical variables (width, height, environment) are missing.
- [x] **Product Logic**: "Golden Formula" proxies (10mm vs 6mm pricing) implemented in prompts.

## 2. Interaction Flow (Chat Interface)
- [x] **Trigger**: User starts chat with "Create quote for [Client]...".
- [x] **Data Collection**: System effectively asks for Env, Access, Curvature before calculating.
- [x] **Catalog Injection**: Logic exists to inject `ancProductCatalog` into context if available.

## 3. Outputs (The "Dual View")
- [x] **Client-Facing (PDF/Markdown)**:
    - [x] Generates exact "Sales Quotation" header/footer.
    - [x] Includes standard Legal Text & Payment Terms (50/25/25).
    - [x] Formats Pricing Table correctly.
- [x] **Internal Audit (The "Ugly Excel")**:
    - [x] **Raw Data**: System outputs a valid JSON block (`type: "anc_estimate"`) at the end of the chat.
    - [x] **Visualization**: **SOLVED (Agent Skill)**. Created "ANC Audit Generator" skill that sends JSON to n8n.
    - **Action**: Use n8n to generate the Excel file and email it (Refer to `docs/N8N_AUDIT_WORKFLOW_SPEC.md`).

## 4. Deployment & Handoff
- [x] **Documentation**: `ANC_MODE_IMPLEMENTATION_GUIDE.md` created.
- [x] **Activation Script**: `ANC_QUICKSTART.sh` allows single-command setup.
- [ ] **Live Demo Sandbox**: Need to ensure the "Sandbox" environment Natalia logged into is actually running this latest code.

## 5. Next Steps for "Gold" Delivery
1.  **Formula verification**: Replace the "proxy" percentages (e.g., Labor = 0.15 * Hardware) with the *real* formulas once Natalia signs the NDA/provides the sheet.
2.  **Excel Converter**: Build a small utility (or n8n webhook) that takes the chat JSON and emails a `.xlsx` file to the user. This closes the "Internal Audit" gap.
