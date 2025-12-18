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
| `affine:paragraph` | Text, headings (`type: 'h1'`) |
| `affine:list` | Bullet/numbered lists |
| `affine:code` | Code blocks |
| `affine:image` | Images |
| `affine:table` | Tables |

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
