/**
 * Auto-Math Logic for affine:embed-pricing-table blocks
 * 
 * Automatically calculates line totals (Hours × Rate = Total) for pricing table blocks.
 * Listens to row updates and triggers calculations without infinite loops.
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
  console.log("🚀 Initializing Auto-Math Service for Pricing Tables");

  /**
   * Process a pricing table block and set up auto-calculation
   */
  function processPricingTable(pricingTableBlock: any) {
    if (!pricingTableBlock || pricingTableBlock.flavour !== 'affine:embed-pricing-table') {
      return;
    }

    const model = pricingTableBlock.model;
    if (!model) return;

    // For pricing table blocks, we work with the rows array directly
    const rows = model.rows || [];
    if (rows.length === 0) {
      return;
    }

    console.log('✅ Auto-Math enabled for pricing table block', {
      blockId: pricingTableBlock.id,
      rowCount: rows.length,
    });

    /**
     * Recalculate line totals for all rows in this pricing table
     */
    function recalculateAllRows() {
      try {
        const updatedRows = rows.map((row: any) => {
          if (row.isHeader) return row; // Skip header rows

          const hours = Number(row.hours) || 0;
          const rate = Number(row.baseRate) || 0;
          const calculatedTotal = Math.round(hours * rate);

          // Only update if the calculated total differs from existing total
          const existingTotal = Math.round(Number(row.lineTotal) || 0);
          if (calculatedTotal !== existingTotal) {
            return {
              ...row,
              lineTotal: calculatedTotal
            };
          }
          return row;
        });

        // Only update if something changed
        const hasChanges = updatedRows.some((newRow: any, index: number) => {
          const oldRow = rows[index];
          return newRow.lineTotal !== oldRow.lineTotal;
        });

        if (hasChanges) {
          console.log('🔄 Recalculating pricing table totals:', {
            blockId: pricingTableBlock.id,
            changedRows: updatedRows.filter((r: any, i: number) => r.lineTotal !== rows[i].lineTotal).length
          });
          
          doc.updateBlock(model, { rows: updatedRows });
        }
      } catch (e) {
        console.error('[AutoMath] Failed to recalculate pricing table:', e);
      }
    }

    /**
     * Handle property updates on the pricing table model
     */
    const propsObserver = (event: any) => {
      // Check if rows property was updated
      if (event.key === 'rows' || event.keysChanged?.includes('rows')) {
        recalculateAllRows();
      }
    };

    // Attach observer to the model's properties
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
   * Find and process all pricing table blocks in the doc
   */
  function initializeAllPricingTables() {
    try {
      const pricingTableBlocks = doc.getBlocksByFlavour?.('affine:embed-pricing-table') || [];
      console.log(`🔍 Found ${pricingTableBlocks.length} pricing table blocks`);
      
      pricingTableBlocks.forEach((block) => {
        processPricingTable(block);
      });
    } catch (e) {
      console.warn('[AutoMath] Error initializing pricing tables:', e);
    }
  }

  /**
   * Listen for new blocks being added (in case a pricing table is added later)
   */
  const handleBlockAdded = (event: any) => {
    const newBlock = event.model || event.block;
    if (newBlock?.flavour === 'affine:embed-pricing-table') {
      console.log('📝 New pricing table block detected, initializing');
      processPricingTable(newBlock);
    }
  };

  // Initial setup for existing pricing tables
  initializeAllPricingTables();

  // Listen for future pricing table additions
  let unsubscribeBlockAdded: { dispose: () => void } | null = null;
  
  if (doc.slots) {
    if (doc.slots.rootAdded) {
      unsubscribeBlockAdded = doc.slots.rootAdded.on(handleBlockAdded);
    } else if (doc.slots.blockUpdated) {
      // Fallback: listen to block updates and check for new pricing tables
      doc.slots.blockUpdated.on((event: any) => {
        if (event?.type === 'add' || event?.id) {
          const block = doc.getBlock(event.id);
          if (block?.flavour === 'affine:embed-pricing-table') {
            console.log('📝 New pricing table block detected via blockUpdated');
            processPricingTable(block);
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
  (window as any).recalculateDatabaseRow = recalculatePricingTable;

  return unsubscribe;
}

/**
 * Manually trigger a recalculation for a specific pricing table block
 */
export function recalculatePricingTable(pricingTableBlock: any) {
  // Legacy alias for backwards compatibility with tests
  return recalculateDatabaseRow(pricingTableBlock, '');
}

/**
 * Legacy function for backwards compatibility
 */
export function recalculateDatabaseRow(pricingTableBlock: any, rowId: string) {
  if (!pricingTableBlock || pricingTableBlock.flavour !== 'affine:embed-pricing-table') {
    return;
  }

  const model = pricingTableBlock.model;
  const rows = model.rows || [];

  const updatedRows = rows.map((row: any) => {
    if (row.isHeader) return row;

    const hours = Number(row.hours) || 0;
    const rate = Number(row.baseRate) || 0;
    const calculatedTotal = Math.round(hours * rate);

    return {
      ...row,
      lineTotal: calculatedTotal
    };
  });

  try {
    pricingTableBlock.doc.updateBlock(model, { rows: updatedRows });
    console.log('🔄 Manually recalculated pricing table:', pricingTableBlock.id);
  } catch (e) {
    console.error('[AutoMath] Failed to manually recalculate pricing table:', e);
  }
}
