# RAG KB Update Plan

## anythingllm-kb.md

### 🔌 Agent Plugin Development (Updated)


**Agent Plugins Location:** `server/utils/agents/aibitat/plugins/`

**Built-in Plugins:**
- `web-browsing.js` - DuckDuckGo/Google/SerpApi search
- `web-scraping.js` - URL content scraping via CollectorApi
- `product-extraction.js` - LLM-based product & price extraction

**Plugin Structure:**
```javascript
const pluginName = {
  name: "web-browsing",
  plugin: function() {
    return {
      name: this.name,
      setup(aibitat) {
        aibitat.function({
          name: this.name,
          description: "...",
          parameters: { /* JSON Schema */ },
          handler: async function({ query }) {
            // Logic here
            return result; // Must return string
          },
          
          // Optional: Custom methods
          search: async function(query) { ... }
        });
      }
    };
  }
};
module.exports = { pluginName };
```

**Headless Plugin Execution:**
```javascript
const { webBrowsing } = require("./agents/aibitat/plugins/web-browsing");
const mockAibitat = {
  handlerProps: { log: ... },
  introspect: ...,
  caller: "ProductImport",
  provider: settings.LLMProvider,
  model: settings.LLMModel,
  function: function(funcConfig) { this.currentFunction = funcConfig; }
};

const pluginConfig = webBrowsing.plugin();
pluginConfig.setup(mockAibitat);
const result = await mockAibitat.currentFunction.handler({ query: "search term" });
```


### 🔑 Environment Variables (Critical)


| Variable | Purpose | Default |
|----------|---------|---------|
| `STORAGE_DIR` | Path to data folder | `./storage` |
| `DB_CONNECTION_STRING` | PostgreSQL URL | Required for Docker |
| `JWT_SECRET` | Token signing | Auto-generated |
| `DISABLE_TELEMETRY` | Disable analytics | `false` |
| `GENERIC_OPENAI_STREAMING_DISABLED` | Disable streaming | `false` |

**Easypanel Environment Variables:**
Add via Easypanel container environment settings - no file editing needed.


### 📦 Docker Deployment (Easypanel)


**Image:** `mintplexlabs/anythingllm:latest`

**Auto-Build Workflow:**
1. Push to GitHub (`main` or `master` branch)
2. Easypanel webhook triggers
3. Docker Compose rebuilds container
4. Zero-downtime deployment (if configured)

**Health Checks:**
- Frontend: `http://your-domain.com` (port 80)
- Backend: `http://your-domain.com:3001` (port 3001)
- Collector: `http://your-domain.com:8888` (port 8888)

**Volume Mounts:**
- `/app/server/storage` → PostgreSQL data persists
- `/app/frontend/dist` → Built frontend assets


**Updates Needed:**
- Custom Agent Skills: Add plugin.json reference for hubId, version, entrypoint
- Agent System: Update with AIbitat plugin architecture details

## blocksuite-kb.md

### 10. Recent Implementation: Thread Notes in AnythingLLM


**Integration Pattern:** AnythingLLM + BlockSuite Thread Notes

**Backend Storage:**
- Table: `workspace_threads.notes` (TEXT/JSONB)
- Format: BlockSuite JSON snapshot

**Frontend Integration:**
- Component: `frontend/src/components/BlockSuite/ThreadNotesEditor.jsx`
- Pattern: Hybrid React + BlockSuite blocks

**REST API:**
```javascript
GET /api/workspace/:slug/thread/:threadSlug/notes
PUT /api/workspace/:slug/thread/:threadSlug/notes
Body: { "notes": "<blocksuite-snapshot json>" }
```

**Usage Flow:**
1. User opens thread
2. Fetch existing notes snapshot from DB
3. Initialize BlockSuite editor with snapshot
4. Auto-save on change (debounced 500ms)
5. Convert to Markdown/PDF on export


### 11. Custom Blocks: Pricing Table


**Flavour:** `affine:embed-pricing-table`

**Props Schema:**
```typescript
{
  title: internal.Text(),
  rows: internal.Boxed([{
    id: string,
    role: string,
    description: string,
    hours: number,
    baseRate: number
  }])
}
```

**React Component:** `pricing-table-block.jsx`
- Wrapper pattern: Lit component mounts React root
- Subscribes to `model.props.rows$` signal
- Renders table with inline editing

**Export Integration:**
- Custom `HtmlAdapter` visitor for pricing table
- Generates `<table>` HTML for PDF export


**Updates Needed:**
- Part 2: Add more implementation details from anythingllm-kb.md

