# 🚀 AnythingLLM Backend API Reference
**Complete Guide for Building Frontend Applications**

> **Status:** Documented from active codebase
> **Last Updated:** Dec 31, 2025
> **API Base URL:** `https://your-domain.com/api` or `/api` (same-origin)

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Workspaces](#workspaces)
- [Workspace Threads](#workspace-threads)
- [Chat API](#chat-api)
- [Documents & Embeddings](#documents--embeddings)
- [Attachments](#attachments)
- [Users](#users)
- [System Settings](#system-settings)
- [Request/Response Patterns](#requestresponse-patterns)

---

## 🔐 Authentication

### API Key Authentication

All API endpoints require an `Authorization` header with a valid API key.

**Header Format:**
```http
Authorization: Bearer YOUR_API_KEY_HERE
```

**Get API Key:**
- Go to Settings → API Keys in the web UI
- Or create via database: `INSERT INTO api_keys (label, created_by) VALUES (?, ?)`

### Verify Auth

```http
GET /v1/auth
Authorization: Bearer YOUR_API_KEY
```

**Response (200 OK):**
```json
{
  "authenticated": true
}
```

**Response (403 Forbidden):**
```json
{
  "message": "Invalid API Key"
}
```

---

## 📁 Workspaces

### Get All Workspaces

```http
GET /v1/workspaces
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "workspaces": [
    {
      "id": 79,
      "name": "My Workspace",
      "slug": "my-workspace",
      "createdAt": "2023-08-17T00:45:03Z",
      "openAiHistory": 20,
      "threads": [
        {
          "slug": "thread-slug",
          "name": "Thread Name",
          "user_id": 1
        }
      ]
    }
  ]
}
```

### Create New Workspace

```http
POST /v1/workspace/new
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "My New Workspace",
  "similarityThreshold": 0.7,
  "openAiTemp": 0.7,
  "openAiHistory": 20,
  "openAiPrompt": "Custom prompt",
  "queryRefusalResponse": "Custom refusal",
  "chatMode": "chat",
  "topN": 4
}
```

### Get Workspace by Slug

```http
GET /v1/workspace/{slug}
Authorization: Bearer YOUR_API_KEY
```

### Delete Workspace

```http
DELETE /v1/workspace/{slug}
Authorization: Bearer YOUR_API_KEY
```

---

## 🧵 Workspace Threads

### Get Thread Chats

```http
GET /v1/workspace/{slug}/thread/{threadSlug}/chats
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "prompt": "User question",
      "response": "{\"text\": \"AI response\"}",
      "sentAt": "2023-08-17T00:45:03Z",
      "include": true,
      "api_session_id": "session-id-123"
    }
  ]
}
```

### Send Chat to Thread

```http
POST /v1/workspace/{slug}/thread/{threadSlug}/chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "message": "What is AnythingLLM?",
  "mode": "chat | query",
  "userId": 1,
  "attachments": [...]
}
```

### Delete Thread

```http
DELETE /v1/workspace/{slug}/thread/{threadSlug}
Authorization: Bearer YOUR_API_KEY
```

---

## 💬 Chat API

### Send Chat Message (Primary Endpoint)

```http
POST /v1/workspace/{slug}/chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "message": "What is AnythingLLM?",
  "mode": "chat | query",
  "sessionId": "optional-session-id",
  "attachments": [
    {
      "name": "document.pdf",
      "mime": "application/anythingllm-document",  // IMPORTANT: For documents
      "contentString": "data:application/pdf;base64,JVBERi0..."
    }
  ]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | ✅ | The user's message/question |
| `mode` | string | ✅ | `"chat"` (uses LLM + embeddings) or `"query"` (only uses embeddings if relevant) |
| `sessionId` | string | ❌ | Optional identifier for chat sessions |
| `attachments` | array | ❌ | Array of attachment objects (see [Attachments](#attachments) section) |
| `reset` | boolean | ❌ | Reset chat history (default: false) |

**Response (Streaming SSE):**

The response is **Server-Sent Events (SSE)** - a stream of JSON chunks:

```
event: textChunk
{
  "content": "AI response text chunk"
}

event: sources
{
  "sources": [
    {
      "text": "...content preview...",
      "id": 123,
      "url": "file://path/to/document",
      "title": "Document Title",
      "docAuthor": "Author Name",
      "score": 0.85,
      "metadata": {...}
    }
  ]
}

event: end
{
  "id": "uuid-v4",
  "type": "abort | textResponse",
  "textResponse": "Complete AI response here",
  "sources": [...],
  "close": true,
  "error": null
}
```

**Response Types:**

| Type | Description |
|------|-------------|
| `"abort"` | Chat aborted (e.g., invalid mode, empty message) |
| `"textResponse"` | Successfully generated response |
| `"end"` | Streaming completed |

### Get Chat History

```http
GET /v1/workspace/{slug}/chats?limit=100&orderBy=asc
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "history": [
    {
      "role": "user",
      "content": "User message",
      "sentAt": "2023-08-17T00:45:03Z"
    },
    {
      "role": "assistant",
      "content": "AI response",
      "sentAt": "2023-08-17T00:45:05Z"
    }
  ]
}
```

### Stream Chat (Alternative)

```http
POST /v1/workspace/{slug}/stream-chat
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

Same body as `/v1/workspace/{slug}/chat` but streams via SSE.

---

## 📄 Documents & Embeddings

### Upload Document

```http
POST /v1/document/upload
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

Body (FormData):
  file: File object
  addToWorkspaces: "workspace1,workspace2"  // Optional: comma-separated slugs
  metadata: {
    "title": "Custom Title",
    "author": "Author Name"
    "description": "Document description"
  }
```

**Response:**
```json
{
  "success": true,
  "error": null,
  "document": {
    "id": "doc-uuid",
    "location": "documents/custom-documents/filename.json"
    "title": "Document Title",
    "text": "Extracted text content...",
    "wordCount": 1520,
    "tokenCount": 4200
  }
}
```

### Upload & Embed Document (One-Shot)

```http
POST /v1/document/upload-and-embed
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data
```

Same as above, but automatically embeddings the document into specified workspaces.

### Update Workspace Embeddings

```http
POST /v1/workspace/{slug}/update-embeddings
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Embeddings updated for workspace"
}
```

---

## 📎 Attachments

**CRITICAL:** Attachment MIME type handling

For attachments to be processed as **documents** (PDFs, text files, etc.), you MUST use:

```json
{
  "mime": "application/anythingllm-document"
}
```

**If you send:**
- `"application/pdf"` → Will be treated as **image** (not processed)
- `"application/anythingllm-document"` → Will be parsed and text extracted ✅

### Attachment Object Structure

```typescript
interface Attachment {
  name: string;                    // File name with extension
  mime: string;                    // CRITICAL: "application/anythingllm-document" for docs
  contentString: string;             // Base64 data (for images) OR data URI for docs
}
```

**Examples:**

**Image Attachment:**
```json
{
  "name": "screenshot.png",
  "mime": "image/png",
  "contentString": "data:image/png;base64,iVBORw0KG..."
}
```

**Document Attachment (PDF):**
```json
{
  "name": "contract.pdf",
  "mime": "application/anythingllm-document",  // IMPORTANT!
  "contentString": "data:application/pdf;base64,JVBERi0..."
}
```

**Processing Flow:**

1. Backend checks `mime === "application/anythingllm-document"`
2. If **true** → Sends to Collector for text extraction (PDFLoader → OCR if needed)
3. If **false** → Treats as image (passes directly to LLM without parsing)

---

## 👥 Users

### Get Current User

**For multi-user mode:** User info is in response headers from authenticated endpoints.

Or via internal API:
```http
GET /v1/users/me
Authorization: Bearer YOUR_API_KEY
```

---

## ⚙️ System Settings

### Get All Settings

```http
GET /v1/system/settings
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "settings": {
    "VectorDB": "lancedb",
    "LLMProvider": "openai",
    "EmbeddingEngine": "openai",
    "EmbeddingModelLimit": 4096,
    "TextSplitterChunkSize": 1000,
    "TextSplitterChunkOverlap": 20,
    "TelemetryEnabled": true
  }
}
```

---

## 🔑 API Key Management

### List API Keys

```http
GET /v1/api-keys
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "keys": [
    {
      "id": 1,
      "label": "Production App",
      "secret": "sk-...",  // Only shown on creation
      "createdAt": "2023-08-17T00:45:03Z",
      "lastUsedAt": "2023-08-17T00:45:03Z"
    }
  ]
}
```

### Create API Key

```http
POST /v1/api-key/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "label": "My App",
  "permissions": []  // Future: granular permissions
}
```

**Response:**
```json
{
  "apiKey": {
    "id": 123,
    "label": "My App",
    "secret": "sk-abc123...",  // ONLY SHOWN ONCE!
    "createdAt": "2023-08-17T00:45:03Z"
  },
  "message": "API key created. Save this secret safely, it will not be shown again."
}
```

### Delete API Key

```http
DELETE /v1/api-key/{id}
Authorization: Bearer YOUR_API_KEY
```

---

## 📨 Vector Database Integration

### Supported Vector DBs

| Provider | Environment Variable | Notes |
|----------|-------------------|-------|
| **LanceDB** (default) | `VECTOR_DB=lancedb` | Local file-based, no setup needed |
| Pinecone | `VECTOR_DB=pinecone` | Requires `PINECONE_API_KEY`, `PINECONE_INDEX` |
| Chroma | `VECTOR_DB=chroma` | Requires `CHROMA_ENDPOINT` (optional auth) |
| Weaviate | `VECTOR_DB=weaviate` | Requires `WEAVIATE_ENDPOINT` |
| QDrant | `VECTOR_DB=qdrant` | Requires `QDRANT_API_KEY`, `QDRANT_HOST` |
| Milvus | `VECTOR_DB=milvus` | Requires `MILVUS_ADDRESS`, `MILVUSUS_TOKEN` |
| Zilliz | `VECTOR_DB=zilliz` | Requires `ZILLIZ_CLOUD_ENDPOINT`, `ZILLIZ_TOKEN` |
| PGVector | `VECTOR_DB=pgvector` | Requires PostgreSQL with pgvector extension |
| AstraDB | `VECTOR_DB=astra` | DataStax Astra DB |

### Embedding Engines

| Engine | Environment Variable | Default Context Window |
|--------|-------------------|----------------------|
| OpenAI | `EMBEDDING_ENGINE=openai` | 8191 tokens |
| Cohere | `EMBEDDING_ENGINE=cohere` | 2048 tokens |
| Azure OpenAI | `EMBEDDING_ENGINE=azure` | 8191 tokens |
| Voyage AI | `EMBEDDING_ENGINE=voyage` | 4000 tokens |
| Ollama | `EMBEDDING_ENGINE=ollama` | Depends on model |
| Native (default) | `EMBEDDING_ENGINE=inherit` | Uses LLM provider |

---

## 🧩 LLM Providers

### Supported LLMs

| Provider | Environment Variable | Notes |
|----------|-------------------|-------|
| OpenAI | `LLM_PROVIDER=openai` | GPT-4, GPT-4o, GPT-3.5-turbo |
| Anthropic | `LLM_PROVIDER=anthropic` | Claude 3.5 Sonnet, Opus |
| Azure OpenAI | `LLM_PROVIDER=azure` | Azure-deployed GPT models |
| Google Gemini | `LLM_PROVIDER=gemini` | Gemini Pro, Ultra |
| Ollama | `LLM_PROVIDER=ollama` | Local models |
| LiteLLM | `LLM_PROVIDER=litellm` | Local quantized models |
| Groq | `LLM_PROVIDER=groq` | Fast Llama models |
| Together AI | `LLM_PROVIDER=together` | Multiple model options |
| Cohere | `LLM_PROVIDER=cohere` | Command R, R+ |
| Perplexity | `LLM_PROVIDER=perplexity` | Llama models |
| OpenRouter | `LLM_PROVIDER=openrouter` | Route to multiple providers |

### Model Selection

Set custom model via workspace settings:
```json
{
  "chatModel": "gpt-4-turbo"
}
```

Or via request:
```json
{
  "model": "claude-3-opus-20240229"
}
```

---

## 📊 Request/Response Patterns

### Error Response Format

All errors follow this pattern:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Success Response Format

Most successful responses follow this pattern:

```json
{
  "success": true,
  "message": "Optional success message"
}
```

### Streaming Response

Chat responses stream events:

**Chunk Event:**
```json
{
  "type": "textChunk",
  "content": "Partial text..."
}
```

**Sources Event:**
```json
{
  "type": "sources",
  "sources": [
    {
      "id": 123,
      "text": "Document snippet...",
      "title": "Document Title",
      "docAuthor": "Author",
      "score": 0.95,
      "metadata": {...}
    }
  ]
}
```

**End Event:**
```json
{
  "type": "end",
  "id": "uuid",
  "textResponse": "Complete response...",
  "sources": [...],
  "close": true
}
```

---

## 🔐 Authentication Middleware

### Multi-User Mode

When `MULTI_USER_MODE=true` is enabled:

- Every request requires valid session/cookie
- User is loaded via `userFromSession()`
- Workspace access is checked against user permissions

### Role-Based Access

| Role | Permissions |
|------|-------------|
| `admin` | Full access to everything |
| `manager` | Can modify workspace settings, delete documents |
| `default` | Read-only access to chat and documents |

---

## 📝 Document Processing Pipeline

### File Upload Flow

```
User Upload → FormData → /v1/document/upload
  ↓
Collector API (port 8888)
  ↓
Process Document:
  - PDF: PDFLoader → Text extraction (+ OCR fallback)
  - DOCX: docx library
  - TXT: Raw text
  - CSV: Parse rows
  ↓
Chunking (TextSplitter)
  ↓
Embedding (EmbedderEngine)
  ↓
Vector DB (LanceDB/Pinecone/etc)
  ↓
Workspace Documents Table
```

### Parsed Files (Chat Attachments)

```
Drag & Drop → /workspace/{slug}/parse
  ↓
Collector API
  ↓
Store as Parsed File (workspace_parsed_files)
  ↓
User can:
  - Keep in context window (token limited)
  - Embed to workspace (/workspace/{slug}/embed-parsed-file/{fileId})
  ↓
Delete from parsed files after embedding
```

---

## 🎨 Frontend Integration Examples

### Fetch Workspace Data

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function getWorkspace(slug) {
  const response = await fetch(`${API_BASE}/v1/workspace/${slug}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch workspace');
  return await response.json();
}
```

### Send Chat Message with Streaming

```javascript
async function sendChatMessage(slug, message, onChunk, onEnd) {
  const response = await fetch(`${API_BASE}/v1/workspace/${slug}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      mode: 'chat',
      sessionId: 'optional-session-id'
    })
  });

  if (!response.ok) throw new Error('Failed to send message');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line for next iteration

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = JSON.parse(line.slice(6));
      if (data.type === 'textChunk') {
        onChunk(data.content);
      } else if (data.type === 'end') {
        onEnd(data);
      }
    }
  }
}

// Usage:
let fullResponse = '';
await sendChatMessage('my-workspace', 'Hello!', (chunk) => {
  fullResponse += chunk;
  console.log('Streaming:', chunk);
}, (final) => {
  console.log('Complete response:', fullResponse);
  console.log('Sources:', final.sources);
});
```

### Upload Document

```javascript
async function uploadDocument(file, workspaces = []) {
  const formData = new FormData();
  formData.append('file', file);
  if (workspaces.length > 0) {
    formData.append('addToWorkspaces', workspaces.join(','));
  }

  const response = await fetch(`${API_BASE}/v1/document/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    },
    body: formData
  });

  if (!response.ok) throw new Error('Failed to upload document');
  return await response.json();
}
```

### Create API Key

```javascript
async function createApiKey(label) {
  const response = await fetch(`${API_BASE}/v1/api-key/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ label })
  });

  if (!response.ok) throw new Error('Failed to create API key');
  const data = await response.json();
  
  // SAVE THIS SECURELY! It won't be shown again!
  console.log('API Key:', data.apiKey.secret);
  return data.apiKey;
}
```

---

## 🎯 Workspace as Backend Architecture

### Concept

Use AnythingLLM's backend as a **"Headless AI Workspace Service"** for your custom frontend:

```
Your Custom Frontend (React/Vue/Svelte/Next.js)
            │
            │ REST API (Bearer Token)
            ↓
    AnythingLLM Backend
            │
            ├─→ Workspace Management
            ├─→ Document Storage & Embeddings
            ├─→ Vector DB (LanceDB/Pinecone/etc)
            └─→ LLM Orchestration (OpenAI/Claude/etc)
