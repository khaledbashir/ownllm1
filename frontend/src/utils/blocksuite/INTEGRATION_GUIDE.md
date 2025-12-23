/**
 * Integration Guide: Using Auto-Math in BlockSuiteEditor
 * 
 * This file demonstrates where and how to initialize the auto-math logic
 * in the existing BlockSuiteEditor component.
 * 
 * Copy the code snippets below into BlockSuiteEditor.jsx
 */

// ============================================================================
// 1. ADD TO IMPORTS (at the top of BlockSuiteEditor.jsx)
// ============================================================================

import { setupDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath';

// ============================================================================
// 2. ADD TO EDITOR INITIALIZATION (inside the initEditor effect)
// ============================================================================

/*
  After the editor is set up and doc is loaded, add this:

  useEffect(() => {
    if (!editorRef.current || !doc) return;

    // Initialize auto-math for database blocks
    const unsubscribeAutoMath = setupDatabaseAutoMath(doc);

    // Return cleanup function
    return () => {
      unsubscribeAutoMath();
    };
  }, [doc]);
*/

// ============================================================================
// 3. FULL EXAMPLE: Where to place this in context
// ============================================================================

/*
  Example snippet from BlockSuiteEditor.jsx around line 650-700:

  useEffect(() => {
    if (!containerRef.current || !isReady) return;

    (async () => {
      try {
        const schema = new Schema().register([
          ...AffineSchemas,
          PricingTableBlockSchema,
        ]);

        const collection = new DocCollection({ schema });
        collection.meta.initialize();

        let doc;
        if (content && !isEmpty) {
          const parsed = JSON.parse(content);
          if (parsed.type === 'blocksuite-snapshot') {
            const snapJob = new Job({ collection });
            doc = await snapJob.snapshotToDoc(parsed.snapshot);
          } else {
            doc = collection.createDoc();
            doc.load();
          }
        } else {
          doc = createEmptyDoc(collection);
        }

        await ensureDocLoaded(doc);

        // *** ADD THIS: Initialize auto-math after doc is loaded ***
        const unsubscribeAutoMath = setupDatabaseAutoMath(doc);

        // Store the unsubscribe function for cleanup
        editorRef.current.unsubscribeAutoMath = unsubscribeAutoMath;
        // ***

        const editor = new AffineEditorContainer();
        editor.doc = doc;
        editor.specs = [
          ...PageEditorBlockSpecs,
          PricingTableBlockSpec,
        ];

        containerRef.current.appendChild(editor);
        editorRef.current.editor = editor;
        editorRef.current.doc = doc;
        editorRef.current.collection = collection;

        // ... rest of setup ...
      } catch (e) {
        console.error('[BlockSuiteEditor] Init error:', e);
      }
    })();
  }, [content, isReady, isEmpty, onReady]);

  // *** ADD THIS: Cleanup unsubscribe on unmount ***
  useEffect(() => {
    return () => {
      if (editorRef.current?.unsubscribeAutoMath) {
        editorRef.current.unsubscribeAutoMath();
      }
    };
  }, []);
  // ***
*/

// ============================================================================
// 4. ADVANCED: Custom Configuration Example
// ============================================================================

/*
  If you need to customize which column names trigger auto-math:

  const customConfig = {
    multipliers: [
      { names: ['qty', 'quantity', 'units'], type: 'number' },
      { names: ['unit_price', 'cost', 'rate'], type: 'number' },
    ],
    target: { names: ['line_total', 'total'], type: 'number' },
  };

  const unsubscribeAutoMath = setupDatabaseAutoMath(doc, customConfig);
*/

// ============================================================================
// 5. TESTING: Verify Auto-Math is Working
// ============================================================================

/*
  Add this to your dev tools console to debug:

  // Enable debug logging
  localStorage.setItem('debug_blocksuite_automath', '1');

  // Watch for calculations
  const blocks = doc.getBlocksByFlavour('affine:database');
  console.log('Database blocks found:', blocks.length);

  // Manually trigger a calculation test:
  import { recalculateDatabaseRow } from '@/utils/blocksuite/databaseAutoMath';
  const dbBlock = blocks[0];
  const rowId = Object.keys(dbBlock.model.cells)[0];
  recalculateDatabaseRow(dbBlock, rowId);
*/

export const AUTO_MATH_INTEGRATION_GUIDE = {
  importStatement:
    "import { setupDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath'",
  initializationLocation: 'After doc.load() in the editor init effect',
  returnValue: 'unsubscribe function for cleanup',
  customization:
    'Pass a custom config object as the second parameter to setupDatabaseAutoMath',
  debugFlag: 'localStorage.setItem("debug_blocksuite_automath", "1")',
};
