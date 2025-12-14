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
3. **Widgets control editability** → Remove widgets for read-only sections
