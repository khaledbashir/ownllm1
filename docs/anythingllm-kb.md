# AnythingLLM Internal Knowledge Base

> Core platform reference. How the system works under the hood.

---

## 🤖 LLM Providers

**Supported Providers:**
- **Cloud:** OpenAI, Azure OpenAI, AWS Bedrock, Anthropic, Google Gemini, Groq, Cohere, Mistral, Perplexity, OpenRouter, Together AI, DeepSeek, xAI
- **Local:** Ollama, LM Studio, LocalAI, KoboldCPP, LiteLLM, Text Generation Web UI, llama.cpp

---

## 💬 Chat Endpoints

| Type | Endpoint |
|------|----------|
| Non-streaming | `/v1/workspace/{slug}/chat` |
| Streaming | `/v1/workspace/{slug}/stream-chat` |
| Thread chat | `/v1/workspace/{slug}/thread/{threadSlug}/chat` |
| Thread stream | `/v1/workspace/{slug}/thread/{threadSlug}/stream-chat` |

**Disable streaming:** `GENERIC_OPENAI_STREAMING_DISABLED = "true"`

---

## ⚙️ Workspace Settings

Set via `POST /v1/workspace/{slug}/update`:

```json
{
  "openAiPrompt": "Your custom system prompt",
  "openAiTemp": 0.1,
  "chatProvider": "openai",
  "chatModel": "gpt-4o",
  "chatMode": "query",
  "similarityThreshold": 0.5,
  "topN": 8
}
```

| Field | Purpose |
|-------|---------|
| `openAiPrompt` | System prompt for workspace |
| `openAiTemp` | Temperature (0-1) |
| `chatModel` | LLM model name |
| `similarityThreshold` | RAG relevance cutoff |
| `topN` | Number of snippets to retrieve |

---

## 📄 Document Pipeline

```
Upload → Collector (parse/OCR) → Chunking → Embedding → Vector DB → Workspace
```

**Endpoints:**
- `POST /v1/document/upload-link` - Web URL
- `POST /v1/document/raw-text` - Raw text with `title`, `description`, `author`, `source`

**Chunking settings:** `Text Chunk Size`, `Text Chunk Overlap`

---

## 🔍 RAG Flow

1. **Query Vectorization** - User question → embedding
2. **Vector Search** - Find similar chunks (uses `similarityThreshold`, `topN`)
3. **Reranking** (optional) - Refine relevance
4. **Prompt Augmentation** - Inject context into LLM prompt
5. **Generation** - LLM responds with citations

**Document Pinning:** Force full document into context (overrides RAG settings)

---

## 🏗️ Architecture

| Component | Role |
|-----------|------|
| **Workspace** | Container for docs + conversations (isolated) |
| **Thread** | Persistent conversation context within workspace |
| **Message** | Individual chat tied to a thread |

**Best Practice:** 1:1 relationship between user document and AnythingLLM thread

---

## 🤖 Agent System

**Invoke:** Use `@agent` in chat

**How it works:**
1. LLM generates JSON matching tool schema
2. Tool executes if JSON valid
3. Result returned to conversation

**Built-in Skills:**
- RAG Search, Web Browsing, Web Scraping
- Save Files, List Documents, Summarize Documents
- Chart Generation, SQL Agent

**MCP Support:** Full Model Context Protocol client
- Config: `plugins/anythingllm_mcp_servers.json`

---

## 🔧 Custom Agent Skills

**Directory:** `plugins/agent-skills/{hubId}/`

**Required Files:**

1. `plugin.json` - Metadata, config, params, examples
   - `hubId`: Must match folder name
   - `version`: Semver version
   - `entrypoint`: Handler function name
   - `setup_args`: Runtime configuration
2. `handler.js` - JavaScript execution logic
   - Exports `runtime` object with `handler` function
   - Must return string value
   - Access `this.introspect()`, `this.logger()`, `this.config`

---

## 👥 Multi-User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access |
| **Manager** | All workspaces, no LLM/Vector settings |
| **Default** | Only assigned workspaces, no settings |

**Auth check:** `GET /v1/auth` → `{"authenticated": true}`

---

## 🔌 Extension Patterns

1. **Custom Agent Skills** - JS in `plugins/agent-skills/`
2. **Agent Flows** - No-code visual builder
3. **MCP Servers** - External tool integration
4. **Environment Variables** - Low-level config

---

## 📡 API Structure

| API | Purpose |
|-----|---------|
| `/api/v1/...` | External developer API (documented) |
| `server` | Core backend (Vector DB, LLM) |
| `collector` | Document processing |

---

## 🏗️ OwnLLM Custom Schema

Your fork adds these to `workspaces` table:

| Field | Type | Purpose |
|-------|------|---------|
| `products` | JSON | Services/packages with pricing |
| `rateCard` | JSON | Roles with hourly rates |

**Access in Agent Skills:**
```javascript
const Database = require('better-sqlite3');
const dbPath = path.join(process.env.STORAGE_DIR, 'anythingllm.db');
const db = new Database(dbPath, { readonly: true });

const row = db.prepare('SELECT products, rateCard FROM workspaces WHERE id = ?')
  .get(params._workspaceId);
```

**Auth:** Bearer token in `Authorization` header

---

## 🔗 MCP Integration

**MCP Servers Config:** `plugins/anythingllm_mcp_servers.json`

**Schema:**
```json
{
  "servers": {
    "server-id": {
      "name": "Display Name",
      "description": "What this server does",
      "url": "http://localhost:3000/sse",  // SSE endpoint
      "apiKey": "optional-key",
      "enabled": true
    }
  }
}
```

**Usage:**
- MCP servers expose tools via SSE
- Agent can call MCP tools like native skills
- Requires MCP-compatible server running separately

---

## 🛒 Product Import (Custom Implementation)

**Backend:** `server/utils/productImport.js`

**Flow:**
1. User provides URL or search query
2. (Optional) Web search via `web-browsing` plugin
3. Scrape URL via `web-scraping` plugin
4. Extract products via `product-extraction` plugin (LLM-based)
5. Parse JSON and normalize products

**API Endpoint:**
```javascript
POST /api/workspace/:slug/import-products
Body: { 
  "url": "https://example.com/products",  // Optional
  "query": "SaaS pricing plans"      // Optional, one required
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod-123",
      "name": "Pro Plan",
      "description": "...",
      "price": 99,
      "pricingType": "monthly",
      "category": "Subscription"
    }
  ]
}
```

**Frontend Component:** `ProductsManager/index.jsx`
- Smart input detection: URL vs search query
- Calls `Workspace.importProducts(slug, url, query)`

---

## 🔌 Agent Plugin Development (Updated)

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

---

## 🔑 Environment Variables (Critical)

| Variable | Purpose | Default |
|----------|---------|---------|
| `STORAGE_DIR` | Path to data folder | `./storage` |
| `DB_CONNECTION_STRING` | PostgreSQL URL | Required for Docker |
| `JWT_SECRET` | Token signing | Auto-generated |
| `DISABLE_TELEMETRY` | Disable analytics | `false` |
| `GENERIC_OPENAI_STREAMING_DISABLED` | Disable streaming | `false` |

**Easypanel Environment Variables:**
Add via Easypanel container environment settings - no file editing needed.

---

## 📦 Docker Deployment (Easypanel)

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
