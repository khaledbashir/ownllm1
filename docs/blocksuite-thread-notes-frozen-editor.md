# BlockSuite Thread Notes “Frozen Editor” — Cause & Fix

This document explains how to diagnose and fix a case where the **Thread Notes BlockSuite editor renders but is non-interactive** (can’t click to place a cursor, can’t type).

## Symptom
In the Workspace Chat UI (Thread Notes panel):
- The editor UI appears, but behaves as if it’s “read-only” or frozen.
- Clicking in the editor does not place a caret.
- Keyboard input does nothing.
- No obvious frontend crash / blank page.

## Root Cause
The BlockSuite/Affine editor relies on an underlying document model (Yjs-backed). In the Thread Notes implementation we were:
1) Creating or restoring a `doc` (from a snapshot or by creating an empty doc)
2) Mounting the editor container

…but **not calling `doc.load()`** before attaching the doc to the editor and mounting.

In that state, the editor can *render* but ends up partially initialized (selection/input pipeline not fully ready), which presents as a frozen editor.

This is consistent with other working BlockSuite usage in the codebase (e.g. `frontend/src/components/BlockSuite/LetterheadEditor.jsx`) that calls `doc.load()`.

## Where It Happened
Thread Notes editor implementation:
- `frontend/src/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor.jsx`

## Fix (Implemented)
After a doc is restored from snapshot (or created empty), ensure it’s loaded **before** assigning it to the editor and mounting.

Patch summary:
- Add an `ensureDocLoaded(doc)` helper that:
  - Calls `doc.load()` if present
  - Awaits it if it returns a Promise
  - Catches errors and continues (don’t brick the UI)
- Call `await ensureDocLoaded(doc);` immediately after doc creation/restoration, before `editor.doc = doc`.

This was committed as:
- Commit `28df3162` — `fix: load blocksuite doc to prevent frozen notes editor`

### Code Pattern
In `frontend/src/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor.jsx`:

```js
const ensureDocLoaded = async (targetDoc) => {
  if (!targetDoc || typeof targetDoc.load !== "function") return;
  try {
    const result = targetDoc.load();
    if (result && typeof result.then === "function") {
      await result;
    }
  } catch (e) {
    console.warn("[BlockSuiteEditor] doc.load() failed (continuing):", e);
  }
};

// After snapshot restore or empty doc creation
await ensureDocLoaded(doc);

const editor = new AffineEditorContainer();
editor.doc = doc;
containerRef.current.appendChild(editor);
```

## How To Diagnose If It Happens Again
1) **Confirm the symptom is “editor is visible but not interactive”**
   - Not a blank page / crash.

2) **Check if `doc.load()` is being called** in the relevant BlockSuite editor wrapper.
   - Search for `new AffineEditorContainer()` and see whether the doc is loaded prior.

3) **Check browser console logs** for BlockSuite/Affine/Yjs warnings.
   - Even if the editor is frozen, errors may appear related to doc initialization.

4) **Compare with a known-good editor implementation**
   - Example reference: `frontend/src/components/BlockSuite/LetterheadEditor.jsx`

## Verification Steps (After Deploy)
- Open any workspace thread → Thread Notes.
- Click inside the editor and confirm caret appears.
- Type and confirm content appears.
- Optional regression checks:
  - Reload the page and verify it remains editable.
  - Insert content into notes from chat and verify it still works.

## Notes / Gotchas
- `doc.load()` may throw or be async depending on BlockSuite/Yjs version and persistence adapters.
  - Always call it safely and await if needed.
- If the editor is still frozen **even with `doc.load()`**, the next most likely culprits are:
  - CSS overlays/z-index/pointer-events preventing clicks from reaching the editor.
  - A corrupted/invalid snapshot that restores an unusable document structure.
  - Focus/selection not being set after mount.

## Related Fix (Insert Into Notes)
A separate but related issue was that insertions could fail with:
- `[BlockSuiteEditor] No note block found`

That was fixed by ensuring `affine:note` exists during insertion:
- Commit `10371618` — `fix: ensure note block exists when inserting`
