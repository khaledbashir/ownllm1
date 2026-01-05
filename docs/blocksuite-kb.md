# AI Knowledge Base: BlockSuite Architecture & Development Guide

> **System Prompt Context**: This guide serves as the architectural source of truth for AI agents working on the OwnLLM BlockSuite integration.

## 1. Core Architecture & Philosophy
**Summary:** BlockSuite is a "data-first" framework. Unlike traditional editors that rely on the DOM as the source of truth, BlockSuite relies on a decoupled data layer built on Yjs (CRDTs). The UI is merely a reactive reflection of this data.

*   **The Data Layer (`@blocksuite/store`):**
    *   **Doc:** The primary container. Every document holds a Yjs subdocument and a block tree.
    *   **DocCollection:** Manages multiple docs and handles cross-doc consistency.
    *   **BlockModel:** The strongly-typed interface for reading/writing block data. It bridges Yjs and native JavaScript.
    *   **BlockSpec:** Encapsulates the schema, view, and service for a block.

*   **Data Flow:**
    *   `UI` → `Action/Command` → `Store (CRDT)` → `Signal/Event` → `UI Update`.
    *   **Rule:** Never update the UI state directly for document data. Update the BlockModel, and let the UI react to the change.

## 2. Data Modeling & Schema Definition
The AI must define schemas using the `@blocksuite/store` syntax.

### 2.1 Defining Blocks
Use `defineBlockSchema` to create definitions.
*   **Flavour:** A unique string ID (e.g., `affine:pricing-table`).
*   **Props:** The reactive data fields.
    *   **Primitive Types:** Strings, numbers, booleans.
    *   **`internal.Text`:** Maps to `Y.Text`. Use this for rich text to support collaborative formatting.
    *   **`internal.Boxed`:** Use this for opaque data blobs (like large static arrays) that do not require granular conflict resolution. It uses a "last-write-wins" strategy.

### 2.2 Nested Data Strategies (Crucial)
When modeling complex blocks (e.g., a table with rows and cells), you must choose a storage mode:
*   **Default Mode (Hierarchical):** Uses nested `Y.Map` objects. **Avoid** for dynamic arrays or deep nesting due to potential data loss during concurrent updates.
*   **Flat Mode (Recommended):** Flattens properties into a single `Y.Map` using dot notation (e.g., `prop:rows.0.rate`).
    *   **Usage:** Use this for complex objects like Pricing Tables or Kanban boards to ensure atomic updates and high concurrent safety.

### 2.3 Schema Evolution
*   **No Stop-the-World Migrations:** Because data is distributed (CRDT), you cannot run a central database migration.
*   **Optional Properties:** When adding new fields to an existing block, define them as optional (`undefined` default). The UI must handle the `undefined` state gracefully.
*   **Lazy Migration:** If a schema change is drastic, implement "migration-on-read" logic that updates the block structure programmatically when the block is loaded into the `BlockService`.

## 3. React Integration Patterns
BlockSuite uses Lit (Web Components) natively. To use it with React, the AI must follow specific bridging patterns to avoid "re-render loops."

### 3.1 The Wrapper Pattern
Do not implement `BlockSpec.view` directly in React. Create a Lit `BlockComponent` that mounts a React Root.
*   **Mounting:** Create `ReactDOM.createRoot` in `firstUpdated()` or `connectedCallback`.
*   **Unmounting:** Call `root.unmount()` in `disconnectedCallback`.

### 3.2 State Management (Anti-Patterns)
*   **Do Not Mirror Props to State:** Do not copy `BlockModel` data into React `useState` unless it is transient UI state (like a hover effect).
*   **Reactive Signals:** Block properties are exposed as signals (ending in `$`).
    *   **Correct:** Subscribe to `model.props.myProp$` inside a `useEffect` to trigger re-renders.
    *   **Correct:** Use `useSyncExternalStore` to treat the BlockSuite store as an external source of truth.

### 3.3 The Update Loop
1.  React Component triggers user action.
2.  Call `doc.updateBlock(model, { prop: newValue })`.
3.  **STOP.** Do not update local React state manually.
4.  BlockSuite updates Yjs CRDT.
5.  `model.props.prop$` signal fires.
6.  React subscription detects signal -> `setState` (internal) -> Re-render.

## 4. Updates, Transactions, and History
The AI must optimize for performance and history cleanliness when performing "Smart Actions" (e.g., AI generating a full table).

### 4.1 Batching
*   **Implicit Batching:** Multiple `updateBlock` calls are often batched by Yjs, but explicit transactions are safer for logic grouping.
*   **Transactions:** Use `doc.transact(() => { ... })` to bundle updates. This triggers a single event propagation, improving performance.

