# OwnLLM - Complete Project Documentation

**Version:** 1.9.1 (AnythingLLM Fork)  
**Last Updated:** December 2025  
**Repository:** https://github.com/khaledbashir/ownllm1

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is This Project?](#what-is-this-project)
3. [Who is This For?](#who-is-this-for)
4. [Architecture Overview](#architecture-overview)
5. [Original AnythingLLM Features](#original-anythingllm-features)
6. [Custom Features (OwnLLM)](#custom-features-ownllm)
7. [Technology Stack](#technology-stack)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Deployment](#deployment)

---

## Executive Summary

**OwnLLM** is a customized, self-hosted AI document intelligence platform built on top of AnythingLLM. It's designed to transform documents and conversations into actionable business outputs: proposals, quotes, contracts, and structured notes.

**Core Value Proposition:**
- Turn conversations with AI into professional documents
- Generate proposals with products, rates, and custom branding
- Rich note-taking within conversations
- Export to branded PDFs
- Multi-workspace, multi-user management
- Privacy-first (fully self-hosted)

---

## What is This Project?

### Base Technology: AnythingLLM

[AnythingLLM](https://anythingllm.com) by Mintplex Labs is an open-source, full-stack application that enables:
- **Document Intelligence**: Upload PDFs, TXT, DOCX files and chat with them
- **Multi-workspace isolation**: Separate contexts for different projects/clients
- **Flexible LLM support**: Use OpenAI, Claude, Ollama, or any compatible provider
- **Vector database agnostic**: Pinecone, Chroma, Qdrant, Weaviate, LanceDB, etc.
- **AI Agents**: Custom agents with tools, web browsing, code execution
- **Multi-user management**: With permission controls (Docker version)
- **API-first design**: Full developer API for integrations

### OwnLLM Customizations

**OwnLLM extends AnythingLLM with business document generation capabilities:**

1. **Thread Notes Editor**: Rich text editor for each conversation thread
2. **PDF Export with Branding**: Professional templates with logos, colors, fonts
3. **Products Manager**: Define services/products for proposal generation
4. **Rate Card Manager**: Define roles and hourly rates for T&M quotes
5. **Smart Plugins**: Custom per-workspace plugins with configurable schemas
6. **Artifacts**: Store and manage AI-generated code
7. **PDF Templates**: Create reusable branded PDF export templates

---

## Who is This For?

### Primary Users

1. **Consulting Firms**
   - Generate proposals with custom rates and products
   - Create branded PDFs from AI conversations
   - Track notes per client meeting

2. **Agencies**
   - Manage client workspaces separately
   - Build proposals with hourly rates
   - Export delivery specifications

3. **Freelancers / Solo Consultants**
   - Quick proposal generation from chat
   - Branded PDF exports
   - Organized note-taking per project

4. **Product Managers**
   - Document specifications in notes
   - Export to PDF for stakeholders
   - Archive conversations with artifacts

5. **Enterprise Teams**
   - Multi-user access control
   - Per-workspace configuration
   - Audit logging and compliance

### Secondary Users

- Data analysts (chat with CSV/Excel data)
- Legal teams (chat with contracts)
- Researchers (chat with academic papers)
- Anyone who wants to "chat with their documents"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        OwnLLM Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │   Frontend       │      │   Backend        │           │
│  │  (React/Vite)   │◄────►│  (Node/Express)  │           │
│  │  - Chat UI       │      │  - REST API      │           │
│  │  - Editor        │      │  - WebSockets    │           │
│  │  - Settings      │      │  - Auth          │           │
│  └──────────────────┘      └──────────────────┘           │
│         ▲                          ▲                        │
│         │                          │                        │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │   Collector      │      │   Database       │           │
│  │  (Document Proc) │      │  (SQLite/PgSQL)  │           │
│  │  - OCR/Parsing   │      │  - Prisma ORM    │           │
│  │  - Embedding     │      │  - Migrations    │           │
│  └──────────────────┘      └──────────────────┘           │
│         ▲                          ▲                        │
│         │                          │                        │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │   External APIs  │      │   Vector DBs     │           │
│  │  - OpenAI        │      │  - Pinecone      │           │
│  │  - Anthropic     │      │  - Chroma        │           │
│  │  - Ollama        │      │  - Qdrant        │           │
│  │  - Google        │      │  - Weaviate      │           │
│  │  - etc.          │      │  - LanceDB       │           │
│  └──────────────────┘      └──────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
ownllm/
├── frontend/                 # React + Vite (port 5173)
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── WorkspaceChat/    # Main chat container
│   │   │   │   └── ThreadNotes/  # Notes editor (CUSTOM)
│   │   │   ├── Modals/           # Workspace settings
│   │   │   │   └── ManageWorkspace/
│   │   │   │       ├── ProductsManager/  # (CUSTOM)
│   │   │   │       └── RateCardManager/  # (CUSTOM)
│   │   │   └── SmartPlugins/     # Plugin UI (CUSTOM)
│   │   ├── models/           # API client classes
│   │   │   └── smartPlugins.js # (CUSTOM)
│   │   ├── pages/            # Route pages
│   │   └── utils/            # Helpers
│   ├── package.json
│   └── vite.config.js
│
├── server/                   # Node.js Express (port 3001)
│   ├── endpoints/            # API routes
│   │   ├── chat.js           # Chat streaming
│   │   ├── workspaces.js     # Workspace CRUD
│   │   ├── workspaceThreads.js # Threads (CUSTOM notes field)
│   │   ├── smartPlugins.js   # Plugin endpoints (CUSTOM)
│   │   ├── artifacts.js      # Code artifact storage (CUSTOM)
│   │   └── utils.js          # System utilities
│   ├── models/               # Database queries
│   │   ├── workspace.js
│   │   ├── workspaceThread.js
│   │   ├── smartPlugins.js   # (CUSTOM)
│   │   ├── artifacts.js      # (CUSTOM)
│   │   └── systemSettings.js
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # DB migrations
│   │   │   ├── 20251211100317_add_thread_notes/        # (CUSTOM)
│   │   │   ├── 20251211122132_init_artifacts/          # (CUSTOM)
│   │   │   └── 20251211181413_add_pdf_templates/       # (CUSTOM)
│   │   └── seed.js           # Test data
│   ├── utils/                # Helpers
│   │   ├── middleware/       # Express middleware
│   │   ├── http/             # HTTP utilities
│   │   └── chats/            # Chat processing
│   ├── storage/              # Local files
│   ├── swagger/              # API docs (auto-generated)
│   └── package.json
│
├── collector/                # Document processor (port 8000)
│   ├── index.js              # Entry point
│   ├── processLink/          # URL to text
│   ├── processRawText/       # Text processing
│   ├── processSingleFile/    # File handling
│   ├── extensions/           # Custom processors
│   └── utils/                # Helpers (OCR, Whisper, etc.)
│
├── docker/                   # Docker & deployment
│   ├── Dockerfile            # Production image
│   ├── Dockerfile.lite       # Minimal image
│   ├── docker-compose.yml    # Local dev stack
│   └── HOW_TO_USE_DOCKER.md  # Deployment guide
│
├── blocksuite-upstream/      # (REMOVED - was old editor)
│
└── cloud-deployments/        # Cloud providers
    ├── aws/
    ├── gcp/
    ├── digitalocean/
    └── helm/
```

---

## Original AnythingLLM Features

### Core Chat & Document Intelligence

| Feature | Description | Status |
|---------|-------------|--------|
| **Document Upload** | Support for PDF, TXT, DOCX, MD, JSON, CSV | ✅ Active |
| **Multi-format Parsing** | Automatic text extraction from files | ✅ Active |
| **Workspace Isolation** | Separate contexts for different projects | ✅ Active |
| **Workspace Threads** | Organized conversations per workspace | ✅ Active (Enhanced with notes) |
| **Vector Embeddings** | Convert text to searchable vectors | ✅ Active |
| **Chat History** | Persist and retrieve past conversations | ✅ Active |
| **Chat Feedback** | Users can rate responses (thumbs up/down) | ✅ Active |
| **RAG (Retrieval Augmented Generation)** | Combine docs + LLM for accurate answers | ✅ Active |

### LLM & AI Providers

| Category | Supported Providers |
|----------|-------------------|
| **LLMs** | OpenAI, Azure OpenAI, Anthropic Claude, Google Gemini, Groq, DeepSeek, Ollama, LM Studio, LocalAI, Mistral, Cohere, Perplexity, OpenRouter, AWS Bedrock, and 10+ more |
| **Embeddings** | OpenAI, Ollama, LocalAI, Hugging Face, Cohere, etc. |
| **Vector DBs** | Pinecone, Chroma, Qdrant, Weaviate, LanceDB, Milvus, Supabase, Astra DB |
| **Speech-to-Text** | OpenAI Whisper, Deepgram, Ollama |
| **Text-to-Speech** | ElevenLabs, Piper TTS, Google Cloud |

### AI Agents

| Feature | Description |
|---------|-------------|
| **Custom AI Agents** | Build agents with custom instructions |
| **Agent Tools** | Web search, web scraping, code execution |
| **Tool Definitions** | Define custom tools via API |
| **Agent Memory** | Maintain context across tool calls |
| **Web Browsing** | Agents can search & scrape the web |
| **No-code Agent Builder** | Drag-and-drop agent flow creation |
| **MCP Support** | Model Context Protocol compatibility |

### User & Access Management

| Feature | Description |
|---------|-------------|
| **Multi-user Support** | Multiple users per instance (Docker) |
| **Workspace Users** | Invite users to specific workspaces |
| **Permission Levels** | Admin, Manager, Default roles |
| **API Keys** | Developer API authentication |
| **Session Management** | Login/logout with JWT tokens |
| **Password Recovery** | Reset tokens and recovery codes |
| **Invite System** | Invite new users via code |

### Integrations & APIs

| Feature | Description |
|---------|-------------|
| **REST API** | Full CRUD for workspaces, docs, chats, threads |
| **WebSocket Support** | Real-time chat streaming |
| **Embeddable Chat Widget** | Embed chat on external websites |
| **Browser Extension** | Chat with any webpage |
| **Slash Commands** | Custom preset prompts (/summarize, /explain, etc.) |
| **Event Logging** | Track user actions for audit |

### UI & UX

| Feature | Description |
|---------|-------------|
| **Dark/Light Mode** | Themeable UI |
| **Drag & Drop** | Files, documents, workspace organization |
| **Responsive Design** | Works on desktop, tablet, mobile |
| **Search** | Find documents and conversations |
| **Citation Display** | Show which documents were used |
| **Suggested Messages** | Per-workspace conversation starters |
| **Settings UI** | Configure LLM, vector DB, providers |

---

## Custom Features (OwnLLM)

### 1. 🗒️ **Thread Notes - Rich Document Editor**

**Purpose**: Transform thread conversations into structured, formatted notes alongside chat.

**What it does**:
- Each thread has a dedicated notes panel (right side of chat)
- Full rich text editor with markdown support
- Auto-save to database (debounced)
- AI can insert content directly into notes
- Export notes to branded PDF
- Supports headings, lists, code, tables, blockquotes, etc.

**Key Files**:
```
frontend/src/components/WorkspaceChat/ThreadNotes/
├── index.jsx                 # Main container, manages state
├── YooptaEditor.jsx          # Rich editor implementation (Yoopta)
├── ExportPdfModal.jsx        # PDF export dialog
├── editor.css                # Dark theme styling
└── types.js                  # TypeScript definitions
```

**Database**:
```sql
ALTER TABLE workspace_threads ADD COLUMN notes TEXT;
```

**Features**:
- **Editor Blocks**: Paragraph, Headings (1-3), Lists (bullet/numbered/todo), Code, Blockquote, Callout, Divider, Table, Link
- **Text Marks**: Bold, Italic, Underline, Strike, Highlight, Code
- **Toolbar**: Format menu, link insertion tool, action menu (type "/" for slash commands)
- **Auto-save**: Changes saved every 1000ms
- **Backward Compatibility**: Supports legacy BlockSuite format + plain text

**API Contract**:
```javascript
// From YooptaEditor ref
editorRef.current.insertMarkdown(text)  // AI can append markdown
editorRef.current.getEditor()            // Access underlying Yoopta editor
```

---

### 2. 📄 **PDF Export with Custom Branding**

**Purpose**: Generate professional PDFs with workspace branding (logo, colors, fonts).

**What it does**:
- Export thread notes as branded PDF
- Choose from saved templates or create inline
- Customize logo, colors, header/footer text, fonts
- Server-side HTML-to-PDF conversion
- Download or email PDF

**Key Files**:
```
frontend/src/components/WorkspaceChat/ThreadNotes/
└── ExportPdfModal.jsx           # Export UI + template selection

frontend/src/pages/GeneralSettings/PdfTemplates/
└── index.jsx                     # Template CRUD UI
```

**Database**:
```
pdf_templates table:
├── id                 (INT, PK)
├── name              (STRING)
├── workspace_id      (INT, FK)
├── logo_path         (STRING, URL or file)
├── primary_color     (STRING, hex)
├── font_family       (STRING)
├── header_text       (STRING)
├── footer_text       (STRING)
└── created_by        (INT, FK users)
```

**API Endpoints**:
```
POST   /workspace/:slug/export-pdf        # Generate PDF from HTML
GET    /workspace/:slug/pdf-templates     # List templates
POST   /workspace/:slug/pdf-templates     # Create template
PUT    /workspace/:slug/pdf-templates/:id # Update template
DELETE /workspace/:slug/pdf-templates/:id # Delete template
```

**HTML → PDF Flow**:
1. Frontend serializes notes to HTML (via Yoopta's `html.serialize()`)
2. Wraps HTML with template CSS
3. POSTs to backend `/export-pdf`
4. Backend uses Puppeteer (headless browser) to render HTML → PDF
5. Returns PDF blob
6. Browser downloads file

---

### 3. 📦 **Products Manager**

**Purpose**: Define products/services per workspace for AI-generated proposals.

**What it does**:
- Create a catalog of services/products per workspace
- Assign pricing (fixed or hourly)
- Include features/deliverables for each
- Reference in proposal generation
- AI uses products to create accurate quotes

**Key Files**:
```
frontend/src/components/Modals/ManageWorkspace/
└── ProductsManager/
    ├── index.jsx              # CRUD UI for products
    └── styles.css
```

**Database**:
```
workspaces.products = JSON field (SQLite) storing:
[
  {
    "id": "uuid",
    "name": "Web Development",
    "category": "Development",
    "price": 5000,
    "pricingType": "fixed|hourly",
    "description": "Full-stack web app",
    "features": ["React", "Node.js", "PostgreSQL"],
    "icon": "code"
  },
  ...
]
```

**API Endpoints**:
```
GET    /workspace/:slug            # Fetch workspace + products
PUT    /workspace/:slug/update     # Update workspace (includes products)
```

**UI Flow**:
1. Workspace Settings → Products tab
2. Click "Add Product"
3. Fill: Name, Category, Price, Pricing Type, Description, Features
4. Save to `workspaces.products` JSON field

---

### 4. 💰 **Rate Card Manager**

**Purpose**: Define hourly rates for team members/roles for time & materials proposals.

**What it does**:
- Create per-workspace rate cards
- Assign roles (Developer, Designer, PM, etc.) with hourly rates
- Categorize by cost center (if needed)
- AI uses rates to generate accurate T&M proposals
- Support for multiple currencies

**Key Files**:
```
frontend/src/components/Modals/ManageWorkspace/
└── RateCardManager/
    ├── index.jsx              # CRUD UI for rate cards
    └── styles.css
```

**Database**:
```
workspaces.rateCard = JSON field (SQLite) storing:
[
  {
    "id": "uuid",
    "role": "Senior Developer",
    "hourlyRate": 150,
    "category": "Development",
    "currency": "USD"
  },
  {
    "id": "uuid",
    "role": "Designer",
    "hourlyRate": 100,
    "category": "Design",
    "currency": "USD"
  },
  ...
]
```

**API Endpoints**:
```
GET    /workspace/:slug            # Fetch workspace + rate card
PUT    /workspace/:slug/update     # Update workspace (includes rateCard)
```

**UI Flow**:
1. Workspace Settings → Rate Card tab
2. Click "Add Role"
3. Fill: Role Name, Hourly Rate, Category, Currency
4. Save to `workspaces.rateCard` JSON field

---

### 5. 🧩 **Smart Plugins** (Extensible)

**Purpose**: Create per-workspace plugins with custom data schemas for domain-specific data collection.

**What it does**:
- Define custom schemas (form fields) per plugin
- Store plugin configs in database
- AI can invoke plugins to collect data
- Support for string, number, boolean, select types
- Per-workspace plugin isolation

**Key Files**:
```
server/endpoints/
└── smartPlugins.js              # API routes

server/models/
└── smartPlugins.js              # Database queries

frontend/src/pages/GeneralSettings/SmartPlugins/
├── index.jsx                     # Plugin CRUD UI
└── UniversalTable/               # Generic table for plugin data
    └── index.jsx
```

**Database**:
```
smart_plugins table:
├── id              (INT, PK)
├── workspace_id    (INT, FK)
├── name            (STRING)
├── description     (STRING)
├── active          (BOOLEAN)
├── schema          (JSON) - configurable form schema
├── uiConfig        (JSON) - UI prompt/instructions
├── created_by      (INT, FK users)
└── created_at      (TIMESTAMP)

Schema Format:
{
  "version": 1,
  "fields": [
    {
      "key": "client_name",
      "label": "Client Name",
      "type": "string"
    },
    {
      "key": "project_status",
      "label": "Status",
      "type": "select",
      "options": ["Active", "Pending", "Completed"]
    },
    ...
  ]
}
```

**API Endpoints**:
```
GET    /workspace/:slug/smart-plugins        # List plugins
POST   /workspace/:slug/smart-plugins        # Create plugin
PUT    /workspace/:slug/smart-plugins/:id    # Update plugin
DELETE /workspace/:slug/smart-plugins/:id    # Delete plugin
```

**UI Flow**:
1. Settings → Smart Plugins tab
2. Click "Create Plugin"
3. Define schema (form fields)
4. Set plugin name, description, active status
5. Save and use in chat

---

### 6. 💾 **Artifacts - Code Storage**

**Purpose**: Store code artifacts generated by AI (for reference, sharing, execution).

**What it does**:
- Store code snippets with metadata
- Support multiple languages (JS, Python, SQL, etc.)
- Associate with workspace/user
- Export artifact code
- Reference artifacts in chat

**Key Files**:
```
server/endpoints/
└── artifacts.js                 # API routes

server/models/
└── artifacts.js                 # (Implied, queries database)

frontend/src/components/Artifacts/
├── ArtifactViewer.jsx           # Display artifact
└── ArtifactExporter.jsx         # Download/copy artifact
```

**Database**:
```
artifacts table:
├── id              (INT, PK)
├── uuid            (STRING, unique)
├── workspace_id    (INT, FK)
├── user_id         (INT, FK)
├── name            (STRING)
├── code            (TEXT, the actual code)
├── language        (STRING) - js, python, sql, html, etc.
├── description     (STRING)
├── created_at      (TIMESTAMP)
└── updated_at      (TIMESTAMP)
```

**API Endpoints**:
```
GET    /workspace/:slug/artifacts           # List artifacts
POST   /workspace/:slug/artifacts           # Create artifact
GET    /workspace/:slug/artifacts/:uuid     # Get single artifact
PUT    /workspace/:slug/artifacts/:uuid     # Update artifact
DELETE /workspace/:slug/artifacts/:uuid     # Delete artifact
```

**UI Integration**:
- Artifacts appear in chat as collapsible code blocks
- Copy-to-clipboard functionality
- Export as file download
- Syntax highlighting per language

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **Vite** | 4.3.0 | Build tool & dev server |
| **Tailwind CSS** | 3.3.1 | Utility-first styling |
| **React Router** | 6.3.0 | Client-side routing |
| **Yoopta Editor** | 4.9.9 | Rich text editor (CUSTOM) |
| **Slate.js** | 0.102.0 | Editor foundation (via Yoopta) |
| **Phosphor Icons** | 2.1.7 | Icon library |
| **React Toastify** | 9.1.3 | Toast notifications |
| **Lodash** | Various | Utility functions |
| **i18next** | 23.11.3 | Internationalization |
| **React Query** (implied) | Latest | Server state management |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.21.2 | Web framework |
| **Prisma ORM** | 5.3.1 | Database ORM |
| **SQLite** | (built-in) | Local database (default) |
| **PostgreSQL** | (optional) | Production database |
| **Bree** | 9.2.5 | Job scheduler (document processing) |
| **LangChain** | 0.1.36 | LLM orchestration |
| **OpenAI SDK** | 4.95.1 | OpenAI integration |
| **Anthropic SDK** | 0.39.0 | Claude integration |
| **JWT** | jsonwebtoken 9.0.0 | Authentication |
| **bcrypt** | 5.1.0 | Password hashing |
| **Swagger** | 2.23.5 | API documentation |

### Document Processing (Collector)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Axios** | Latest | HTTP client |
| **Cheerio** | 1.0.0 | HTML parsing |
| **pdf-parse** | (implied) | PDF text extraction |
| **Tesseract.js** | (implied) | OCR |
| **Whisper** | (OpenAI) | Speech-to-text |

### Deployment

| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Coolify/Easypanel** | Auto-deployment platform |
| **DigitalOcean** | Cloud hosting |
| **AWS**, **GCP**, **Azure** | Cloud alternatives |
| **Kubernetes** | Helm charts for enterprise |

---

## Database Schema

### Core Tables

#### `workspace_threads` (CUSTOM FIELDS)
```sql
CREATE TABLE workspace_threads (
  id INT PRIMARY KEY,
  name STRING,
  slug STRING UNIQUE,
  workspace_id INT FOREIGN KEY,
  user_id INT FOREIGN KEY,
  notes STRING DEFAULT '',     -- CUSTOM: Thread notes (Yoopta format)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `pdf_templates` (CUSTOM)
```sql
CREATE TABLE pdf_templates (
  id INT PRIMARY KEY,
  name STRING,
  workspace_id INT FOREIGN KEY,
  logo_path STRING,
  primary_color STRING,
  font_family STRING,
  header_text STRING,
  footer_text STRING,
  created_by INT FOREIGN KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `artifacts` (CUSTOM)
```sql
CREATE TABLE artifacts (
  id INT PRIMARY KEY,
  uuid STRING UNIQUE,
  workspace_id INT FOREIGN KEY,
  user_id INT FOREIGN KEY,
  name STRING,
  code TEXT,
  language STRING,
  description STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `smart_plugins` (CUSTOM)
```sql
CREATE TABLE smart_plugins (
  id INT PRIMARY KEY,
  workspace_id INT FOREIGN KEY,
  name STRING,
  description STRING,
  active BOOLEAN,
  schema JSON,
  uiConfig JSON,
  created_by INT FOREIGN KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `workspaces` (EXTENDED)
```sql
CREATE TABLE workspaces (
  id INT PRIMARY KEY,
  name STRING,
  slug STRING UNIQUE,
  -- ... original fields ...
  products STRING,      -- CUSTOM: JSON array of products
  rateCard STRING,      -- CUSTOM: JSON array of rate card entries
  -- ... etc ...
);
```

---

## API Endpoints

### Chat & Threads

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/workspace/:slug/thread` | Create thread |
| `GET` | `/api/workspace/:slug/threads` | List threads |
| `GET` | `/api/workspace/:slug/thread/:slug` | Get thread |
| `PUT` | `/api/workspace/:slug/thread/:slug` | Update thread (including notes) |
| `DELETE` | `/api/workspace/:slug/thread/:slug` | Delete thread |
| `POST` | `/api/workspace/:slug/thread/:slug/chat` | Send chat message |

### Workspace Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/workspace/:slug` | Get workspace + config |
| `PUT` | `/api/workspace/:slug/update` | Update workspace (products, rateCard) |
| `POST` | `/api/workspace/new` | Create workspace |
| `DELETE` | `/api/workspace/:slug` | Delete workspace |

### PDF Templates (CUSTOM)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/workspace/:slug/pdf-templates` | List templates |
| `POST` | `/api/workspace/:slug/pdf-templates` | Create template |
| `PUT` | `/api/workspace/:slug/pdf-templates/:id` | Update template |
| `DELETE` | `/api/workspace/:slug/pdf-templates/:id` | Delete template |

### PDF Export (CUSTOM)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/workspace/:slug/export-pdf` | Generate PDF from HTML |

### Artifacts (CUSTOM)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/workspace/:slug/artifacts` | List artifacts |
| `POST` | `/api/workspace/:slug/artifacts` | Create artifact |
| `GET` | `/api/workspace/:slug/artifacts/:uuid` | Get artifact |
| `PUT` | `/api/workspace/:slug/artifacts/:uuid` | Update artifact |
| `DELETE` | `/api/workspace/:slug/artifacts/:uuid` | Delete artifact |

### Smart Plugins (CUSTOM)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/workspace/:slug/smart-plugins` | List plugins |
| `POST` | `/api/workspace/:slug/smart-plugins` | Create plugin |
| `PUT` | `/api/workspace/:slug/smart-plugins/:id` | Update plugin |
| `DELETE` | `/api/workspace/:slug/smart-plugins/:id` | Delete plugin |

### Documents

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/workspace/:slug/upload` | Upload document |
| `GET` | `/api/workspace/:slug/documents` | List documents |
| `DELETE` | `/api/workspace/:slug/document/:id` | Delete document |

### Users & Auth

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/logout` | User logout |
| `POST` | `/api/auth/register` | User registration (if enabled) |
| `GET` | `/api/user` | Get current user |
| `PUT` | `/api/user` | Update user profile |

### System

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/system/stats` | System statistics |
| `GET` | `/api/system/config` | System configuration |
| `POST` | `/api/system/logo` | Upload system logo |

---

## Deployment

### Local Development

```bash
# Setup
yarn setup
yarn prisma:setup
yarn dev:all        # Runs frontend, server, collector in parallel

# Or separately:
yarn dev:frontend   # http://localhost:5173
yarn dev:server     # http://localhost:3001
yarn dev:collector  # http://localhost:8000
```

### Docker (Production)

```bash
# Single container
docker build -f docker/Dockerfile -t ownllm:latest .
docker run -p 3001:3001 \
  -e AUTH_TOKEN=supersecret \
  -e LLM_PROVIDER=openai \
  -e OPENAI_API_KEY=sk-xxx \
  ownllm:latest

# Docker Compose (with collector)
docker-compose -f docker/docker-compose.yml up
```

### Easypanel / DigitalOcean

The project includes a `Dockerfile` at repo root (mirrors `docker/Dockerfile`) for auto-deployment:

```bash
git push origin main
# → Easypanel detects push
# → Builds image
# → Deploys to your VPS
```

**Environment Variables**:
```
AUTH_TOKEN              # Single-user password
JWT_SECRET             # JWT signing key
LLM_PROVIDER           # openai, anthropic, ollama, etc.
OPENAI_API_KEY         # If using OpenAI
VECTOR_DB_TYPE         # pinecone, chroma, qdrant, etc.
DATABASE_URL           # PostgreSQL (optional, defaults to SQLite)
```

---

## Key Metrics & Stats

| Metric | Value |
|--------|-------|
| **Frontend Bundle** | ~1.5MB gzipped |
| **Backend Binary** | ~50MB (with node_modules) |
| **DB Size (empty)** | ~2MB SQLite file |
| **Max Document Size** | 3GB (configurable) |
| **Supported Languages** | 40+ (via i18next) |
| **API Endpoints** | 50+ |
| **Database Tables** | 30+ (including custom) |
| **Code Files** | 200+ (React/Node) |

---

## Future Enhancement Ideas

1. **Enhanced Proposal Templates**
   - Drag-and-drop template builder
   - Version control for templates
   - Approval workflows

2. **Billing Integration**
   - Invoice generation
   - Payment tracking
   - Stripe/PayPal integration

3. **Reporting & Analytics**
   - Proposal conversion rates
   - Revenue tracking
   - Team utilization metrics

4. **Collaboration Features**
   - Real-time co-editing of notes
   - Comment threads
   - @mentions

5. **AI Improvements**
   - Fine-tuned models for proposal generation
   - Industry-specific templates
   - Sentiment analysis for client feedback

6. **Mobile App**
   - React Native frontend
   - Offline note editing
   - Mobile PDF export

7. **Enterprise Features**
   - SAML/OAuth authentication
   - Audit logging
   - Data residency options
   - Custom domain support

---

## Support & Contributing

- **Docs**: [AnythingLLM Docs](https://docs.anythingllm.com)
- **GitHub**: [https://github.com/khaledbashir/ownllm1](https://github.com/khaledbashir/ownllm1)
- **Issues**: File bugs/features on GitHub Issues
- **Discussions**: Community help on GitHub Discussions

---

## License

MIT License - See [LICENSE](./LICENSE) file

---

**Document Version**: 1.0  
**Last Updated**: December 13, 2025  
**Author**: Technical Documentation Team
