# n8n Workflow Automation via API

**Use this guide to create n8n workflows programmatically through natural language → API.**

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Creating Workflows](#creating-workflows)
4. [Workflow Structure](#workflow-structure)
5. [Common Node Types](#common-node-types)
6. [Executing Workflows](#executing-workflows)
7. [Example Workflows](#example-workflows)
8. [Helper Script](#helper-script)

---

## 🔐 Authentication

You need **two different API keys** for n8n:

### 1. MCP Server API Key (for MCP connection)
- **Purpose:** Connect VS Code Copilot to n8n via MCP
- **Scope:** `mcp-server-api`
- **Format:** JWT Bearer token
- **Header:** `Authorization: Bearer <token>`

**Get it here:**
```
http://206.189.26.80:5678 → Settings → API → Generate Token
```

### 2. Instance API Key (for REST API)
- **Purpose:** Create/modify workflows via REST API
- **Scope:** Full API access
- **Format:** JWT API key
- **Header:** `X-N8N-API-KEY: <key>`

**Get it here:**
```
http://206.189.26.80:5678 → Settings → API → Instance API Key
```

---

## 🌐 API Endpoints

### Base URL
```
http://206.189.26.80:5678/api/v1
```

### Available Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/workflows` | List all workflows |
| `GET` | `/workflows/:id` | Get workflow details |
| `POST` | `/workflows` | Create new workflow |
| `PATCH` | `/workflows/:id` | Update workflow |
| `DELETE` | `/workflows/:id` | Delete workflow |
| `POST` | `/workflows/:id/execute` | Execute workflow |
| `POST` | `/workflows/:id/activate` | Activate workflow |
| `POST` | `/workflows/:id/deactivate` | Deactivate workflow |

---

## 🏗️ Creating Workflows

### Basic Request

```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workflow",
    "nodes": [...],
    "connections": {...},
    "settings": {}
  }'
```

### Required Fields

- `name`: Workflow name
- `nodes`: Array of node objects
- `connections`: Connection graph between nodes
- `settings`: Workflow settings (can be empty `{}`)

---

## 📦 Workflow Structure

### Node Object

```json
{
  "parameters": {},           // Node-specific configuration
  "name": "Node Name",         // Display name
  "type": "n8n-nodes-base.start",  // Node type identifier
  "typeVersion": 1,             // Node version
  "position": [240, 300]       // [x, y] coordinates
}
```

### Connections Object

```json
{
  "SourceNode": {
    "main": [
      [
        {
          "node": "TargetNode",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

---

## 🔧 Common Node Types

### Start Node
```json
{
  "parameters": {},
  "name": "Start",
  "type": "n8n-nodes-base.start",
  "typeVersion": 1,
  "position": [240, 300]
}
```

### Set Node (Set/Transform Data)
```json
{
  "parameters": {
    "values": {
      "string": [
        {
          "name": "message",
          "value": "Hello World"
        },
        {
          "name": "timestamp",
          "value": "={{ $now.toISO() }}"
        }
      ],
      "number": [
        {
          "name": "count",
          "value": 42
        }
      ]
    }
  },
  "name": "Set",
  "type": "n8n-nodes-base.set",
  "typeVersion": 1,
  "position": [460, 300]
}
```

### HTTP Request Node
```json
{
  "parameters": {
    "url": "https://api.example.com/data",
    "method": "GET",
    "options": {}
  },
  "name": "HTTP Request",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4,
  "position": [460, 300]
}
```

### Code Node (Custom JavaScript)
```json
{
  "parameters": {
    "jsCode": "return [{json: {result: items[0].json.input * 2}}];"
  },
  "name": "Code",
  "type": "n8n-nodes-base.code",
  "typeVersion": 1,
  "position": [680, 300]
}
```

---

## 🚀 Executing Workflows

### Execute by ID

```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows/WORKFLOW_ID/execute \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {}
  }'
```

### Execute with Input Data

```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows/WORKFLOW_ID/execute \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "items": [
        {
          "json": {
            "input": "Hello from API",
            "value": 42
          }
        }
      ]
    }
  }'
```

---

## 📚 Example Workflows

### Example 1: Simple Hello World
```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hello World",
    "nodes": [
      {
        "parameters": {},
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "typeVersion": 1,
        "position": [240, 300]
      },
      {
        "parameters": {
          "values": {
            "string": [
              {
                "name": "message",
                "value": "Hello from API!"
              }
            ]
          }
        },
        "name": "Set Message",
        "type": "n8n-nodes-base.set",
        "typeVersion": 1,
        "position": [460, 300]
      }
    ],
    "connections": {
      "Start": {
        "main": [[{"node": "Set Message", "type": "main", "index": 0}]]
      }
    },
    "settings": {}
  }'
```

### Example 2: HTTP Call + Transform
```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fetch and Transform Data",
    "nodes": [
      {
        "parameters": {},
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "typeVersion": 1,
        "position": [240, 300]
      },
      {
        "parameters": {
          "url": "https://api.github.com/users/github",
          "method": "GET",
          "options": {}
        },
        "name": "Get GitHub User",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4,
        "position": [460, 300]
      },
      {
        "parameters": {
          "values": {
            "string": [
              {
                "name": "username",
                "value": "={{ $json.login }}"
              },
              {
                "name": "bio",
                "value": "={{ $json.bio }}"
              }
            ]
          }
        },
        "name": "Extract Data",
        "type": "n8n-nodes-base.set",
        "typeVersion": 1,
        "position": [680, 300]
      }
    ],
    "connections": {
      "Start": {
        "main": [[{"node": "Get GitHub User", "type": "main", "index": 0}]]
      },
      "Get GitHub User": {
        "main": [[{"node": "Extract Data", "type": "main", "index": 0}]]
      }
    },
    "settings": {}
  }'
```

### Example 3: Data Processing Chain
```bash
curl -X POST http://206.189.26.80:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Processing Pipeline",
    "nodes": [
      {
        "parameters": {},
        "name": "Start",
        "type": "n8n-nodes-base.start",
        "typeVersion": 1,
        "position": [240, 300]
      },
      {
        "parameters": {
          "values": {
            "string": [{"name": "input", "value": "100"}],
            "number": [{"name": "multiplier", "value": 5}]
        }
        },
        "name": "Set Input",
        "type": "n8n-nodes-base.set",
        "typeVersion": 1,
        "position": [460, 300]
      },
      {
        "parameters": {
          "jsCode": "const input = $json.input;\nconst multiplier = $json.multiplier;\nconst result = input * multiplier;\nreturn [{json: {input, multiplier, result}}];"
        },
        "name": "Calculate",
        "type": "n8n-nodes-base.code",
        "typeVersion": 1,
        "position": [680, 300]
      },
      {
        "parameters": {
          "values": {
            "string": [{"name": "status", "value": "success"}]
          }
        },
        "name": "Set Status",
        "type": "n8n-nodes-base.set",
        "typeVersion": 1,
        "position": [900, 300]
      }
    ],
    "connections": {
      "Start": {
        "main": [[{"node": "Set Input", "type": "main", "index": 0}]]
      },
      "Set Input": {
        "main": [[{"node": "Calculate", "type": "main", "index": 0}]]
      },
      "Calculate": {
        "main": [[{"node": "Set Status", "type": "main", "index": 0}]]
      }
    },
    "settings": {}
  }'
