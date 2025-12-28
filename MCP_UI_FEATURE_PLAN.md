# 🔌 MCP SERVER MANAGEMENT UI - FEATURE PLAN

**Created:** December 28, 2025
**Status:** 📋 PLANNING PHASE
**Goal:** Visual interface to add, edit, and manage MCP servers

---

## 🎯 PROBLEM STATEMENT

### Current Pain Points
- ❌ **No visual interface** to add new MCP servers
- ❌ **Manual JSON editing** required (error-prone)
- ❌ **No validation** before adding servers
- ❌ **No preview** of available tools before connecting
- ❌ **Difficult for non-technical users** to set up MCP

### Current Workflow
1. User must manually edit `storage/plugins/anythingllm_mcp_servers.json`
2. Restart AnythingLLM server
3. Check if server works
4. Debug errors through logs

**This is complex and user-hostile.**

---

## 📋 FEATURE REQUIREMENTS

### ✅ Primary Features

#### 1. **Add MCP Server Modal**
- Visual form to add new MCP servers
- Support for 3 connection types:
  - **stdio** (command-line based, e.g., npx packages)
  - **http** (REST API based)
  - **sse** (Server-Sent Events)

#### 2. **Edit MCP Server Modal**
- Modify existing server configurations
- Update commands, args, environment variables
- Preserve connection data during edits

#### 3. **Environment Variables Editor**
- Add/remove environment variables
- Key-value pair inputs
- Support sensitive data (password fields)

#### 4. **Server Validation**
- Test connection before saving
- Check command validity
- Validate required fields
- Show error messages inline

#### 5. **MCP Catalog Integration**
- Browse available MCP servers from catalog
- One-click install from catalog
- Pre-configured templates

---

## 🏗️ TECHNICAL ARCHITECTURE

### Backend Changes

#### 1. **New API Endpoint: Add MCP Server**
**File:** `server/endpoints/mcpServers.js`

