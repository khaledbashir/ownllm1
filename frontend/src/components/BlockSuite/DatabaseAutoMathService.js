/**
 * DatabaseAutoMathService - Auto-calculation service for affine:database blocks
 * 
 * This service automatically calculates Total = Hours × Rate for database blocks
 * that have columns named "Hours", "Rate", and "Total".
 * 
 * Architecture: BlockSuite BlockService (singleton, lifecycle-aware)
 * - Listens to doc.slots.blockUpdated for cell changes
 * - Uses CRDT-safe updates via doc.updateBlock()
 * - Prevents infinite loops with recentlyUpdated tracking
 */

import { BlockService } from '@blocksuite/block-std';

export class DatabaseAutoMathService extends BlockService {
  constructor() {
    super();
    this.recentlyUpdated = new Set();
    this.cleanupInterval = null;
  }

  mounted() {
    console.log('🚀 DatabaseAutoMathService mounted');
    
    // Listen to block updates
    this.disposable = this.std.doc.slots.blockUpdated.on((event) => {
      this.handleBlockUpdated(event);
    });

    // Calculate all databases on mount
    this.calculateAllDatabases();

    // Clean up recentlyUpdated set periodically
    this.cleanupInterval = setInterval(() => {
      this.recentlyUpdated.clear();
    }, 5000);
  }

  unmounted() {
    console.log('🛑 DatabaseAutoMathService unmounted');
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  handleBlockUpdated(event) {
    const blockId = event.id || event.model?.id;
    if (!blockId) return;

    const doc = this.std.doc;
    const block = doc.getBlock(blockId);
    
    if (!block) return;

    // Check if this is a database block or a child of a database block
    if (block.flavour === 'affine:database') {
      this.processDatabaseBlock(block);
    } else {
      // Check if parent is a database block
      const parent = doc.getParent(blockId);
      if (parent?.flavour === 'affine:database') {
        this.processDatabaseBlock(parent);
      }
    }
  }

  processDatabaseBlock(block) {
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

    this.calculateTotals(model, children, hoursCol, rateCol, totalCol);
  }

  calculateTotals(model, children, hoursCol, rateCol, totalCol) {
    const doc = this.std.doc;
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
      const hours = this.parseNumber(hoursValue);
      const rate = this.parseNumber(rateValue);
      const calculatedTotal = hours * rate;

      // Only update if values are valid and different
      if (hours !== null && rate !== null) {
        const cellKey = `${rowId}:${totalCol.id}`;
        
        if (calculatedTotal !== currentTotal && !this.recentlyUpdated.has(cellKey)) {
          updatedCells[rowId] = {
            ...rowCells,
            [totalCol.id]: {
              columnId: totalCol.id,
              value: calculatedTotal
            }
          };
          this.recentlyUpdated.add(cellKey);
          hasUpdates = true;
          
          console.log(`✏️  Updated ${rowId}: ${hours} × ${rate} = ${calculatedTotal}`);
        }
      }
    }

    if (hasUpdates) {
      doc.updateBlock(model, { cells: updatedCells });
    }
  }

  parseNumber(value) {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  calculateAllDatabases() {
    const doc = this.std.doc;
    const databaseBlocks = doc.getBlocksByFlavour?.('affine:database') || [];
    
    console.log(`🔍 Found ${databaseBlocks.length} database blocks`);
    
    for (const block of databaseBlocks) {
      this.processDatabaseBlock(block);
    }
  }
}

// Export as a BlockSpec for registration
export const DatabaseAutoMathBlockSpec = {
  schema: null, // No custom schema - works with existing affine:database
  service: DatabaseAutoMathService,
  view: null, // No custom view - works with existing database view
};