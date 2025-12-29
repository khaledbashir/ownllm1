# CRM Manager Skill

Powerful agent skill for managing CRM leads, pipelines, and activities directly from the AnythingLLM chat interface.

## Features

- **Lead Management**: Create, view, update, and delete leads.
- **Pipeline Control**: Move leads between stages (Lead, Qualification, Proposal, Negotiation, Won, Lost).
- **Statistics**: Get summaries of lead counts and total deal values.

## Usage

Ask the AI agent to perform CRM tasks using natural language:

- "Show me all active leads"
- "Create a new lead for John Doe from Acme Corp worth $5000"
- "Move lead #123 to the Won stage"
- "Give me a summary of my sales pipeline"

## Actions

The skill supports the following actions:

- `list_leads`: Fetch all leads or filter by stage.
- `create_lead`: Add a new entry to the CRM.
- `update_lead`: Change lead details or add notes.
- `move_lead`: Advance a lead through the pipeline.
- `delete_lead`: Remove a lead from the CRM.

## Technical Details

- **HubId**: `crm-manager`
- **Version**: `1.0.0`
- **Runtime**: NodeJS (AnythingLLM v1.9.1+)
