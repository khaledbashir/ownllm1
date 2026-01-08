# ANC Estimator Implementation Guide

## 🎯 Quick Start (3 Steps)

You don't need custom Python endpoints. EverythingLLM already has the infrastructure.

---

## Step 1: Activate ANC Mode for Your Workspace

### Option A: Via Database (Direct SQL)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Connect to EverythingLLM database
cd /root/everythingllm/ownllm1
sqlite3 storage/documents AnythingLLM.db

# Run the activation script
# Replace {workspace_id} with your actual workspace ID
UPDATE workspaces
SET activeLogicModule = 'anc'
WHERE id = 1;  -- Change to your workspace ID
```

### Option B: Via EverythingLLM UI

If your workspace has an "Active Logic Module" setting in the workspace settings, simply select "ANC" from the dropdown.

---

## Step 2: Create ANC Estimator Smart Plugin

### Via API Call

```bash
curl -X POST http://your-easypanel-domain.com/api/workspace/{workspace_id}/smart-plugins \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @docs/ANC_ESTIMATOR_SMART_PLUGIN.json
```

### Via EverythingLLM UI

1. Navigate to your workspace
2. Go to "Smart Plugins" (or "Plugins")
3. Click "Create New Plugin"
4. Copy the contents of `ANC_ESTIMATOR_SMART_PLUGIN.json`
5. Paste into the plugin editor
6. Save

---

## Step 3: Set ANC Product Catalog

### Via API Call

```bash
curl -X PATCH http://your-easypanel-domain.com/api/workspace/{workspace_id} \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ancProductCatalog": [
      {
        "productName": "Ribbon 10mm",
        "category": "Ribbon Displays",
        "pitch": "10mm",
        "baseCostPerSqFt": 325.00,
        "resolution": "30.5 px/ft",
        "notes": "High refresh rate, outdoor-ready",
        "structuralMargin": 0.15,
        "laborMargin": 0.20
      }
    ]
  }'
```

### Via Database

```bash
sqlite3 storage/documents AnythingLLM.db <<EOF
UPDATE workspaces
SET ancProductCatalog = '[
  {
    "productName": "Ribbon 10mm",
    "category": "Ribbon Displays",
    "pitch": "10mm",
    "baseCostPerSqFt": 325.00,
    "resolution": "30.5 px/ft",
    "notes": "High refresh rate, outdoor-ready",
    "structuralMargin": 0.15,
    "laborMargin": 0.20
  },
  {
    "productName": "Ribbon 6mm",
    "category": "Ribbon Displays",
    "pitch": "6mm",
    "baseCostPerSqFt": 550.00,
    "resolution": "50.8 px/ft",
    "notes": "Tight pitch for closer viewing",
    "structuralMargin": 0.15,
    "laborMargin": 0.20
  }
]'
WHERE id = {workspace_id};
EOF
```

---

## 🧪 Test the ANC Estimator

### Test Conversation Flow

**User Message:**
```
I need a quote for ABCDE Company, Ribbon 10mm display, 20 feet high by 40 feet wide.
```

**Expected System Response:**
```
I need a few more details to provide an accurate quote:

1. Environment: Indoor or Outdoor?
2. Service Access: Front, Rear, or Both?
3. Curvature: Straight, Curved, Concave, or Convex?
4. Client Address: What is the client's address for the quote?
```

**User Message:**
```
Outdoor, rear service, straight. Address is 123 Main St, Anytown, USA.
```

**Expected System Response:**
```
ABCDE
SALES QUOTATION
www.anc.com/contact
 NY 914.696.2100 TX 940.464.2320
1

RIBBON SPECIFICATIONS
MM Pitch 10 mm
Quantity 1
Active Display Height (ft.) 20'
Active Display Width (ft.) 40'
Pixel Resolution (H) 610 p
Pixel Resolution (W) 1220 p

This Sales Quotation will set forth the terms by which ABCDE located at 123 Main St, Anytown, USA ("Purchaser"), and ANC Sports Enterprises, LLC, located at 2 Manhattanville Road, Suite 402, Purchase, NY 10577 ("ANC") (collectively, the "Parties") agree that ANC will provide the LED Displays ("Display System") for Stadium, as described below.

