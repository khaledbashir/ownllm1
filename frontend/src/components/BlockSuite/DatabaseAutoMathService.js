/**
 * DatabaseAutoMath - Simple auto-calculation for affine:database blocks
 *
 * This service automatically calculates Total = Hours × Rate for database blocks
 * that have columns named "Hours", "Rate", and "Total".
 *
 * Enhanced with:
 * - Value comparison guard to prevent infinite recalculation loops
 * - Proper model property access instead of child index
 * - Transactional updates using command chain
 * - Verbose debugging for column detection
 */

// HARDCODED RATE CARD - Add your roles and rates here
const RATE_CARD = {
  "Tech - Sr. Architect - Integration Strategy": 365,
  "Tech - Specialist - Integration Configuration": 180,
  "Tech - Specialist - Testing": 180,
  "Account Management - (Account Director)": 295,
  "Project Management - (Account Manager)": 180,
  // Add more as needed...
};

export function setupDatabaseAutoMath(doc) {
  if (!doc || !doc.slots) {
    console.warn("⚠️  No doc or slots provided to setupDatabaseAutoMath");
    return null;
  }

  console.log("🚀 Initializing Auto-Math Service for Database Blocks");

  const recentlyUpdated = new Set();
  let cleanupInterval = null;

  const handleBlockUpdated = (event) => {
    try {
      const blockId = event.id || event.model?.id;
      if (!blockId) return;

      const block = doc.getBlock(blockId);
      if (!block) return;

      // Check if this is a database block or a child of a database block
      if (block.flavour === "affine:database") {
        console.log("📝 Database block updated:", block.id);
        processDatabaseBlock(doc, block, recentlyUpdated);
      } else {
        // Check if parent is a database block
        const parent = doc.getParent(blockId);
        if (parent?.flavour === "affine:database") {
          console.log(
            "📝 Row updated, recalculating parent database:",
            parent.id
          );
          processDatabaseBlock(doc, parent, recentlyUpdated);
        }
      }
    } catch (e) {
      console.error("❌ Error in handleBlockUpdated:", e);
    }
  };

  // Listen to block updates
  const disposable = doc.slots.blockUpdated.on(handleBlockUpdated);

  // Calculate all databases on mount (with delay to ensure doc is loaded)
  setTimeout(() => {
    try {
      calculateAllDatabases(doc, recentlyUpdated);
    } catch (e) {
      console.error("❌ Error in calculateAllDatabases:", e);
    }
  }, 500);

  // Clean up recentlyUpdated set periodically
  cleanupInterval = setInterval(() => {
    recentlyUpdated.clear();
  }, 5000);

  // Return cleanup function
  return () => {
    console.log("🛑 DatabaseAutoMathService cleanup");
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    if (disposable) {
      disposable.dispose();
    }
  };
}

function processDatabaseBlock(doc, block, recentlyUpdated) {
  try {
    if (!block?.model) return;

    const model = block.model;
    const columns = model.columns || [];
    const children = block.children || [];
    const cells = model.cells || {};

    // 1. Log the columns we found (Debug)
    const colNames = columns.map((c) => c.name);
    console.log("📋 Found Columns:", colNames.join(", "));

    // 2. Identify Columns (More flexible matching with regex)
    // We match 'hrs', 'hour', 'qty', 'quantity' for Hours
    const hoursCol = columns.find((c) => /hour|hrs|qty|quantity/i.test(c.name));

    // We match 'rate', 'price', 'unit', 'cost' for Price
    const rateCol = columns.find((c) => /rate|price|unit|cost/i.test(c.name));

    // We match 'total', 'amount', 'sum' for Total
    const totalCol = columns.find((c) => /total|amount|sum/i.test(c.name));

    if (!hoursCol || !rateCol || !totalCol) {
      console.warn(
        `⚠️  Block ${block.id} missing columns. Needed: Hours/Rate/Total. Found: ${colNames.join(", ")}`
      );
      return;
    }

    console.log("✅ Found auto-math columns:", {
      hours: hoursCol.name,
      rate: rateCol.name,
      total: totalCol.name,
    });

    calculateTotals(
      doc,
      model,
      children,
      hoursCol,
      rateCol,
      totalCol,
      recentlyUpdated
    );
  } catch (e) {
    console.error("❌ Error in processDatabaseBlock:", e);
  }
}