```javascript
app.post(
  "/mcp-servers/add",
  [validatedRequest, flexUserRoleValid([ROLES.admin])],
  async (request, response) => {
    try {
      const { name, command, args, env, connectionType } = reqBody(request);
      const result = await new MCPCompatibilityLayer().addMCPServer({
        name,
        command,
        args,
        env,
        connectionType
      });
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

#### 2. **New API Endpoint: Edit MCP Server**
**File:** `server/endpoints/mcpServers.js`

```javascript
app.post(
  "/mcp-servers/edit",
  [validatedRequest, flexUserRoleValid([ROLES.admin])],
  async (request, response) => {
    try {
      const { name, updates } = reqBody(request);
      const result = await new MCPCompatibilityLayer().updateMCPServer(name, updates);
      return response.status(200).json(result);
    } catch (error) {
      return response.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
```

#### 3. **New Hypervisor Method: Add MCP Server**
**File:** `server/utils/MCP/hypervisor/index.js`

```javascript
/**
 * Add new MCP server to config file
 * @param {Object} config - MCP server configuration
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
async addMCPServerToConfig(config) {
  const { name, command, args, env } = config;

  // Validate name uniqueness
  const existing = this.mcpServerConfigs.find(s => s.name === name);
  if (existing) {
    return {
      success: false,
      error: `MCP server with name "${name}" already exists`
    };
  }

  // Add to config
  const servers = safeJsonParse(
    fs.readFileSync(this.mcpServerJSONPath, "utf8"),
    { mcpServers: {} }
  );

  servers.mcpServers[name] = {
    command,
    args,
    env: env || {},
    anythingllm: {
      autoStart: true
    }
  };

  fs.writeFileSync(
    this.mcpServerJSONPath,
    JSON.stringify(servers, null, 2),
    "utf8"
  );

  this.log(`MCP server ${name} added to config file`);
  return { success: true, error: null };
}
```

#### 4. **New Hypervisor Method: Update MCP Server**
**File:** `server/utils/MCP/hypervisor/index.js`

```javascript
/**
 * Update existing MCP server in config file
 * @param {string} name - Name of server to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, error: string | null}>}
 */
updateMCPServerInConfig(name, updates) {
  const servers = safeJsonParse(
    fs.readFileSync(this.mcpServerJSONPath, "utf8"),
    { mcpServers: {} }
  );

  if (!servers.mcpServers[name]) {
    return {
      success: false,
      error: `MCP server ${name} not found`
    };
  }

  // Update fields
  Object.assign(servers.mcpServers[name], updates);

  fs.writeFileSync(
    this.mcpServerJSONPath,
    JSON.stringify(servers, null, 2),
    "utf8"
  );

  this.log(`MCP server ${name} updated in config file`);
  return { success: true, error: null };
}
```

#### 5. **New Hypervisor Method: Validate MCP Server**
**File:** `server/utils/MCP/hypervisor/index.js`

```javascript
/**
 * Validate MCP server configuration before saving
 * @param {Object} config - MCP server configuration
 * @returns {Promise<{valid: boolean, error: string | null}>}
 */
async validateMCPServer(config) {
  const { command, args, connectionType } = config;

  // Basic validation
  if (!config.name || !config.name.trim()) {
    return { valid: false, error: "Server name is required" };
  }

  if (!command || !command.trim()) {
    return { valid: false, error: "Command is required" };
  }

  // Check if command exists (for stdio)
  if (connectionType === 'stdio') {
    const commandExists = await this.#checkCommandExists(command);
    if (!commandExists) {
      return { valid: false, error: `Command "${command}" not found in PATH` };
    }
  }

  // Validate URL format (for http/sse)
  if (connectionType === 'http' || connectionType === 'sse') {
    // URL validation logic
  }

  return { valid: true, error: null };
}
```

---

### Frontend Changes

#### 1. **New Component: Add MCP Server Modal**
**File:** `frontend/src/pages/Admin/Agents/MCPServers/AddServerModal.jsx`

```jsx
import { useState } from "react";
import { Plus, X, Check } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";
import showToast from "@/utils/toast";

export default function AddServerModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    connectionType: 'stdio',
    command: 'npx',
    args: ['-y', ''],
    env: []
  });

  const addEnvVar = () => {
    setFormData(prev => ({
      ...prev,
      env: [...prev.env, { key: '', value: '' }]
    }));
  };

  const updateEnvVar = (index, field, value) => {
    const newEnv = [...formData.env];
    newEnv[index][field] = value;
    setFormData(prev => ({ ...prev, env: newEnv }));
  };

  const removeEnvVar = (index) => {
    setFormData(prev => ({
      ...prev,
      env: prev.env.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    const { success, error } = await MCPServers.addServer(formData);
    if (success) {
      showToast('MCP server added successfully', 'success');
      onAdd();
      onClose();
    } else {
      showToast(error || 'Failed to add MCP server', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-bg-secondary rounded-xl p-6 w-full max-w-2xl">
        {/* Modal content */}
      </div>
    </div>
  );
}
```

#### 2. **New Component: Edit MCP Server Modal**
**File:** `frontend/src/pages/Admin/Agents/MCPServers/EditServerModal.jsx`

Similar structure to AddModal but pre-filled with existing data.

#### 3. **New Component: MCP Catalog Browser**
**File:** `frontend/src/pages/Admin/Agents/MCPServers/Catalog.jsx`

```jsx
import { useState } from "react";
import { Globe, Download } from "@phosphor-icons/react";
import MCPServers from "@/models/mcpServers";

export default function MCPCatalog({ onInstall }) {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    const data = await fetch('/api/mcp-catalog').then(r => r.json());
    setServers(data.servers);
    setLoading(false);
  };

  const installServer = async (server) => {
    await MCPServers.addServer(server.config);
    onInstall();
  };

  return (
    <div className="space-y-4">
      {/* Catalog grid */}
    </div>
  );
}
```

#### 4. **Update MCPServers Model**
**File:** `frontend/src/models/mcpServers.js`

```javascript
addServer: async (config) => {
  return await fetch(`${API_BASE}/mcp-servers/add`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(config),
  })
    .then((res) => res.json())
    .catch((e) => ({
      success: false,
      error: e.message,
    }));
},

editServer: async (name, updates) => {
  return await fetch(`${API_BASE}/mcp-servers/edit`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ name, updates }),
  })
    .then((res) => res.json())
    .catch((e) => ({
      success: false,
      error: e.message,
    }));
},

