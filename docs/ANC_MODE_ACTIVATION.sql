-- ============================================
-- ANC MODE ACTURATION SCRIPT
-- ============================================
-- This script activates ANC mode for a workspace
-- and sets up the ANC Product Catalog
-- ============================================

-- STEP 1: Set workspace to ANC mode
-- Replace {workspace_id} with your actual workspace ID
UPDATE workspaces
SET activeLogicModule = 'anc'
WHERE id = {workspace_id};

-- STEP 2: Create ANC Product Catalog
-- Store product data in JSON format in ancProductCatalog field
UPDATE workspaces
SET ancProductCatalog = '[
  {
    "productName": "Ribbon 10mm",
    "category": "Ribbon Displays",
    "pitch": "10mm",
    "baseCostPerSqFt": 325.00,
    "resolution": "30.5 px/ft",
    "notes": "High refresh rate, outdoor-ready, ideal for stadiums and large venues"
  },
  {
    "productName": "Ribbon 6mm",
    "category": "Ribbon Displays",
    "pitch": "6mm",
    "baseCostPerSqFt": 550.00,
    "resolution": "50.8 px/ft",
    "notes": "Tight pixel pitch for closer viewing distances, premium quality"
  },
  {
    "productName": "Scoreboard Main",
    "category": "Scoreboards",
    "pitch": "10mm",
    "baseCostPerSqFt": 310.00,
    "resolution": "30.5 px/ft",
    "notes": "Standard stadium resolution, cost-effective for sports venues"
  },
  {
    "productName": "Center Hung",
    "category": "Center Hung Displays",
    "pitch": "10mm",
    "baseCostPerSqFt": 425.00,
    "resolution": "30.5 px/ft",
    "notes": "Four-sided center hung for arenas, requires structural mounting"
  },
  {
    "productName": "Video Wall",
    "category": "Indoor Displays",
    "pitch": "4mm",
    "baseCostPerSqFt": 680.00,
    "resolution": "76.2 px/ft",
    "notes": "Ultra-high resolution for corporate lobbies and control rooms"
  }
]'
WHERE id = {workspace_id};

-- STEP 3: Verify activation
SELECT
  id,
  name,
  activeLogicModule,
  ancProductCatalog IS NOT NULL as hasProductCatalog
FROM workspaces
WHERE id = {workspace_id};
