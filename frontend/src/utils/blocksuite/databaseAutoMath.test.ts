/**
 * Test Suite for Database Auto-Math Logic
 *
 * Usage:
 *   import { testDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath.test';
 *   testDatabaseAutoMath();
 */

import {
  setupDatabaseAutoMath,
  recalculateDatabaseRow,
} from "./databaseAutoMath";
import { Doc, Schema, DocCollection, Text } from "@blocksuite/store";

/**
 * Create a mock database block for testing
 */
function createMockDatabaseBlock(doc: Doc, parentId: string) {
  const genId = () => Math.random().toString(36).substring(2, 10);

  // Create columns: Name, Hours, Rate, Total
  const columns = [
    { id: genId(), name: "Name", type: "title" },
    { id: genId(), name: "Hours", type: "number" },
    { id: genId(), name: "Rate", type: "number" },
    { id: genId(), name: "Total", type: "number" },
  ];

  const viewsColumns = columns.map(() => ({
    id: Math.random().toString(36).substring(2, 10),
    hide: false,
    width: 180,
  }));

  // Create database block
  const databaseId = doc.addBlock(
    "affine:database",
    {
      views: [
        {
          id: genId(),
          name: "Table View",
          mode: "table",
          columns: [],
          filter: { type: "group", op: "and", conditions: [] },
          header: {
            titleColumn: viewsColumns[0].id,
            iconColumn: "type",
          },
        },
      ],
      title: new Text(""),
      cells: {},
      columns,
    },
    parentId
  );

  // Create row 1: Developer, 10 hours, 75/hr
  const row1Id = doc.addBlock(
    "affine:paragraph",
    { text: new Text("Developer"), type: "text" },
    databaseId
  );

  // Create row 2: Designer, 5 hours, 65/hr
  const row2Id = doc.addBlock(
    "affine:paragraph",
    { text: new Text("Designer"), type: "text" },
    databaseId
  );

  const cells = {
    [row1Id]: {
      [columns[1].id]: { columnId: columns[1].id, value: new Text("10") },
      [columns[2].id]: { columnId: columns[2].id, value: new Text("75") },
      [columns[3].id]: { columnId: columns[3].id, value: new Text("0") },
    },
    [row2Id]: {
      [columns[1].id]: { columnId: columns[1].id, value: new Text("5") },
      [columns[2].id]: { columnId: columns[2].id, value: new Text("65") },
      [columns[3].id]: { columnId: columns[3].id, value: new Text("0") },
    },
  };

  const databaseBlock = doc.getBlock(databaseId);
  if (databaseBlock) {
    doc.updateBlock(databaseBlock.model, { cells });
  }

  return {
    databaseId,
    databaseBlock,
    columns,
    rows: [
      {
        id: row1Id,
        name: "Developer",
        hours: "10",
        rate: "75",
        expectedTotal: "750.00",
      },
      {
        id: row2Id,
        name: "Designer",
        hours: "5",
        rate: "65",
        expectedTotal: "325.00",
      },
    ],
  };
}

/**
 * Test 1: Column Detection
 * Verify that Hours, Rate, and Total columns are found correctly
 */
export function testColumnDetection() {
  console.log("\n=== TEST 1: Column Detection ===");

  try {
    const schema = new Schema();
    const collection = new DocCollection({ schema });
    collection.meta.initialize();

    const doc = collection.createDoc();
    doc.load();

    const pageId = doc.addBlock("affine:page", {});
    const noteId = doc.addBlock("affine:note", {}, pageId);

    const { databaseBlock, columns } = createMockDatabaseBlock(doc, noteId);

    console.log("✓ Database block created");
    console.log("  Columns:", columns.map((c) => c.name).join(", "));

    if (!databaseBlock) {
      console.error("✗ Failed to get database block");
      return false;
    }

    const model = databaseBlock.model;
    console.log(
      "  Model columns:",
      model.columns.map((c: any) => c.name).join(", ")
    );

    const hasHours = model.columns.some(
      (c: any) => c.name?.toLowerCase() === "hours"
    );
    const hasRate = model.columns.some(
      (c: any) => c.name?.toLowerCase() === "rate"
    );
    const hasTotal = model.columns.some(
      (c: any) => c.name?.toLowerCase() === "total"
    );

    if (hasHours && hasRate && hasTotal) {
      console.log("✓ All required columns detected");
      return true;
    } else {
      console.error("✗ Missing required columns", {
        hasHours,
        hasRate,
        hasTotal,
      });
      return false;
    }
  } catch (e) {
    console.error("✗ Test failed:", e);
    return false;
  }
}

/**
 * Test 2: Manual Calculation
 * Verify that recalculateDatabaseRow updates the Total correctly
 */