```

---

## 🛠️ Helper Script

Save this as `create_n8n_workflow.sh`:

```bash
#!/bin/bash

# n8n Workflow Creator
# Usage: ./create_n8n_workflow.sh "Workflow Name" 'workflow_json.sh'

N8N_API_URL="http://206.189.26.80:5678/api/v1"
INSTANCE_API_KEY="YOUR_INSTANCE_API_KEY"

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 \"Workflow Name\" 'workflow_json'"
  exit 1
fi

WORKFLOW_NAME="$1"
WORKFLOW_JSON="$2"

curl -s -X POST "${N8N_API_URL}/workflows" \
  -H "X-N8N-API-KEY: ${INSTANCE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$WORKFLOW_JSON" | python3 -m json.tool
```

**Usage:**
```bash
chmod +x create_n8n_workflow.sh
./create_n8n_workflow.sh "My Workflow" '{"name":"My Workflow",...}'
```

---

## 🤝 MCP Integration

After creating workflows, enable them for MCP access:

```bash
curl -X PATCH http://206.189.26.80:5678/api/v1/workflows/WORKFLOW_ID \
  -H "X-N8N-API-KEY: YOUR_INSTANCE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "availableInMCP": true
    }
  }'
```

Then execute via MCP in VS Code Copilot:
```
User: "Run the workflow named 'My Workflow' with input data {value: 42}"
```

---

## 📌 Quick Reference

**Create workflow:**
```bash
curl -X POST .../api/v1/workflows -d '{"name":"...", ...}'
```

**Execute workflow:**
```bash
curl -X POST .../api/v1/workflows/ID/execute -d '{"data":{...}}'
```

**Enable for MCP:**
```bash
curl -X PATCH .../api/v1/workflows/ID -d '{"settings":{"availableInMCP":true}}'
```

**List workflows:**
```bash
curl -X GET .../api/v1/workflows
```

---

## 🎯 Natural Language → API Flow

1. **User asks:** "Create a workflow that fetches data from an API and emails it"
2. **AI parses:** Identify nodes needed (HTTP Request, Email)
3. **AI generates:** JSON workflow structure
4. **API call:** POST to `/api/v1/workflows`
5. **Result:** Workflow created in n8n UI
6. **User visualizes:** See the workflow at `http://206.189.26.80:5678`

---

## 📝 Current Setup

- **n8n Instance:** `http://206.189.26.80:5678`
- **MCP Server URL:** `http://206.189.26.80:5678/mcp-server/http`
- **VS Code Config:** `C:/Users/ahmad/AppData/Roaming/Code/User/mcp.json`

---

## 🚦 Next Steps

1. ✅ Create workflows via API
2. ✅ Visualize in n8n UI
3. ✅ Enable for MCP access
4. ⏳ Execute via VS Code Copilot Chat
5. ⏳ Build complex automation pipelines

---

**Document Version:** 1.0
**Last Updated:** 2025-12-26
