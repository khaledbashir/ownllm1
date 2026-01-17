# ANC Proposal Slider - Complete Testing Guide (A-Z)

## Phase 1: Pre-Deployment Verification

### 1.1 GitHub Commit Status
```bash
# Verify all commits are pushed
git log --oneline | head -5
# Should show:
# 1d0ac8f0 Fix: Replace invalid ChevronLeft icon with CaretLeft
# f9a1230e ANC: Workspace-specific feature gating
# 9d9c7dce ANC: Hardened JSON proposal slider...
```

**✅ Check**: Latest commit contains icon fix

### 1.2 File Structure
```bash
# Verify all new files exist
ls -la frontend/src/components/ProposalPreviewSlider/
ls -la frontend/src/utils/quoteDataParser.js
ls -la frontend/src/utils/ancQuoteSchema.js

# Should see:
# - index.jsx (400+ lines)
# - quoteDataParser.js (150+ lines)
# - ancQuoteSchema.js (schema validation)
```

**✅ Check**: All component files present

### 1.3 System Prompt
```bash
# Verify ANC system prompt has JSON instructions
grep -A 20 "CRITICAL: JSON DATA OUTPUT" ANC_SYSTEM_PROMPT.md

# Should see:
# - "anc_quote_update" type
# - "schemaVersion": 1
# - Field examples
```

**✅ Check**: System prompt has versioned JSON format

---

## Phase 2: Deployment Verification (After EasyPanel Build)

### 2.1 Check Build Success
- ✅ Open EasyPanel console
- ✅ Look for: "Build completed successfully"
- ✅ Frontend should deploy without errors
- ✅ No "ChevronLeft is not exported" errors
- ✅ Server should start on port 3001

**Status**: ⏳ Wait for EasyPanel to build

### 2.2 Verify Deployment
```bash
# Test that application is running
curl -s http://localhost:3001 | head -20

# OR check EasyPanel UI:
# - Green checkmark on frontend
# - Green checkmark on server
# - No error logs
```

**✅ Check**: Application deployed and running

---

## Phase 3: Workspace Setup

### 3.1 Create Test ANC Workspace
**Method 1: Use existing ANC workspace**
```
1. Open dashboard
2. Look for workspace named "anc-sports" or similar
3. If not exists, create new workspace
4. Name it: "ANC Test - Miami Stadium"
5. Set system prompt to: ANC_SYSTEM_PROMPT.md content
```

**Method 2: Clone if already exists**
```
1. Find existing ANC workspace
2. Click "Settings" → "Duplicate Workspace"
3. Name: "ANC Test - Miami Stadium"
4. Deep Clone: YES (copies system prompt)
```

**✅ Check**: Workspace created with ANC system prompt

### 3.2 Verify System Prompt
```
1. Go to workspace settings
2. Look for "System Prompt" or "Agent Persona"
3. Should start with: "You are the ANC Sports Proposal Engine..."
4. Should contain: "ANC_quote_update" type
5. Should have JSON examples
```

**✅ Check**: System prompt correctly set

### 3.3 Create Non-ANC Test Workspace
```
1. Create new workspace
2. Name: "Regular Chat Test"
3. Use default system prompt (NOT ANC)
4. This is for negative testing (slider should NOT appear)
```

**✅ Check**: Non-ANC workspace created for comparison

---

## Phase 4: Slider Visibility Testing

### 4.1 Test ANC Workspace - Slider Should Appear
**Steps:**
```
1. Open ANC workspace ("ANC Test - Miami Stadium")
2. Go to Chat tab
3. Look at right side of screen
4. Should see: Small toggle button on right edge with > arrow
5. Click the arrow to open slider
6. Slider should slide in from right
7. Header should say "📋 Proposal Preview"
8. Two tabs: "Specs" and "Pricing"
9. Message: "Start a conversation..."
```

**✅ Check**: Slider appears and opens/closes

### 4.2 Test Non-ANC Workspace - Slider Should NOT Appear
**Steps:**
```
1. Open Regular Chat workspace
2. Go to Chat tab
3. Look at right side
4. Should see: NO toggle button
5. NO slider visible
6. Chat works normally without slider
```

**✅ Check**: Slider only shows in ANC workspaces

---

## Phase 5: Conversation Flow Testing

### 5.1 Simple User Input
**Steps:**
```
1. In ANC workspace, type: "I need a 40x20 outdoor LED display"
2. Press Enter
3. Watch AI response
4. AI should:
   - Acknowledge the request naturally
   - Ask ONE next question (not multiple)
   - Output JSON block at end
```

**Expected AI Response:**
```
"Great! A 40x20 outdoor display is a solid choice. 
That's 800 square feet of display area.

Now, what pixel pitch would you prefer? 
10mm is standard for long-distance viewing...

```json
{"width": 40, "height": 20, "environment": "Outdoor", "screenArea": 800}
```
```

