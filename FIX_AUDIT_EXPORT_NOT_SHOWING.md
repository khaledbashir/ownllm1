# 🔧 ANC_AUDIT_EXPORT Not Showing - FIX GUIDE

## ❌ ISSUE
`ANC_AUDIT_EXPORT` skill is not appearing in Custom Skills list, but `ANC_SYSTEM_INTERNAL_CALCULATOR` is visible.

---

## ✅ FILES ARE CORRECT

### Verified in Docker Storage:
```bash
ls -la /app/server/storage/plugins/agent-skills/ | grep anc-
```

Output shows all ANC skills exist:
- ✅ `anc-audit-export/`
- ✅ `anc-pricing/`
- ✅ `anc-pdf-export/`
- ✅ `anc-publisher/`

### plugin.json is Correct:
- ✅ `hubId: "anc-audit-export"`
- ✅ `active: true`
- ✅ `imported: true`
- ✅ `entrypoint.file: "handler.js"`
- ✅ All `params` defined

### handler.js is Correct:
- ✅ `module.exports.runtime.handler` function
- ✅ Returns a string (not object or undefined)
- ✅ No syntax errors

---

## 🚨 ROOT CAUSE

According to AnythingLLM specification:

> "If you are currently chatting with the agent, you must type **`/exit`** to end the current session before the agent can 'see' new or updated skill."

**You are in an active chat session.** The agent can't see new skills until you:
1. Exit the current session
2. Reload the page
3. Check Agent Skills in settings

---

## 🛠️ FIX STEPS

### STEP 1: Exit Current Session
In your chat window, type:
```
/exit
```

**This ends the current agent session.**

### STEP 2: Refresh the Page
Press **F5** or click browser refresh button.

### STEP 3: Navigate to Workspace Settings
1. Click on **Workspace Settings** (gear icon ⚙️)
2. Click on **Agent Skills** tab
3. Scroll through the list

### STEP 4: Verify ANC_AUDIT_EXPORT Appears
You should now see:
- ✅ `ANC_SYSTEM_INTERNAL_CALCULATOR`
- ✅ `ANC_AUDIT_EXPORT` ← **This should now appear!**

### STEP 5: Enable Both Skills
1. Turn **ON** `ANC_SYSTEM_INTERNAL_CALCULATOR`
2. Turn **ON** `ANC_AUDIT_EXPORT`
3. Click **"Save Changes"**

### STEP 6: Start New Chat
1. Go back to chat interface
2. Start typing new message

---

## 🧪 TEST AFTER FIX

### Test 1: Simple Calculation
```
Calculate a 24ft by 10ft indoor LED display with 1.5mm pixel pitch at 32% margin.
```

**Expected:** Agent calls `ANC_SYSTEM_INTERNAL_CALCULATOR` and returns breakdown

### Test 2: Audit Export
```
Generate internal audit Excel for this quote.
```

**Expected:** Agent calls `ANC_AUDIT_EXPORT` and returns download link

---

## 🔧 IF STILL NOT SHOWING

### Option A: Restart AnythingLLM Server
```bash
# Stop server (Ctrl+C in terminal where server is running)

# Restart server
cd /root/everythingllm/ownllm1/server
yarn dev
```

Wait for: "Primary server in HTTP mode listening on port 3001"

### Option B: Verify Handler.js Syntax
```bash
# Check for JavaScript errors
node -c /app/server/storage/plugins/agent-skills/anc-audit-export/handler.js
```

If no output, file is correct.

### Option C: Check Server Logs
```bash
# Look for skill loading errors
docker logs everythingllm-ownllm1-server-1 2>&1 | grep -i "error\|skill"
```

### Option D: Re-sync Skills
```bash
# Copy skills to Docker storage again
cp -r /root/everythingllm/ownllm1/server/storage/plugins/agent-skills/anc-* /app/server/storage/plugins/agent-skills/

# Restart server
```

---

## 📋 WORKING VS BROKEN SKILLS

### Working (ANC_PRICING):
```
{
  "hubId": "anc-pricing",
  "name": "ANC_SYSTEM_INTERNAL_CALCULATOR",
  "active": true,
  "imported": true
}
```

### Same Structure (ANC_AUDIT_EXPORT):
```
{
  "hubId": "anc-audit-export",
  "name": "ANC_AUDIT_EXPORT",
  "active": true,
  "imported": true
}
```

**Both have identical structure.** The issue is the active session.

---

## ✅ SUCCESS CHECKLIST

- [ ] Type `/exit` in current chat
- [ ] Refresh browser page (F5)
- [ ] Go to Workspace Settings > Agent Skills
- [ ] `ANC_AUDIT_EXPORT` appears in list
- [ ] Enable `ANC_AUDIT_EXPORT`
- [ ] Save changes
- [ ] Start new chat session
- [ ] Test calculation works
- [ ] Test audit export works

---

## 🎯 QUICK FIX (60 seconds)

1. **Type** `/exit` in your chat window
2. **Press** F5 to refresh page
3. **Click** Workspace Settings → Agent Skills
4. **Scroll** to find `ANC_AUDIT_EXPORT`
5. **Enable** the skill
6. **Save** changes
7. **Start** new chat and test

---

**Why This Happens:**
AnythingLLM loads custom skills on page load. If you're in an active session, the agent memory doesn't refresh until you exit and reload.

**Files Are Correct - Just Need to Reload!** 🔄

---

**Last Updated:** January 15, 2026
**Issue:** ANC_AUDIT_EXPORT not visible
**Root Cause:** Active session blocking skill discovery
**Fix:** Type `/exit` and refresh page
