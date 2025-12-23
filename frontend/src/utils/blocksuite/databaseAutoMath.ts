/**
 * Auto-Math Logic for affine:database blocks
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

type CellValue = {
  columnId: string;
  value: any;
};

interface ColumnInfo {
  id: string;
  name: string;
  type?: string;
}

/**
 * Configuration for auto-calculation
 * Matches column names (case-insensitive) to determine which columns to multiply
 */
const AUTO_CALC_CONFIG = {
  // These columns will be multiplied together
  multipliers: [
    { names: ['hours', 'qty', 'quantity'], type: 'number' },
    { names: ['rate', 'price', 'cost'], type: 'number' },
  ],
  // The result column
  target: { names: ['total', 'subtotal', 'amount'], type: 'number' },
};

/**
 * Find a column ID by matching against a list of possible names
 */
function findColumnIdByNames(
  columns: ColumnInfo[],
  possibleNames: string[]
): string | null {
  const lowerNames = possibleNames.map((n) => n.toLowerCase());
  const column = columns.find((col) =>
    lowerNames.includes(col.name?.toLowerCase() || '')
  );
  return column?.id || null;
}

/**
 * Parse a cell value as a float, returning 0 for empty/invalid values
 */
function parseNumberSafe(value: any): number {
  if (!value) return 0;

  // If it's a Text object (BlockSuite), convert to string first
  const text = typeof value?.toString === 'function' ? value.toString() : String(value);

  const num = parseFloat(text);
  return isNaN(num) ? 0 : num;
}

/**
 * Format a number as a string for cell storage
 */
function formatNumberForCell(num: number): string {
  // Round to 2 decimals to avoid floating-point precision issues
  return num.toFixed(2);
}

/**
 * Main setup function - call this when initializing a document
 * 
 * @param doc - The BlockSuite Doc
 * @param config - Optional custom configuration
 * @returns Unsubscribe function to stop listening
 */