```

### Benefits

- **No frontend code needed** from AnythingLLM
- **Use your own UX/UI** - complete control
- **Authentication handled** - API keys or OAuth
- **Scalable architecture** - backend is stateless
- **Multi-tenant ready** - separate workspaces per user/org

### Recommended Setup

1. **Single Backend Instance:** Run one AnythingLLM backend for all your apps
2. **Per-User Workspaces:** Create one workspace per user/customer
3. **Shared Knowledge Bases:** Create workspaces with common knowledge for all users
4. **Thread Management:** Use threads to maintain conversation history

### Example Architecture

```
┌─────────────────────────────────────────────────────┐
│  Your SaaS Platform (Custom Frontend)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ User A   │  │ User B   │  │ User C   │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
└───────┼─────────────┼─────────────┼────────────────┘
        │             │             │
        │ API Calls   │             │
        ↓             ↓             ↓
┌─────────────────────────────────────────────────────┐
│  AnythingLLM Backend                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Workspace A  │  │ Workspace B  │  │ Knowledge│ │
│  │ (User A)     │  │ (User B)     │  │ Base (all)│ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Vector Database (LanceDB/Pinecone/etc)      │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  LLM Provider (OpenAI/Anthropic/etc)         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Database Models (Prisma)

### Workspace Model