### 4.2 Undo/Redo Grouping
*   **CaptureSync:** If an AI agent inserts 50 blocks (e.g., a generated list), the user expects one "Undo" to remove them all.
*   **Usage:** Call `doc.captureSync()` *before* and *after* the logical operation group to ensure they are treated as a single history item.

## 5. Export and Serialization (Transformers)
BlockSuite documents are typically persisted as JSON snapshots.

### 5.1 Snapshots
*   Use `Job` to convert `doc` -> `snapshot` (JSON) and vice versa.
*   Storage: Snapshots are typically stored in a PostgreSQL `TEXT` or `JSONB` column.

### 5.2 Custom Exports (HTML/Markdown)
To export custom blocks (like an `affine:embed-pricing-table`) to HTML/PDF, you must extend the **Adapter** system.
*   **ASTWalker:** Use `ASTWalker` to traverse the block tree.
*   **Visitor Pattern:** Implement `setEnter` and `setLeave` handlers.
    *   *Example:* On `enter` of a pricing table block, open a `<table>` node in the target AST. On `leave`, close it.
*   **Fallback:** If an adapter returns `null` for a block, BlockSuite falls back to default text serialization.

## 6. Implementation Snippets for AI Reference

### Schema Definition (Flat Mode)
```typescript
import { defineBlockSchema } from '@blocksuite/store';

export const PricingTableSchema = defineBlockSchema({
  flavour: 'affine:embed-pricing-table',
  props: (internal) => ({
    // Flat mode: Store complex rows as a single flat Y.Map if possible
    // or use internal.Boxed if concurrent row editing isn't required
    data: internal.Boxed([]), 
    title: internal.Text(),
  }),
  metadata: {
    role: 'content',
    version: 1,
    children: [], // Leaf node, no children allowed
  },
});
```

### React Component Wrapper (Lit Bridge)
```typescript
// Based on Source
@customElement('affine-embed-pricing-table')
export class PricingTableBlock extends BlockComponent {
  private _reactRoot?: Root;

  override connectedCallback() {
    super.connectedCallback();
    // Subscribe to model updates to request Lit updates, 
    // which then triggers React renders
    this.model.propsUpdated.on(() => this.requestUpdate());
  }

  protected override firstUpdated() {
    const container = this.renderRoot.querySelector('#react-root');
    this._reactRoot = createRoot(container!);
    this.renderReact();
  }

  private renderReact() {
    // Pass the model, NOT the raw data. 
    // React component should subscribe to model signals.
    this._reactRoot?.render(<ReactPricingTable model={this.model} />);
  }
}
```

### Performing AI "Smart Actions" (Batching)
```typescript
// Based on Source
function applyAIUpdate(doc: Doc, model: BlockModel, newRows: any[]) {
  doc.transact(() => {
    // Update massive amount of data in one go
    doc.updateBlock(model, { rows: newRows });
  });
  // Ensure this batch is a single undo step
  doc.captureSync(); 
}
```

### Custom Export Adapter (ASTWalker)
```typescript
// Based on Source
walker.setEnter(async (node, context) => {
  if (node.flavour === 'affine:embed-pricing-table') {
    const html = generateTableHTML(node.props);
    context.openNode(
      { type: 'div', content: html, children: [] },
      'children'
    );
  }
});
```

---

# Part 2: OwnLLM Implementation Details

## 🏛️ Project Specific Architecture

### 1. Workspace Thread Notes
This repo uses BlockSuite to power **Workspace Chat → Thread Notes**. Notes are stored per thread in the DB as a single `TEXT` field containing JSON.

**Storage Format:**
- DB column: `workspace_threads.notes` (`TEXT`)
- API endpoints:
  - `GET /api/workspace/:slug/thread/:threadSlug/notes` → returns `{ notes: string }`
  - `PUT /api/workspace/:slug/thread/:threadSlug/notes` with `{ notes: string }`
- Snapshot payload format:
```json
{
  "type": "blocksuite-snapshot",
  "version": 1,
  "snapshot": { /* Job.docToSnapshot(doc) */ }
}
```

### 2. Pricing Tables (Custom Embed Block)
We implement pricing tables as a custom embed block to avoid `affine:database` UI leakage.
- Block flavour: `affine:embed-pricing-table`
- Block schema/spec: `frontend/src/components/BlockSuite/pricing-table-block.jsx`

**Props Contract:**
- `title: Text`
- `rows: Array<{ id, role, description, hours, baseRate }>` (Stored as JSON array)

### 3. Rate Card + Smart Actions (SOW pipeline)
SOW generation is implemented as **smart actions** that return markdown + structured pricing payloads.
- Backend smart actions: `server/utils/chats/smartActions.js`
- Integration: Smart action result → Thread Notes action handler → BlockSuite insertion.
