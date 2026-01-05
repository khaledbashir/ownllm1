# BlockSuite Internal Knowledge Base

> Reference doc for BlockSuite development patterns. Updated as we learn.

---

## 🎯 Core Concepts

| Concept | Description |
|---------|-------------|
| **BlockSpec** | Bundle of schema + view + service that defines a block type |
| **Widgets** | UI components (slash menu, toolbar) registered in BlockSpecs |
| **Fragments** | UI outside editor (title input, outline sidebar) |
| **Presets** | Ready-to-use editors (`PageEditor`, `EdgelessEditor`) |

---

## 📝 Document Title

Set title when creating `affine:page`:

```typescript
import { Text } from '@blocksuite/store';

doc.load(() => {
  const pageBlockId = doc.addBlock('affine:page', {
    title: new Text('Your Document Title'),
  });
});
```

---

## 🖼️ Add Image Block

```typescript
doc.addBlock('affine:image', {
  src: 'https://example.com/image.png'
}, parentId);
```

For CORS/proxy: `editorRoot.spec.getService('affine:image').setImageProxyURL(url)`

---

## 📤 Export to Markdown

Use Snapshot API + MarkdownAdapter:

```typescript
const job = new Job({ collection: doc.collection });
const snapshot = await job.docToSnapshot(doc);
const adapter = new MarkdownAdapter(job);
const markdownResult = await adapter.fromDocSnapshot({ 
  snapshot, 
  assets: job.assetsManager 
});
```

---

## 🔒 Read-Only Mode

No "locked" property per block. Instead:
- **Remove widgets** from BlockSpec to disable editing
- Create BlockSpec without `toolbar`, `dragHandle` widgets
- "Remove all widgets to compose read-only editors"

---

## 📦 Block Types

| Block | Purpose |
|-------|---------|
| `affine:page` | Root block with title |
| `affine:surface` | Canvas/graphics layer (Edgeless mode) |
| `affine:note` | Container for content blocks (Page mode) |
| `affine:paragraph` | Text, headings (`type: 'h1'`, `'h2'`, `'quote'`) |
| `affine:list` | Bullet/numbered/todo lists (`type: 'bulleted'`, `'numbered'`, `'todo'`) |
| `affine:code` | Code blocks with `language` property |
| `affine:image` | Images with `sourceId` (asset reference) |
| `affine:database` | Data grid/table with Kanban support |
| `affine:divider` | Horizontal rule |
| `affine:bookmark` | Link cards with `url`, `title`, `description` |
| `affine:attachment` | File attachments with `name`, `size` |

---

## 🗄️ affine:database Data Structure (CRITICAL FOR EXPORT)

The `affine:database` block stores content using **Block Tree hierarchy**, not a simple cells object.

### Key Architecture

| Component | Storage Location | Description |
|-----------|------------------|-------------|
| **Column Definitions** | `model.columns[]` | Array of `{id, name, type}` |
| **Rows** | Child blocks | Each row is an `affine:paragraph` or `affine:list` block |
| **First Column (Title)** | Child block's `text` | The paragraph/list text IS the first column |
| **Other Columns** | `model.cells[rowId][columnId]` | Non-title columns stored in cells object |

### Export Pattern

```javascript
// Correct way to export affine:database
const columns = model.columns || [];
const childBlocks = block.children || []; // ROWS are child blocks!
const cells = model.cells || {};

for (const childBlock of childBlocks) {
    const rowId = childBlock.id;
    const firstColText = getText(childBlock); // Title column
    
    // Other columns from cells object
    const rowCells = cells[rowId] || {};
    columns.slice(1).forEach(col => {
        const cellValue = rowCells[col.id]?.value?.toString() || "";
    });
}
```

### Common Mistake ❌
```javascript
// WRONG: This will produce empty cells
Object.keys(model.cells).forEach(rowId => { ... });
```

### Correct Approach ✅
```javascript
// RIGHT: Iterate child blocks as rows
for (const childBlock of block.children) {
    const firstCol = getText(childBlock);
    const otherCols = model.cells[childBlock.id] || {};
}
```

---

## ⌨️ Slash Command

- Implemented as widget: `@blocksuite/affine-widget-slash-menu`
- Registered in BlockSpec
- To add custom items: extend slash menu widget or BlockService

---

## 📋 Invoice Template Pattern