```prisma
model Workspace {
  id                   Int            @id @default(autoincrement())
  name                 String
  slug                 String         @unique
  createdAt           DateTime       @default(now())
  openAiHistory        Int            @default(20)
  openAiTemp           Float?
  similarityThreshold  Float          @default(0.25)
  chatMode             String         @default("chat")
  topN                 Int            @default(4)
  openAiPrompt         String?
  queryRefusalResponse String?
  
  documents            Document[]
  workspaceChats       WorkspaceChat[]
  threads              WorkspaceThread[]
}
```

### Document Model

```prisma
model Document {
  id           Int      @id @default(autoincrement())
  docId        String   @unique
  title        String
  text         String
  workspaceId  Int
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  createdAt    DateTime @default(now())
}
```

### WorkspaceChat Model

```prisma
model WorkspaceChat {
  id             Int       @id @default(autoincrement())
  workspaceId    Int
  workspace      Workspace @relation(fields: [workspaceId], references: [id])
  prompt         String
  response       String    @db.Text
  apiSessionId   String?
  threadId       Int?
  thread         WorkspaceThread? @relation(fields: [threadId], references: [id])
  sentAt         DateTime  @default(now())
  include        Boolean   @default(true)
}
```

### WorkspaceThread Model

```prisma
model WorkspaceThread {
  id          Int             @id @default(autoincrement())
  workspaceId Int
  workspace   Workspace       @relation(fields: [workspaceId], references: [id])
  slug        String         @unique
  userId      Int?
  user        User?           @relation(fields: [userId], references: [id])
  chats       WorkspaceChat[]
}
```

