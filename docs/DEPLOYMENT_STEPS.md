# ANC Estimator Deployment Steps (Easypanel Production)

## 📋 Overview

Since you deploy via Git push → Easypanel auto-build, here's the production workflow.

---

## Step 1: Review the Deliverables

Check what we've created:

```bash
cd /root/everythingllm/ownllm1
ls -la docs/ANC_*
```

You should see:
- `ANC_ESTIMATOR_SMART_PLUGIN.json` - Smart plugin config
- `ANC_MODE_ACTIVATION.sql` - Database activation script
- `ANC_MODE_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `ANC_AGENT_BUILDER_FLOW.json` - Agent builder flow
- `ANC_QUICKSTART.sh` - One-command setup script
- `ANC_SOLUTION_SUMMARY.md` - Executive summary

**All of these are now in your codebase and will be deployed to Easypanel.**

---

## Step 2: Verify the ANC System Prompt

The ANC prompt is already in your codebase at:
`server/prompts/systemPrompts.js` (lines 23-98)

**No changes needed here.** It's production-ready.

You can verify it exists:

```bash
grep -A 5 "const SYSTEM_PROMPTS" server/prompts/systemPrompts.js
```

You should see:
```javascript
const SYSTEM_PROMPTS = {
  agency: `...`,
  anc: `### ROLE
You are an **ANC Senior Estimator**. Your job is to convert client requests...
```

---

## Step 3: Commit and Push to GitHub

This triggers the Easypanel build.

```bash
cd /root/everythingllm/ownllm1

# Check what changed
git status

# Add all new files
git add docs/ANC_*.json
git add docs/ANC_*.md
git add docs/ANC_*.sh
git add docs/ANC_*.sql

# Commit
git commit -m "feat: Add ANC Estimator with Smart Plugin and Activation Script

- Add ANC Estimator Smart Plugin with Golden Formula rules
- Add ANC mode activation SQL script
- Add implementation guide and quickstart script
- Add Agent Builder flow for multi-turn interviews
- ANC system prompt already exists in systemPrompts.js"

# Push to GitHub (replace with your repo)
git push origin main
```

---

## Step 4: Wait for Easypanel Auto-Build

1. Go to your Easypanel dashboard
2. Find your EverythingLLM service
3. Watch the build logs
4. Wait for deployment to complete (typically 5-10 minutes)

---

## Step 5: SSH into VPS and Run Activation Script

Once Easypanel finishes deploying, SSH in and activate ANC mode:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to app directory
cd /root/everythingllm/ownllm1

# Run the activation script
./docs/ANC_QUICKSTART.sh
```

**What this script does:**
1. Sets `activeLogicModule = 'anc'` in the database
2. Installs the ANC Product Catalog (5 products with pricing)
3. Creates the ANC Estimator Smart Plugin (via API if API key provided)

---

## Step 6: Test the ANC Estimator

Open EverythingLLM in your browser and test:

**Test 1: Basic Request**
```
I need a quote for ABCDE Company, Ribbon 10mm display, 20 feet high by 40 feet wide.
```

**Expected Response:**
```
I need a few more details to provide an accurate quote:

1. Environment: Indoor or Outdoor?
2. Service Access: Front, Rear, or Both?
3. Curvature: Straight, Curved, Concave, or Convex?
4. Client Address: What is the client's address for the quote?
```

**Test 2: Complete Request**
```
I need a quote for ABCDE Company, Ribbon 10mm display, 20 feet high by 40 feet wide,
outdoor, rear service, straight. Address: 123 Main St, Anytown, USA.
```

**Expected Response:**
Full ANC Sales Quotation with:
- ABCDE company header
- Specifications table (Pitch, Qty, Height, Width, Resolution)
- Legal language with client address
- Pricing breakdown (7 line items + Subtotal + Tax 9.5% + Total)
- Included section
- Signature blocks
- Payment terms (50/25/25)
- JSON block at end for system

---

## Step 7: (Optional) Customize Products

If you need to adjust products, update the database:

```bash
sqlite3 storage/documents/AnythingLLM.db

# View current catalog
SELECT ancProductCatalog FROM workspaces WHERE id = 1;

# Update with custom pricing
UPDATE workspaces
SET ancProductCatalog = '[
  {
    "productName": "Ribbon 10mm",
    "baseCostPerSqFt": 350.00,  -- Updated price
    ...
  }
]'
WHERE id = 1;
```

---

## Step 8: (Optional) Adjust Margins

If you need to change margins, update the Smart Plugin prompt:

```bash
# Find the smart plugin in database
sqlite3 storage/documents/AnythingLLM.db

# View plugins
SELECT id, name FROM smart_plugins;

# Update the prompt (replace {plugin_id})
UPDATE smart_plugins
SET uiConfig = '{
  "prompt": "### ANC ESTIMATOR CALCULATION RULES\n\n...
... Structural Margin: 18% of Base Cost ...",  -- Updated from 15%
  ...
}'
WHERE id = {plugin_id};
```

---

## 🔍 Troubleshooting

### ANC Mode Not Activating

**Check:**
```bash
sqlite3 storage/documents/AnythingLLM.db
SELECT id, name, activeLogicModule FROM workspaces WHERE id = 1;
```

**Expected output:** `activeLogicModule` should be `anc`

**Fix:**
```bash
UPDATE workspaces
SET activeLogicModule = 'anc'
WHERE id = 1;
```

### Smart Plugin Not Found

**Check:**
```bash
sqlite3 storage/documents/AnythingLLM.db
SELECT id, name, active FROM smart_plugins WHERE name LIKE '%ANC%';
```

**Expected output:** Should see "ANC Estimator Logic"

**Fix:**
```bash
# Manually insert the plugin (replace values)
INSERT INTO smart_plugins (workspaceId, name, description, schema, uiConfig, active)
VALUES (
  1,
  'ANC Estimator Logic',
  'ANC Senior Estimator calculation rules',
  '{ "type": "object", "properties": {...} }',
  '{ "prompt": "...", "icon": "calculator", "color": "#FF5722" }',
  1
);
```

### Product Catalog Missing

**Check:**
```bash
sqlite3 storage/documents/AnythingLLM.db
SELECT ancProductCatalog FROM workspaces WHERE id = 1;
```

**Expected output:** JSON array with 5 products

**Fix:** Run `ANC_MODE_ACTIVATION.sql` script

---

## 📊 Quick Reference

| Task | Command |
|------|---------|
| Check ANC mode status | `sqlite3 storage/documents/AnythingLLM.db "SELECT activeLogicModule FROM workspaces WHERE id=1;"` |
| View product catalog | `sqlite3 storage/documents/AnythingLLM.db "SELECT ancProductCatalog FROM workspaces WHERE id=1;"` |
| View smart plugins | `sqlite3 storage/documents/AnythingLLM.db "SELECT id, name, active FROM smart_plugins;"` |
| Activate ANC mode | `sqlite3 storage/documents/AnythingLLM.db "UPDATE workspaces SET activeLogicModule='anc' WHERE id=1;"` |
| Run full activation | `./docs/ANC_QUICKSTART.sh` |

---

## 🎯 Summary

1. ✅ ANC system prompt already exists in codebase
2. ✅ Smart plugin config committed to Git
3. ✅ Activation script committed to Git
4. ⏳ Push to GitHub → Easypanel builds
5. ⏳ SSH into VPS → Run activation script
6. ⏳ Test in EverythingLLM UI
7. ✅ ANC Estimator live in production!

**Total time to production: ~15 minutes**
