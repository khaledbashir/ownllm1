const { getLLMProvider } = require("../utils/helpers");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { IntegrationVault } = require("../models/integrationVault");
const { PublicApiRegistry } = require("../models/publicApiRegistry");

// Schema for all available block types
const FLOW_BLOCKS_SCHEMA = {
  api_call: {
    name: "API Call",
    description: "Make an HTTP request to an external API",
    requiredInputs: ["url"],
    config: {
      url: {
        type: "string",
        required: true,
        description: "The API endpoint URL",
      },
      method: {
        type: "string",
        default: "GET",
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      },
      headers: { type: "array", description: "Array of {key, value} pairs" },
      body: {
        type: "string",
        description: "Request body (for POST/PUT/PATCH)",
      },
      bodyType: {
        type: "string",
        default: "json",
        options: ["json", "text", "form"],
      },
      responseVariable: {
        type: "string",
        required: true,
        description: "Variable to store the response",
      },
    },
  },
  llm_instruction: {
    name: "LLM Instruction",
    description: "Process data using AI/LLM with custom instructions",
    requiredInputs: ["instruction"],
    config: {
      instruction: {
        type: "string",
        required: true,
        description: "Instructions for the LLM to follow",
      },
      resultVariable: {
        type: "string",
        required: true,
        description: "Variable to store the result",
      },
    },
  },
  web_scraping: {
    name: "Web Scraping",
    description: "Scrape content from a webpage",
    requiredInputs: ["url"],
    config: {
      url: {
        type: "string",
        required: true,
        description: "URL of the page to scrape",
      },
      captureAs: {
        type: "string",
        default: "text",
        options: ["text", "html", "querySelector"],
      },
      querySelector: {
        type: "string",
        description: "CSS selector (if captureAs is querySelector)",
      },
      enableSummarization: { type: "boolean", default: true },
      resultVariable: {
        type: "string",
        required: true,
        description: "Variable to store scraped content",
      },
    },
  },
  code: {
    name: "Code Block",
    description: "Execute custom JavaScript code",
    requiredInputs: ["code"],
    config: {
      code: {
        type: "string",
        required: true,
        description: "JavaScript code to execute",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the result",
      },
    },
  },
};

const FLOW_BUILDER_SYSTEM_PROMPT = `You are a Flow Builder AI assistant. Your job is to build automation flows with MINIMAL user questions.

## AVAILABLE BLOCK TYPES:
${JSON.stringify(FLOW_BLOCKS_SCHEMA, null, 2)}

## 🔑 SMART AUTOCOMPLETE SYSTEM:
Before asking the user for ANY endpoint, API key, or configuration:

### 1. CHECK USER'S VAULT FIRST
The following services are pre-configured in the user's vault (if available):
[VAULT_ENTRIES]

If the user mentions a service that's in their vault, USE IT DIRECTLY without asking.
Example: User says "send Slack notification" and Slack is in vault → Use the saved webhook, don't ask.

### 2. USE PUBLIC API REGISTRY FOR GENERIC NEEDS
For common requests like jokes, quotes, weather, facts, images - we have verified free APIs:
[PUBLIC_APIS]

If user asks for something generic, USE these pre-verified endpoints directly.
Example: User says "get a random joke" → Use JokeAPI (https://v2.jokeapi.dev/joke/Any), don't ask.

### 3. ONLY ASK WHEN BOTH FAIL
Only ask the user for input when:
- Service is NOT in their vault
- AND no suitable public API exists
- AND you cannot proceed without the info

## RESPONSE PRIORITY:
1. ✅ VAULT HAS IT → Use directly, inform user what you used
2. ✅ PUBLIC API EXISTS → Use it, inform user what you chose
3. ⚠️ NEITHER → Then ask, listing what's needed

## EXAMPLE RESPONSES:

**When vault has Slack:**
User: "Send Slack message when deal closes"
You: "Great! I found your Slack webhook in the vault. Building your flow..."
[Generate flow with saved webhook]

**When using public API:**
User: "I want a random joke generator"
You: "I'll use JokeAPI - it's free and reliable. Here's your flow:"
[Generate flow with https://v2.jokeapi.dev/joke/Any]

**Only when needed:**
User: "Post to my custom internal system"
You: "I need one thing:
☐ Your internal API endpoint URL

Once you provide this, I'll build your flow!"

## FLOW JSON FORMAT:
\`\`\`json
{
  "name": "Flow name",
  "description": "What this flow does",
  "blocks": [
    {
      "id": "unique-id-1",
      "type": "block_type",
      "config": { ... }
    }
  ],
  "variables": [
    { "name": "variableName", "value": "" }
  ]
}
\`\`\`

Remember: The goal is MINIMAL QUESTIONS. Use vault and public APIs aggressively.`;