export function setupDatabaseAutoMath(
  doc: Doc,
  config = AUTO_CALC_CONFIG
) {
  // Track which cells we've just updated (to avoid infinite loops)
  const recentlyUpdated = new Set<string>();
  const UPDATE_TIMEOUT = 500; // ms

  /**
   * Process a database block and set up auto-calculation
   */
  function processDatabase(databaseBlock: any) {
    if (!databaseBlock || databaseBlock.flavour !== 'affine:database') {
      return;
    }

    const model = databaseBlock.model;
    if (!model) return;

    const columns: ColumnInfo[] = model.columns || [];
    if (columns.length < 3) {
      // Need at least 3 columns for Hours, Rate, Total
      return;
    }

    // Find the column IDs for Hours, Rate, and Total
    const hoursColId = findColumnIdByNames(
      columns,
      config.multipliers[0].names
    );
    const rateColId = findColumnIdByNames(
      columns,
      config.multipliers[1].names
    );
    const totalColId = findColumnIdByNames(columns, config.target.names);

    // If any required column is missing, disable auto-calc for this block
    if (!hoursColId || !rateColId || !totalColId) {
      console.debug(
        '[AutoMath] Skipping database block - missing required columns',
        { hoursColId, rateColId, totalColId }
      );
      return;
    }

    console.debug('[AutoMath] Enabled for database block', {
      blockId: databaseBlock.id,
      hoursColId,
      rateColId,
      totalColId,
    });

    /**
     * Recalculate total for a specific row
     */
    function recalculateRow(rowId: string) {
      // Don't recalculate if we just updated this cell
      const key = `${databaseBlock.id}:${rowId}:${totalColId}`;
      if (recentlyUpdated.has(key)) {
        return;
      }

      const cells = model.cells || {};
      const rowCells = cells[rowId] || {};

      const hoursCell = rowCells[hoursColId] as CellValue | undefined;
      const rateCell = rowCells[rateColId] as CellValue | undefined;

      if (!hoursCell || !rateCell) {
        // If either source is missing, don't update
        return;
      }

      const hoursValue = parseNumberSafe(hoursCell.value);
      const rateValue = parseNumberSafe(rateCell.value);
      const totalValue = hoursValue * rateValue;

      // Import Text from blocksuite/store
      const { Text } = require('@blocksuite/store');

      // Update the total cell (mark as recently updated first)
      recentlyUpdated.add(key);
      setTimeout(() => recentlyUpdated.delete(key), UPDATE_TIMEOUT);

      // Use the update mechanism to safely modify cells
      const updatedCells = { ...cells };
      if (!updatedCells[rowId]) {
        updatedCells[rowId] = {};
      }

      updatedCells[rowId][totalColId] = {
        columnId: totalColId,
        value: new Text(formatNumberForCell(totalValue)),
      };

      // Dispatch the update using doc.updateBlock
      try {
        doc.updateBlock(model, { cells: updatedCells });
      } catch (e) {
        console.error('[AutoMath] Failed to update total cell:', e);
      }
    }

    /**
     * Handle cell updates - check if it's Hours or Rate, then recalc
     */
    function handleCellUpdate(rowId: string, colId: string) {
      // Only recalculate if the changed column is Hours or Rate
      if (colId === hoursColId || colId === rateColId) {
        recalculateRow(rowId);
      }
    }

    /**
     * Listen to block updates via the model's observer
     * Y.js provides deep observation for nested cell changes
     */
    const cellsObserver = (event: any) => {
      // The event structure depends on Y.js Map updates
      // We listen to changes in the cells object
      if (!event.keysChanged) return;

      event.keysChanged.forEach((key: string) => {
        // Key format is "{rowId}:{colId}" or similar
        const parts = key.split(':');
        if (parts.length >= 1) {
          const rowId = parts[0];
          const colId = parts[1];
          if (rowId && colId) {
            handleCellUpdate(rowId, colId);
          }
        }
      });
    };

    // Attach observer to the model's cells object
    // BlockSuite models use Y.js Maps internally
    if (model.cells && model.cells.observeDeep) {
      try {
        model.cells.observeDeep(cellsObserver);
      } catch (e) {
        console.warn('[AutoMath] Could not attach deep observer:', e);
      }
    }

    // Also listen to doc-level block updates as a fallback
    const blockUpdateHandler = (event: any) => {
      if (!event.id || event.id !== databaseBlock.id) return;

      // If the cells map was updated, recheck all rows
      const cells = model.cells || {};
      Object.keys(cells).forEach((rowId) => {
        // We don't know which cell was updated, so recalculate if Hours or Rate exist
        recalculateRow(rowId);
      });
    };

    return {
      cellsObserver,
      blockUpdateHandler,
    };
  }

  /**
   * Find and process all database blocks in the doc
   */
  function initializeAllDatabases() {
    try {
      const databaseBlocks = doc.getBlocksByFlavour?.('affine:database') || [];
      databaseBlocks.forEach((block) => {
        processDatabase(block);
      });
    } catch (e) {
      console.warn('[AutoMath] Error initializing databases:', e);
    }
  }

  /**
   * Listen for new blocks being added (in case a database is added later)
   */
  const handleBlockAdded = (event: any) => {
    const newBlock = event.model;
    if (newBlock.flavour === 'affine:database') {
      console.debug('[AutoMath] New database block detected, initializing');
      processDatabase(newBlock);
    }
  };

  // Initial setup for existing databases
  initializeAllDatabases();

  // Listen for future database additions
  const unsubscribeBlockAdded = doc.slots.blockAdded.on(handleBlockAdded);

  /**
   * Cleanup function - call to stop listening
   */
  const unsubscribe = () => {
    if (unsubscribeBlockAdded) {
      unsubscribeBlockAdded();
    }
    recentlyUpdated.clear();
    console.debug('[AutoMath] Unsubscribed from database updates');
  };

  return unsubscribe;
}

/**
 * Manually trigger a recalculation for a specific database row
 * Use this if auto-calculation doesn't trigger (e.g., programmatic updates)
 */
export function recalculateDatabaseRow(
  databaseBlock: any,
  rowId: string,
  config = AUTO_CALC_CONFIG
) {
  if (!databaseBlock || databaseBlock.flavour !== 'affine:database') {
    return;
  }

  const model = databaseBlock.model;
  const columns: ColumnInfo[] = model.columns || [];

  const hoursColId = findColumnIdByNames(
    columns,
    config.multipliers[0].names
  );
  const rateColId = findColumnIdByNames(
    columns,
    config.multipliers[1].names
  );
  const totalColId = findColumnIdByNames(columns, config.target.names);

  if (!hoursColId || !rateColId || !totalColId) {
    console.warn('[AutoMath] Missing required columns for calculation');
    return;
  }

  const cells = model.cells || {};
  const rowCells = cells[rowId] || {};

  const hoursValue = parseNumberSafe(rowCells[hoursColId]?.value);
  const rateValue = parseNumberSafe(rowCells[rateColId]?.value);
  const totalValue = hoursValue * rateValue;

  const { Text } = require('@blocksuite/store');

  const updatedCells = { ...cells };
  if (!updatedCells[rowId]) {
    updatedCells[rowId] = {};
  }

  updatedCells[rowId][totalColId] = {
    columnId: totalColId,
    value: new Text(formatNumberForCell(totalValue)),
  };

  try {
    databaseBlock.doc.updateBlock(model, { cells: updatedCells });
  } catch (e) {
    console.error('[AutoMath] Failed to recalculate row:', e);
  }
}
