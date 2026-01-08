# ANC Audit Generation: Complete Setup & Usage Guide

This guide explains how to connect the **ANC Audit Generator Skill** (in AnythingLLM) to **n8n** to produce the Excel backup files Natalia needs.

---

## 🏗️ Phase 1: n8n Setup (The Receiver)
*You need to enable the "listener" that catches the data from the chat.*

1.  **Open n8n** (usually `http://YOUR_SERVER_IP:5678`).
2.  **Create a New Workflow**.
3.  **Add a Trigger Node**:
    *   Search for **Webhook**.
    *   **HTTP Method**: `POST`
    *   **Path**: `anc-audit-generator`
    *   **Authentication**: None (or Basic if you configured it, but start with None for testing).
    *   *Resulting Test URL*: `http://localhost:5678/webhook-test/anc-audit-generator`
    *   *Resulting Production URL*: `http://localhost:5678/webhook/anc-audit-generator`
4.  **Add the "Spreadsheet File" Node**:
    *   Search for **Spreadsheet File**.
    *   **Operation**: `Write to File` (or Create).
    *   **File Format**: `xlsx`.
    *   **Data Mapping**: Drag the fields from the Webhook input (pricing, clientName, etc.) into the spreadsheet columns.
5.  **Add Email Node** (Gmail / Outlook):
    *   **To**: The estimator's email (or Natalia).
    *   **Attachments**: The file output from the Spreadsheet node.
6.  **Activate**: Click "Active" in top right.

---

## 🔌 Phase 2: Skill Configuration (The Sender)
*The skill code is already installed, but you must enable it for the workspace.*

1.  **Open AnythingLLM**.
2.  Go to **Workspace Settings** -> **Agent Skills**.
3.  You should see **"ANC Audit Generator"** in the list.
4.  **Toggle it ON**.
5.  *Optional*: If the n8n URL is different than `localhost:5678` (e.g., if running in Docker containers that can't talk via localhost), you may need to edit `handler.js` to use the container name (e.g., `http://n8n:5678/webhook/...`).

---

## 💬 Phase 3: Usage (The Workflow)
*How to actually use it in a chat session.*

1.  **Start a Chat**: "Create a quote for Coca Cola for a 10mm Outdoor Ribbon Board, 10x100."
2.  **Refine**: Answer the agent's questions (Curvature, Access, etc.).
3.  **Finalize**: The Agent will show the "Pretty" Markdown table.
4.  **Trigger the Audit**:
    *   **User**: "This looks good. Generate the audit file."
    *   **Agent**: *Recognizes intent* -> *Bundles JSON data* -> *Calls `anc-audit-generator`*.
    *   **UI Feedback**: You will see "Thinking... Sending quote data to n8n for Excel generation..."
5.  **Result**: The Agent will reply: "Audit file generated and emailed to estimators."

---

## 🐞 Troubleshooting

**"Failed to connect to n8n"**
- Check your Docker networking. If AnythingLLM and n8n are in the same Docker network, use `http://n8n:5678` instead of `localhost`.
- Edit header: `/root/everythingllm/ownllm1/server/storage/plugins/agent-skills/anc-audit-generator/handler.js`

**"Agent doesn't trigger the tool"**
- Make sure you are in **Agent Mode** (`@agent` or Agent workspace setting enabled).
- Try being explicit: "Use the audit generator tool to send this to n8n."