// Build dynamic prompt with actual vault/api data
function buildFlowBuilderPrompt(vaultEntries = [], publicApis = []) {
  let prompt = FLOW_BUILDER_SYSTEM_PROMPT;

  // Inject vault entries
  if (vaultEntries.length > 0) {
    const vaultList = vaultEntries
      .map((e) => `- ${e.service}: "${e.name}" (${e.category})`)
      .join("\n");
    prompt = prompt.replace("[VAULT_ENTRIES]", vaultList);
  } else {
    prompt = prompt.replace("[VAULT_ENTRIES]", "(No saved integrations yet)");
  }

  // Inject public APIs
  if (publicApis.length > 0) {
    const apiList = publicApis
      .map((a) => `- ${a.category}: ${a.name} → ${a.endpoint} (${a.authType})`)
      .join("\n");
    prompt = prompt.replace("[PUBLIC_APIS]", apiList);
  } else {
    prompt = prompt.replace("[PUBLIC_APIS]", "(No cached public APIs)");
  }

  return prompt;
}

function flowGenerationEndpoints(app) {
  if (!app) return;

  // Generate flow configuration via AI conversation
  app.post(
    "/agent-flows/generate",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { messages, model, attachments = [] } = request.body;

        if (!messages || !Array.isArray(messages)) {
          return response.status(400).json({
            success: false,
            error: "Messages array is required",
          });
        }

        // Get the LLM provider - use specified model or default
        let LLMConnector;
        if (model) {
          // Try to get provider for specific model
          try {
            LLMConnector = getLLMProvider({ model });
          } catch {
            // Fall back to default if model not found
            LLMConnector = getLLMProvider();
          }
        } else {
          LLMConnector = getLLMProvider();
        }

        if (!LLMConnector) {
          return response.status(500).json({
            success: false,
            error: "No LLM provider configured",
          });
        }

        // Build attachment context if any
        let attachmentContext = "";
        if (attachments && attachments.length > 0) {
          const attachmentDescriptions = attachments
            .map((att, idx) => {
              let desc = `[Attachment ${idx + 1}]: ${att.name} (${att.type}, ${att.size} bytes)`;
              if (att.type?.startsWith("image/") && att.content) {
                desc += " - Image attached (base64 encoded)";
              }
              return desc;
            })
            .join("\n");
          attachmentContext = `\n\n## User Attachments:\n${attachmentDescriptions}\n`;
        }

        // Fetch user's vault entries and public APIs for smart autocomplete
        const user = response.locals.user;
        const vaultEntries = await IntegrationVault.getAll(user?.id);
        const publicApis = await PublicApiRegistry.search(""); // Get all cached APIs

        // Build dynamic prompt with injected data
        const systemPrompt = buildFlowBuilderPrompt(vaultEntries, publicApis);

        // Prepare messages for the LLM
        const chatMessages = [
          { role: "system", content: systemPrompt + attachmentContext },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];

        // Get response from LLM
        const result = await LLMConnector.getChatCompletion(chatMessages, {
          temperature: 0.7,
        });

        if (!result || !result.textResponse) {
          return response.status(500).json({
            success: false,
            error: "Failed to get response from LLM",
          });
        }

        const responseText = result.textResponse;

        // Try to extract JSON flow from the response if present
        let generatedFlow = null;
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            generatedFlow = JSON.parse(jsonMatch[1]);
          } catch (e) {
            // JSON parsing failed, flow isn't complete yet
          }
        }

        return response.status(200).json({
          success: true,
          message: result.textResponse,
          flow: generatedFlow,
        });
      } catch (error) {
        console.error("Error generating flow:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get available block types schema
  app.get(
    "/agent-flows/schema",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (_request, response) => {
      try {
        return response.status(200).json({
          success: true,
          schema: FLOW_BLOCKS_SCHEMA,
        });
      } catch (error) {
        console.error("Error getting schema:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { flowGenerationEndpoints };
