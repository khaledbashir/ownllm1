---
description: Generate AnythingLLM custom agent skills with proper plugin.json and handler.js
---

# AnythingLLM Agent Skill Generator

## Environment Detection
Ask: "Docker, Desktop, or Local Development?"

- **Docker**: `$STORAGE_DIR/plugins/agent-skills/[hubId]/`
- **Desktop**: `~/Library/Application Support/anythingllm-desktop/storage/plugins/agent-skills/[hubId]/`
- **Local Dev**: `server/storage/plugins/agent-skills/[hubId]/`

## Skill Structure
```
plugins/agent-skills/my-skill-name/
├── plugin.json      # Config & metadata
├── handler.js       # Execution logic
└── node_modules/    # Bundled dependencies (if needed)
```

## plugin.json Template
```json
{
  "active": true,
  "hubId": "my-skill-name",
  "name": "Human Readable Name",
  "schema": "skill-1.0.0",
  "version": "1.0.0",
  "description": "What this skill does",
  "author": "@ownllm",
  "license": "MIT",
  "setup_args": {
    "API_KEY": {
      "type": "string",
      "required": true,
      "input": {
        "type": "password",
        "placeholder": "Enter API key",
        "hint": "Get from service.com/api"
      }
    }
  },
  "examples": [
    {
      "prompt": "Example user query",
      "call": "{\"param1\": \"value1\"}"
    }
  ],
  "entrypoint": {
    "file": "handler.js",
    "params": {
      "param1": {
        "description": "What this param is for",
        "type": "string"
      }
    }
  },
  "imported": true
}
```

## handler.js Template
```javascript
const MODULE_NAME = "my-skill-name";

module.exports.runtime = {
  handler: async function (params) {
    const { param1 } = params;
    
    // Access setup_args via this.runtimeArgs (NOT this.config)
    const apiKey = this.runtimeArgs.API_KEY;
    
    // Show progress in UI
    this.introspect(`${MODULE_NAME} starting...`);
    
    try {
      // Validate
      if (!param1) return `Error: param1 required`;
      
      // Logic here...
      this.introspect("Processing...");
      
      // MUST return string
      return JSON.stringify({ result: "success" }, null, 2);
      
    } catch (error) {
      return `Error in ${MODULE_NAME}: ${error.message}`;
    }
  }
};
```

## Critical Rules
1. **ALWAYS return strings** - Never objects/arrays/undefined
2. **`this.runtimeArgs`** = User config from setup_args
3. **`this.config`** = Skill metadata (name, version)
4. **`this.introspect(msg)`** = Show progress in UI
5. **hubId must match folder name**

## OwnLLM Database Access
For skills needing workspace data (products, rateCard):

```javascript
const Database = require('better-sqlite3');
const path = require('path');

// Assumes _workspaceId injected by server
const dbPath = path.join(process.env.STORAGE_DIR, 'anythingllm.db');
const db = new Database(dbPath, { readonly: true });

const row = db.prepare('SELECT products, rateCard FROM workspaces WHERE id = ?')
  .get(params._workspaceId);

const products = JSON.parse(row.products || '[]');
```

## Hot Reload
- Edit existing: Type `/exit` in chat
- New skill: Reload browser page

## Testing
```
@agent [example prompt from plugin.json]
```
