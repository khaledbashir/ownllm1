/**
 * IMPLEMENTATION EXAMPLES: Database Auto-Math in BlockSuiteEditor.jsx
 * 
 * Copy-paste ready code snippets showing exactly where and how to integrate
 * the auto-math functionality into your existing BlockSuiteEditor component.
 */

// ============================================================================
// EXAMPLE 1: Minimal Integration (Recommended for most cases)
// ============================================================================

/*
  Location: BlockSuiteEditor.jsx, top-level imports (~line 15)

  ADD THIS:
*/
import { setupDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath';

/*
  Location: Inside the main useEffect that initializes the editor (~line 670-700)

  FIND THIS:
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

          // ← INSERT HERE: Auto-math initialization
          
          const editor = new AffineEditorContainer();
          ...

  REPLACE WITH:
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

          // ✨ AUTO-MATH INITIALIZATION ✨
          const unsubscribeAutoMath = setupDatabaseAutoMath(doc);
          
          const editor = new AffineEditorContainer();
          // ... rest of editor setup ...
          
          // Store unsubscribe function for cleanup
          editorRef.current.unsubscribeAutoMath = unsubscribeAutoMath;
        } catch (e) {
          ...
        }
      })();
    }, [content, isReady, isEmpty, onReady]);

  THEN ADD THIS CLEANUP (at the same component level, e.g., after the above useEffect):
    useEffect(() => {
      return () => {
        // Cleanup auto-math subscription on unmount
        if (editorRef.current?.unsubscribeAutoMath) {
          editorRef.current.unsubscribeAutoMath();
          delete editorRef.current.unsubscribeAutoMath;
        }
      };
    }, []);
*/

// ============================================================================
// EXAMPLE 2: With Custom Configuration
// ============================================================================

/*
  If you need to customize which columns trigger auto-math:

  REPLACE THE INITIALIZATION LINE WITH:
*/
const customConfig = {
  multipliers: [
    { names: ['qty', 'quantity', 'units', 'hours'], type: 'number' },
    { names: ['unit_price', 'unit_cost', 'rate', 'price'], type: 'number' },
  ],
  target: { names: ['line_total', 'total', 'subtotal', 'amount'], type: 'number' },
};

const unsubscribeAutoMath = setupDatabaseAutoMath(doc, customConfig);
editorRef.current.unsubscribeAutoMath = unsubscribeAutoMath;

// ============================================================================
// EXAMPLE 3: With Error Handling
// ============================================================================

/*
  If you want explicit error handling:
*/
try {
  const unsubscribeAutoMath = setupDatabaseAutoMath(doc);
  editorRef.current.unsubscribeAutoMath = unsubscribeAutoMath;
  console.log('[BlockSuiteEditor] Auto-math enabled for databases');
} catch (error) {
  console.error('[BlockSuiteEditor] Failed to setup auto-math:', error);
  // Fail gracefully - app still works without auto-calc
}

// ============================================================================
// EXAMPLE 4: Debugging & Testing
// ============================================================================

/*
  Add this to your browser console to test the implementation:
*/

// Enable debug logging
localStorage.debug_blocksuite_automath = '1';

// Check if auto-math is loaded
console.log('databaseAutoMath:', typeof setupDatabaseAutoMath);

// Run unit tests
import { testDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath.test';
testDatabaseAutoMath();

// Manually trigger calculation on a specific row
import { recalculateDatabaseRow } from '@/utils/blocksuite/databaseAutoMath';
const db = doc.getBlocksByFlavour('affine:database')[0];
const rowId = Object.keys(db.model.cells)[0];
recalculateDatabaseRow(db, rowId);
console.log('Recalculated row:', rowId);

// ============================================================================
// EXAMPLE 5: Full Component Reference (Excerpt)
// ============================================================================

/*
  This shows what the modified component looks like:

  import { setupDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath';
  
  const BlockSuiteEditor = forwardRef(({ content, isEmpty, onReady }, ref) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    // Main editor initialization effect
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

          // Load or create doc
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

          // ✨ INITIALIZE AUTO-MATH HERE ✨
          const unsubscribeAutoMath = setupDatabaseAutoMath(doc);
          editorRef.current.unsubscribeAutoMath = unsubscribeAutoMath;

          // Initialize editor
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

          // Setup event handlers...
          setupAutoSave(doc);
          setupAISlashMenu(editor);
          // ... etc

          onReady?.();
        } catch (e) {
          console.error('[BlockSuiteEditor] Init error:', e);
        }
      })();
    }, [content, isReady, isEmpty, onReady]);

    // ✨ CLEANUP EFFECT FOR AUTO-MATH ✨
    useEffect(() => {
      return () => {
        if (editorRef.current?.unsubscribeAutoMath) {
          editorRef.current.unsubscribeAutoMath();
          delete editorRef.current.unsubscribeAutoMath;
        }
      };
    }, []);

    // Rest of component...
    return (
      <div ref={containerRef} className="blocksuite-editor" />
    );
  });

  export default BlockSuiteEditor;
*/

// ============================================================================
// EXAMPLE 6: Testing the Integration (Quick Checklist)
// ============================================================================

/*
  After integrating, test with this checklist:

  Manual Testing:
  ──────────────
  1. [ ] Create a new document
  2. [ ] Insert a table with columns: "Name", "Hours", "Rate", "Total"
  3. [ ] In the first row:
     [ ] Enter "Developer" in Name
     [ ] Enter "10" in Hours
     [ ] Enter "75" in Rate
  4. [ ] Verify Total auto-calculates to "750.00"
  5. [ ] Edit Hours to "15" → Total should update to "1125.00"
  6. [ ] Clear Hours field → Total should become "0.00"
  7. [ ] Save the document
  8. [ ] Reload the page (e.g., refresh browser)
  9. [ ] Verify the Total is still "0.00" or recalculates correctly

  Edge Case Testing:
  ──────────────────
  1. [ ] Create database with different column names: "QTY", "PRICE", "TOTAL"
  2. [ ] Verify auto-calc still works (case-insensitive matching)
  3. [ ] Test with empty cells → should not error
  4. [ ] Test with decimal hours: "1.5" × "75" = "112.50"
  5. [ ] Test with non-numeric input: "abc" (should default to 0)

  Developer Console Testing:
  ─────────────────────────
  1. [ ] Run unit tests: testDatabaseAutoMath()
  2. [ ] Check for "[AutoMath]" debug messages
  3. [ ] Verify no errors in console
  4. [ ] Check Chrome DevTools Performance tab for no excessive updates
*/

// ============================================================================
// EXAMPLE 7: Troubleshooting Template
// ============================================================================

/*
  If auto-math isn't working, debug with this:

  1. Check if setupDatabaseAutoMath is being called:
     Add console.log in BlockSuiteEditor.jsx:
       const unsubscribeAutoMath = setupDatabaseAutoMath(doc);
       console.log('Auto-math initialized:', !!unsubscribeAutoMath);

  2. Check if columns are being detected:
     In databaseAutoMath.ts, add console.logs in findColumnIdByNames()
     
  3. Check if observers are firing:
     Add observer.on() logging in setupDatabaseAutoMath()
     
  4. Check if calculation is happening:
     Add console.log in recalculateRow()

  5. Check if updates are persisting:
     Verify saveDocSnapshot() is being called after doc.updateBlock()

  6. Run tests:
     testDatabaseAutoMath() should return true

  7. Check browser console for:
     - "[AutoMath] Enabled for database block" messages
     - Any "[AutoMath] Error" messages
     - No "Infinite loop detected" warnings
*/

export const INTEGRATION_EXAMPLES = {
  setupImport: "import { setupDatabaseAutoMath } from '@/utils/blocksuite/databaseAutoMath'",
  initLocation: 'After ensureDocLoaded(doc) in editor initialization effect',
  cleanupLocation: 'Add new useEffect() to handle cleanup',
  customConfigExample: {
    multipliers: [{ names: ['qty', 'hours'] }, { names: ['rate', 'price'] }],
    target: { names: ['total'] },
  },
  testCommand: 'testDatabaseAutoMath() in browser console',
};