**✅ Check**: AI responds naturally + outputs JSON

### 5.2 Verify JSON Not Visible to User
**Steps:**
```
1. After AI responds, look at chat
2. You should see: "Great! A 40x20 outdoor display..."
3. You should NOT see: The JSON block
4. Chat should look clean and professional
```

**✅ Check**: JSON hidden from chat view

### 5.3 Verify Slider Updates
**Steps:**
```
1. After first response, slider should auto-open
2. Click "Specs" tab if not already selected
3. Should show:
   - Width: 40 ft
   - Height: 20 ft
   - Environment: Outdoor
   - Screen Area: 800 sqft
   - Pixel Pitch: (empty, not answered yet)
```

**✅ Check**: Slider displays extracted data

---

## Phase 6: Progressive Data Collection

### 6.1 Answer Second Question
**Steps:**
```
1. User: "10mm pixel pitch"
2. AI responds with next question
3. AI outputs JSON: {"pixelPitch": "10"}
```

**Check Slider:**
```
1. Specs tab should update
2. Pixel Pitch now shows: "10mm"
3. Previous data (width, height, etc.) still there
```

**✅ Check**: Data merges correctly

### 6.2 Answer Third Question
**Steps:**
```
1. User: "New installation, full service"
2. AI continues asking
3. AI outputs JSON with new fields
```

**Check Slider:**
```
1. More fields fill in
2. No data is lost
3. "Pricing" tab still shows "No pricing yet"
```

**✅ Check**: Progressive data building works

### 6.3 Complete All Questions
**Steps:**
```
1. Continue answering until all fields complete:
   - Width ✓
   - Height ✓
   - Environment ✓
   - Pixel Pitch ✓
   - Service Level ✓
   - Power Distance ✓
   - etc. (11-15 fields)
```

**AI Should Announce:**
```
"Perfect! I have everything I need. 
Here's your proposal preview:"

```json
{
  "type": "anc_quote_update",
  "schemaVersion": 1,
  "fields": {
    "width": 40,
    "height": 20,
    ...
    "finalPrice": 4594286
  },
  "status": "complete"
}
```
```

**✅ Check**: All fields collected

---

## Phase 7: Pricing Display Testing

### 7.1 View Pricing Tab
**Steps:**
```
1. Slider should be open
2. Click "Pricing" tab
3. Should display:
   - Hardware Cost: $2,000,000
   - Structural Cost: $400,000
   - Labor Cost: $600,000
   - PM Fee: $216,000
   - Total Cost: $3,216,000
   - Final Client Price: $4,594,286 (highlighted in blue)
```

**Verify Calculations:**
```
Hardware = 40ft × 20ft × 2500/sqft = 2,000,000 ✓
Structural = 2,000,000 × 0.20 = 400,000 ✓
Labor = (800/100) × 40hrs × $150 = 600,000 ✓
PM Fee = (2,000,000 + 400,000 + 600,000) × 0.08 = 216,000 ✓
```

**✅ Check**: Pricing calculates correctly

### 7.2 Verify Button States
**Before Complete:**
```
1. Before all fields answered
2. Buttons should be DISABLED (gray)
3. Hover shows tooltip
4. Click does nothing
```

**After Complete:**
```
1. After all fields answered
2. Buttons should be ENABLED (green/purple)
3. Hover shows action
4. Click triggers generation
```

**✅ Check**: Buttons enable only when data complete

---

## Phase 8: File Generation Testing

### 8.1 Generate Excel Audit
**Steps:**
```
1. All data complete in slider
2. Click "Generate Excel Audit" button (green)
3. Button shows loading spinner
4. Wait 5-10 seconds
5. Toast notification: "Excel proposal generated"
6. File downloads: "proposal_TIMESTAMP.xlsx"
```

**Check Excel File:**
```
1. Open downloaded file in Excel
2. Should contain:
   - Client name: "Miami Stadium"
   - Specifications tab with all data
   - Pricing tab with formulas (not static values)
   - Summary with final price
   - Professional formatting
```

**✅ Check**: Excel generates and downloads

### 8.2 Download PDF
**Steps:**
```
1. Click "Download PDF" button (purple)
2. Button shows loading spinner
3. Wait 5-10 seconds
4. Toast notification: "PDF proposal downloaded"
5. File downloads: "proposal_TIMESTAMP.pdf"
```

**Check PDF File:**
```
1. Open downloaded file
2. Should contain:
   - ANC Sports branding
   - Client name and date
   - Full specifications
   - Pricing breakdown
   - Terms and conditions
   - Professional layout
```

**✅ Check**: PDF generates and downloads

---

## Phase 9: Error Handling Testing

