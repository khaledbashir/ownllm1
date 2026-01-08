# ANC Deployment Guide: Logic & Excel Export Implementation

1. **ANC Mode Activation**
   - Ensure the workspace logic module is set to `anc`.
   - Checks `activeLogicModule` in `server/utils/chats/stream.js`.

2. **Excel Export Feature (Client-Side)**
   - **File**: `frontend/src/components/BlockSuite/pricing-table-block.jsx`
   - **Function**: `exportToExcel()` added to `PricingTableWidget`.
   - **Trigger**: New "Download Excel (CSV)" button under the total price in the BlockSuite doc editor.
   - **Format**: Generates a CSV file (readable by Excel) containing all columns + formulas + totals.
   - **Benefit**: Zero server dependency (no n8n required). Works instantly in browser.

3. **Verification Steps**
   - Open Chat.
   - Generate Quote.
   - Click "Insert" to put table into Doc.
   - Scroll to bottom of Pricing Table.
   - Click "Download Excel (CSV)".
   - Verify file opens in Excel with correct columns.
