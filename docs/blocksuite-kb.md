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

