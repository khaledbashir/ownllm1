# 🧪 ANC FORMULA BANK - COMPLETE TESTING GUIDE

## 📋 PREREQUISITES

### ✅ Ensure These Are Running:
1. **AnythingLLM Server** - Should be running on port 3001
2. **Browser Access** - Access to the AnythingLLM web UI
3. **ANC Skills Deployed** - Should be visible in Workspace Settings

---

## 🚀 STEP 1: START ANYTHINGLLM SERVER

### Option A: If Server is Already Running
Check if the server is running by visiting:
```
http://localhost:3001
```
or your VPS URL:
```
https://basheer-everythingllm.x0uyzh.easypanel.host
```

### Option B: Start Server Manually
```bash
cd /root/everythingllm/ownllm1/server
yarn dev
```

**Wait for:** "Primary server in HTTP mode listening on port 3001"

---

## 🔐 STEP 2: LOGIN TO ANYTHINGLLM

1. **Open Browser:** Navigate to your AnythingLLM URL
2. **Login:** Enter your credentials (email/password)
3. **Dashboard:** You should see the main dashboard with workspaces

---

## 📁 STEP 3: EXIT ACTIVE SESSION & RELOAD PAGE

**CRITICAL:** If you're currently in an active chat session, new skills won't appear!

1. **Type:** `/exit` in your current chat window
2. **Press:** F5 or click browser refresh button
3. **Wait:** Page to reload completely

This is REQUIRED because AnythingLLM loads skills on page load. Active sessions don't refresh skill list.

---

## 📁 STEP 4: CREATE TEST WORKSPACE

1. **Click:** "Create Workspace" button
2. **Workspace Name:** `ANC Formula Bank Test`
3. **Workspace Type:** `Standard` (or "Chat")
4. **Click:** "Create Workspace"

You should now be in the chat interface for your new workspace.

---

## ⚙️ STEP 4: ENABLE ANC AGENT SKILLS

### Navigate to Workspace Settings:
1. **Click:** Workspace Settings (gear icon ⚙️)
2. **Select:** "Agent Skills" tab
3. **Look for:**
   - ✅ `ANC_SYSTEM_INTERNAL_CALCULATOR`
   - ✅ `ANC_AUDIT_EXPORT`

### Enable Skills:
1. **Toggle ON:** `ANC_SYSTEM_INTERNAL_CALCULATOR`
2. **Toggle ON:** `ANC_AUDIT_EXPORT`
3. **Click:** "Save Changes"

**If Skills Don't Appear:**
- Check server logs for errors
- Verify skills exist in `/app/server/storage/plugins/agent-skills/`
- Restart AnythingLLM server if needed

---

## 🧮 STEP 5: TEST ANC CALCULATION

### Test 1: Simple Indoor Display

**In the chat box, type:**
```
Calculate a 24ft by 10ft indoor LED display with 1.5mm pixel pitch at 32% margin.
```

**Expected Output:**
```
Using ANC_SYSTEM_INTERNAL_CALCULATOR:

📊 ANC CPQ Quote - Internal Calculation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: 24' x 10' Indoor LED (240 sqft)
Pixel Pitch: 1.5mm
Target Margin: 32%

🏢 HARDWARE
  Base Hardware: $360,000
  Spares (5%): $12,000
  Processing: $15,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subtotal: $387,000

🏗️ STRUCTURAL
  Materials: $72,000
  Labor: $432,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subtotal: $504,000

⚡ ELECTRICAL & DATA
  PDUs: $2,500
  Cabling: $3,600
  Subcontracting: $12,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subtotal: $18,100

👷 INSTALLATION
  Labor: $36,000
  Supervision: $7,500
  Travel: $3,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subtotal: $46,500

📋 PROFESSIONAL SERVICES
  Project Management (8%): $69,120
  General Conditions (5%): $43,200
  Submittals: $2,500
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Subtotal: $114,820

💰 FINAL SUMMARY
  Cost Basis: $1,158,920
  Sell Price: $1,704,294
  Gross Profit: $545,374
  Margin: 32.00%
```

**If This Works:** ✅ ANC Calculator is working!

---

### Test 2: Complex Outdoor Display (All Modifiers)

**In the chat box, type:**
```
Calculate a 50ft by 30ft outdoor LED display with 6mm pixel pitch, new steel, rigging access, and rush timeline at 30% margin.
```

