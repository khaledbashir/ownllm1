const { getLLMProvider } = require("../utils/helpers");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
    flexUserRoleValid,
    ROLES,
} = require("../utils/middleware/multiUserProtected");

// Schema for all available block types
const FLOW_BLOCKS_SCHEMA = {
    api_call: {
        name: "API Call",
        description: "Make an HTTP request to an external API",
        requiredInputs: ["url"],
        config: {
            url: { type: "string", required: true, description: "The API endpoint URL" },
            method: { type: "string", default: "GET", options: ["GET", "POST", "PUT", "DELETE", "PATCH"] },
            headers: { type: "array", description: "Array of {key, value} pairs" },
            body: { type: "string", description: "Request body (for POST/PUT/PATCH)" },
            bodyType: { type: "string", default: "json", options: ["json", "text", "form"] },
            responseVariable: { type: "string", required: true, description: "Variable to store the response" },
        },
    },
    llm_instruction: {
        name: "LLM Instruction",
        description: "Process data using AI/LLM with custom instructions",
        requiredInputs: ["instruction"],
        config: {
            instruction: { type: "string", required: true, description: "Instructions for the LLM to follow" },
            resultVariable: { type: "string", required: true, description: "Variable to store the result" },
        },
    },
    web_scraping: {
        name: "Web Scraping",
        description: "Scrape content from a webpage",
        requiredInputs: ["url"],
        config: {
            url: { type: "string", required: true, description: "URL of the page to scrape" },
            captureAs: { type: "string", default: "text", options: ["text", "html", "querySelector"] },
            querySelector: { type: "string", description: "CSS selector (if captureAs is querySelector)" },
            enableSummarization: { type: "boolean", default: true },
            resultVariable: { type: "string", required: true, description: "Variable to store scraped content" },
        },
    },
    code: {
        name: "Code Block",
        description: "Execute custom JavaScript code",
        requiredInputs: ["code"],
        config: {
            code: { type: "string", required: true, description: "JavaScript code to execute" },
            resultVariable: { type: "string", description: "Variable to store the result" },
        },
    },
};

const FLOW_BUILDER_SYSTEM_PROMPT = `You are a Flow Builder AI assistant. Your job is to HELP users build automation flows by understanding their needs and gathering requirements BEFORE generating.

## AVAILABLE BLOCK TYPES:
${JSON.stringify(FLOW_BLOCKS_SCHEMA, null, 2)}

## CRITICAL RULES:
1. NEVER generate a flow until you have ALL required information from the user
2. ALWAYS ask clarifying questions first
3. List what inputs you need from the user before proceeding
4. REFUSE to generate until user provides all required values (URLs, API keys, webhooks, etc.)
5. Only output the final flow JSON when the user provides everything

## YOUR CONVERSATION FLOW:
1. User describes what they want
2. You acknowledge and explain what you understood
3. You list the REQUIRED inputs needed (actual URLs, API keys, specific values)
4. You wait for user to provide these with ☐ checkboxes
5. Once complete, generate the flow JSON in a code block

## RESPONSE FORMAT FOR GATHERING REQUIREMENTS:
"Got it! To build this flow, I need the following from you:

☐ [First required input - describe what you need]
☐ [Second required input - describe what you need]
☐ [etc...]

Please provide these values and I'll create your flow!"

## RESPONSE FORMAT FOR FINAL FLOW (only when all info provided):
\`\`\`json
{
  "name": "Flow name here",
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

## EXAMPLE CONVERSATION:
User: "I want to monitor my website and get a Slack notification if it goes down"

You: "Got it! To build this website monitoring flow, I need:

☐ Your website URL to monitor (e.g., https://example.com)
☐ Your Slack webhook URL (looks like https://hooks.slack.com/services/...)
☐ How often to check (every 5 min? hourly?)

Please provide these and I'll build your flow!"

Remember: NEVER guess or make up URLs, API keys, or specific values. Always ask the user for real values.`;

function flowGenerationEndpoints(app) {
    if (!app) return;

    // Generate flow configuration via AI conversation
    app.post(
        "/agent-flows/generate",
        [validatedRequest, flexUserRoleValid([ROLES.admin])],
        async (request, response) => {
            try {
                const { messages } = request.body;

                if (!messages || !Array.isArray(messages)) {
                    return response.status(400).json({
                        success: false,
                        error: "Messages array is required",
                    });
                }

                // Get the workspace's LLM provider
                const LLMConnector = getLLMProvider();
                if (!LLMConnector) {
                    return response.status(500).json({
                        success: false,
                        error: "No LLM provider configured",
                    });
                }

                // Prepare messages for the LLM
                const chatMessages = [
                    { role: "system", content: FLOW_BUILDER_SYSTEM_PROMPT },
                    ...messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ];

                // Get response from LLM
                const result = await LLMConnector.sendChat(chatMessages, {
                    temperature: 0.7,
                });

                if (!result || typeof result !== "string") {
                    return response.status(500).json({
                        success: false,
                        error: "Failed to get response from LLM",
                    });
                }

                // Try to extract JSON flow from the response if present
                let generatedFlow = null;
                const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    try {
                        generatedFlow = JSON.parse(jsonMatch[1]);
                    } catch (e) {
                        // JSON parsing failed, flow isn't complete yet
                    }
                }

                return response.status(200).json({
                    success: true,
                    message: result,
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
