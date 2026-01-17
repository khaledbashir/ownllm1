# ANC Slider - QUICK TEST (Just Do This)

## STEP 1: Create Test Workspace
```
1. Go to Dashboard
2. Find "anc-sports" workspace (or any ANC workspace)
3. Click "Settings" button
4. Click "Duplicate Workspace"
5. Name: "Test Miami" 
6. Check "Deep Clone" ✓
7. Click "Create"
8. Wait 30 seconds...
```

**Result**: New workspace "Test Miami" created with ANC system prompt

---

## STEP 2: Open Test Workspace
```
1. Click on "Test Miami" workspace
2. Go to "Chat" tab
3. Look at RIGHT SIDE of screen
```

**Check**: 
- ✓ See small button on right edge with `>` arrow? = **GOOD** (slider working)
- ✗ No button on right? = **BAD** (system prompt not set)

---

## STEP 3: Test Basic Conversation
```
1. Type in chat box: "I need a 40 by 20 feet outdoor LED display, 10mm pixel pitch"
2. Press Enter
3. Wait for AI response (30 seconds)
```

**Check**:
- ✓ AI responds naturally? = **GOOD**
- ✓ Slider automatically opens on right? = **GOOD**
- ✗ No slider opened? = **BAD**

---

## STEP 4: Check Slider Data
```
1. Look at open slider on right
2. Make sure "Specs" tab is selected
3. Look for:
   - Width: 40 ft
   - Height: 20 ft
   - Environment: Outdoor
   - Pixel Pitch: 10mm
   - Screen Area: 800 sqft
```

**Check**:
- ✓ All data shows? = **GOOD**
- ✗ Empty or wrong values? = **BAD** (check AI response)

---

## STEP 5: Check JSON Hidden
```
1. Look at chat message from AI
2. Does it show the ```json block?
```

**Check**:
- ✓ NO JSON visible = **GOOD** (hidden as intended)
- ✗ JSON visible = **BAD** (code block not hidden)

---

## STEP 6: Continue Answering Questions
```
AI asks: "How far from power source?"
1. Type: "300 feet"
2. Press Enter
3. Wait for response
4. Check slider updates
```

**Check**:
- ✓ Slider updates with new field? = **GOOD**
- ✓ Old data (width, height) still there? = **GOOD**

---

## STEP 7: Answer Until Complete
```
Keep answering AI questions until you get to:
"Perfect! I have everything I need."

Answer these fields (in any order):
- Width/Height: 40x20 ✓
- Environment: Outdoor ✓
- Pixel Pitch: 10mm ✓
- Service Level: Full Install
- Power Distance: 300 feet
- Steel Type: New
- etc. (keep answering)
```

**Check**:
- ✓ AI stops asking = **All data collected**

---

## STEP 8: Check Pricing Tab
```
1. Slider should still be open
2. Click "Pricing" tab
3. Look for:
   - Hardware Cost: $2,000,000
   - Structural Cost: $400,000
   - Labor Cost: $600,000
   - PM Fee: $216,000
   - FINAL CLIENT PRICE: (large number in blue box)
```

**Check**:
- ✓ Numbers showing? = **GOOD**
- ✗ "No pricing" message? = **BAD** (not enough data yet)

---

## STEP 9: Download Excel
```
1. Slider has two buttons at bottom:
   - Green button: "Generate Excel Audit"
   - Purple button: "Download PDF"

2. Click GREEN button ("Generate Excel Audit")
3. Button shows spinning icon (loading)
4. Wait 10 seconds...
5. Green notification pops up: "Excel proposal generated"
6. Check Downloads folder: "proposal_*.xlsx" file there
```

**Check**:
- ✓ File downloaded? = **GOOD**
- ✗ Error message? = **BAD** (server issue)

---

## STEP 10: Check Excel File
```
1. Open Downloads folder
2. Find: proposal_XXXXX.xlsx
3. Open in Excel or Google Sheets
4. Should see:
   - Tab 1: Client Info (name, date)
   - Tab 2: Specifications (all your answers)
   - Tab 3: Pricing (costs with FORMULAS, not static)
   - Tab 4: Summary (final price)
5. Numbers should match slider pricing
```

**Check**:
- ✓ File opens? = **GOOD**
- ✓ Data matches slider? = **GOOD**
- ✗ File corrupted? = **BAD**

---

## STEP 11: Download PDF
```
1. Go back to browser
2. Click PURPLE button ("Download PDF")
3. Button shows spinning icon
4. Wait 10 seconds...
5. Purple notification: "PDF proposal downloaded"
6. Check Downloads: "proposal_*.pdf" file
```

**Check**:
- ✓ File downloaded? = **GOOD**

---

## STEP 12: Check PDF File
```
1. Open proposal_*.pdf
2. Should show:
   - ANC Sports logo/branding
   - Client name: Test Miami
   - Date
   - Display specifications (40x20, 10mm, etc)
   - Pricing breakdown
   - Professional formatting
3. Compare final price to slider
```

**Check**:
- ✓ PDF looks professional? = **GOOD**
- ✓ Prices match? = **GOOD**

---

## STEP 13: Test Non-ANC Workspace (Negative Test)
```
1. Create NEW workspace (not cloned from ANC)
2. Name: "Regular Chat"
3. Use default system prompt (don't change)
4. Go to Chat
5. Look at RIGHT SIDE
```

**Check**:
- ✓ NO slider visible? = **GOOD** (feature correctly disabled)
- ✗ Slider appears? = **BAD** (should only appear in ANC workspaces)

---

## STEP 14: Test Mobile View
```
1. On same browser, press F12 (DevTools)
2. Click phone icon (toggle device toolbar)
3. Go back to "Test Miami" workspace
4. Look at chat
```

**Check**:
- ✓ Slider appears as full-width overlay? = **GOOD**
- ✓ Can close and open it? = **GOOD**
- ✓ Download buttons work? = **GOOD**

---

## STEP 15: Error Test (F12 Console)
```
1. Press F12 (open DevTools)
2. Go to "Console" tab
3. Try downloading a file
4. Look for messages
```

**Check**:
- ✓ See "[ANC Quote Update]" logs? = **GOOD** (audit trail working)
- ✓ Timestamp visible? = **GOOD** (logging working)
- ✗ Errors in red? = **BAD**

---

## FINAL CHECKLIST

Copy this, check them off:

```
CRITICAL TESTS (must all pass):
☐ Slider appears in ANC workspace
☐ Slider does NOT appear in regular workspace
☐ AI outputs JSON
☐ JSON is hidden from chat
☐ Slider shows correct data
☐ Pricing tab shows costs
☐ Excel downloads
☐ PDF downloads

SHOULD WORK (test if you want):
☐ Mobile view
☐ Console logs
☐ Data persists after refresh
☐ Error handling graceful

IF ALL CHECKMARKS ✓ = EVERYTHING WORKS
```

---

## QUICK TROUBLESHOOT

**Slider doesn't appear:**
- Check: Is system prompt set to "ANC Sports Proposal Engine"?
- Fix: Go to workspace settings, paste ANC system prompt

**AI doesn't output JSON:**
- Check: Is system prompt correct?
- Fix: Copy-paste full ANC_SYSTEM_PROMPT.md content

**Excel/PDF download fails:**
- Check: Is server running?
- Check: Network tab in F12 - what's the error?
- Fix: Wait for EasyPanel build to complete

**Download works but file is empty:**
- Check: Did you answer all questions?
- Check: Is finalPrice > 0?
- Fix: Need width, height, environment, pixelPitch at minimum

---

**DONE!** If all steps work = **PRODUCTION READY** ✅