**Expected Output:**
- Base Hardware: $3,300,000
- Materials: $759,000 (with +15% new steel modifier)
- Structural Labor: $5,073,750 (with +15% new steel +10% rigging modifiers)
- Contingency: $584,238 (5% for Outdoor + New Steel)
- Timeline Surcharge: $2,336,952 (+20% for Rush)
- **Final Sell Price:** $20,865,638 at 30% margin

**If This Works:** ✅ All ANC modifiers are working!

---

### Test 3: Ribbon Board Special Product

**In the chat box, type:**
```
Calculate a 100ft by 3ft outdoor ribbon board with 10mm pixel pitch and curved access at 35% margin.
```

**Expected Output:**
- Base Hardware: $750,000
- Ribbon Surcharge: $150,000 (+20% for Ribbon Board)
- Materials: $150,000
- Structural Labor: $945,000 (with +5% curved modifier)
- **Final Sell Price:** $3,828,154 at 35% margin

**If This Works:** ✅ Ribbon Board + Curved modifiers working!

---

## 📊 STEP 6: TEST ANC AUDIT EXPORT

### After Any Calculation Test:

**In the chat box, type:**
```
Generate the internal audit Excel for this quote.
```

**OR Direct Tool Call:**
```
@ANC_AUDIT_EXPORT
width: 24
height: 10
pixelPitch: 1.5mm
environment: indoor
margin: 0.32
```

**Expected Output:**
```
### 📊 ANC Internal Audit Generated

**Audit File:** ANC_Internal_Audit_XXXXXXXXXX.xlsx
**Format:** 8-Tabs with ALL ANC Master Formulas
**Purpose:** For Estimators to verify calculations

🔗 **[DOWNLOAD_INTERNAL_AUDIT_EXCEL](https://basheer-everythingllm.x0uyzh.easypanel.host/api/system/download/ANC_Internal_Audit_XXXXXXXXXX.xlsx)**

*All formulas shown in 'Formula Reference' tab. Ready for estimator review.*
```

---

## 📥 STEP 7: DOWNLOAD & VERIFY EXCEL FILE

### Click the Download Link

1. **Click:** The link provided by the agent
2. **Browser:** Should download `ANC_Internal_Audit_XXXXXXXXXX.xlsx`
3. **Open:** Excel file (Microsoft Excel, Google Sheets, or LibreOffice)

### Verify 8 Tabs Exist:
1. ✅ **Executive Summary** - Total cost, margin, sell price
2. ✅ **Hardware Breakdown** - Base cost, ribbon surcharge, spares, processing
3. ✅ **Structural Materials** - Materials with modifiers (steel, rigging, curved)
4. ✅ **Labor Breakdown** - Installation, supervision, travel
5. ✅ **Electrical & Data** - PDUs, cabling, subcontracting
6. ✅ **Professional Services** - PM (8%), General Conditions (5%), Submittals
7. ✅ **Installation Assessment** - Scaffolding, freight, storage, timeline
8. ✅ **Formula Reference** - ALL ANC Master formulas used

### Verify Formula Reference Tab:
Should show all formulas used:
- Pixel Pitch Rates (10mm: $2,500/sqft, etc.)
- Hardware Base Rate
- Materials Factor (Base × 20%)
- Structural Modifiers (New Steel +15%, Rigging +10%, Curved +5%)
- PM Fee (8%)
- Contingency (5% if Outdoor + New Steel)
- Timeline Charges (Standard/Rush +20%/ASAP +50%)
- Target Margin
- Ribbon Surcharge (+20%)

**If This Works:** ✅ ANC Audit Export is fully functional!

---

## 🎯 STEP 8: COMPLETE WORKFLOW TEST

### Full 4-Phase "Stop-and-Go" Workflow

#### Phase 1: Data Lock
```
Extract the following from this RFP:
- Project name
- Screen dimensions
- Pixel pitch
- Environment (indoor/outdoor)
- Access requirements
- Steel condition
- Timeline requirements
```

**Wait for:** Agent to extract all data
**You:** "Confirm data is correct (Yes/No)"

#### Phase 2: Calculation
```
Calculate the quote at 32% margin.
```

**Wait for:** Agent to call ANC_SYSTEM_INTERNAL_CALCULATOR
**You:** Review breakdown (Continue/Adjust)

#### Phase 3: Audit Generation
```
Generate the internal audit Excel.
```