validateServer: async (config) => {
  return await fetch(`${API_BASE}/mcp-servers/validate`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(config),
  })
    .then((res) => res.json())
    .catch((e) => ({
      valid: false,
      error: e.message,
    }));
},
```

#### 5. **Update Main MCP Servers Page**
**File:** `frontend/src/pages/Admin/Agents/index.jsx`

Add "Add Server" button that opens AddServerModal.

---

## 📐 UI/UX DESIGN

### Add Server Modal Layout

```
┌─────────────────────────────────────────────┐
│  Add MCP Server                    [X]   │
├─────────────────────────────────────────────┤
│                                      │
│  Server Name *                         │
│  ┌─────────────────────────────────┐     │
│  │ my-custom-mcp               │     │
│  └─────────────────────────────────┘     │
│                                      │
│  Connection Type *                     │
│  ◉ Command (stdio)  ○ HTTP ○ SSE    │
│                                      │
│  Command *                            │
│  ┌─────────────────────────────────┐     │
│  │ npx                          │     │
│  └─────────────────────────────────┘     │
│                                      │
│  Arguments                            │
│  ┌─────────────────────────────────┐     │
│  │ -y @package/name             │     │
│  └─────────────────────────────────┘     │
│                                      │
│  Environment Variables                  │
│  ┌─────────────────────────────────┐     │
│  │ API_KEY    │ **********       │ [─]│
│  └─────────────────────────────────┘     │
│  [+ Add Variable]                       │
│                                      │
│  [Test Connection]  [Cancel]  [Add]   │
└─────────────────────────────────────────────┘
```

### Catalog Browser Layout

```
┌─────────────────────────────────────────────┐
│  MCP Catalog                          │
├─────────────────────────────────────────────┤
│                                      │
│  🔍 Search MCP servers...              │
│                                      │
│  ┌────────────────────────────┐         │
│  │ 🐳 Docker MCP           │         │
│  │ Manage Docker containers   │         │
│  │ ⭐ 4.5k                │         │
│  │ [Install]               │         │
│  └────────────────────────────┘         │
│                                      │
│  ┌────────────────────────────┐         │
│  │ 📊 Filesystem MCP       │         │
│  │ Read/write files         │         │
│  │ ⭐ 2.3k                │         │
│  │ [Install]               │         │
│  └────────────────────────────┘         │
│                                      │
└─────────────────────────────────────────────┘
```

---

## 🎨 USER FLOWS

### Flow 1: Add MCP Server (Manual)

1. User clicks "Add MCP Server" button
2. Modal opens with empty form
3. User fills in:
   - Server name: "my-custom-mcp"
   - Connection type: "Command (stdio)"
   - Command: "npx"
   - Arguments: "-y @my-org/my-mcp-server"
   - Environment variables: API_KEY="***"
4. User clicks "Test Connection"
5. System validates and tests connection
6. Shows success message
7. User clicks "Add"
8. Server saved to config and appears in list

### Flow 2: Add MCP Server (From Catalog)

1. User clicks "Browse Catalog" button
2. Catalog browser opens
3. User searches for "docker"
4. User clicks "Install" on Docker MCP
5. Pre-filled modal opens with all settings
6. User fills in required env vars
7. User clicks "Add"
8. Server installed and ready to use

### Flow 3: Edit MCP Server

1. User clicks gear icon on existing server
2. Selects "Edit Server"
3. Modal opens with pre-filled data
4. User modifies settings
5. User clicks "Save"
6. Config updated
7. Server reloaded automatically

---

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Core Backend (2-3 days)
- [ ] Add `addMCPServerToConfig` to hypervisor
- [ ] Add `updateMCPServerInConfig` to hypervisor
- [ ] Add `validateMCPServer` to hypervisor
- [ ] Create `/mcp-servers/add` endpoint
- [ ] Create `/mcp-servers/edit` endpoint
- [ ] Create `/mcp-servers/validate` endpoint
- [ ] Add validation logic
- [ ] Write unit tests

### Phase 2: Core Frontend (2-3 days)
- [ ] Create `AddServerModal.jsx`
- [ ] Create `EditServerModal.jsx`
- [ ] Add `addServer` to MCPServers model
- [ ] Add `editServer` to MCPServers model
- [ ] Add `validateServer` to MCPServers model
- [ ] Update main page with "Add Server" button
- [ ] Add "Edit" option to server menu
- [ ] Integrate with existing toggle/delete

### Phase 3: Advanced Features (3-4 days)
- [ ] Create MCP Catalog endpoint
- [ ] Create `MCPCatalog.jsx` component
- [ ] Add one-click install from catalog
- [ ] Add server status indicators
- [ ] Add connection testing UI
- [ ] Add error messages and validation

### Phase 4: Polish (1-2 days)
- [ ] Add loading states
- [ ] Add success/error toasts
- [ ] Add confirmation dialogs
- [ ] Add help tooltips
- [ ] Add documentation links
- [ ] Test all user flows

---

## 📊 EFFORT ESTIMATE

| Phase | Time | Complexity |
|-------|-------|------------|
| Phase 1: Backend | 2-3 days | Medium |
| Phase 2: Frontend | 2-3 days | Medium |
| Phase 3: Advanced | 3-4 days | High |
| Phase 4: Polish | 1-2 days | Low |
| **Total** | **8-12 days** | **Medium-High** |

---

## ✅ SUCCESS CRITERIA

### Functional Requirements
- [ ] Users can add MCP servers via UI (no manual JSON editing)
- [ ] Users can edit MCP server configurations
- [ ] Connection validation before saving
- [ ] Support for stdio, http, and sse connection types
- [ ] Environment variables editor with secure fields
- [ ] Catalog browser with one-click install
- [ ] Real-time connection status

### Non-Functional Requirements
- [ ] Response time < 2s for operations
- [ ] Clear error messages for failed operations
- [ ] Responsive design (mobile friendly)
- [ ] Accessible (keyboard navigation)
- [ ] Consistent with existing AnythingLLM UI

### User Experience Requirements
- [ ] No manual file editing required
- [ ] Intuitive forms with validation
- [ ] Clear visual feedback
- [ ] Helpful error messages
- [ ] Documentation links available

---

## ⚠️ POTENTIAL ISSKS & RISKS

### Technical Risks
1. **Command Execution**
   - Risk: Arbitrary command execution via stdio
   - Mitigation: Only allow admin users, validate commands

2. **Security**
   - Risk: Exposing API keys in UI
   - Mitigation: Mask sensitive fields, store securely

3. **Connection Testing**
   - Risk: Slow response from MCP servers
   - Mitigation: Add timeout, async validation

4. **Catalog Updates**
   - Risk: Stale catalog data
   - Mitigation: Fetch from official MCP registry

### User Experience Risks
1. **Complexity**
   - Risk: Too many fields overwhelms users
   - Mitigation: Progressive disclosure, defaults, templates

2. **Error Recovery**
   - Risk: Users can't fix errors
   - Mitigation: Clear error messages, retry options

3. **Backward Compatibility**
   - Risk: Breaking existing JSON configs
   - Mitigation: Don't remove JSON support, coexist with UI

---

## 📚 REFERENCES

### Existing Files
- `anythingllm_mcp_servers.json` - Current MCP config file
- `server/utils/MCP/hypervisor/index.js` - MCP server management
- `server/utils/MCP/index.js` - MCP compatibility layer
- `server/endpoints/mcpServers.js` - Existing API endpoints
- `frontend/src/pages/Admin/Agents/MCPServers/` - UI components
- `frontend/src/models/mcpServers.js` - API client

### External Resources
- [MCP Official Docs](https://modelcontextprotocol.io/)
- [AnythingLLM MCP Docs](https://docs.anythingllm.com/mcp-compatibility/overview)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)

---

## 🎯 PRIORITY & SCOPE

### MVP (Minimum Viable Product) - Phase 1 & 2
**Must Have:**
- ✅ Add MCP server form (stdio only)
- ✅ Basic validation
- ✅ Save to config file
- ✅ Edit existing servers
- ✅ Delete existing servers

**Nice to Have:**
- ⭕ Connection testing
- ⭕ Environment variables editor

**Out of Scope:**
- ❌ HTTP/SSE support (future)
- ❌ Catalog browser (future)
- ❌ Advanced validation (future)

### V2 (Enhanced) - Phase 3
**Must Have:**
- ✅ HTTP/SSE support
- ✅ MCP Catalog browser
- ✅ One-click install

**Nice to Have:**
- ⭕ Connection testing UI
- ⭕ Server health monitoring
- ⭕ Export/Import configurations

### V3 (Polished) - Phase 4
**Must Have:**
- ✅ Advanced validation
- ✅ Error recovery
- ✅ Help documentation

**Nice to Have:**
- ⭕ Configuration templates
- ⭕ Server groups
- ⭕ Usage statistics

---

## 🚀 NEXT STEPS

1. **Review Plan**
   - Get approval on feature scope
   - Confirm technical approach
   - Validate assumptions

2. **Set Up Development**
   - Create feature branch
   - Set up testing environment
   - Prepare test MCP servers

3. **Start Implementation**
   - Begin with Phase 1 (backend)
   - Follow success criteria
   - Test incrementally

4. **User Testing**
   - Internal testing after each phase
   - Collect feedback
   - Iterate on UI/UX

5. **Documentation**
   - Update user docs
   - Create admin guide
   - Record demo video

---

## 📝 NOTES

### Current MCP Configuration Structure
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@leonardsellem/n8n-mcp-server"],
      "env": {
        "N8N_API_URL": "https://...",
        "N8N_API_KEY": "..."
      },
      "anythingllm": {
        "autoStart": true
      }
    }
  }
}
```