```typescript
function initInvoiceDoc(doc: Doc) {
  doc.load(() => {
    const pageId = doc.addBlock('affine:page', { 
      title: new Text('INVOICE') 
    });
    const noteId = doc.addBlock('affine:note', {}, pageId);
    
    // Logo (image block)
    doc.addBlock('affine:image', { src: 'logo.png' }, noteId);
    
    // Line items table
    doc.addBlock('affine:table', {}, noteId);
    
    // Footer
    doc.addBlock('affine:paragraph', { 
      text: new Text('Thank you for your business!'),
      type: 'quote'
    }, noteId);
  });
}
```

---

## 💡 Tips

1. **Fixed Header/Footer** → Render as HTML outside `<editor-host>`, not as blocks
2. **Template = doc.load()** → No file templates, programmatic initialization
---

## 🏛️ Architecture & FAQ

### 1. Headless / Server-Side Rendering (SSR)
*   **Question**: Can we render HTML natively in Node.js (no browser)?
*   **Answer**: **No.** BlockSuite relies on Web Components and needs a DOM.
*   **Workaround**: Use `Adapter API` to convert JSON Snapshot -> HTML (fast, structural) or stick to Puppeteer for "perfect" visual rendering (slower, accurate).

### 2. Custom React Blocks
*   **Status**: BlockSuite uses `Lit` (Web Components) by default.
*   **React Integration**: Requires `EditorHost` middleware (WIP).
*   **Current Best Practice**: Use **Embed Blocks** for isolated React components (like Pricing Tables) that manage their own state, or standard `BlockService` data models.

### 3. Persistence Strategy
*   **Recommendation**: Save **Binary CRDT Data** (Y.js blobl), NOT just the JSON snapshot.
*   **Why**: Enables collaboration, streaming, and efficient conflict resolution.
*   **Pattern**: Connect `doc` to a custom Provider that syncs binary data with Postgres.

### 4. Event Hooks (Global Listeners)
*   **Global Events**: Use `this.std.event` (UIEventDispatcher).
*   **Block State Changes**: Use `BlockService` + `CommandManager`. Everything is a command; intercept commands to trigger side effects (e.g., "User checked box" -> "Update DB").

---

## 🧵 Workspace Thread Notes (AnythingLLM)

This repo uses BlockSuite to power **Workspace Chat → Thread Notes**. Notes are stored per thread in the DB as a single `TEXT` field containing JSON.

### Storage Format

- DB column: `workspace_threads.notes` (`TEXT`)
- API endpoints:
  - `GET /api/workspace/:slug/thread/:threadSlug/notes` → returns `{ notes: string }`
  - `PUT /api/workspace/:slug/thread/:threadSlug/notes` with `{ notes: string }`
- Snapshot payload format (what we store in `notes`):

```json
{
  "type": "blocksuite-snapshot",
  "version": 1,
  "snapshot": { /* Job.docToSnapshot(doc) */ }
}
```

Frontend implementation:
- Editor + snapshot save/restore: `frontend/src/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor.jsx`
- Fetch + update notes: `frontend/src/models/workspaceThread.js`

### Save/Restore Notes (Important)

- Restore: `Job.snapshotToDoc(parsed.snapshot)`
- Save: `Job.docToSnapshot(doc)` then JSON.stringify
- Autosave should listen to **more than only** `doc.slots.blockUpdated`.
  - Some operations (especially `doc.addBlock`) may not fire `blockUpdated` reliably.
  - Prefer listening to `blockUpdated` + `blockAdded` + `blockDeleted` when available.

Debugging tip:
- Set `localStorage.debug_blocksuite = "1"` to log pricing/database block counts on doc restore.

---

## 💰 Pricing Tables (Custom Embed Block)

We implement pricing tables as a custom embed block to avoid `affine:database` UI leakage ("Table View", "+ New Record", etc.) and to keep totals deterministic.

- Block flavour: `affine:embed-pricing-table`
- Block schema/spec: `frontend/src/components/BlockSuite/pricing-table-block.jsx`
- Inserted during markdown parsing and also via explicit API from Thread Notes actions.

### Props Contract

`affine:embed-pricing-table` stores data in block props:

- `title: Text`
- `currency: string` (default `AUD`)
- `discountPercent: number`
- `gstPercent: number`
- `rows: Array<{ id, role, description, hours, baseRate }>`

