#!/usr/bin/env node
const { Server } = require("../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/index.js");
const { StdioServerTransport } = require("../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require("../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/types.js");

// Define the server
const server = new Server(
    {
        name: "dummy-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "dummy_orchestrator",
                description: "A dummy tool that simulates orchestration tasks",
                inputSchema: {
                    type: "object",
                    properties: {
                        task: {
                            type: "string",
                            description: "The task to orchestrate",
                        },
                    },
                    required: ["task"],
                },
            },
        ],
    };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "dummy_orchestrator") {
        const task = request.params.arguments?.task || "Unknown task";
        return {
            content: [
                {
                    type: "text",
                    text: `[Dummy MCP] Orchestrating task: "${task}"... DONE! ✅`,
                },
            ],
        };
    }
    throw new Error("Tool not found");
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