### Connection Types Supported
1. **stdio** (Stdin/Stdout)
   - Command-line tools
   - Examples: npx packages, python scripts
   - Most common

2. **http** (REST API)
   - HTTP endpoints
   - Requires URL
   - Less common

3. **sse** (Server-Sent Events)
   - Real-time streaming
   - Requires URL
   - Advanced use cases

### Existing UI Components to Reuse
- `ServerPanel.jsx` - Existing server details panel
- `MCPServersList.jsx` - Existing list component
- Toast notifications - For success/error feedback
- Modal patterns - From other admin pages

---

## 🎓 LEARNING RESOURCES

For Developers:
- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [AnythingLLM Architecture](https://docs.anythingllm.com/architecture)
- [React Component Patterns](https://reactpatterns.com/)

For Users:
- [Getting Started with MCP](https://docs.anythingllm.com/mcp-compatibility/overview)
- [Adding MCP Servers](TO_BE_CREATED)
- [Troubleshooting MCP](TO_BE_CREATED)

---

## 🎉 SUMMARY

This feature plan provides a complete roadmap for building a visual MCP server management interface for AnythingLLM.

**Key Benefits:**
- ✅ No manual JSON editing
- ✅ Visual, intuitive interface
- ✅ Connection validation
- ✅ MCP catalog integration
- ✅ Better user experience

**Estimated Effort:** 8-12 days (2-3 weeks)
**Priority:** High (major UX improvement)
**Risk:** Medium (manageable with proper testing)

**Next Action:** Get feedback on plan and begin Phase 1 implementation.

---

## 🤝 HANDOVER

**What We Planned:**
- Complete MCP UI feature plan with 4 phases
- Backend API endpoints (add, edit, validate)
- Frontend components (AddModal, EditModal, Catalog)
- Hypervisor methods for config management
- User flows and UX design
- Implementation roadmap with timeline

**What's Next:**
- Review plan with stakeholders
- Get approval on scope and timeline
- Create feature branch: `feature/mcp-ui`
- Begin Phase 1: Backend implementation
- Set up test environment with sample MCP servers

**Files to Create:**
- `frontend/src/pages/Admin/Agents/MCPServers/AddServerModal.jsx`
- `frontend/src/pages/Admin/Agents/MCPServers/EditServerModal.jsx`
- `frontend/src/pages/Admin/Agents/MCPServers/Catalog.jsx` (Phase 3)

**Files to Modify:**
- `server/endpoints/mcpServers.js` - Add add/edit/validate endpoints
- `server/utils/MCP/hypervisor/index.js` - Add config methods
- `server/utils/MCP/index.js` - Add hypervisor wrappers
- `frontend/src/models/mcpServers.js` - Add API methods
- `frontend/src/pages/Admin/Agents/index.jsx` - Add "Add Server" button
- `frontend/src/pages/Admin/Agents/MCPServers/index.jsx` - Update list component

**Documentation to Update:**
- `docs/mcp-compatibility/adding-servers.md` (TO BE CREATED)
- `docs/mcp-catalog.md` (TO BE CREATED)
- README.md - Add MCP UI section

---

**Status:** ✅ FEATURE PLAN COMPLETE - Ready for Review and Implementation