### Export Contract (PDF)

PDF export uses a custom serializer that has a dedicated case for `affine:embed-pricing-table`.

- Serializer location: `frontend/src/components/WorkspaceChat/ThreadNotes/BlockSuiteEditor.jsx`
- If `rows` is empty you may see `"No rows"` in PDF output.
  - That indicates the block exists but data binding/persistence failed.

---

## 🪪 Rate Card + Smart Actions (SOW pipeline)

SOW generation is implemented as **smart actions** that return markdown + structured pricing payloads.

Backend smart actions:
- `server/utils/chats/smartActions.js`
- Key actions:
  - `draft_sow`
  - `multi_scope_sow`

Business rules enforced:
- Uses workspace **HOURLY RATE CARD** (AUD ex GST)
- Mandatory roles and ordering are enforced server-side

Integration pattern:
- Smart action result → Thread Notes action handler → BlockSuite insertion:
  - Markdown sections inserted as `affine:paragraph`/`affine:list` etc.
  - Pricing payload inserted as `affine:embed-pricing-table`

---

## 🔌 Adding a New Block / Extension (Practical Checklist)

1. Create block schema + view
- Prefer embed blocks for self-contained UI.
- Add schema/spec near `frontend/src/components/BlockSuite/`.

2. Register the block
- Schema registration (data shape): register with `Schema().register([...AffineSchemas, MyBlockSchema])`.
- Spec registration (view/widgets): `editor.pageSpecs = [...PageEditorBlockSpecs, MyBlockSpec]`.

3. Persist via snapshots
- Ensure changes trigger save. If you programmatically add blocks, explicitly save a snapshot after insertion.

4. Export handling
- Decide export requirement:
  - If must appear in PDF, add a serializer case (snapshot→HTML) for the new block flavour.
  - Avoid leaking interactive UI elements into export.

5. Debug quickly
- Add a temporary `localStorage` feature flag to log block counts/props on restore.

---

## 🛠️ Detailed Technical Q&A: Custom Blocks & Adapters

### 1. How do we define a custom `BlockSpec`?

A BlockSpec is composed of three main parts: `schema`, `service`, and `view`.

#### A. Defining the `BlockSpec`
1.  **Schema**: Define the data structure using `defineBlockSchema`.
2.  **Service**: Extend `BlockService` to implement custom logic.
3.  **View**: Define the UI component (usually using Lit).

```typescript
const MyBlockSpec: BlockSpec = {
    schema: MyBlockSchema,
    service: MyBlockService,
    view: {
        component: literal`my-block-component`, // The registered Web Component tag
        widgets: {
            myToolbar: literal`my-toolbar`,
        },
    },
};
```

#### B. Registration
To register the new block, insert the custom `BlockSpec` into the editor's specification list:

```typescript
editor.specs = [ ... PageEditorBlockSpecs, EmbedGithubBlockSpec];
editor.doc = doc;
```
Once registered, you can insert the new block using `doc.addBlock('namespace:name', props, parentId)`.

### 2. How do we hook custom blocks into Html/Markdown adapters?

1.  **Extend `BaseAdapter`**: Define an adapter functionality extending `BaseAdapter`.
2.  **Implement `fromDocSnapshot`**: The conversion logic resides in `fromDocSnapshot`, which takes the **Snapshot** and **Assets Manager** (`job.assetsManager`) as payload.
3.  **Use `ASTWalker`**: Use `ASTWalker` to traverse the BlockSuite Snapshot and build the target AST (e.g., HTML structure).

### 3. Pattern for HtmlAdapter Extensions?

The pattern processes block types based on their **`flavour`**. The `ASTWalker` uses **`setEnter`** and **`setLeave`** handlers to process nested nodes.

### 4. Implementing a Custom Table Adapter (Example)

To transform a `my:fancy-table` block into a `<table>` tag:

1.  **Initialize Walker**: `ASTWalker<BlockSnapshot, HTML_AST_Node>()`
2.  **setEnter**: Open the node.
    ```typescript
    walker.setEnter(async (o, context) => {
        if (o.node.flavour === 'my:fancy-table') {
            context.openNode({ type: 'table', children: [] }, 'children');
        }
    });
    ```
