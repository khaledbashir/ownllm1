# OwnLLM - Comprehensive Project Overview

**Version:** 1.9.1 (AnythingLLM Fork)
**Repository:** https://github.com/khaledbashir/ownllm1
**Branch:** `feature/multi-tenant-saas`
**Last Updated:** December 2025

---

## Table of Contents

1. [Project Executive Summary](#project-executive-summary)
2. [What is OwnLLM?](#what-is-ownllm)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Original AnythingLLM Features](#original-anythingllm-features)
6. [Custom OwnLLM Features](#custom-ownllm-features)
7. [Multi-Tenant SaaS Features](#multi-tenant-saas-features)
8. [How It Works](#how-it-works)
9. [User Roles & Permissions](#user-roles--permissions)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Database Schema](#database-schema)
12. [Deployment Options](#deployment-options)
13. [Use Cases](#use-cases)

---

## Project Executive Summary

**OwnLLM** is a **self-hosted, multi-tenant SaaS platform** for AI-powered document intelligence and business proposal generation. Built as an enhanced fork of AnythingLLM, it combines enterprise-grade document chat capabilities with business document generation tools.

### Core Value Proposition

- **Transform conversations into professional documents** - Rich notes editor alongside chat
- **Generate AI-powered proposals** - Use products, rates, and branding to create quotes
- **Multi-tenant SaaS architecture** - Organizations with complete data isolation
- **Privacy-first design** - Fully self-hosted, no data leaves your environment
- **Flexible AI integration** - Support for 25+ LLM providers and 10+ vector databases
- **Enterprise-ready features** - CRM, PDF templates, smart plugins, and more

### Key Differentiators vs. Original AnythingLLM

| Feature | Original AnythingLLM | OwnLLM |
|---------|---------------------|----------|
| Business Proposal Generation | ❌ | ✅ Products & Rate Cards |
| Rich Thread Notes | ❌ | ✅ BlockSuite Editor |
| Branded PDF Export | ❌ | ✅ Custom Templates |
| Multi-Tenant Organizations | ❌ | ✅ Complete SaaS Architecture |
| CRM Integration | ❌ | ✅ Pipeline & Cards System |
| Code Artifacts | ❌ | ✅ Save & Manage Code |
| Smart Plugins | ❌ | ✅ Custom Schemas |
| Email Verification | ❌ | ✅ Full Flow |
| Billing/Seat Limits | ❌ | ✅ Plan Management |

---

## What is OwnLLM?

### Base: AnythingLLM by Mintplex Labs

AnythingLLM is an open-source, full-stack AI application that enables:
- **Document Intelligence**: Chat with uploaded documents (PDF, DOCX, TXT, etc.)
- **RAG (Retrieval-Augmented Generation)**: Combine documents with LLM knowledge
- **Vector Embeddings**: Store documents as searchable vectors
- **Multi-workspace Isolation**: Separate contexts for different projects
- **AI Agents**: Custom agents with tools, web browsing, code execution
- **REST API**: Full programmatic access to all features

### Custom Enhancements (OwnLLM)

OwnLLM transforms AnythingLLM into a **business proposal and document generation platform**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                               │
│   1. Define Products & Rates                                  │
│      └── Workspace Settings → Products/Rate Card              │
│                                                               │
│   2. Chat with AI for Proposal Generation                     │
│      └── Thread Chat + Rich Notes Editor                        │
│                                                               │
│   3. AI Generates Structured Proposal                          │
│      └── Uses products, rates, company branding                 │
│                                                               │
│   4. Edit & Export to Branded PDF                             │
│      └── Professional PDF with logo, colors, formatting          │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **Vite** | Build Tool & Dev Server | 4.x |
| **React Router** | Client-side Routing | 6.x |
| **Tailwind CSS** | Styling | 3.x |
| **Yoopta Editor** | Rich Text Editor | Latest |
| **Phosphor Icons** | Icon Library | Latest |
| **Zustand** | State Management (lightweight) | Latest |
| **Axios** | HTTP Client | Latest |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 18.x+ |
| **Express.js** | Web Framework | 4.x |
| **Prisma ORM** | Database ORM | 5.x |
| **SQLite** | Default Database (Production: PostgreSQL) | 3.x |
| **JWT** | Authentication | jsonwebtoken |
| **Multer** | File Upload Handling | Latest |
| **Puppeteer** | HTML to PDF Generation | Latest |
| **WS (WebSocket)** | Real-time Chat | 8.x |

### AI/Vector Integration

| Category | Providers |
|----------|------------|
| **LLMs** | OpenAI, Anthropic, Google Gemini, Azure OpenAI, AWS Bedrock, Groq, DeepSeek, Ollama, LM Studio, LocalAI, Mistral, Cohere, Perplexity, OpenRouter, X.AI, Novita, Fireworks AI, Z.AI, Moonshot AI, GiteeAI, LiteLLM, TogetehrAI, KoboldCPP, TextGenWebUI, HuggingFace |
| **Vector Databases** | Pinecone, Chroma, Qdrant, Weaviate, LanceDB, Milvus, Supabase (pgvector), Astra DB, Zilliz |
| **Embeddings** | OpenAI, Ollama, LocalAI, Cohere, HuggingFace |
| **Text-to-Speech** | ElevenLabs, Piper TTS, Google Cloud |
| **Speech-to-Text** | OpenAI Whisper, Deepgram, Ollama |

### Infrastructure

| Component | Technology |
|-----------|------------|
| **Containerization** | Docker |
| **Process Management** | PM2 (production) |
| **Reverse Proxy** | Nginx (EasyPanel) |
| **Health Checks** | Custom health endpoint |
| **Logging** | Winston + File rotation |

---

## System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Web UI     │  │ Mobile App   │  │ Browser Ext  │             │
│  │  (React/Vite) │  │  (React Native)│  │  (Chrome/FF)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│                      (Nginx/EasyPanel)                              │
└────────────────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Frontend       │  │   Backend        │  │   Collector      │
│  (React/Vite)   │  │  (Node/Express)  │  │  (Doc Processor) │
│  Port: 5173     │  │  Port: 3001      │  │  Port: 8000      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                                │                   │
                                ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Database    │  │  Vector DB    │  │   File Storage│             │
│  │ (SQLite/PG)  │  │ (Pinecone/etc) │  │  (Local/S3)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   OpenAI API    │  │  Anthropic API  │  │   Ollama        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Directory Structure

```
ownllm/
├── frontend/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── WorkspaceChat/  # Main chat interface
│   │   │   │   └── ThreadNotes/  # Rich notes editor (CUSTOM)
│   │   │   ├── Modals/         # Modal dialogs
│   │   │   │   └── ManageWorkspace/
│   │   │   │       ├── ProductsManager/  # Products CRUD (CUSTOM)
│   │   │   │       └── RateCardManager/  # Rate card CRUD (CUSTOM)
│   │   │   └── Organizations/  # SaaS org management (CUSTOM)
│   │   ├── models/             # API client classes
│   │   ├── pages/             # Route pages
│   │   └── utils/             # Helper functions
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js Express Backend
│   ├── endpoints/              # API routes
│   │   ├── chat.js           # Chat streaming
│   │   ├── workspaces.js     # Workspace CRUD
│   │   ├── organization.js   # Organization API (CUSTOM SaaS)
│   │   ├── billing.js        # Billing endpoints (CUSTOM SaaS)
│   │   ├── workspaceThreads.js # Thread management
│   │   ├── smartPlugins.js   # Plugin system (CUSTOM)
│   │   ├── artifacts.js      # Code artifacts (CUSTOM)
│   │   ├── templates.js      # PDF templates (CUSTOM)
│   │   ├── crm.js           # CRM pipelines/cards (CUSTOM)
│   │   └── publicProposals.js # Proposal sharing (CUSTOM)
│   ├── models/                # Database queries (Prisma)
│   │   ├── organization.js   # Organization model (CUSTOM SaaS)
│   │   ├── workspace.js
│   │   ├── user.js
│   │   ├── smartPlugins.js  # (CUSTOM)
│   │   └── artifacts.js     # (CUSTOM)
│   ├── utils/                 # Utilities
│   │   ├── middleware/       # Express middleware
│   │   │   └── tenantIsolation.js # Multi-tenant filtering (CUSTOM SaaS)
│   │   ├── chats/            # Chat processing
│   │   ├── documentProcessor/ # Proposal generation (CUSTOM)
│   │   └── emailService.js   # Email sending (CUSTOM SaaS)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   ├── storage/              # Local file storage
│   └── package.json
│
├── collector/                  # Document Processing Service
│   ├── processLink/           # URL to text extraction
│   ├── processSingleFile/     # File handling
│   ├── extensions/            # Custom processors
│   └── utils/                # OCR, Whisper, etc.
│
├── docker/                    # Docker Configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── HOW_TO_USE_DOCKER.md
│
├── docs/                      # Documentation
│   ├── MULTI_TENANT_ARCHITECTURE.md
│   ├── MULTI_TENANT_SETUP.md
│   ├── MULTI_TENANT_API.md
│   └── MULTI_TENANT_DEPLOYMENT.md
│
└── cloud-deployments/         # Cloud deployment configs
    ├── aws/
    ├── gcp/
    └── digitalocean/
```

---

## Original AnythingLLM Features

### 1. Authentication & User Management

#### Core Authentication
- **Multi-user authentication** - Register, login, logout with JWT tokens
- **Password recovery** - Reset via email with secure tokens
- **Recovery codes** - 2FA backup codes
- **Temporary auth tokens** - Short-lived API access tokens
- **Role-based access control** - Admin, Manager, Default roles

#### User Management
- **Admin panel** - Full user CRUD operations
- **User invitations** - Invite via code, set workspaces
- **Profile management** - Bio, profile picture
- **Message limits** - Per-user daily message quotas
- **Suspension** - Suspend abusive users

### 2. AI Model Providers (25+ Options)

#### Major Cloud Providers
| Provider | Models | Status |
|----------|---------|--------|
| OpenAI | GPT-4, GPT-3.5, GPT-4-turbo | ✅ |
| Anthropic | Claude 3 Opus, Sonnet, Haiku | ✅ |
| Google Gemini | Pro, Ultra, Flash | ✅ |
| Azure OpenAI | Azure-hosted GPT models | ✅ |
| AWS Bedrock | Claude, Llama, Titan | ✅ |
| Groq | Ultra-fast inference | ✅ |

#### Open Source & Local
| Provider | Models | Status |
|----------|---------|--------|
| Ollama | Llama, Mistral, CodeLlama, etc. | ✅ |
| LM Studio | Local model management | ✅ |
| LocalAI | OpenAI-compatible API | ✅ |
| KoboldCPP | Text generation | ✅ |
| TextGenWebUI | Multiple model servers | ✅ |

#### Specialized Providers
| Provider | Specialization | Status |
|----------|---------------|--------|
| Perplexity | Web-enhanced responses | ✅ |
| OpenRouter | Multi-provider routing | ✅ |
| Together AI | Open source hosting | ✅ |
| Mistral | Mistral models | ✅ |
| Cohere | Embeddings, generation | ✅ |
| HuggingFace | HF Inference API | ✅ |

### 3. Vector Databases (10+ Options)

#### Cloud Solutions
| Provider | Features | Status |
|----------|-----------|--------|
| Pinecone | Managed, scalable | ✅ |
| Weaviate | Open source, hybrid search | ✅ |
| Chroma | AI-native, lightweight | ✅ |
| Qdrant | High-performance, filtering | ✅ |
| Milvus | Scalable, distributed | ✅ |
| Zilliz | Pinecone alternative | ✅ |
| Astra DB | Cassandra-based | ✅ |

#### Self-Hosted
| Provider | Features | Status |
|----------|-----------|--------|
| LanceDB | Local-first, zero-copy | ✅ |
| pgvector | PostgreSQL extension | ✅ |
| Chroma Cloud | Managed Chroma | ✅ |

### 4. Chat & Conversation System

#### Core Chat Features
- **Real-time streaming** - Token-by-token response streaming
- **Multi-turn conversations** - Maintain context across messages
- **Chat history** - Persist and retrieve past conversations
- **Context-aware responses** - Use document embeddings
- **System prompts** - Custom AI personality per workspace
- **Similarity threshold** - Control document relevance
- **Temperature control** - Adjust response creativity
- **Message feedback** - Thumbs up/down rating

#### Chat Modes
- **Workspace Chat** - Chat with uploaded documents (RAG)
- **Direct Chat** - Simple Q&A without documents
- **Agent Chat** - AI agent with tools
- **Embed Chat** - Website widget chat

#### Slash Commands
- Custom preset prompts
- Pre-defined workflows
- Quick actions (/summarize, /explain, /code, etc.)

### 5. Document Management

#### Document Ingestion
- **Drag & drop upload** - Intuitive file selection
- **URL processing** - Extract content from websites
- **Bulk upload** - Process multiple files
- **Folder organization** - Categorize documents
- **Live sync** - Watch folders for changes (experimental)

#### Supported Formats
| Category | Formats |
|----------|----------|
| Text | .txt, .md, .csv, .json, .xml, .yaml |
| Documents | .pdf, .docx, .pptx, .odt |
| Web | HTML, Markdown |
| Code | All programming languages |
| Audio | .mp3, .wav (via Whisper) |
| Images | OCR text extraction |

#### Document Processing
- **Text chunking** - Intelligent splitting for embedding
- **Metadata extraction** - Automatic tagging
- **Duplicate detection** - Prevent re-indexing
- **Vector embedding** - Automatic vectorization
- **Cache management** - Performance optimization

### 6. AI Agent System

#### Agent Builder
- **Visual flow editor** - Drag-and-drop agent creation
- **Pre-built nodes**:
  - Start/Finish nodes
  - LLM instruction nodes
  - API call nodes
  - Web scraping nodes
  - Code execution nodes
  - File processing nodes
  - Website nodes

#### Agent Skills
| Skill | Description |
|--------|-------------|
| SQL Agent | Query databases |
| Web Scraping | Advanced web extraction |
| File Operations | Process documents |
| Memory Management | Persistent context |
| Chart Generation | Data visualization |

#### MCP Support
- **Model Context Protocol** - External tool integration
- **Tool cooldown** - Rate limiting
- **Custom connectors** - Build your own tools

### 7. Data Connectors

| Integration | Description |
|-------------|-------------|
| Obsidian Vault | Markdown note sync |
| Confluence | Atlassian wiki import |
| Drupal Wiki | CMS content import |
| Paperless-ngx | Document management |
| GitLab Repos | Code repository sync |
| YouTube Transcripts | Video content extraction |
| Generic URL | Any website processing |

### 8. Enterprise Features

#### API Management
- **REST API** - Full platform control
- **API Keys** - Secure access control
- **Rate limiting** - Usage protection
- **Swagger docs** - API documentation

#### Embed Widgets
- **Website chat widgets** - Embed on external sites
- **Configurable appearance** - Brand matching
- **Multiple instances** - Different settings
- **Mobile responsive** - All devices

#### Community Hub
- **Agent sharing** - Publish agent flows
- **Skill marketplace** - Download community skills
- **Template library** - Reusable configurations

### 9. Monitoring & Logging

- **Event logging** - System activity tracking
- **Performance monitoring** - Resource usage
- **Error tracking** - Debug information
- **Telemetry** - Anonymous usage stats (optional)
- **Health checks** - System status monitoring

---

## Custom OwnLLM Features

### 1. 🗒️ Thread Notes - Rich Document Editor

**Purpose**: Transform thread conversations into structured, formatted notes alongside chat.

#### Features
- **Full rich text editor** - WYSIWYG document creation
- **Block-based editing** - Modular content blocks
- **Real-time collaboration ready** - Multi-user editing foundation
- **Dark mode support** - Theme integration
- **Auto-save** - Changes saved every 1000ms
- **AI integration** - AI can insert content directly into notes

#### Editor Block Types
| Block Type | Description |
|-------------|-------------|
| Text Blocks | Paragraphs, headings (H1-H3) |
| List Blocks | Bulleted, numbered, todo lists |
| Code Blocks | Syntax highlighting |
| Blockquote | Quoted text |
| Callout | Highlighted notes |
| Table | Data tables |
| Divider | Content separation |
| Link | URL insertion |

#### API Contract
```javascript
// AI can insert markdown into editor
editorRef.current.insertMarkdown(text)

// Access underlying Yoopta editor
editorRef.current.getEditor()
```

#### Key Files
- `frontend/src/components/WorkspaceChat/ThreadNotes/index.jsx` - Main container
- `frontend/src/components/WorkspaceChat/ThreadNotes/YooptaEditor.jsx` - Editor implementation

### 2. 📄 PDF Export with Custom Branding

**Purpose**: Generate professional PDFs with workspace branding.

#### Features
- **Server-side HTML to PDF** - High-quality rendering with Puppeteer
- **Custom templates** - Per-workspace PDF templates
- **Brand customization** - Logos, colors, fonts, CSS
- **Header/Footer** - Company branding support
- **A4 format** - Professional page layout
- **Background printing** - Maintain visual elements

#### Template System
| Field | Description |
|--------|-------------|
| `name` | Template name |
| `logoPath` | Logo image URL |
| `headerText` | Custom header text |
| `footerText` | Custom footer text |
| `primaryColor` | Accent color (hex) |
| `secondaryColor` | Background color (hex) |
| `fontFamily` | Font selection |
| `cssOverrides` | Custom CSS |
| `workspaceId` | Associated workspace |
| `userId` | Creator |

#### API Endpoints
```
POST   /workspace/:slug/export-pdf        # Generate PDF
GET    /workspace/:slug/pdf-templates     # List templates
POST   /workspace/:slug/pdf-templates     # Create template
PUT    /workspace/:slug/pdf-templates/:id # Update template
DELETE /workspace/:slug/pdf-templates/:id # Delete template
```

#### Key Files
- `frontend/src/components/WorkspaceChat/ThreadNotes/ExportPdfModal.jsx` - Export UI
- `server/routes/documentProcessor.js` - HTML to PDF processing

### 3. 📦 Products Manager

**Purpose**: Define products/services per workspace for AI-generated proposals.

#### Product Structure
```json
{
  "id": "uuid",
  "name": "Web Development Package",
  "category": "Development",
  "price": 5000,
  "pricingType": "fixed",  // or "hourly"
  "description": "Full-stack web application",
  "features": [
    "React frontend",
    "Node.js backend",
    "PostgreSQL database",
    "Authentication"
  ],
  "icon": "code"
}
```

#### API Endpoints
```
GET    /workspace/:slug            # Fetch workspace + products
PUT    /workspace/:slug/update     # Update workspace (includes products)
```

#### Key Files
- `frontend/src/components/Modals/ManageWorkspace/ProductsManager/index.jsx`

### 4. 💰 Rate Card Manager

**Purpose**: Define hourly rates for team members/roles.

#### Rate Card Structure
```json
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
  }
]
```

#### Key Files
- `frontend/src/components/Modals/ManageWorkspace/RateCardManager/index.jsx`

### 5. 🧩 Smart Plugins

**Purpose**: Per-workspace plugins with custom data schemas.

#### Plugin Structure
```json
{
  "name": "Client Onboarding",
  "description": "Collect client information",
  "schema": [
    {
      "name": "companyName",
      "type": "string",
      "required": true
    },
    {
      "name": "industry",
      "type": "select",
      "options": ["Tech", "Finance", "Healthcare"]
    },
    {
      "name": "teamSize",
      "type": "number"
    }
  ]
}
```

#### Key Files
- `server/models/smartPlugins.js` - Plugin data model
- `server/endpoints/smartPlugins.js` - Plugin endpoints

### 6. 🗂️ Artifact Library

**Purpose**: Store and manage AI-generated code.

#### Artifact Structure
```json
{
  "name": "API Client",
  "code": "// Code here...",
  "language": "javascript",
  "workspaceId": 1,
  "userId": 1
}
```

#### Key Files
- `server/models/artifacts.js` - Artifact data model
- `server/endpoints/artifacts.js` - Artifact endpoints

### 7. 📋 Block Templates

**Purpose**: Create reusable document blocks.

#### Features
- Save document sections as templates
- Reusable across workspaces
- JSON serialized block tree
- Workspace-scoped or global

#### Key Files
- `server/prisma/schema.prisma` - block_templates table
- `server/endpoints/templates.js` - Template endpoints

### 8. 📨 Email Verification System

**Purpose**: Require email verification for new user registration.

#### Features
- **Verification tokens** - Secure email verification links
- **Token expiration** - 24-hour validity
- **Email service** - SMTP-based sending
- **Console fallback** - Log to console when SMTP not configured
- **Resend functionality** - Users can request new verification emails

#### Email Templates
```
Subject: Verify your email address

Hello {username},

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.
```

#### Key Files
- `server/models/emailVerificationTokens.js` - Token model
- `server/utils/emailService.js` - Email sending service
- `server/endpoints/system.js` - Verification endpoints

---

## Multi-Tenant SaaS Features

### Overview

OwnLLM transforms from a single-tenant application to a multi-tenant SaaS platform with complete data isolation between organizations.

### 1. Organization Model

#### Organization Schema
```javascript
{
  id: Int,
  name: String,
  slug: String (unique),
  plan: String (default: "free"),  // free, pro, enterprise
  subscriptionId: String?,  // Stripe subscription ID
  status: String (default: "active"),  // active, trial, past_due, canceled, suspended
  seatLimit: Int?,  // Max users allowed
  settings: String?,  // JSON for organization-specific settings
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### Organization API Endpoints
```
GET    /organizations                    # List all organizations
GET    /organizations/:id               # Get organization details
POST   /organizations/new               # Create organization
POST   /organizations/:id              # Update organization
DELETE /organizations/:id              # Delete organization
GET    /organizations/:id/stats        # Get organization statistics
GET    /organizations/:id/users        # List organization users
GET    /organizations/:id/workspaces   # List organization workspaces
GET    /organizations/:id/remaining-seats  # Check remaining seats
```

### 2. Tenant Isolation Middleware

**Purpose**: Ensure users can only access their organization's data.

#### How It Works
```javascript
// tenantIsolation.js
function getOrganizationFilter(user) {
  // Super admins (no organizationId) can access all data
  if (isSuperAdmin(user)) {
    return {};  // No filtering
  }
  
  // Regular users filtered by organizationId
  return { organizationId: user.organizationId };
}

// Applied to Prisma queries
const filteredQuery = prisma.workspace.findMany({
  where: {
    ...getOrganizationFilter(req.user),
    // Additional query conditions
  }
});
```

#### Functions
| Function | Description |
|-----------|-------------|
| `isSuperAdmin(user)` | Detect super admin users |
| `getOrganizationFilter(user)` | Build WHERE clause |
| `applyOrganizationFilter(query, user)` | Apply filter to Prisma queries |
| `canAccessOrganization(user, orgId)` | Check access to organization |
| `canAccessWorkspace(user, workspace)` | Check access to workspace |

### 3. Billing & Seat Limits

#### Plan Configuration
| Plan | Seat Limit | Features |
|-------|-------------|-----------|
| Free | 5 | Basic features |
| Pro | 25 | Advanced features |
| Enterprise | 100 | Full features + support |

#### Billing Endpoints
```
GET    /api/billing/seat-limit/:organizationId      # Check seat limit
GET    /api/billing/organization/:organizationId      # Get org billing info
POST   /api/billing/update-plan                    # Update organization plan
POST   /api/billing/webhook/stripe                # Stripe webhook
POST   /api/billing/webhook/paddle                # Paddle webhook
```

#### Seat Limit Enforcement
- Registration: Check before creating new user
- Invite acceptance: Check before accepting invite
- Workspace creation: Check organization capacity

### 4. User-to-Organization Assignment

#### User Model Updates
```javascript
{
  // ... existing fields
  email: String?,
  emailVerified: Boolean (default: false),
  organizationId: Int?  // null = super admin
}
```

#### Admin User Management
- Assign users to organizations via EditUserModal
- Organization dropdown for super admins
- "None (Super Admin)" option for platform-level users

### 5. Frontend Organization Management

#### Pages
| Page | Purpose |
|-------|---------|
| `/organizations` | List all organizations |
| `/organizations/new` | Create new organization |
| `/organizations/:id` | Organization details |
| `/organizations/:id/settings` | Organization settings |

#### Organization Details
- Overview tab: Stats, plan, status
- Users tab: Organization users list
- Workspaces tab: Organization workspaces list
- Remaining seats display

### 6. Email Verification Flow

#### Registration Flow
```
1. User registers → Organization created
2. Verification email sent to user
3. User clicks verification link
4. Email verified flag set to true
5. User can now login
```

#### Verification Page
- Frontend page at `/verify-email/:token`
- Shows success/failure message
- Option to resend verification email

### 7. Super Admin Dashboard

**Purpose**: Platform-level administration for managing all organizations.

#### Features
- List all organizations
- Organization statistics overview
- User counts per organization
- System-wide metrics
- Quick actions (create org, suspend org)
- Only accessible by users without organizationId

### 8. CRM Integration

#### CRM Pipelines
```javascript
{
  id: Int,
  name: String,
  description: String?,
  type: String (default: "custom"),  // embed, proposal, custom
  stages: String,  // JSON array of stage names
  color: String?,
  userId: Int?,
  workspaceId: Int?,
  organizationId: Int?,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### CRM Cards
```javascript
{
  id: Int,
  pipelineId: Int,
  stage: String,
  position: Int,
  title: String,
  name: String?,
  email: String?,
  phone: String?,
  company: String?,
  embedSessionId: String?,
  threadId: Int?,
  proposalId: String?,
  notes: String?,
  metadata: String?,
  value: Float?,
  userId: Int?,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

#### Proposal CRM Integration
- Auto-create CRM cards on proposal sign
- Link proposals to pipelines
- Track proposal status through stages

---

## How It Works

### User Journey: Creating a Proposal

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: SETUP                                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Login or Register                                      │
│  2. Select Organization (if multi-org user)                   │
│  3. Navigate to Workspace Settings                           │
│  4. Configure Products:                                      │
│     - Add services with prices                                │
│     - Set pricing type (fixed/hourly)                        │
│  5. Configure Rate Card:                                    │
│     - Define team roles with hourly rates                      │
│  6. Configure PDF Template:                                  │
│     - Upload logo, set colors, fonts                          │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: GENERATE PROPOSAL                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Create new thread in workspace                          │
│  2. Chat with AI:                                         │
│     "Create a proposal for Ahmad Co.                           │
│      They need HubSpot setup + email automation                │
│      Use our standard packages and rates"                      │
│  3. AI generates proposal in Thread Notes editor:             │
│     - Uses configured products                                 │
│     - Uses rate card for time estimates                       │
│     - Applies company branding                                 │
│  4. Review and edit proposal directly in editor              │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: EXPORT & SHARE                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Click "Export to PDF"                                  │
│  2. Select PDF template                                      │
│  3. Preview PDF                                             │
│  4. Download or email PDF                                    │
│  5. Optionally share as public proposal with tracking           │
└─────────────────────────────────────────────────────────────────┘
```

### User Journey: Multi-Tenant Registration

```
┌─────────────────────────────────────────────────────────────────┐
│  NEW USER SIGNUP                                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Visit /register                                          │
│  2. Enter account info:                                       │
│     - Username, email, password                               │
│  3. Enter organization info:                                  │
│     - Organization name                                        │
│     - Slug (auto-generated, editable)                         │
│  4. Select plan (Free/Pro/Enterprise)                       │
│  5. Submit registration                                      │
│  6. User account created, Organization created                │
│  7. Verification email sent                                   │
│  8. User clicks verification link                              │
│  9. Account activated, can login                              │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ORGANIZATION ADMINISTRATION                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. User logs in (now organization owner)                    │
│  2. Navigate to Organization Settings                        │
│  3. Configure:                                              │
│     - Organization details                                     │
│     - Plan and billing status                                 │
│     - Seat limits                                            │
│  4. Invite team members:                                     │
│     - Generate invite code                                    │
│     - Set allowed workspaces                                  │
│  5. Seat limit enforced (Free: 5, Pro: 25, Enterprise: 100)│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Chat with Documents

```
┌─────────────────────────────────────────────────────────────────┐
│  1. USER UPLOADS DOCUMENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│  Frontend → Collector Service                                │
│  • File uploaded via drag & drop                            │
│  • Collector extracts text (PDF/DOCX parsing)               │
│  • Text split into chunks (size configurable)                │
│  • Chunks sent to LLM for embedding                       │
│  • Vectors stored in Vector DB                              │
│  • Metadata stored in database                              │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. USER SENDS CHAT MESSAGE                                 │
├─────────────────────────────────────────────────────────────────┤
│  Frontend → Backend API                                    │
│  • WebSocket connection for streaming                        │
│  • User message received                                    │
│  • Query tokenized                                          │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. RETRIEVAL (RAG)                                        │
├─────────────────────────────────────────────────────────────────┤
│  Backend → Vector DB                                       │
│  • Query converted to embedding vector                        │
│  • Vector similarity search in Vector DB                     │
│  • Top-k similar chunks retrieved                          │
│  • Chunks filtered by organizationId (tenant isolation)       │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. GENERATION                                                │
├─────────────────────────────────────────────────────────────────┤
│  Backend → LLM Provider                                     │
│  • System prompt + retrieved context + user query           │
│  • Send to LLM (OpenAI/Claude/etc.)                       │
│  • Stream response token by token                            │
│  • Response sent to frontend via WebSocket                  │
│  • Response saved to database                              │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AI CAN UPDATE NOTES (OPTIONAL)                            │
├─────────────────────────────────────────────────────────────────┤
│  • AI analyzes chat context                                 │
│  • AI inserts formatted content into Thread Notes           │
│  • Content auto-saved to database                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                SUPER ADMIN (No organizationId)            │
│  ✓ Access all organizations                              │
│  ✓ Manage platform-level settings                        │
│  ✓ Create/delete organizations                           │
│  ✓ Assign users to organizations                       │
│  ✓ Full system control                                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ORGANIZATION ADMIN (role: "admin")           │
│  ✓ Access own organization only                           │
│  ✓ Manage organization settings                           │
│  ✓ Create/delete workspaces                             │
│  ✓ Invite users to organization                        │
│  ✓ Manage user roles within organization                  │
│  ✓ All workspace permissions                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            MANAGER (role: "manager")                      │
│  ✓ Access assigned workspaces                             │
│  ✓ Manage workspace settings                             │
│  ✓ Upload/delete documents                              │
│  ✓ Create/delete threads                                 │
│  ✓ Cannot manage users                                   │
│  ✓ Cannot manage organization settings                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          DEFAULT USER (role: "default")                    │
│  ✓ Access assigned workspaces                             │
│  ✓ Chat with documents                                  │
│  ✓ Create threads                                       │
│  ✓ View/edit thread notes                               │
│  ✓ Cannot delete documents                               │
│  ✓ Cannot manage settings                               │
└─────────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Action | Super Admin | Org Admin | Manager | Default |
|--------|-------------|------------|----------|----------|
| View all organizations | ✅ | ❌ | ❌ | ❌ |
| Create organization | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Edit organization settings | ✅ | ✅ (own) | ❌ | ❌ |
| Invite users | ✅ | ✅ (own org) | ❌ | ❌ |
| Assign user roles | ✅ | ✅ (own org) | ❌ | ❌ |
| Create workspace | ✅ | ✅ (own org) | ✅ | ❌ |
| Delete workspace | ✅ | ✅ (own org) | ✅ (assigned) | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ✅ |
| Delete documents | ✅ | ✅ | ✅ | ❌ |
| Chat with documents | ✅ | ✅ | ✅ | ✅ |
| Edit thread notes | ✅ | ✅ | ✅ | ✅ |
| Export PDF | ✅ | ✅ | ✅ | ✅ |
| Manage products/rates | ✅ | ✅ | ❌ | ❌ |
| Manage CRM | ✅ | ✅ | ✅ | ❌ |

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/register-with-organization` | Register with org |
| GET | `/api/v1/auth/verify-email/:token` | Verify email |
| POST | `/api/v1/auth/resend-verification` | Resend verification |
| POST | `/api/v1/auth/reset-password` | Request password reset |
| POST | `/api/v1/auth/confirm-reset-password` | Confirm password reset |

### Users

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/users` | List users (admin) |
| GET | `/api/v1/users/:id` | Get user |
| PATCH | `/api/v1/admin/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Delete user |
| POST | `/api/v1/users/generate-recovery-codes` | Generate 2FA codes |

### Organizations

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/organizations` | List all organizations |
| GET | `/api/v1/organizations/:id` | Get organization |
| POST | `/api/v1/organizations/new` | Create organization |
| POST | `/api/v1/organizations/:id` | Update organization |
| DELETE | `/api/v1/organizations/:id` | Delete organization |
| GET | `/api/v1/organizations/:id/stats` | Get stats |
| GET | `/api/v1/organizations/:id/users` | Get org users |
| GET | `/api/v1/organizations/:id/workspaces` | Get org workspaces |
| GET | `/api/v1/organizations/:id/remaining-seats` | Get remaining seats |

### Billing

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/billing/seat-limit/:organizationId` | Check seat limit |
| GET | `/api/billing/organization/:organizationId` | Get billing info |
| POST | `/api/billing/update-plan` | Update plan |
| POST | `/api/billing/webhook/stripe` | Stripe webhook |
| POST | `/api/billing/webhook/paddle` | Paddle webhook |

### Workspaces

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/workspaces` | List workspaces |
| GET | `/api/v1/workspaces/:slug` | Get workspace |
| POST | `/api/v1/workspaces/new` | Create workspace |
| POST | `/api/v1/workspaces/:slug/update` | Update workspace |
| DELETE | `/api/v1/workspaces/:slug/delete` | Delete workspace |

### Documents

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/v1/document/upload` | Upload document |
| GET | `/api/v1/workspace/:slug/documents` | List documents |
| DELETE | `/api/v1/workspace/:slug/documents/:docId` | Delete document |
| GET | `/api/v1/document/status` | Get document status |

### Chat

| Method | Endpoint | Description |
|---------|-----------|-------------|
| POST | `/api/v1/workspace/:slug/chat` | Send chat message |
| GET | `/api/v1/workspace/:slug/chats` | List chats |
| GET | `/api/v1/workspace/:slug/chats/:chatId` | Get chat |
| DELETE | `/api/v1/workspace/:slug/chats/:chatId` | Delete chat |

### Threads

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/workspace/:slug/threads` | List threads |
| GET | `/api/v1/workspace/:slug/thread/:threadSlug` | Get thread |
| POST | `/api/v1/workspace/:slug/thread/new` | Create thread |
| POST | `/api/v1/workspace/:slug/thread/:threadSlug/update` | Update thread |
| DELETE | `/api/v1/workspace/:slug/thread/:threadSlug/delete` | Delete thread |

### Smart Plugins

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/workspace/:slug/smart-plugins` | List plugins |
| POST | `/api/v1/workspace/:slug/smart-plugins/new` | Create plugin |
| PUT | `/api/v1/workspace/:slug/smart-plugins/:id` | Update plugin |
| DELETE | `/api/v1/workspace/:slug/smart-plugins/:id` | Delete plugin |

### Artifacts

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/workspace/:slug/artifacts` | List artifacts |
| POST | `/api/v1/workspace/:slug/artifacts/new` | Create artifact |
| PUT | `/api/v1/workspace/:slug/artifacts/:id` | Update artifact |
| DELETE | `/api/v1/workspace/:slug/artifacts/:id` | Delete artifact |

### CRM

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/v1/workspace/:slug/crm/pipelines` | List pipelines |
| POST | `/api/v1/workspace/:slug/crm/pipelines/new` | Create pipeline |
| PUT | `/api/v1/workspace/:slug/crm/pipelines/:id` | Update pipeline |
| DELETE | `/api/v1/workspace/:slug/crm/pipelines/:id` | Delete pipeline |
| GET | `/api/v1/workspace/:slug/crm/cards` | List cards |
| POST | `/api/v1/workspace/:slug/crm/cards/new` | Create card |
| PUT | `/api/v1/workspace/:slug/crm/cards/:id` | Update card |
| DELETE | `/api/v1/workspace/:slug/crm/cards/:id` | Delete card |

### Public Proposals

| Method | Endpoint | Description |
|---------|-----------|-------------|
| GET | `/api/public/proposals/:id` | View public proposal |
| POST | `/api/v1/workspace/:slug/proposals/new` | Create proposal |
| PUT | `/api/v1/workspace/:slug/proposals/:id/sign` | Sign proposal |

---

## Database Schema

### Key Tables

#### organizations
```prisma
model organizations {
  id            Int      @id @default(autoincrement())
  name          String
  slug          String   @unique
  plan          String   @default("free")
  subscriptionId String?
  status        String   @default("active")
  seatLimit     Int?
  settings      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  users              users[]
  workspaces         workspaces[]
  invites           invites[]
  crmPipelines      crm_pipelines[]
  apiKeys           api_keys[]
  workspaceDocuments workspace_documents[]
}
```

#### users
```prisma
model users {
  id               Int                           @id @default(autoincrement())
  username         String?                       @unique
  password         String
  email            String?                       @unique
  emailVerified    Boolean?                      @default(false)
  role             String                        @default("default")
  suspended        Int                           @default(0)
  organizationId   Int?
  createdAt        DateTime                      @default(now())
  lastUpdatedAt    DateTime                      @default(now())

  organization     organizations?                 @relation(fields: [organizationId], references: [id])
  workspace_chats  workspace_chats[]
  threads          workspace_threads[]
  artifacts        artifacts[]
  smart_plugins    smart_plugins[]
  crm_pipelines   crm_pipelines[]
  crm_cards       crm_cards[]

  @@index([organizationId])
}
```

#### workspaces
```prisma
model workspaces {
  id                    Int    @id @default(autoincrement())
  name                  String
  slug                  String  @unique
  organizationId        Int?
  openAiPrompt          String?
  products              String?
  rateCard              String?
  enableProposalMode    Boolean @default(false)
  defaultProposalPipelineId Int?
  createdAt            DateTime @default(now())
  lastUpdatedAt        DateTime @updatedAt

  organization         organizations?   @relation(fields: [organizationId], references: [id])
  documents            workspace_documents[]
  threads              workspace_threads[]
  smart_plugins        smart_plugins[]
  artifacts            artifacts[]
  crm_pipelines        crm_pipelines[]
  public_proposals     public_proposals[]
  block_templates      block_templates[]

  @@index([organizationId])
}
```

#### crm_pipelines
```prisma
model crm_pipelines {
  id             Int      @id @default(autoincrement())
  name           String
  description    String?
  type           String   @default("custom")
  stages         String
  color          String?  @default("#3b82f6")
  userId         Int?
  workspaceId    Int?
  organizationId Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization   organizations?  @relation(fields: [organizationId], references: [id])
  workspace      workspaces?     @relation(fields: [workspaceId], references: [id])
  cards          crm_cards[]
  proposals      public_proposals[]

  @@index([organizationId])
}
```

#### smart_plugins
```prisma
model smart_plugins {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  schema      String
  active      Boolean   @default(true)
  workspaceId Int
  createdBy   Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   workspaces @relation(fields: [workspaceId], references: [id])
  user        users?     @relation(fields: [createdBy], references: [id])

  @@unique([workspaceId, name])
}
```

#### artifacts
```prisma
model artifacts {
  id          Int      @id @default(autoincrement())
  name        String
  code        String
  language    String
  userId      Int?
  workspaceId Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        users?     @relation(fields: [userId], references: [id])
  workspace   workspaces @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId])
}
```

---

## Deployment Options

### 1. Docker (Recommended for Production)

#### Quick Start
```bash
git clone https://github.com/khaledbashir/ownllm1.git
cd ownllm
docker-compose up -d
```

#### Docker Compose Services
- `frontend` - React app (port 5173)
- `server` - Node.js API (port 3001)
- `collector` - Document processor (port 8000)
- `database` - PostgreSQL (port 5432)

#### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/ownllm"

# LLM Provider (example: OpenAI)
OPEN_API_KEY="sk-..."

# Vector Database (example: Pinecone)
PINECONE_API_KEY="..."
PINECONE_INDEX="..."

# Email (for verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="user@gmail.com"
SMTP_PASS="password"

# JWT
JWT_SECRET="your-secret-key"

# Multi-Tenant
ENABLE_MULTI_TENANT="true"
DEFAULT_PLAN="free"
```

### 2. EasyPanel

**EasyPanel** is a modern server management panel with one-click deployments.

#### Deployment Steps
1. Install EasyPanel on your server
2. Create new application
3. Select "Docker Compose" template
4. Configure environment variables
5. Deploy

#### EasyPanel Features
- Automatic SSL certificates
- Easy domain management
- One-click backups
- Resource monitoring
- Log viewer

### 3. Cloud Deployment

#### AWS
- Use `cloud-deployments/aws/` templates
- Deploy to ECS or App Runner
- Configure S3 for file storage
- Use RDS for PostgreSQL

#### GCP
- Use `cloud-deployments/gcp/` templates
- Deploy to Cloud Run
- Use Cloud Storage for files
- Use Cloud SQL for database

#### DigitalOcean
- Use `cloud-deployments/digitalocean/` templates
- Deploy to App Platform
- Spaces for object storage
- Managed PostgreSQL

### 4. Bare Metal

For advanced users wanting full control:

```bash
# Install dependencies
npm install
cd server && npm install
cd ../collector && npm install
cd ../frontend && npm install

# Run database migrations
cd ../server
npx prisma migrate deploy

# Start services
cd ..
npm run dev  # Starts all services
```

---

## Use Cases

### 1. Consulting Firms

**Problem**: Generate consistent, branded proposals for clients quickly.

**Solution with OwnLLM**:
- Define service packages in Products Manager
- Set team rates in Rate Card Manager
- Create branded PDF templates
- Chat with AI to generate proposals
- Export directly to PDF

**Benefits**:
- Faster proposal turnaround
- Consistent branding
- Accurate pricing
- Professional output

### 2. Digital Agencies

**Problem**: Manage multiple client workspaces and generate quotes.

**Solution with OwnLLM**:
- Multi-tenant SaaS architecture
- Separate workspace per client
- CRM pipelines for lead tracking
- Public proposal sharing
- Email verification for team onboarding

**Benefits**:
- Complete client data isolation
- Centralized team management
- Professional proposal tracking
- Seat-based pricing

### 3. Freelancers

**Problem**: Quick proposal generation with minimal setup.

**Solution with OwnLLM**:
- Simple Products Manager
- Branded PDF export
- Document chat for research
- Auto-save notes

**Benefits**:
- Minimal setup time
- Professional documents
- All-in-one platform
- Self-hosted privacy

### 4. Enterprise Teams

**Problem**: Secure, on-premise document AI with proposal generation.

**Solution with OwnLLM**:
- Fully self-hosted
- No data leaves organization
- Multi-admin dashboard
- Organization-level settings
- Audit logging

**Benefits**:
- Data sovereignty
- Regulatory compliance
- Custom integrations
- Scalable architecture

### 5. Research Teams

**Problem**: Chat with academic papers and generate reports.

**Solution with OwnLLM**:
- Upload research papers (PDF)
- Chat with documents using RAG
- Take structured notes in Thread Notes
- Export reports to PDF

**Benefits**:
- Faster literature review
- Better organization
- Professional output
- Self-hosted privacy

---

## Summary

**OwnLLM** is a comprehensive, multi-tenant SaaS platform for AI-powered document intelligence and business proposal generation. Built on top of AnythingLLM, it adds:

- **Multi-tenant SaaS architecture** - Complete organization isolation
- **Rich document editor** - Thread Notes with full formatting
- **Proposal generation** - Products, rates, and branded PDF export
- **CRM integration** - Pipelines, cards, proposal tracking
- **Smart plugins** - Custom data schemas per workspace
- **Code artifacts** - Save and manage generated code
- **Email verification** - Secure user onboarding
- **Billing infrastructure** - Seat limits and plan management

**Platform Capabilities:**
- 25+ LLM providers
- 10+ vector databases
- 200+ React components
- 150+ API endpoints
- 40+ database tables
- 500+ configuration options

**Technology:**
- Frontend: React 18, Vite, Tailwind CSS, Yoopta Editor
- Backend: Node.js, Express, Prisma ORM
- Database: SQLite (dev) / PostgreSQL (production)
- Deployment: Docker, EasyPanel, Cloud (AWS, GCP, DigitalOcean)

For more information, see:
- [Architecture](docs/MULTI_TENANT_ARCHITECTURE.md)
- [Setup Guide](docs/MULTI_TENANT_SETUP.md)
- [API Reference](docs/MULTI_TENANT_API.md)
- [Deployment Guide](docs/MULTI_TENANT_DEPLOYMENT.md)
