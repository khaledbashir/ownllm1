/**
 * Auto-Math Logic for native BlockSuite affine:database blocks
 * 
 * Automatically calculates totals (Hours × Rate = Total) for database blocks.
 * Listens to cell updates and triggers calculations without infinite loops.
 * 
 * Usage:
 *   const unsubscribe = setupDatabaseAutoMath(doc);
 *   // Later:
 *   unsubscribe(); // Stop listening
 */

import type { Doc } from '@blocksuite/store';

/**
 * Main setup function - call this when initializing a document
 * 
 * @param doc - The BlockSuite Doc
 * @returns Unsubscribe function to stop listening
 */
export function setupDatabaseAutoMath(doc: Doc) {
  console.log("🚀 Initializing Auto-Math Service for Database Blocks");

  /**
   * Process a database block and set up auto-calculation
   */
  function processDatabaseBlock(databaseBlock: any) {
    if (!databaseBlock || databaseBlock.flavour !== 'affine:database') {
      return;
    }

    const model = databaseBlock.model;
    if (!model) return;

    const columns = model.columns || [];
    const cells = model.cells || {};
    const children = databaseBlock.children || [];

    // Find Hours, Rate, and Total columns
    const hoursCol = columns.find((c: any) => 
      c.name?.toLowerCase().includes('hour') || 
      c.name?.toLowerCase().includes('qty') ||
      c.name?.toLowerCase().includes('quantity')
    );
    const rateCol = columns.find((c: any) => 
      c.name?.toLowerCase().includes('rate') || 
      c.name?.toLowerCase().includes('price') ||
      c.name?.toLowerCase().includes('cost')
    );
    const totalCol = columns.find((c: any) => 
      c.name?.toLowerCase().includes('total') || 
      c.name?.toLowerCase().includes('amount')
    );

    // Only proceed if we have all required columns
    if (!hoursCol || !rateCol || !totalCol) {
      console.log('⚠️ Database block missing required columns (Hours, Rate, Total)', {
        blockId: databaseBlock.id,
        columns: columns.map((c: any) => c.name)
      });
      return;
    }

    console.log('✅ Auto-Math enabled for database block', {
      blockId: databaseBlock.id,
      hoursCol: hoursCol.name,
      rateCol: rateCol.name,
      totalCol: totalCol.name,
      rowCount: children.length
    });

    /**
     * Recalculate totals for all rows in this database
     */
    function recalculateAllRows() {
      try {
        let hasChanges = false;
        const updatedCells = { ...cells };

        children.forEach((rowBlock: any) => {
          const rowId = rowBlock.id;
          const rowCells = cells[rowId] || {};

          // Get Hours and Rate values
          const hoursCell = rowCells[hoursCol.id];
          const rateCell = rowCells[rateCol.id];
          const totalCell = rowCells[totalCol.id];

          const hours = parseNumber(hoursCell?.value);
          const rate = parseNumber(rateCell?.value);
          const currentTotal = parseNumber(totalCell?.value);
          const calculatedTotal = Math.round(hours * rate);

          // Only update if calculated total differs from existing total
          if (calculatedTotal !== currentTotal) {
            console.log('🔄 Updating row total:', {
              rowId,
              hours,
              rate,
              oldTotal: currentTotal,
              newTotal: calculatedTotal
            });

            updatedCells[rowId] = {
              ...rowCells,
              [totalCol.id]: {
                columnId: totalCol.id,
                value: calculatedTotal
              }
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          console.log('💾 Updating database block with new totals:', databaseBlock.id);
          doc.updateBlock(model, { cells: updatedCells });
        }
      } catch (e) {
        console.error('[AutoMath] Failed to recalculate database:', e);
      }
    }

    /**
     * Handle property updates on database model
     */
    const propsObserver = (event: any) => {
      // Check if cells property was updated
      if (event.key === 'cells' || event.keysChanged?.includes('cells')) {
        recalculateAllRows();
      }
    };

    // Attach observer to model's properties
    if (model.propsUpdated && typeof model.propsUpdated.on === 'function') {
      try {
        model.propsUpdated.on(propsObserver);
      } catch (e) {
        console.warn('[AutoMath] Could not attach props observer:', e);
      }
    }

    // Initial calculation
    recalculateAllRows();

    return {
      propsObserver,
      recalculateAllRows,
    };
  }

  /**
   * Find and process all database blocks in doc
   */
  function initializeAllDatabaseBlocks() {
    try {
      const databaseBlocks = doc.getBlocksByFlavour?.('affine:database') || [];
      console.log(`🔍 Found ${databaseBlocks.length} database blocks`);
      
      databaseBlocks.forEach((block) => {
        processDatabaseBlock(block);
      });
    } catch (e) {
      console.warn('[AutoMath] Error initializing database blocks:', e);
    }
  }

  /**
   * Listen for new blocks being added (in case a database is added later)
   */
  const handleBlockAdded = (event: any) => {
    const newBlock = event.model || event.block;
    if (newBlock?.flavour === 'affine:database') {
      console.log('📝 New database block detected, initializing');
      processDatabaseBlock(newBlock);
    }
  };

  // Initial setup for existing database blocks
  initializeAllDatabaseBlocks();

  // Listen for future database additions
  let unsubscribeBlockAdded: { dispose: () => void } | null = null;
  
  if (doc.slots) {
    if (doc.slots.rootAdded) {
      unsubscribeBlockAdded = doc.slots.rootAdded.on(handleBlockAdded);
    } else if (doc.slots.blockUpdated) {
      // Fallback: listen to block updates and check for new databases
      doc.slots.blockUpdated.on((event: any) => {
        if (event?.type === 'add' || event?.id) {
          const block = doc.getBlock(event.id);
          if (block?.flavour === 'affine:database') {
            console.log('📝 New database block detected via blockUpdated');
            processDatabaseBlock(block);
          }
        }
      });
    }
  }

  /**
   * Cleanup function - call to stop listening
   */
  const unsubscribe = () => {
    if (unsubscribeBlockAdded && unsubscribeBlockAdded.dispose) {
      unsubscribeBlockAdded.dispose();
    }
    console.log('🛑 Auto-Math Service disconnected');
  };

  // Legacy export for backwards compatibility
  (window as any).recalculateDatabaseRow = recalculateDatabaseRow;

  return unsubscribe;
}

/**
 * Helper function to parse number from various cell value formats
 */
function parseNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  
  // If it's already a number
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  
  // If it's a string, extract the number
  if (typeof value === 'string') {
    const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const n = Number(match[0]);
      return Number.isFinite(n) ? n : 0;
    }
  }
  
  // If it's an object with value property
  if (value && typeof value === 'object') {
    if (value.value !== undefined) return parseNumber(value.value);
    if (typeof value.toString === 'function') return parseNumber(value.toString());
  }
  
  return 0;
}

/**
 * Manually trigger a recalculation for a specific database block
 */
export function recalculateDatabaseRow(databaseBlock: any, rowId: string) {
  if (!databaseBlock || databaseBlock.flavour !== 'affine:database') {
    return;
  }

  const model = databaseBlock.model;
  const columns = model.columns || [];
  const cells = model.cells || {};

  // Find Hours, Rate, and Total columns
  const hoursCol = columns.find((c: any) => 
    c.name?.toLowerCase().includes('hour') || 
    c.name?.toLowerCase().includes('qty') ||
    c.name?.toLowerCase().includes('quantity')
  );
  const rateCol = columns.find((c: any) => 
    c.name?.toLowerCase().includes('rate') || 
    c.name?.toLowerCase().includes('price') ||
    c.name?.toLowerCase().includes('cost')
  );
  const totalCol = columns.find((c: any) => 
    c.name?.toLowerCase().includes('total') || 
    c.name?.toLowerCase().includes('amount')
  );

  if (!hoursCol || !rateCol || !totalCol) {
    console.warn('[AutoMath] Database missing required columns');
    return;
  }

  // If rowId is provided, only recalculate that row
  if (rowId) {
    const rowCells = cells[rowId] || {};
    const hours = parseNumber(rowCells[hoursCol.id]?.value);
    const rate = parseNumber(rowCells[rateCol.id]?.value);
    const calculatedTotal = Math.round(hours * rate);

    const updatedCells = {
      ...cells,
      [rowId]: {
        ...rowCells,
        [totalCol.id]: {
          columnId: totalCol.id,
          value: calculatedTotal
        }
      }
    };

    try {
      databaseBlock.doc.updateBlock(model, { cells: updatedCells });
      console.log('🔄 Manually recalculated row:', rowId);
    } catch (e) {
      console.error('[AutoMath] Failed to manually recalculate row:', e);
    }
  } else {
    // Recalculate all rows
    const updatedCells = { ...cells };
    let hasChanges = false;

    databaseBlock.children?.forEach((rowBlock: any) => {
      const rId = rowBlock.id;
      const rowCells = cells[rId] || {};

      const hours = parseNumber(rowCells[hoursCol.id]?.value);
      const rate = parseNumber(rowCells[rateCol.id]?.value);
      const currentTotal = parseNumber(rowCells[totalCol.id]?.value);
      const calculatedTotal = Math.round(hours * rate);

      if (calculatedTotal !== currentTotal) {
        updatedCells[rId] = {
          ...rowCells,
          [totalCol.id]: {
            columnId: totalCol.id,
            value: calculatedTotal
          }
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      try {
        databaseBlock.doc.updateBlock(model, { cells: updatedCells });
        console.log('🔄 Manually recalculated database:', databaseBlock.id);
      } catch (e) {
        console.error('[AutoMath] Failed to manually recalculate database:', e);
      }
    }
  }
}
