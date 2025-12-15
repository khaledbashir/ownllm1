const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require("uuid");

// Load env vars from .env.development
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Force development mode
process.env.NODE_ENV = 'development';

if (!process.env.OPEN_AI_KEY) {
    console.warn("WARNING: OPEN_AI_KEY not found in env. Agents might fail during execution if they hit the LLM.");
}

const { FlowExecutor } = require('./utils/agentFlows/executor');
const { AgentHandler } = require('./utils/agents');

const prisma = new PrismaClient();
const TEST_SLUG = `test-ws-${uuidv4()}`;

async function setup() {
    console.log("Setting up test data...");
    const user = await prisma.users.create({
        data: {
            username: `testuser-${uuidv4()}`,
            password: "password123", // Dummy
            role: "default",
        }
    });

    const workspace = await prisma.workspaces.create({
        data: {
            name: "Test Workspace",
            slug: TEST_SLUG,
            chatProvider: "openai",
            chatModel: "gpt-3.5-turbo",
            agentProvider: "openai",
            agentModel: "gpt-3.5-turbo",
            openAiTemp: 0.7,
        }
    });

    return { user, workspace };
}

async function cleanup(userId, workspaceId) {
    console.log("Cleaning up...");
    if (workspaceId) await prisma.workspaces.delete({ where: { id: workspaceId } });
    if (userId) await prisma.users.delete({ where: { id: userId } });
    await prisma.$disconnect();
}

async function test() {
    let testUser, testWorkspace;
    try {
        const { user, workspace } = await setup();
        testUser = user;
        testWorkspace = workspace;
        console.log(`Created User ${user.id} and Workspace ${workspace.id}`);

        // Mock aibitat with VALID context
        const mockAibitat = {
            invocation: {
                workspace: { id: workspace.id, slug: workspace.slug, chatProvider: 'openai', chatModel: 'gpt-3.5-turbo' },
                user_id: user.id,
                prompt: "Hello RAG Test"
            },
            introspect: (msg) => console.log('INTROSPECT:', msg),
            handlerProps: {
                log: (msg) => console.log('LOG:', msg),
            },
        };

        const flow = {
            config: {
                steps: [
                    {
                        type: 'executeAgent',
                        config: {
                            prompt: 'Hello, are you online?',
                            resultVariable: 'agent_response',
                            // workspaceId: workspace.id // Optional, defaults to context
                        }
                    }
                ]
            }
        };

        console.log('Starting Flow Execution...');
        const executor = new FlowExecutor();
        const result = await executor.executeFlow(flow, {}, mockAibitat);

        console.log('Flow Result:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error("Test Failed with Error:", err);
        // Don't exit yet, let cleanup run
    } finally {
        await cleanup(testUser?.id, testWorkspace?.id);
    }
}

test();
