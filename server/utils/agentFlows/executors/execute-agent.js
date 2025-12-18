// NOTE: AgentHandler is lazy-loaded inside executeAgent() to avoid circular dependency:
// agentFlows/index.js → executor.js → execute-agent.js → agents/index.js → defaults.js → agentFlows/index.js
const { HeadlessSocket } = require("../../agents/headless");
const { v4: uuidv4 } = require("uuid");
const { WorkspaceAgentInvocation } = require("../../../models/workspaceAgentInvocation");

/**
 * Execute an Agent Flow step in headless mode.
 * @param {Object} config - Flow step configuration
 * @param {Object} context - Execution context with introspect function and variables
 * @returns {Promise<string>} - The agent's final text response
 */
async function executeAgent(config, context) {
    const { prompt, workspaceId } = config; // workspaceId is optional override
    const { introspect, logger, aibitat } = context;

    logger(`\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing EXECUTE_AGENT block`);
    introspect(`Starting Headless Agent Execution...`);

    // Use the workspace from the parent context (the flow's workspace)
    // unless an explicit workspaceId is provided in the block.
    // Note: 'aibitat' here is the Flow's aibitat, which has the invocation context.
    const targetWorkspace = workspaceId
        ? { id: workspaceId } // Minimal workspace object if ID provided (AgentHandler fetches details if needed)
        : aibitat?.invocation?.workspace;

    if (!targetWorkspace) {
        throw new Error("No workspace context available for Agent execution.");
    }

    // Use the user from the current context
    const targetUser = aibitat?.invocation?.user_id
        ? { id: aibitat.invocation.user_id }
        : null;

    try {
        const uuid = uuidv4();
        introspect(`Initializing Agent for prompt: "${prompt.slice(0, 50)}..."`);

        // Create a NEW invocation record for this sub-call.
        // This ensures telemetry and history tracking for the nested call are correct.
        const { invocation } = await WorkspaceAgentInvocation.new({
            prompt,
            workspace: targetWorkspace,
            user: targetUser,
            thread: null, // New thread for this isolation? Or keep same? Let's use new to avoid mixing context.
        });

        // Create the Headless Socket Mock
        const headlessSocket = new HeadlessSocket();

        // Lazy-load AgentHandler to avoid circular dependency
        const { AgentHandler } = require("../../agents");

        // Instantiate AgentHandler
        // We create a new handler instance for this specific execution to avoid polluting
        // the parent Flow's handler instance.
        const agentHandler = new AgentHandler({ uuid: invocation.uuid });

        // Initialize the Agent System
        await agentHandler.init();
        await agentHandler.createAIbitat({ socket: headlessSocket });

        // Hook logging
        // Redirect internal agent logs to our Flow logger
        agentHandler.log = (text, ...args) => {
            logger(`[HeadlessAgent] ${text}`, ...args);
            // verbose logging could go to introspect if useful, but maybe too noisy
        };

        introspect(`Agent initialized. Running...`);

        // Start Execution
        agentHandler.startAgentCluster();

        // Wait for completion
        const result = await headlessSocket.waitForCompletion(120000); // 2 minute timeout

        introspect(`Agent execution completed.`);

        // Close the invocation (cleanup)
        await WorkspaceAgentInvocation.close(invocation.uuid);

        return result;

    } catch (error) {
        logger(`Headless Agent processing failed: ${error.message}`, error);
        throw new Error(`Headless Agent execution failed: ${error.message}`);
    }
}

module.exports = executeAgent;