---

## 🚨 Common Pitfalls & Solutions

### 1. PDF Attachments Not Being Read

**Problem:** AI doesn't read PDF content

**Cause:** Wrong MIME type

**Fix:** Always use `"mime": "application/anythingllm-document"` for non-image files

```json
{
  "name": "document.pdf",
  "mime": "application/anythingllm-document",  // CORRECT ✅
  "contentString": "data:application/pdf;base64,..."
}
```

### 2. CORS Errors

**Problem:** Browser blocks API requests

**Fix:** Ensure backend allows your frontend origin

In `server/index.js`:
```javascript
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));
```

### 3. Chat Response is Empty

**Problem:** No response or "Unable to find relevant content"

**Cause:** No documents in workspace OR similarity threshold too high

**Fix:** 
1. Lower similarityThreshold (try 0.5)
2. Upload more documents
3. Check LLM provider is configured

### 4. Streaming Not Working

**Problem:** Response waits until complete before showing

**Cause:** Server buffering or proxy issues

**Fix:**
- Disable compression middleware for SSE endpoints
- Use proper headers in proxy (nginx/traefik)

```nginx
# Nginx example
location /api/ {
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;
  proxy_pass http://backend;
}
```

### 5. Memory Issues with Large Documents

**Problem:** Server crashes when embedding large PDFs

