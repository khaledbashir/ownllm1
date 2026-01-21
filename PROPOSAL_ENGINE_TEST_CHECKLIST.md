# 🧪 ANC Proposal Engine - Quick Test Checklist

**Last Updated:** January 21, 2026  
**Component:** ProposalPreviewSlider  
**Status:** ✅ Ready for Testing

---

## ⚡ 5-Minute Quick Test

- [ ] **Open Proposal Slider**
  - Go to chat with a proposal
  - Click toggle button (blue "QUOTE" button on right side)
  - Slider should open on right side

- [ ] **Tab 1: Project**
  - [ ] Enter client name → Should accept text
  - [ ] Select environment (Indoor/Outdoor) → Dropdown should work
  - [ ] No recalculation happens on this tab (project data only)

- [ ] **Tab 2: Specs**
  - [ ] Change width from 20 to 30 → Costs should update instantly
  - [ ] Change height from 10 to 15 → Screen area should recalculate
  - [ ] Change pixel pitch (4mm → 1.5mm) → Hardware cost should increase
  - [ ] Screen Area box should show: width × height in sq ft

- [ ] **Tab 3: Costs**
  - [ ] Drag margin slider from 30% → 50% → Price should increase in real-time
  - [ ] Drag margin slider from 50% → 20% → Price should decrease instantly
  - [ ] All line items should show: Hardware, Structural, Labor, Expense, etc.
  - [ ] Final price should be bold at bottom

- [ ] **Tab 4: Output**
  - [ ] Should show "Incomplete Quote" warning if Specs tab is empty
  - [ ] Should show "Ready to Export" if all fields filled
  - [ ] "Download Client PDF" button should be enabled
  - [ ] "Generate Excel Audit" button should be enabled

- [ ] **Test PDF Download**
  - [ ] Click "Download Client PDF"
  - [ ] Button should show "Generating PDF..."
  - [ ] Wait 5-10 seconds
  - [ ] File should download to Downloads folder
  - [ ] File name should be "ANC_Proposal_ClientName_*.pdf"
  - [ ] PDF should open in viewer (validate briefly)

- [ ] **Test Excel Download**
  - [ ] Click "Generate Excel Audit"
  - [ ] Button should show "Generating Excel..."
  - [ ] Wait 5-10 seconds
  - [ ] File should download to Downloads folder
  - [ ] File name should be "ANC_Audit_ClientName_*.xlsx"
  - [ ] Excel should open in spreadsheet app

---

## 🔍 Detailed Test Scenarios

### Scenario 1: Live Calculation Test

```
Setup:
- Width: 20 ft
- Height: 10 ft
- Pixel Pitch: 4mm
- Margin: 30%
- Expected Final Price: ~$100,000 (approximate)

Test Steps:
1. Go to Specs tab
2. Change width to 30 ft
3. CHECK: Costs tab should immediately show higher price
4. Change height to 15 ft
5. CHECK: Final price should be even higher
6. Go to Costs tab
7. Drag margin slider to 50%
8. CHECK: Final price should increase significantly
9. Drag margin slider to 20%
10. CHECK: Final price should decrease
```

**Expected Outcome:**
- ✅ No delays - all updates should be instant
- ✅ Numbers should be higher with larger dimensions
- ✅ Numbers should be higher with higher margin

---

### Scenario 2: Data Integrity Test

```
Setup:
- Complete all Specs fields
- Go to Costs tab and note final price (e.g., $125,000)
- Download PDF
- Download Excel

Test Steps:
1. Open downloaded PDF
2. Look for final price line
3. CHECK: Should match $125,000
4. Open downloaded Excel
5. Look for "Project Grand Total" row
6. CHECK: Should match $125,000
7. Look for line items:
   - Hardware cost
   - Structural cost
   - Labor cost
   - Expense cost
8. CHECK: All should match what was shown in UI
```

**Expected Outcome:**
- ✅ PDF shows same price as UI preview
- ✅ Excel shows same price as UI preview
- ✅ All line items match between preview and files

---

### Scenario 3: Mobile Responsiveness

```
Test Steps:
1. Open on mobile device (or resize browser to mobile width)
2. Click toggle button to open slider
3. CHECK: Slider should be full-width or nearly full
4. CHECK: Tabs should be readable (may hide text, show icons)
5. Try scrolling through all tabs
6. CHECK: All inputs should be accessible
7. Try downloading PDF
8. CHECK: Should work on mobile too
```

**Expected Outcome:**
- ✅ No horizontal scrolling needed
- ✅ All buttons are tap-able
- ✅ All inputs are usable
- ✅ Downloads work on mobile

---

### Scenario 4: Error Handling

```
Test Steps:
1. Leave Specs tab empty (no width/height)
2. Go to Output tab
3. CHECK: Should show "Incomplete Quote" warning
4. Try clicking "Download PDF" button
5. CHECK: Button should be disabled (gray)
6. Go back to Specs tab
7. Enter width=20, height=10
8. Go back to Output tab
9. CHECK: Should show "Ready to Export" message
10. CHECK: Buttons should be enabled (colored)
```

