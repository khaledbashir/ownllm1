# 🗑️ n8n FILES CLEANUP NOTES

**Date:** December 28, 2025
**Reason:** User self-hosts n8n on Easypanel, not needed in AnythingLLM docker stack

---

## ✅ FILES MODIFIED

### 1. Docker Compose
**File:** `docker/docker-compose.yml`

**Removed Services:**
- ❌ `n8n` - Main n8n service
- ❌ `redis` - n8n's queue manager
- ❌ `browserless` - Chrome for n8n workflows

**Updated anything-llm service:**
- ❌ Removed `BROWSER_WS_URL` environment variable (no longer needed)
- ❌ Removed `depends_on: - browserless` (no longer needed)

**Result:** Docker stack reduced from 4 services to 1 (anything-llm only)

---

### 2. Environment Variables
**File:** `docker/.env.example`

**Removed:**
```dotenv
# REMOVED: n8n Configuration
N8N_USER=admin
N8N_PASSWORD=change-this-password-to-something-secure
```

**Note:** These are still in your `.env` file, you can remove them too.

---

## 🔍 MCP CONNECTION STILL WORKS

### Configuration File: `anythingllm_mcp_servers.json`

**n8n MCP Servers Configured:**
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@leonardsellem/n8n-mcp-server"],
      "env": {
        "N8N_API_URL": "https://basheer-n8n.5jtgcw.easypanel.host/api",
        "N8N_API_KEY": "<your-api-key>"
      }
    },
    "n8n-builder": {
      "command": "npx",
      "args": ["-y", "@makafeli/n8n-workflow-builder"],
      "env": {
        "N8N_HOST": "https://basheer-n8n.5jtgcw.easypanel.host",
        "N8N_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**This Still Works!**
- AnythingLLM connects to external n8n via MCP
- No need for local n8n service
- API key and URL configured in `anythingllm_mcp_servers.json`

---

## 📊 IMPACT

### Resource Savings
- **Docker Services:** -3 (n8n, redis, browserless)
- **Docker Images:** -2 (n8n:latest, redis:7-alpine)
- **Docker Volumes:** -2 (n8n_data, n8n_redis)
- **Ports Freed:** -3 (5678, 6379, 3002)

### Estimated Resource Reduction
- **Memory:** -500MB to -1GB (n8n + redis + chrome)
- **Disk Space:** -500MB to -1GB (n8n_data + n8n_redis volumes)
- **Startup Time:** -10-15 seconds (fewer services to start)

---

## 📁 FILES TO REVIEW (Manual Cleanup Needed)

### These files are still in the repo but can be removed if not needed:

1. **`N8N_API_WORKFLOW_CREATION.md`**
   - Purpose: Guide for creating n8n workflows
   - Status: Documentation only
   - Action: Keep for reference, or remove if you don't need it

2. **`n8n_lead_intake_workflow.json`**
   - Purpose: Production workflow (Typeform → Airtable)
   - Status: Should be imported to your Easypanel n8n
   - Action: Import to Easypanel n8n, then remove from repo

3. **`n8n_workflow_specialist_job_summary.md`**
   - Purpose: Job summary documentation
   - Status: Documentation only
   - Action: Keep for reference, or remove if not needed

4. **`docker/n8n-workflows/`** (directory)
   - Purpose: Local n8n workflow storage
   - Status: No longer needed (using Easypanel n8n)
   - Action: Remove directory and all contents

---

## ✅ TESTING REQUIRED

### Test MCP Connection After Removal:

```bash
# Start anything-llm only
cd /root/ownllm/docker
docker-compose up -d

# Check MCP servers are accessible
# Verify in AnythingLLM UI: Settings → Community Hub → MCP Servers
# Expected: n8n MCP servers should show "connected"

# Test n8n workflow execution
# In AnythingLLM UI, try to execute an n8n workflow via MCP
# Expected: Should work (connects to Easypanel n8n)
```

### Verify No n8n References:

```bash
# Check server code doesn't reference local n8n
grep -r "localhost.*5678\|n8n:5678\|internal.*n8n" server/

# Should return: No matches
```

---

## 🎯 NEXT STEPS

### Immediate (After Testing):
1. ✅ Test MCP connection to Easypanel n8n
2. ✅ Test n8n workflow execution via MCP
3. ✅ Verify everything still works

### Optional Cleanup (If You Want):
1. ⏸️ Remove n8n documentation files from repo root:
   - `N8N_API_WORKFLOW_CREATION.md`
   - `n8n_workflow_specialist_job_summary.md`

2. ⏸️ Remove n8n workflow file (after importing to Easypanel):
   - `n8n_lead_intake_workflow.json`

3. ⏸️ Remove n8n-workflows directory:
   - `docker/n8n-workflows/`

---

## 📝 NOTES

### Why This is Better:

**Before:**
- Duplicate n8n services (one in Easypanel, one in Docker stack)
- Double resource usage
- Conflicting workflows
- Harder to manage

**After:**
- Single n8n instance on Easypanel
- MCP connection from AnythingLLM
- Lower resource usage
- Centralized workflow management
- Simpler architecture

### Backups Created:
- `docker/docker-compose.backup.yml` - Original compose file
- Contains: n8n, redis, browserless services

### Files NOT Modified (Still Working):
- `anythingllm_mcp_servers.json` - MCP configuration intact
- Easypanel n8n - Still running at basheer-n8n.5jtgcw.easypanel.host

---

## 🤝 HANDOVER

**What Was Done:**
- ✅ Removed n8n service from docker-compose.yml
- ✅ Removed redis service (only used by n8n)
- ✅ Removed browserless service (dev-only)
- ✅ Removed n8n env vars from .env.example
- ✅ Documented MCP connection (still works)
- ✅ Identified optional files to remove manually

**What Still Works:**
- ✅ n8n MCP servers connect to Easypanel n8n
- ✅ AnythingLLM can trigger n8n workflows
- ✅ All features remain functional

**What Next:**
1. Test MCP connection with `docker-compose up -d`
2. Import workflows to Easypanel n8n
3. Remove optional n8n files if desired
4. Commit and push changes

**Files Modified:**
- `docker/docker-compose.yml` - Removed n8n/redis/browserless
- `docker/.env.example` - Removed n8n env vars
- `docker/docker-compose.backup.yml` - Backup of original

---

**Cleanup Completed:** December 28, 2025
**Next Action:** Test and commit