### 9.1 Invalid JSON Handling
**Steps:**
```
1. Manually inspect browser console (F12)
2. In System Prompt, intentionally break JSON:
   ```json
   {"width": 40, "height": INVALID}
   ```
3. AI sends response with broken JSON
4. Should see in console: "Failed to parse JSON" (error logged)
5. Chat continues normally (no crash)
6. Slider does NOT update with bad data
```

**✅ Check**: Graceful error handling

### 9.2 Validation Failure
**Steps:**
```
1. AI outputs JSON with unknown fields:
   ```json
   {"width": 40, "maliciousField": "hack"}
   ```
2. Backend validation rejects unknown keys
3. Console shows: "Validation failed" (error logged)
4. Slider ignores bad data
5. Chat continues normally
```

**✅ Check**: Schema validation blocks bad data

### 9.3 Payload Size Limit
**Steps:**
```
1. AI tries to output massive JSON (>5KB)
2. Frontend detects size limit
3. Logs: "Payload too large"
4. JSON is ignored (not merged)
5. Slider unaffected
```

**✅ Check**: DOS protection works

### 9.4 Network Error (Download Failure)
**Steps:**
```
1. Simulate network error (DevTools > Network > Offline)
2. Click "Download PDF"
3. After timeout, toast shows: "Failed to download PDF"
4. No silent failure
5. User knows something went wrong
```

**✅ Check**: Error feedback shown

---

## Phase 10: Edge Cases & Boundaries

### 10.1 Minimum Data
**Steps:**
```
1. Only provide: "40x20"
2. Slider shows: Width, Height, Screen Area
3. Pricing tab shows: "Not enough data"
4. Download buttons: DISABLED
```

**✅ Check**: Partial data handled gracefully

### 10.2 Workspace Switching
**Steps:**
```
1. In ANC workspace, start conversation
2. Slider opens with data
3. Switch to non-ANC workspace
4. Switch back to ANC workspace
5. Slider state persists correctly
```

**✅ Check**: State maintained across workspace switches

### 10.3 Browser Refresh
**Steps:**
```
1. In ANC workspace with slider showing data
2. Press F5 (refresh page)
3. Chat history reloads
4. Slider reappears with same data
5. JSON parsing re-runs automatically
```

**✅ Check**: Slider recovers on page reload

### 10.4 Multiple Workspaces Open
**Steps:**
```
1. Open two browser tabs
2. Tab A: ANC workspace
3. Tab B: Non-ANC workspace
4. Tab A: Slider visible ✓
5. Tab B: Slider NOT visible ✓
6. Each workspace independent
```

**✅ Check**: No interference between workspaces

---

## Phase 11: Performance Testing

### 11.1 JSON Parsing Speed
**Steps:**
```
1. Monitor browser console (DevTools > Performance)
2. Send message with JSON
3. JSON parsing should complete <100ms
4. Slider update should be instant
5. No noticeable lag
```

**✅ Check**: JSON parsing is fast

### 11.2 Large Slider Data
**Steps:**
```
1. Add many proposal fields to JSON
2. Slider renders all without lag
3. Tab switching is smooth
4. Scrolling is responsive
```

**✅ Check**: Slider handles large datasets

### 11.3 Rapid Message Sending
**Steps:**
```
1. Send 5 messages quickly
2. Each gets JSON block
3. Slider updates for each
4. No race conditions
5. Latest data wins
```

**✅ Check**: Handles rapid updates

---

## Phase 12: Mobile Testing

### 12.1 Mobile Slider Display
**Steps (on mobile or DevTools):**
```
1. Open ANC workspace on mobile
2. Slider should NOT be visible by default
3. Should see: Full-width chat
4. Toggle button at bottom-right (or side)
5. Click toggle
6. Slider expands full-width
7. Chat moves behind
8. Can click outside to close
```

**✅ Check**: Mobile layout works

### 12.2 Mobile Data Entry
**Steps:**
```
1. Type message on mobile
2. Submit
3. Slider updates
4. Can see all fields
5. Can tap buttons
6. Downloads work
```

**✅ Check**: Mobile interaction works

### 12.3 Mobile Download
**Steps:**
```
1. On mobile, click "Download PDF"
2. File downloads to device
3. Can open in mobile PDF viewer
4. Formatting looks good on small screen
```

**✅ Check**: Mobile downloads work

---

## Phase 13: Logging & Audit Trail

### 13.1 Check Browser Console
**Steps:**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Send ANC message
4. Should see logs like:
   ```
   [ANC Quote Update] {
     timestamp: "2024-01-17T10:30:45.123Z",
     fieldsUpdated: ["width", "height"],
     validationPassed: true,
     hasMinimumData: false
   }
   ```