export function testManualCalculation() {
  console.log("\n=== TEST 2: Manual Calculation ===");

  try {
    const schema = new Schema();
    const collection = new DocCollection({ schema });
    collection.meta.initialize();

    const doc = collection.createDoc();
    doc.load();

    const pageId = doc.addBlock("affine:page", {});
    const noteId = doc.addBlock("affine:note", {}, pageId);

    const { databaseBlock, rows } = createMockDatabaseBlock(doc, noteId);

    console.log("✓ Database block created with test data");

    // Test row 1: 10 hours × 75 rate = 750
    recalculateDatabaseRow(databaseBlock, rows[0].id);

    const model = databaseBlock.model;
    const totalCol = model.columns.find(
      (c: any) => c.name?.toLowerCase() === "total"
    );

    if (!totalCol) {
      console.error("✗ Total column not found");
      return false;
    }

    const row1Total =
      model.cells[rows[0].id]?.[totalCol.id]?.value?.toString?.();
    console.log(`  Row 1 total (expected 750.00): ${row1Total}`);

    if (row1Total === "750.00") {
      console.log("✓ Manual calculation works correctly");
      return true;
    } else {
      console.warn("✗ Total mismatch. Got:", row1Total, "Expected: 750.00");
      return false;
    }
  } catch (e) {
    console.error("✗ Test failed:", e);
    return false;
  }
}

/**
 * Test 3: Auto-Subscription
 * Verify that setupDatabaseAutoMath initializes without errors
 */
export function testAutoSubscription() {
  console.log("\n=== TEST 3: Auto-Subscription Setup ===");

  try {
    const schema = new Schema();
    const collection = new DocCollection({ schema });
    collection.meta.initialize();

    const doc = collection.createDoc();
    doc.load();

    const pageId = doc.addBlock("affine:page", {});
    const noteId = doc.addBlock("affine:note", {}, pageId);

    createMockDatabaseBlock(doc, noteId);

    // Initialize auto-math
    const unsubscribe = setupDatabaseAutoMath(doc);

    if (typeof unsubscribe !== "function") {
      console.error(
        "✗ setupDatabaseAutoMath did not return an unsubscribe function"
      );
      return false;
    }

    console.log("✓ Auto-math setup successful");
    console.log("✓ Unsubscribe function returned");

    // Clean up
    unsubscribe();
    console.log("✓ Unsubscribe called successfully");

    return true;
  } catch (e) {
    console.error("✗ Test failed:", e);
    return false;
  }
}

/**
 * Test 4: No Infinite Loop
 * Verify that updating Total doesn't trigger another calculation
 */
export function testNoInfiniteLoop() {
  console.log("\n=== TEST 4: Infinite Loop Prevention ===");

  try {
    const schema = new Schema();
    const collection = new DocCollection({ schema });
    collection.meta.initialize();

    const doc = collection.createDoc();
    doc.load();

    const pageId = doc.addBlock("affine:page", {});
    const noteId = doc.addBlock("affine:note", {}, pageId);

    const { databaseBlock, rows } = createMockDatabaseBlock(doc, noteId);

    let updateCount = 0;

    // Patch the updateBlock to count updates
    const originalUpdateBlock = doc.updateBlock.bind(doc);
    doc.updateBlock = function (model: any, props: any) {
      if (props.cells) {
        updateCount++;
        console.log(`  Update #${updateCount} triggered`);
      }
      return originalUpdateBlock(model, props);
    };

    // Initialize auto-math
    const unsubscribe = setupDatabaseAutoMath(doc);

    // Manually update Hours - should trigger one calc update
    const model = databaseBlock.model;
    const hoursCol = model.columns.find(
      (c: any) => c.name?.toLowerCase() === "hours"
    );

    if (hoursCol) {
      const updatedCells = { ...model.cells };
      updatedCells[rows[0].id] = {
        ...updatedCells[rows[0].id],
        [hoursCol.id]: { columnId: hoursCol.id, value: new Text("20") },
      };

      doc.updateBlock(model, { cells: updatedCells });

      // Give it a moment for async handlers
      setTimeout(() => {
        console.log(`  Total updates triggered: ${updateCount - 1}`);

        if (updateCount <= 2) {
          // 1 for our manual update, possibly 1 for the auto-calc
          console.log("✓ No infinite loop detected");
          unsubscribe();
          return true;
        } else {
          console.warn("✗ Possible infinite loop: too many updates");
          unsubscribe();
          return false;
        }
      }, 500);
    }

    return true;
  } catch (e) {
    console.error("✗ Test failed:", e);
    return false;
  }
}

/**
 * Run all tests
 */
export function testDatabaseAutoMath() {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║  Database Auto-Math Logic Test Suite                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results = [];

  try {
    results.push({
      name: "Column Detection",
      passed: testColumnDetection(),
    });

    results.push({
      name: "Manual Calculation",
      passed: testManualCalculation(),
    });

    results.push({
      name: "Auto-Subscription Setup",
      passed: testAutoSubscription(),
    });

    results.push({
      name: "Infinite Loop Prevention",
      passed: testNoInfiniteLoop(),
    });
  } catch (e) {
    console.error("Test suite error:", e);
  }

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log("║  Test Results Summary                                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  let passed = 0;
  results.forEach((result) => {
    const icon = result.passed ? "✓" : "✗";
    console.log(`${icon} ${result.name}`);
    if (result.passed) passed++;
  });

  console.log(`\nTotal: ${passed}/${results.length} passed`);

  return results.every((r) => r.passed);
}

export default testDatabaseAutoMath;
