# Organization Feature Toggles - Complete Reference

## Overview
This document lists ALL possible features that can be toggled per organization in the Super Admin Dashboard.

---

## 📚 Document & Content Features

### File Upload & Processing
- `file_upload_pdf` - Upload and process PDF files
- `file_upload_docx` - Upload and process Word documents (.docx)
- `file_upload_txt` - Upload and process text files (.txt)
- `file_upload_md` - Upload and process Markdown files
- `file_upload_csv` - Upload and process CSV files
- `file_upload_xlsx` - Upload and process Excel spreadsheets
- `file_upload_epub` - Upload and process EPUB e-books
- `file_upload_images` - Upload and process images (with OCR)
- `file_upload_audio` - Upload and process audio files
- `file_upload_mbox` - Upload and process email archives
- `file_upload_office` - Upload and process Office MIME files

### Document Limits
- `max_documents_per_workspace` - Max documents per workspace (default: 100)
- `max_file_size_mb` - Max file upload size in MB (default: 10)
- `total_storage_limit_gb` - Total storage limit per organization

---

### 🌐 Web & External Content

### Website Scraping
- `website_scraping` - Scrape single websites
- `website_depth_scraping` - Multi-level website depth scraping
- `website_crawling` - Full website crawling with configurable depth
- `website_concurrency_limit` - Max concurrent website scrapes

### Repositories
- `github_repo_import` - Import from GitHub repositories
- `gitlab_repo_import` - Import from GitLab repositories
- `repo_branch_support` - Support for selecting specific branches
- `repo_resync` - Resync repositories on changes

### Video Content
- `youtube_transcript` - Import YouTube video transcripts
- `youtube_channel_import` - Import entire YouTube channels

### Knowledge Base
- `confluence_import` - Import from Confluence
- `notion_import` - Import from Notion
- `obsidian_vault_import` - Import Obsidian vaults
- `linear_import` - Import from Linear

---

## 🤖 AI & LLM Features

### Chat Features
- `ai_chat_enabled` - Basic AI chat functionality
- `chat_history_enabled` - Enable chat history/threads
- `chat_history_retention_days` - How long to keep chat history (default: 90)
- `streaming_responses` - Enable streaming AI responses
- `max_context_messages` - Max messages in chat context (default: 10)

### Model Selection
- `custom_model_selection` - Allow custom LLM model selection
- `multi_model_switching` - Switch between multiple models
- `advanced_temperature_control` - Fine-tune temperature settings
- `top_p_control` - Top-p sampling control
- `max_tokens_control` - Max output tokens control

### Embeddings
- `embeddings_enabled` - Enable document embeddings
- `embedding_provider_selection` - Choose embedding provider
- `re_embedding_on_update` - Re-embed documents when updated
- `embedding_chunk_size` - Custom embedding chunk size
- `embedding_overlap` - Embedding chunk overlap percentage

### Advanced AI
- `agent_builder_enabled` - Enable AI agent builder
- `agent_tool_use` - Use tools in agents (web scraping, API calls, etc.)
- `code_execution` - Execute code snippets in responses
- `function_calling` - Enable function calling
- `reasoning_mode` - Enable advanced reasoning (for capable models)

---

## 🎤 Voice & Audio

### Text-to-Speech (TTS)
- `tts_enabled` - Enable text-to-speech
- `tts_provider_selection` - Choose TTS provider
- `tts_voice_selection` - Voice selection for TTS
- `tts_language_support` - Multi-language TTS support
- `tts_audio_format` - Output format (wav, mp3, etc.)
- `tts_response_format` - Response format options

---

## 🔌 Integrations & API

### Public API
- `public_api_enabled` - Enable public API access
- `api_key_generation` - Generate API keys
- `api_rate_limiting` - Rate limiting for API calls
- `api_calls_per_minute` - API rate limit (default: 60)

### Embed Widgets
- `embed_widget_enabled` - Enable chat embed widgets
- `embed_customization` - Customize embed appearance
- `embed_domain_whitelist` - Whitelist allowed domains
- `embed_analytics` - Track embed widget analytics

### Browser Extension
- `browser_extension_enabled` - Enable browser extension support
- `browser_extension_key_generation` - Generate extension keys

### Webhooks & Integrations
- `webhooks_enabled` - Enable webhook notifications
- `webhook_endpoints_limit` - Max webhook endpoints (default: 5)
- `stripe_integration` - Stripe payment integration
- `paddle_integration` - Paddle payment integration
- `zapier_integration` - Zapier automation integration

### Vault Features
- `integration_vault_enabled` - Store integration configs securely
- `public_api_registry` - Access to public API registry
- `api_categories_enabled` - Browse APIs by category

---

## 👥 User & Workspace Management

