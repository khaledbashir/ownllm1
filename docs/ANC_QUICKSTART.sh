#!/bin/bash

# ============================================
# ANC ESTIMATOR QUICK START SCRIPT
# ============================================
# This script activates ANC mode and creates
# the ANC Estimator Smart Plugin
# ============================================

set -e

echo "🚀 ANC Estimator Quick Start"
echo "============================="
echo ""

# Configuration
WORKSPACE_ID=${1:-1}
API_KEY=${2:-"YOUR_API_KEY"}
BASE_URL=${3:-"http://localhost:3000"}

echo "📋 Configuration:"
echo "  Workspace ID: $WORKSPACE_ID"
echo "  API Key: $API_KEY"
echo "  Base URL: $BASE_URL"
echo ""

# Step 1: Activate ANC Mode via Database
echo "🔄 Step 1: Activating ANC Mode..."
cd /root/everythingllm/ownllm1
sqlite3 storage/documents/AnythingLLM.db <<EOF
UPDATE workspaces
SET activeLogicModule = 'anc'
WHERE id = $WORKSPACE_ID;
EOF
echo "✅ ANC Mode activated for workspace $WORKSPACE_ID"
echo ""

# Step 2: Set ANC Product Catalog
echo "📦 Step 2: Setting ANC Product Catalog..."
sqlite3 storage/documents/AnythingLLM.db <<EOF
UPDATE workspaces
SET ancProductCatalog = '[
  {
    "productName": "Ribbon 10mm",
    "category": "Ribbon Displays",
    "pitch": "10mm",
    "baseCostPerSqFt": 325.00,
    "resolution": "30.5 px/ft",
    "notes": "High refresh rate, outdoor-ready, ideal for stadiums and large venues",
    "structuralMargin": 0.15,
    "laborMargin": 0.20
  },
  {
    "productName": "Ribbon 6mm",
    "category": "Ribbon Displays",
    "pitch": "6mm",
    "baseCostPerSqFt": 550.00,
    "resolution": "50.8 px/ft",
    "notes": "Tight pixel pitch for closer viewing distances, premium quality",
    "structuralMargin": 0.15,
    "laborMargin": 0.20
  },
  {
    "productName": "Scoreboard Main",
    "category": "Scoreboards",
    "pitch": "10mm",
    "baseCostPerSqFt": 310.00,
    "resolution": "30.5 px/ft",
    "notes": "Standard stadium resolution, cost-effective for sports venues",
    "structuralMargin": 0.15,
    "laborMargin": 0.20
  },
  {
    "productName": "Center Hung",
    "category": "Center Hung Displays",
    "pitch": "10mm",
    "baseCostPerSqFt": 425.00,
    "resolution": "30.5 px/ft",
    "notes": "Four-sided center hung for arenas, requires structural mounting",
    "structuralMargin": 0.20,
    "laborMargin": 0.25
  },
  {
    "productName": "Video Wall",
    "category": "Indoor Displays",
    "pitch": "4mm",
    "baseCostPerSqFt": 680.00,
    "resolution": "76.2 px/ft",
    "notes": "Ultra-high resolution for corporate lobbies and control rooms",
    "structuralMargin": 0.12,
    "laborMargin": 0.18
  }
]'
WHERE id = $WORKSPACE_ID;
EOF
echo "✅ ANC Product Catalog installed"
echo ""

# Step 3: Create Smart Plugin via API
echo "🔌 Step 3: Creating ANC Estimator Smart Plugin..."
if [ "$API_KEY" != "YOUR_API_KEY" ]; then
  curl -X POST "$BASE_URL/api/workspace/$WORKSPACE_ID/smart-plugins" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d @docs/ANC_ESTIMATOR_SMART_PLUGIN.json
  echo ""
  echo "✅ Smart Plugin created"
else
  echo "⚠️  Skipping Smart Plugin creation (API_KEY not set)"
  echo "   You can create it manually via the EverythingLLM UI using:"
  echo "   docs/ANC_ESTIMATOR_SMART_PLUGIN.json"
fi
echo ""

# Step 4: Verify activation
echo "✅ Step 4: Verifying activation..."
sqlite3 storage/documents/AnythingLLM.db <<EOF
SELECT
  id,
  name,
  activeLogicModule,
  ancProductCatalog IS NOT NULL as hasProductCatalog,
  CASE WHEN activeLogicModule = 'anc' THEN '✅ ACTIVE' ELSE '❌ NOT ACTIVE' END as status
FROM workspaces
WHERE id = $WORKSPACE_ID;
EOF
echo ""

echo "🎉 ANC Estimator Setup Complete!"
echo ""
echo "Next Steps:"
echo "  1. Test the estimator by chatting with the workspace"
echo "  2. Try: 'I need a quote for a Ribbon 10mm display, 20x40 feet'"
echo "  3. Review the calculations and formatting"
echo ""
echo "📚 Documentation:"
echo "  - Implementation Guide: docs/ANC_MODE_IMPLEMENTATION_GUIDE.md"
echo "  - Smart Plugin Config: docs/ANC_ESTIMATOR_SMART_PLUGIN.json"
echo "  - Agent Builder Flow: docs/ANC_AGENT_BUILDER_FLOW.json"
echo ""
