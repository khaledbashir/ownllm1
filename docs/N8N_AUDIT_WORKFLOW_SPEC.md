# ANC Internal Audit Workflow (n8n)

**Goal:** Receive JSON quote data -> Fill Excel Templates -> Email to Estimator.

## 1. Webhook Trigger
- **Method:** POST
- **Path:** `/webhook/anc-audit-generator`
- **Auth:** None (Internal Usage)

## 2. Process Logic
1.  **Read Binary File:** Read the `ANC_Audit_Template.xlsx` from disk.
2.  **Spreadsheet File (Write):**
    - Map `quoteData.pricing.ledDisplaySystem` -> Cell `B5`
    - Map `quoteData.pricing.structuralMaterials` -> Cell `B6`
    - Map `quoteData.clientName` -> Cell `C2`
    - *Note: The Template should already have formulas in Cell `Total` that reference B5/B6.*
3.  **Gmail / SendEmail Node:**
    - **To:** `natalia@anc.com` (or user context email)
    - **Subject:** `New Quote Audit: {{json.clientName}}`
    - **Attachment:** The modified Excel file.

## 3. Deployment
- Open n8n.
- Import this logic.
- Ensure the `ANC_Audit_Template.xlsx` is available in the n8n container's `/files` directory.