**Wait for:** Agent to call ANC_AUDIT_EXPORT
**You:** Download and verify audit

#### Phase 4: Export
```
Generate the official ANC proposal PDF.
```

**Wait for:** Agent to call ANC_DOCUMENT_PUBLISHER or ANC_PDF_OFFICIAL_PROPOSAL
**You:** Final review and send to client

---

## 🐛 TROUBLESHOOTING

### Issue 1: Server Won't Start

**Error:** "Port 3001 already in use"
**Fix:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Start server again
cd /root/everythingllm/ownllm1/server
yarn dev
```

### Issue 2: ANC Skills Not Visible

**Error:** Skills don't appear in Workspace Settings
**Fix:**
```bash
# Verify skills exist in Docker storage
ls -la /app/server/storage/plugins/agent-skills/ | grep anc-

# If missing, sync from local
cp -r /root/everythingllm/ownllm1/server/storage/plugins/agent-skills/anc-* /app/server/storage/plugins/agent-skills/

# Restart server
# (Stop server with Ctrl+C, then yarn dev again)
```

### Issue 3: Agent Doesn't Call Tools

**Error:** Agent responds but doesn't use ANC tools
**Fix:**
1. Check "Agent Skills" are enabled in Workspace Settings
2. Try more explicit command: "@ANC_SYSTEM_INTERNAL_CALCULATOR width: 24 height: 10 pixelPitch: 1.5mm environment: indoor margin: 0.32"
3. Check server logs for errors

### Issue 4: Excel Download Returns 404

**Error:** Clicking download link shows "404 Not Found"
**Fix:**
```bash
# Verify file exists
ls -la /app/server/storage/documents/ | grep ANC

# Check download endpoint
cat server/endpoints/download.js

# Verify BASE_URL is set
echo $BASE_URL
```

### Issue 5: Agent Hallucinates Links

**Error:** Agent generates fake links that don't work
**Fix:**
- This should be fixed with the new implementation
- Agent should only call ANC_AUDIT_EXPORT for downloads
- Report the issue if it persists

---

## ✅ SUCCESS CRITERIA

### All Tests Pass If:
- ✅ Server starts on port 3001
- ✅ Login to AnythingLLM web UI works
- ✅ ANC skills appear in Workspace Settings
- ✅ ANC_SYSTEM_INTERNAL_CALCULATOR produces correct breakdown
- ✅ All ANC modifiers apply correctly (Steel +15%, Rigging +10%, Ribbon +20%, etc.)
- ✅ ANC_AUDIT_EXPORT generates working download link
- ✅ Excel file downloads successfully
- ✅ 8 tabs exist in Excel file
- ✅ Formula Reference tab shows all ANC formulas
- ✅ Download link works (not 404)

---

## 📝 TEST RESULTS TEMPLATE

Copy and paste this after testing:

```
🧪 ANC FORMULA BANK TEST RESULTS

Date: ___________

✅ Server Start: [PASS/FAIL]
✅ Login: [PASS/FAIL]
✅ ANC Skills Visible: [PASS/FAIL]

✅ Test 1 - Indoor Display (24x10 @ 1.5mm, 32%):
   - Calculation: [PASS/FAIL]
   - Result: $________ (Expected: $1,704,294)

✅ Test 2 - Outdoor Complex (50x30 @ 6mm, New Steel + Rigging + Rush, 30%):
   - Calculation: [PASS/FAIL]
   - Result: $________ (Expected: $20,865,638)

✅ Test 3 - Ribbon Board (100x3 @ 10mm, Curved, 35%):
   - Calculation: [PASS/FAIL]
   - Result: $________ (Expected: $3,803,077)

✅ Test 4 - Audit Export:
   - Download link generated: [PASS/FAIL]
   - Excel file downloads: [PASS/FAIL]
   - 8 tabs exist: [PASS/FAIL]
   - Formula Reference tab complete: [PASS/FAIL]

NOTES:
________________________________________________
________________________________________________

OVERALL STATUS: [PASS/FAIL]
```

---

## 🎉 YOU'RE READY TO TEST!

Follow these steps in order, and you'll verify the entire ANC Formula Bank implementation is working end-to-end.

**Good luck! 🚀**

---

**Last Updated:** January 15, 2026
**Version:** ANC Formula Bank 1.0
**Status:** Ready for Testing ✅