```

**✅ Check**: Audit logging works

### 13.2 Check Network Requests
**Steps:**
```
1. DevTools > Network tab
2. Click "Generate Excel"
3. Should see POST to: `/api/workspace/:slug/generate-proposal`
4. Request body contains: width, height, margin, outputFormat
5. Response: 200 OK with download URL
```

**✅ Check**: API requests correct

---

## Phase 14: Regression Testing

### 14.1 Non-ANC Workspaces Still Work
**Steps:**
```
1. Open Regular Chat workspace
2. Chat works normally
3. No errors in console
4. No slider visible
5. Downloads/features unchanged
```

**✅ Check**: No breaking changes to other workspaces

### 14.2 Other Chat Features Still Work
**Steps:**
```
1. In ANC workspace:
   - Upload files: Works ✓
   - Use search: Works ✓
   - Insert notes: Works ✓
   - Code formatting: Works ✓
   - Images in chat: Works ✓
```

**✅ Check**: Slider doesn't break existing features

---

## Phase 15: Load Testing (Optional)

### 15.1 Sustained Conversation
**Steps:**
```
1. Send 20 messages in ANC workspace
2. Each triggers slider update
3. Chat remains responsive
4. Memory usage stable
5. No memory leaks
```

**✅ Check**: Handles sustained use

### 15.2 Large Files
**Steps:**
```
1. Generate PDF for large project (50+ MB)
2. Download completes
3. File is valid
4. Can open without corruption
```

**✅ Check**: Handles large files

---

## Testing Checklist Summary

### Critical Path (Must Pass)
- [ ] Slider appears in ANC workspace only
- [ ] JSON outputs from AI
- [ ] JSON hidden from user view
- [ ] Slider updates with data
- [ ] Pricing calculates correctly
- [ ] Excel downloads
- [ ] PDF downloads
- [ ] No errors in console

### Important (Should Pass)
- [ ] Workspace switching maintains state
- [ ] Page refresh preserves data
- [ ] Error handling graceful
- [ ] Mobile view works
- [ ] Non-ANC workspaces unaffected
- [ ] Other chat features work

### Nice to Have (Good to Know)
- [ ] Performance is fast
- [ ] Audit logs are detailed
- [ ] Large datasets handled
- [ ] Rapid updates handled
- [ ] Network errors handled

---

## Troubleshooting Guide

### Slider Doesn't Appear
```
✗ Problem: Slider not visible in ANC workspace
✓ Check: 
  1. Is workspace.inlineAiSystemPrompt set?
  2. Does it contain "ANC Sports Proposal Engine"?
  3. F12 > Console: Is isANCWorkspace true?
✓ Fix: Verify system prompt is correctly saved
```

### JSON Not Updating Slider
```
✗ Problem: AI outputs JSON but slider doesn't update
✓ Check:
  1. F12 > Console: Do you see "Failed to parse JSON"?
  2. Is JSON valid (test with JSON.parse)?
  3. Does JSON contain required fields?
✓ Fix: Check system prompt JSON format
```

### Buttons Don't Enable
```
✗ Problem: Download buttons stay disabled
✓ Check:
  1. Is finalPrice > 0?
  2. Are width, height, environment all set?
  3. F12 > Console: What does quoteData contain?
✓ Fix: Need all required fields (check hasMinimumQuoteData)
```

### Download Fails
```
✗ Problem: Excel/PDF download fails
✓ Check:
  1. Is `/api/workspace/:slug/generate-proposal` endpoint available?
  2. Check server logs for errors
  3. Is workspace slug correct?
✓ Fix: Verify backend API is deployed
```

### Mobile Slider Broken
```
✗ Problem: Slider not working on mobile
✓ Check:
  1. Is viewport properly set?
  2. Are touchevents firing?
  3. Is z-index high enough?
✓ Fix: Check responsive CSS classes
```

---

## Sign-Off Checklist

When all tests pass, sign off:

```
✅ Phase 1: Pre-Deployment Verification - PASSED
✅ Phase 2: Deployment Verification - PASSED
✅ Phase 3: Workspace Setup - PASSED
✅ Phase 4: Slider Visibility - PASSED
✅ Phase 5: Conversation Flow - PASSED
✅ Phase 6: Progressive Data Collection - PASSED
✅ Phase 7: Pricing Display - PASSED
✅ Phase 8: File Generation - PASSED
✅ Phase 9: Error Handling - PASSED
✅ Phase 10: Edge Cases - PASSED
✅ Phase 11: Performance - PASSED
✅ Phase 12: Mobile - PASSED
✅ Phase 13: Logging - PASSED
✅ Phase 14: Regression - PASSED
✅ Phase 15: Load Testing - PASSED

FINAL STATUS: ✅ PRODUCTION READY
Date: 2024-01-17
Tester: [Your Name]
```

---

**Total Test Cases**: 70+
**Estimated Time**: 2-3 hours
**Critical Tests**: 8
**Nice-to-Have Tests**: 6

Start testing! 🚀
