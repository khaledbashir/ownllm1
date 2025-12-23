/**
 * DatabaseAutoMath - Simple auto-calculation for affine:database blocks
 * 
 * This service automatically calculates Total = Hours × Rate for database blocks
 * that have columns named "Hours", "Rate", and "Total".
 * 
 * Simple approach: Direct event listener on doc.slots.blockUpdated
 */

export function setupDatabaseAutoMath(doc) {
  if (!doc) {
    console.warn('⚠️  No doc provided to setupDatabaseAutoMath');
    return null;
  }

  const recentlyUpdated = new Set();
  let cleanupInterval = null;

  const handleBlockUpdated = (event) => {
    try {
      const blockId = event.id || event.model?.id;
      if (!blockId) return;

      const block = doc.getBlock(blockId);
      if (!block) return;

      // Check if this is a database block or a child of a database block
      if (block.flavour === 'affine:database') {
        processDatabaseBlock(doc, block, recentlyUpdated);
      } else {
        // Check if parent is a database block
        const parent = doc.getParent(blockId);
        if (parent?.flavour === 'affine:database') {
          processDatabaseBlock(doc, parent, recentlyUpdated);
        }
      }
    } catch (e) {
      console.error('❌ Error in handleBlockUpdated:', e);
    }
  };

  // Listen to block updates
  const disposable = doc.slots.blockUpdated.on(handleBlockUpdated);

  // Calculate all databases on mount (with delay to ensure doc is loaded)
  setTimeout(() => {
    try {
      calculateAllDatabases(doc, recentlyUpdated);
    } catch (e) {
      console.error('❌ Error in calculateAllDatabases:', e);
    }
  }, 500);

  // Clean up recentlyUpdated set periodically
  cleanupInterval = setInterval(() => {
    recentlyUpdated.clear();
  }, 5000);

  // Return cleanup function
  return () => {
    console.log('🛑 DatabaseAutoMathService cleanup');
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

    // Find Hours, Rate, and Total columns
    const hoursCol = columns.find(c => 
      c.name?.toLowerCase() === 'hours' || c.name?.toLowerCase() === 'hour'
    );
    const rateCol = columns.find(c => 
      c.name?.toLowerCase() === 'rate' || c.name?.toLowerCase() === 'price'
    );
    const totalCol = columns.find(c => 
      c.name?.toLowerCase() === 'total' || c.name?.toLowerCase() === 'amount'
    );

    // Only proceed if we have all three columns
    if (!hoursCol || !rateCol || !totalCol) {
      return;
    }

    console.log('📊 Found auto-math columns:', {
      hours: hoursCol.name,
      rate: rateCol.name,
      total: totalCol.name
    });

    calculateTotals(doc, model, children, hoursCol, rateCol, totalCol, recentlyUpdated);
  } catch (e) {
    console.error('❌ Error in processDatabaseBlock:', e);
  }
}

function calculateTotals(doc, model, children, hoursCol, rateCol, totalCol, recentlyUpdated) {
  try {
    const cells = model.cells || {};
    const updatedCells = { ...cells };
    
    let hasUpdates = false;

    for (const child of children) {
      const rowId = child.id;
      const rowCells = cells[rowId] || {};
      
      const hoursValue = rowCells[hoursCol.id]?.value;
      const rateValue = rowCells[rateCol.id]?.value;
      const currentTotal = rowCells[totalCol.id]?.value;
      
      // Parse numeric values
      const hours = parseNumber(hoursValue);
      const rate = parseNumber(rateValue);
      const calculatedTotal = hours * rate;
      
      // Only update if values are valid and different
      if (hours !== null && rate !== null) {
        const cellKey = `${rowId}:${totalCol.id}`;
        
        if (calculatedTotal !== currentTotal && !recentlyUpdated.has(cellKey)) {
          updatedCells[rowId] = {
            ...rowCells,
            [totalCol.id]: {
              columnId: totalCol.id,
              value: calculatedTotal
            }
          };
          recentlyUpdated.add(cellKey);
          hasUpdates = true;
          
          console.log(`✏️  Updated ${rowId}: ${hours} × ${rate} = ${calculatedTotal}`);
        }
      }
    }

    if (hasUpdates) {
      doc.updateBlock(model, { cells: updatedCells });
    }
  } catch (e) {
    console.error('❌ Error in calculateTotals:', e);
  }
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function calculateAllDatabases(doc, recentlyUpdated) {
  try {
    if (!doc) {
      console.warn('⚠️  Doc not available for calculateAllDatabases');
      return;
    }

    // Use getBlocks() and filter instead of getBlocksByFlavour
    const allBlocks = doc.getBlocks?.() || [];
    const databaseBlocks = allBlocks.filter(b => b?.flavour === 'affine:database');
    
    console.log(`🔍 Found ${databaseBlocks.length} database blocks`);
    
    for (const block of databaseBlocks) {
      processDatabaseBlock(doc, block, recentlyUpdated);
    }
  } catch (e) {
    console.error('❌ Error in calculateAllDatabases:', e);
  }
}