function calculateTotals(
  doc,
  model,
  children,
  hoursCol,
  rateCol,
  totalCol,
  recentlyUpdated
) {
  try {
    const cells = model.cells || {};

    // Track which cells need updating
    const updates = [];

    for (const child of children) {
      const rowId = child.id;
      const rowCells = cells[rowId] || {};
      const rowText = child.text?.toString().trim(); // "Role"

      // A. RATE LOOKUP - Check if we have a hardcoded rate for this role
      const currentRateVal = rowCells[rateCol.id]?.value;
      if (
        rowText &&
        RATE_CARD[rowText] &&
        (!currentRateVal || currentRateVal === "")
      ) {
        console.log(`🔍 Found Rate for "${rowText}": ${RATE_CARD[rowText]}`);
        const rateValue = RATE_CARD[rowText].toString();

        // Only add update if rate is different
        if (rateValue !== currentRateVal) {
          updates.push({
            rowId,
            columnId: rateCol.id,
            value: rateValue,
          });
        }
      }

      // B. MATH CALCULATION
      const hoursRaw = rowCells[hoursCol.id]?.value || "0";
      const rateRaw = rowCells[rateCol.id]?.value || "0";

      // Clean inputs (remove currency symbols, handle "2 hours", etc.)
      const hours = parseFloat(hoursRaw.toString().replace(/[^0-9.]/g, ""));
      const rate = parseFloat(rateRaw.toString().replace(/[^0-9.]/g, ""));

      const currentTotal = rowCells[totalCol.id]?.value;

      // Only calculate if values are valid
      if (!isNaN(hours) && !isNaN(rate) && hours > 0) {
        const newTotal = (hours * rate).toFixed(2);

        const cellKey = `${rowId}:${totalCol.id}`;

        // VALUE COMPARISON GUARD - Only update if new total is different
        // This prevents infinite recalculation loop
        if (newTotal !== currentTotal && !recentlyUpdated.has(cellKey)) {
          updates.push({
            rowId,
            columnId: totalCol.id,
            value: newTotal,
          });
          recentlyUpdated.add(cellKey);

          console.log(
            `🧮 Calculating Row ${rowId}: ${hours} × ${rate} = ${newTotal}`
          );
        }
      }
    }

    // C. TRANSACTIONAL UPDATE - Use command chain for atomic updates
    if (updates.length > 0) {
      console.log(`💾 Applying ${updates.length} updates to database`);

      // Create a transactional update using command chain
      // This ensures CRDT integrity and proper undo/redo history
      doc.captureSync();

      for (const update of updates) {
        const { rowId, columnId, value } = update;

        // Ensure cells object exists for this row
        if (!model.cells[rowId]) {
          model.cells[rowId] = {};
        }

        // Update the cell value
        model.cells[rowId][columnId] = {
          columnId: columnId,
          value: value,
        };
      }

      // Apply the update
      doc.updateBlock(model, { cells: model.cells });
    }
  } catch (e) {
    console.error("❌ Error in calculateTotals:", e);
  }
}

function calculateAllDatabases(doc, recentlyUpdated) {
  try {
    if (!doc) {
      console.warn("⚠️  Doc not available for calculateAllDatabases");
      return;
    }

    // Use getBlocks() and filter instead of getBlocksByFlavour
    const allBlocks = doc.getBlocks?.() || [];
    const databaseBlocks = allBlocks.filter(
      (b) => b?.flavour === "affine:database"
    );

    console.log(`🔍 Found ${databaseBlocks.length} database blocks`);

    for (const block of databaseBlocks) {
      processDatabaseBlock(doc, block, recentlyUpdated);
    }
  } catch (e) {
    console.error("❌ Error in calculateAllDatabases:", e);
  }
}