**Expected Outcome:**
- ✅ Incomplete state is clearly indicated
- ✅ Buttons disable/enable based on data completeness
- ✅ User can't accidentally try to download incomplete quote

---

### Scenario 5: Product Switching Test

```
Setup:
- Width: 24 ft
- Height: 10 ft

Test Steps:
1. Go to Specs tab
2. Set Product Class: "Scoreboard"
3. Set Pixel Pitch: 4mm
4. Go to Costs tab
5. Note final price: P1
6. Go back to Specs tab
7. Change Product Class to "Ribbon Board"
8. Go to Costs tab
9. CHECK: Final price should be different (P2 ≠ P1)
10. Check which is higher
11. Repeat with Premium vs Scoreboard
```

**Expected Outcome:**
- ✅ Different product classes result in different prices
- ✅ Premium class should be most expensive
- ✅ Price changes instantly (no button click needed)

---

## 📋 Console Error Check

Before declaring "done", open browser DevTools (F12) and check Console tab:
- [ ] No red error messages
- [ ] No "Uncaught" exceptions
- [ ] Only info/warning messages (acceptable)

---

## 📲 Cross-Browser Test

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge (if on Windows)

Each browser should:
- [ ] Render slider without layout breaks
- [ ] Allow all inputs and downloads
- [ ] Show proper colors/fonts

---

## ⚙️ Backend Verification

Before testing file downloads, verify:

```bash
# Check if endpoint exists
curl -X POST http://localhost:3001/api/workspace/test/generate-proposal \
  -H "Content-Type: application/json" \
  -d '{"width": 20, "height": 10, "clientName": "Test"}'

# Should return JSON with success: true and download URLs
```

If endpoint returns error:
- [ ] Check server is running
- [ ] Check `/server/endpoints/proposals.js` exists
- [ ] Check API routes are registered in main server file

---

## 🎯 Pass/Fail Criteria

### MUST PASS (Blocking)
- [ ] Margin slider updates final price in real-time (while dragging)
- [ ] Height/width changes update screen area instantly
- [ ] PDF button downloads a real file
- [ ] Excel button downloads a real file
- [ ] Numbers in PDF/Excel match UI preview
- [ ] No console errors

### SHOULD PASS (Nice to Have)
- [ ] Works on mobile
- [ ] Responsive design looks good
- [ ] All tabs fully functional
- [ ] Proper error messages for incomplete data
- [ ] Download buttons disable when appropriate

### COULD PASS (Future)
- [ ] Batch download (both files at once)
- [ ] Export to other formats (CSV, JSON)
- [ ] Share URL with pre-filled data
- [ ] Email PDF directly

---

## 🚨 Common Issues & Fixes

### Issue: "No PDF file downloaded"
**Possible Causes:**
- Backend service not running
- `/api/system/download/` endpoint not implemented
- File not actually generated on server

**Fix:**
- Check server logs for generation errors
- Verify file exists in `/server/storage/documents/`
- Check `/api/system/download/` endpoint in routes

---

### Issue: "Costs don't update when I type width/height"
**Possible Causes:**
- `calculateANCQuote()` utility not imported
- Calculation engine has bugs
- useMemo dependency not set up correctly

**Fix:**
- Check imports at top of file
- Run manual test: `calculateANCQuote({width: 20, height: 10})`
- Verify useMemo dependencies: `[externalQuoteData]`

---

### Issue: "Margin slider doesn't work"
**Possible Causes:**
- Slider input not connected to handler
- Handler not updating parent state

**Fix:**
- Check `handleFieldChange` is called on slider change
- Verify `onUpdateQuoteData` callback is passed from parent
- Check ChatContainer passes the callback properly

---

### Issue: "Downloaded PDF is blank"
**Possible Causes:**
- Backend PDF generation service failing
- HTML template not rendering properly
- Puppeteer/headless browser issue

**Fix:**
- Check server logs for PDF generation errors
- Test PDF generation directly: `POST /api/workspace/:slug/generate-proposal`
- Check if Puppeteer is installed and working

---

## 📞 Support

If tests fail:
1. Check console for errors (F12 → Console tab)
2. Check server logs: `docker logs everythingllm-server`
3. Verify all required files exist:
   - [ ] `frontend/src/components/ProposalPreviewSlider/index.jsx`
   - [ ] `server/endpoints/proposals.js`
   - [ ] `server/services/AncAuditExcelService.js`
   - [ ] `frontend/src/utils/ancCalculator.js`

---

**Estimated Time to Complete All Tests:** 30 minutes  
**Estimated Time for Quick Test:** 5 minutes  
**Risk Level:** Low (component-only changes)

Good luck! 🚀