3.  **setLeave**: Close the node.
    ```typescript
    walker.setLeave(async (o, context) => {
        if (o.node.flavour === 'my:fancy-table') {
            context.closeNode();
        }
    });
    ```

### 5. Registering Adapter Extensions

Use **`JobMiddleware`** to inject custom configuration:

```typescript
const middleware: JobMiddleware = ({ adapterConfigs }) => {
    adapterConfigs.set('my:fancy-table:config', { option: 'value' }); 
};
const job = new Job({ collection: doc.collection, middlewares: [middleware] });
```
Your adapter can then retrieve this configuration via `this.job.adapterConfigs`.

### 6. Using `job.assetsManager` for Images

The `assetsManager` is passed into `fromDocSnapshot`.

*   **Accessing Assets**: `job.assetsManager` (or `job.assets`) exposes the assets map.
*   **Inlining**: Retrieve the Blob using the ID (e.g., via `job.assets.get(id)`), convert it to a Base64 string, and inline it into the `src` attribute of the HTML.

### 7. Canonical End-to-End PDF Pipeline

1.  **JSON Snapshot**: Generate snapshot from `doc`.
2.  **HtmlAdapter**: Convert snapshot to HTML string.
3.  **Post-Process**: Inline assets (Base64) and apply styles.
4.  **Render**: Use a headless browser (Puppeteer) or print-CSS tool (Paged.js) to convert the HTML to PDF.

### 8. Adapter-Based vs Visual Export

| Export Type | Purpose | Rationale |
| :--- | :--- | :--- |
| **Adapter-Based** | **Structural/Content** | Fast, headless, runs in Node.js. Good for Markdown/raw HTML. |
| **Visual Export** | **High-Fidelity UI** | Requires a browser to render Web Components and themes. Essential for specific visual layouts (e.g., Page vs Edgeless mode). |

---

## 🏗️ Custom Embed Blocks & React Integration (Best Practices)

Derived from architectural analysis for `form-embed` implementation.

### 1. Defining Embed Blocks
Use the **2-step definition process** to avoid schema errors:
1. **Model**: Extend `defineEmbedModel(BlockModel)` to type safely.
2. **Schema**: Use `createEmbedBlockSchema`. This creates the "contract".

```typescript
// 1. Model
export class MyBlockModel extends defineEmbedModel(BlockModel) {}

// 2. Schema
export const MyBlockSchema = createEmbedBlockSchema({
  name: 'my-embed', // matching flavour!
  toModel: () => new MyBlockModel(),
  props: () => ({ status: 'active' }),
});
```

### 2. The Spec Structure (CRITICAL)
A `BlockSpec` is a bundle. It **MUST** include the schema.
**Correct Structure:**
```javascript
export const MyBlockSpec = {
  schema: MyBlockSchema, // <-- DO NOT FORGET THIS
  view: {
    component: literal`my-web-component-tag`
  }
};
```
*Failure to include `schema` results in editor crashes (Cannot read property 'model' of undefined).*

### 3. React Integration Pattern
While BlockSuite is native Web Components, the "Practical Implementation" for React is to use a wrapper Web Component that manages the React Root.

**Pattern:**
```javascript
class MyBlockElement extends BlockElement {
  connectedCallback() {
      super.connectedCallback();
      // Mount React Root
      this._root = createRoot(this); 
      this._root.render(<MyReactComponent model={this.model} />);
  }
  disconnectedCallback() {
      // Unmount to prevent leaks
      if (this._root) this._root.unmount();
      super.disconnectedCallback();
  }
}
defineOnce('my-web-component-tag', MyBlockElement);
```

### 4. Persistence
Do **not** implement custom serialization. Update props on the model, and the CRDT-backed Block Tree handles binary serialization automatically.
```javascript
doc.updateBlock(model, { formId: 'new-id' }); // Automatically persisted
```

### 5. Detailed Code Pattern: React Wrapper

The canonical way to wrap React components safely:

```javascript
/* implementation of BlockElement */
connectedCallback() {
  super.connectedCallback();
  // 1. Create root 
  // 2. Listen to propsUpdated
  this._sub = this.model.propsUpdated.on(() => this._render());
}

_render() {
  // Pass model DOWN to React. 
  // React should NOT write back to model directly during render.
  this._root.render(<MyReactComponent model={this.model} />);
}

disconnectedCallback() {
  this._sub?.dispose();
  this._root?.unmount();
  super.disconnectedCallback();
}
```