**Cause:** TextSplitter chunking too large

**Fix:** Reduce chunk size

```javascript
// In workspace settings
{
  "textSplitterChunkSize": 500,    // Default: 1000
  "textSplitterChunkOverlap": 50   // Default: 20
}
```

---

## 🔍 Debugging Tips

### Enable Debug Logging

Set environment variable:
```bash
DEBUG=*
```

Or for specific modules:
```bash
DEBUG=collector:*,vector:*
```

### Check Collector Status

```bash
curl http://localhost:8888/health
```

### Test API Endpoints

```bash
# Test auth
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/v1/auth

# Get workspaces
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/v1/workspaces

# Send chat
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","mode":"chat"}' \
  http://localhost:3001/v1/workspace/my-workspace/chat
```

### Check Vector Database

```bash
# LanceDB
sqlite3 storage/vector/lancedb.db "SELECT * FROM vector LIMIT 10;"

# PostgreSQL
psql $DATABASE_URL "SELECT * FROM document_vectors LIMIT 10;"
```

---

## 📚 Additional Resources

### Official Documentation

- **AnythingLLM Docs:** https://useanything.com/docs
- **Multi-Tenant Guide:** See `MULTI_TENANT_ARCHITECTURE.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`

### Related Files

- `server/endpoints/api/workspace/index.js` - Core workspace API
- `server/endpoints/api/auth/index.js` - Authentication
- `server/utils/chats/apiChatHandler.js` - Chat handler logic
- `server/models/workspace.js` - Workspace model
- `collector/processSingleFile/convert/asPDF/index.js` - PDF extraction

---

## 🤝 Handover

**Completed:**
- ✅ Documented all major API endpoints
- ✅ Explained authentication mechanisms
- ✅ Detailed chat streaming SSE protocol
- ✅ Provided attachment handling (critical MIME type fix)
- ✅ Outlined workspace-as-backend architecture
- ✅ Included frontend integration examples
- ✅ Listed common pitfalls and solutions

**Next Steps:**
1. **Set up API Key:** Generate API key via web UI Settings → API Keys
2. **Test Authentication:** Verify `/v1/auth` endpoint works
3. **Create Workspace:** Use `/v1/workspace/new` for your app
4. **Upload Documents:** Use `/v1/document/upload-and-embed`
5. **Build Frontend:** Start with authentication → workspaces → chat

**Deployment Reminder:**
- Push changes to GitHub → Easypanel auto-rebuilds
- Ensure vector database is initialized (LanceDB is default)
- Configure LLM provider in `.env` or Easypanel UI
- Set `DISABLE_TELEMETRY=true` for production

---

**Version:** 1.0.0  
**Generated:** Dec 31, 2025  
**Status:** Production Ready ✅