### Organization Limits
- `max_workspaces_per_org` - Max workspaces per organization (default: 10)
- `workspace_templates` - Enable workspace templates
- `workspace_sharing` - Share workspaces with users
- `workspace_duplication` - Duplicate workspaces

### User Management
- `invite_users_enabled` - Send user invitations
- `user_role_management` - Manage user roles (admin, manager, default)
- `sso_enabled` - Single Sign-On (SSO) support
- `saml_integration` - SAML SSO integration
- `oauth_integration` - OAuth (Google, GitHub) login

### Multi-Tenant Features
- `multi_tenant_mode` - Enable multi-tenant architecture
- `tenant_isolation` - Complete tenant data isolation

---

## 🔒 Security & Privacy

### Data Privacy
- `data_export_enabled` - Export all organization data
- `data_retention_days` - Auto-delete old data (default: 365)
- `gdpr_compliance` - GDPR compliance features
- `data_anonymization` - Anonymize user data

### Security Controls
- `two_factor_auth` - 2FA enforcement
- `session_timeout_minutes` - Session timeout (default: 60)
- `ip_whitelist` - IP-based access control
- `audit_logging_enabled` - Detailed audit logs
- `audit_log_retention_days` - Keep audit logs for (default: 90)

---

## 📊 Analytics & Reporting

### Usage Analytics
- `usage_analytics_enabled` - Track usage statistics
- `detailed_metrics` - Detailed performance metrics
- `cost_tracking` - Track AI/LLM costs
- `token_usage_tracking` - Track token usage

### Reports
- `generate_reports` - Generate usage reports
- `export_reports_csv` - Export reports as CSV
- `export_reports_json` - Export reports as JSON
- `scheduled_reports` - Schedule automatic reports

---

## 🎨 Customization & Branding

### UI Customization
- `custom_logo_upload` - Upload organization logo
- `custom_theme_colors` - Custom theme colors
- `custom_domain` - Custom domain for embed widgets
- `white_label_mode` - White-label the platform

### Workspace Customization
- `system_prompt_customization` - Custom AI system prompts
- `system_prompt_variables` - Use variables in prompts
- `rag_prompt_template` - Custom RAG prompt templates
- `chat_instructions` - Custom chat instructions

---

## 🔧 Advanced Features

### Experimental Features
- `experimental_features` - Access to experimental features
- `live_file_sync` - Live file synchronization
- `advanced_rag` - Advanced RAG (Retrieval-Augmented Generation)
- `hybrid_search` - Hybrid (semantic + keyword) search

### Performance
- `parallel_embeddings` - Parallel document embeddings
- `cache_enabled` - Enable response caching
- `cache_ttl_seconds` - Cache time-to-live (default: 3600)
- `concurrent_requests_limit` - Max concurrent API requests

### Enterprise Features
- `priority_support` - Priority customer support
- `sla_guarantee` - SLA guarantees
- `dedicated_resources` - Dedicated resources
- `custom_deployment` - Custom deployment options

---

## 📝 Plan-Based Defaults

### Free Plan
```
✅ file_upload_pdf, file_upload_txt, file_upload_md
✅ ai_chat_enabled (100 messages/day)
✅ embeddings_enabled (1 workspace, 50 documents)
✅ basic_analytics
✅ 1 user seat
❌ Agent builder
❌ Custom models
❌ API access
❌ Embed widgets
```

### Pro Plan
```
✅ All Free features
✅ All file types
✅ 10 workspaces, 10 user seats
✅ Agent builder
✅ API access (1000 calls/day)
✅ Embed widgets (5 domains)
✅ Custom models
✅ TTS enabled
✅ Webhooks (5 endpoints)
❌ Multi-tenant
❌ SSO
❌ White-label
```

### Enterprise Plan
```
✅ All Pro features
✅ Unlimited workspaces and users
✅ Multi-tenant mode
✅ SSO (SAML, OAuth)
✅ White-label customization
✅ Unlimited API access
✅ Unlimited embed domains
✅ Priority support
✅ Dedicated resources
✅ Custom deployment
✅ All experimental features
```

---

## 🚀 Implementation Plan

1. **Phase 1**: Core feature toggles (upload, chat, embeddings)
2. **Phase 2**: Advanced AI features (agents, tools, code execution)
3. **Phase 3**: Integration features (API, webhooks, embed widgets)
4. **Phase 4**: Enterprise features (SSO, multi-tenant, white-label)

---

## 📌 Notes for Implementation

- Features should be stored as JSON in the `organizations` table's `settings` column
- Use Prisma's `Json` type for flexible feature storage
- Create helper functions: `hasFeature(orgId, feature)` and `setFeature(orgId, feature, value)`
- Add middleware to check feature access before allowing actions
- Log all feature toggle changes to audit logs