---

## 📄 PDF/HTML Export Adapter Pattern

To render custom blocks (like forms) in exports, extend the `BaseAdapter`.

```typescript
import { BaseAdapter, ASTWalker } from '@blocksuite/store';

class CustomHtmlAdapter extends BaseAdapter {
  async fromDocSnapshot({ snapshot }) {
    const walker = new ASTWalker();
    
    walker.setEnter(async (node, context) => {
      if (node.flavour === 'affine:embed-form') {
        // Transform to HTML table or div
        context.openNode(
          { type: 'div', content: `<div class="form-placeholder">Form: ${node.props.title}</div>` }, 
          'children'
        );
      }
    });

    walker.setLeave(async (node, context) => {
       if (node.flavour === 'affine:embed-form') {
         context.closeNode();
       }
    });

    // ... walk logic
  }
}
```

---

## 🎨 Edgeless Architecture & Isomorphic Data

BlockSuite documents are **isomorphic**: a single block tree can be rendered in Page or Edgeless mode.

### Surface Blocks vs. Elements
In Edgeless mode, the **Surface Block** (`affine:surface`) is the mandatory container for graphical content.
- **Block Children**: Standard blocks (images, notes) positioned anywhere.
- **Elements**: Graphical primitives (brushes, shapes) stored in the `elements` field and rendered via HTML5 canvas.

### Hierarchical Determination
- **Page Mode**: Linear order.
- **Edgeless Mode**: Hierarchy uses **Fractional Indexing** (`index` field). Layering is determined by comparing these indices.

### Frames vs. Groups
- **Frames**: Dynamic geometric containers. Dragging the frame moves its contents. Cannot nest.
- **Groups**: Static associations of child IDs. Can nest. No inherent dimensions.

---

## 🖱️ Advanced Selection Management

Managed by `std.selection` (SelectionManager). Critical for context-aware tools.

### Selection Types
- **TextSelection**: Character-level ranges.
- **BlockSelection**: Structural nodes (for drag/delete).
- **SurfaceSelection**: 2D graphical objects in Edgeless.
- **CursorSelection**: Remote collaborator positions.

### Data Structure
`selection.value` objects contain:
- `id`: Block ID
- `path`: Sequence of IDs from root
- `group`: Context identifier

---

## 🧩 Custom Widget Development Pattern

Widgets (like Slash Menus) should inherit from `WidgetComponent`.

### Implementation Pattern
```javascript
export class MyWidget extends WidgetComponent {
  get host() { return this.std.blockComponent; }

  connectedCallback() {
      super.connectedCallback();
      // Listen to UI changes
  }
  
  changeLanguage(lang) {
      // Logic execution
      const block = this.host.model;
      this.doc.updateBlock(block, { language: lang });
  }
}
```
*   **Access Host**: `this.blockComponent` interacts with the hosting block.
*   **Logic**: Use `this.doc.updateBlock` or `this.std.command`.

---

## 🔄 Advanced Synchronization

### Snapshot API (JSON)
- **Use for**: Templates, file imports, structural exports.
- **Nature**: Transactional, unidirectional conversion to JSON.

### Document Streaming (Binary CRDT)
- **Use for**: Real-time collaboration, persistence.
- **Nature**: Yjs binary data streams from providers (IndexedDB, WebSockets).

---

## 🎭 Global Theming (ThemeSchema)

Validated by Zod. Supports `light`, `dark`, and `normal` variants for CSS variable injection.

```typescript
const MyThemeSchema = z.object({
    noteBackgroundColor: z.string(), // CSS var --note-background-color
    connectorColor: z.string(),
});
```

---

## 🎓 Lessons Learned (Common Pitfalls)

### 1. Property Validation (Auto-Math)
**Pitfall**: Calculating fields when metadata is missing.
**Fix**: Verify columns exist before math.
```javascript
if (!model.columns.find(c => c.name === 'Hours')) return;
```

### 2. Infinite Update Loops
**Pitfall**: `doc.updateBlock` triggers `blockUpdated`, causing recursive logic.
**Fix**: **Value Comparison Guard**.
```javascript
if (model.props.total !== newTotal) {
    doc.updateBlock(model, { total: newTotal });
}
```