RIBBONS PRICING
Reserve Level Ribbon - 20' H x 40' W - 10mm - QTY 1 $260,000.00
Structural Materials $65,000.00
Structural Labor and LED Installation $39,000.00
Electrical and Data - Materials and Subcontracting $20,800.00
Project Management, General Conditions, Travel & Expenses $4,500.00
Submittals, Engineering, and Permits $13,000.00
Content Management System Equipment, Installation, and Commissioning $3,000.00
SUBTOTAL: $405,300.00
TAX (9.5%): $38,503.50
TOTAL: $443,803.50

INCLUDED
Reserve Level Ribbon specifications as outlined above
Structural materials and installation
Electrical and data connectivity
Project management and engineering services
Content management system setup
Standard warranty terms
```

---

## 🔍 How It Works (Under the Hood)

### 1. System Prompt Selection

When you set `activeLogicModule = 'anc'`, the chat system automatically:

1. Loads the ANC-specific system prompt from `server/prompts/systemPrompts.js`
2. Injects the ANC Product Catalog into the context
3. Uses the ANC Estimator Smart Plugin prompt as additional instructions

### 2. Smart Plugin Injection

The `uiConfig.prompt` from the ANC Estimator Smart Plugin gets appended to every chat message, ensuring the AI always has access to:
- Golden Formula calculation rules
- Margin percentages (15% structural, 20% labor, 25% curved, 15% outdoor)
- Output format requirements
- Validation rules (must have all 7 variables)

### 3. Multi-Turn Conversations

The Agent Builder's FlowExecutor handles multi-turn conversations:
- Stores variables from each step in `this.variables`
- Supports `${variableName}` substitution across steps
- Automatically validates all required fields before final calculation

---

## 📊 Architecture Diagram

```
User Chat Request
        ↓
┌───────────────────────────────┐
│  EverythingLLM Chat Engine      │
│  (server/utils/chats/index.js) │
└───────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│  Check workspace.activeLogicModule        │
│  If "anc" → Load ANC system prompt        │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│  Inject ANC Product Catalog              │
│  (workspace.ancProductCatalog)            │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│  Inject Smart Plugin Prompts              │
│  (uiConfig.prompt from ANC Estimator)     │
└──────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────┐
│  LLM Response with Calculations          │
│  (follows Golden Formula)                 │
└──────────────────────────────────────────┘
```

---

## 🎨 Customization Options

### Add New Products

Update the `ancProductCatalog` JSON:

```json
{
  "productName": "Custom Display",
  "category": "Custom",
  "pitch": "12mm",
  "baseCostPerSqFt": 275.00,
  "resolution": "25.4 px/ft",
  "notes": "Budget-friendly option",
  "structuralMargin": 0.15,
  "laborMargin": 0.20
}
```

### Adjust Margins

Update the Smart Plugin's `uiConfig.prompt`:

```javascript
// Change structural margin from 15% to 18%
// Update the prompt to reflect: "Structural Margin: 18% of Base Cost"
```

### Add Custom Fields

Add new fields to the Smart Plugin schema:

```json
{
  "mountingType": {
    "type": "string",
    "title": "Mounting Type",
    "enum": ["Wall Mount", "Ceiling Mount", "Pole Mount", "Custom"],
    "default": "Wall Mount"
  }
}
```

---

## 🚀 Next Steps

1. **Activate ANC Mode** (Step 1)
2. **Create Smart Plugin** (Step 2)
3. **Test with sample conversations**
4. **Adjust margins/products as needed**
5. **Deploy to production via Easypanel push**

---

## 📚 Reference Files

- **System Prompts:** `server/prompts/systemPrompts.js` (lines 23-98)
- **Chat Logic:** `server/utils/chats/index.js` (lines 270-357)
- **Smart Plugins:** `server/models/smartPlugins.js` (full file)
- **Smart Plugin Config:** `docs/ANC_ESTIMATOR_SMART_PLUGIN.json`
- **Activation Script:** `docs/ANC_MODE_ACTIVATION.sql`
