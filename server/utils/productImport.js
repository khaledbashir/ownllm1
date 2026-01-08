const {
  EphemeralAgentHandler,
  EphemeralEventListener,
} = require("./agents/ephemeral");
const { Workspace } = require("../models/workspace");
const { v4: uuidv4 } = require("uuid");

/**
 * Import products from URL or web search query using Agent system
 * @param {string} url - Direct URL to scrape (optional)
 * @param {string} query - Search query to find products (optional)
 * @param {import("@prisma/client").workspaces} workspace - Workspace object for context
 * @returns {Promise<Array>} - Array of imported products
 */
async function importProductsFromUrl(url, query = null, workspace = null) {
  console.log(`[ProductImport] Starting product import...`);

  // Build the agent prompt based on input
  let agentPrompt = "";
  if (url) {
    agentPrompt = `Scrape the website at ${url} and extract all products/services with their prices. Return a JSON array with the following structure:
[
  {
    "name": "Product/Service Name",
    "description": "Short description",
    "price": 1000,
    "pricingType": "fixed" | "hourly",
    "category": "Category"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no explanations, no backticks.`;
  } else if (query) {
    agentPrompt = `Search for "${query}" to find relevant products/services, then scrape the results and extract pricing information. Return a JSON array with the following structure:
[
  {
    "name": "Product/Service Name",
    "description": "Short description",
    "price": 1000,
    "pricingType": "fixed" | "hourly",
    "category": "Category"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no explanations, no backticks.`;
  } else {
    throw new Error("Either URL or query must be provided");
  }

  // Get workspace if not provided
  if (!workspace) {
    workspace = await Workspace.get({ slug: "default" });
  }

  console.log(`[ProductImport] Agent prompt: ${agentPrompt}`);

  // Initialize EphemeralAgentHandler (same as chat interface)
  const agentHandler = new EphemeralAgentHandler({
    uuid: uuidv4(),
    workspace,
    prompt: agentPrompt,
    userId: null,
    threadId: null,
    sessionId: uuidv4(),
  });

  // Establish event listener that emulates websocket calls
  const { EphemeralEventListener } = require("./agents");
  const eventListener = new EphemeralEventListener();

  // Initialize agent
  await agentHandler.init();
  await agentHandler.createAIbitat({ handler: eventListener });
  agentHandler.startAgentCluster();

  // Wait for agent to complete (same pattern as apiChatHandler)
  const { thoughts, textResponse } = await eventListener.waitForClose();

  console.log(`[ProductImport] Agent completed. Response: ${textResponse.substring(0, 500)}...`);

  // Parse JSON response from agent
  try {
    // Clean the response (remove markdown, backticks, etc.)
    let cleanedJson = textResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\n/g, " ")
      .trim();

    // Try to find JSON array in response
    const jsonMatch = cleanedJson.match(/\[[^\]]+\]/);
    if (jsonMatch) {
      cleanedJson = jsonMatch[0];
    }

    const products = JSON.parse(cleanedJson);

    if (!Array.isArray(products)) {
      throw new Error("Agent did not return an array of products");
    }

    console.log(`[ProductImport] Successfully extracted ${products.length} products`);

    return products.map((p) => ({
      ...p,
      id: p.id || Math.random().toString(36).substring(7),
      isEstimated: p.isEstimated || false,
    }));
  } catch (e) {
    console.error(`[ProductImport] Failed to parse agent response:`, e.message);
    console.error(`[ProductImport] Raw response:`, textResponse);
    throw new Error("Failed to extract products. The agent may not have been able to scrape the URL or format the response correctly.");
  }
}

module.exports = { importProductsFromUrl };
