const { AgentFlow } = require("./agentFlows");
const { SystemSettings } = require("../models/systemSettings");
const { getLLMProvider } = require("./helpers");

/**
 * Import products from URL or web search query
 * @param {string} url - Direct URL to scrape (optional)
 * @param {string} query - Search query to find products (optional)
 * @returns {Promise<Array>} - Array of imported products
 */
async function importProductsFromUrl(url, query = null) {
  const AgentFlow = require("./agentFlows");
  const { SystemSettings } = require("../models/systemSettings");

  let targetUrl = url;
  
  // Step 1: Web Search if query provided (but no URL)
  if (query && !url) {
    console.log(`[ProductImport] Searching for products with query: "${query}"`);
    
    const settings = await SystemSettings.currentSettings();
    const searchResults = await AgentFlow.executeAgentStep({
      type: "WEB_BROWSING",
      agentFunction: "web-browsing",
      agentInputs: { 
        query,
        engine: "duckduckgo-engine"
      }
    });
    
    if (!searchResults || searchResults.length === 0) {
      throw new Error(`No search results found for query: "${query}"`);
    }
    
    targetUrl = searchResults[0].link;
    console.log(`[ProductImport] Found URL from search: ${targetUrl}`);
  }
  
  // Step 2: Scrape content using Agent's web-scraping skill
  console.log(`[ProductImport] Scraping content from: ${targetUrl}`);
  
  const scrapedContent = await AgentFlow.executeAgentStep({
    type: "WEB_SCRAPING",
    agentFunction: "web-scraping",
    agentInputs: { url: targetUrl }
  });
  
  if (!scrapedContent || scrapedContent.length === 0) {
    throw new Error(`No content found at ${targetUrl}`);
  }
  
  // Step 3: Extract products using Agent's product-extraction skill
  console.log(`[ProductImport] Extracting products from scraped content (${scrapedContent.length} chars)`);
  
  const settings = await SystemSettings.currentSettings();
  const provider = settings?.LLMProvider || "openai";
  const model = settings?.LLMModel || "gpt-3.5-turbo";
  
  const extractedData = await AgentFlow.executeAgentStep({
    type: "AGENT_FUNCTION_CALL",
    agentFunction: "product-extraction",
    agentInputs: {
      context: scrapedContent,
      objective: "Extract products and their prices from provided website content"
    }
  });
  
  try {
    const products = JSON.parse(extractedData);
    console.log(`[ProductImport] Successfully extracted ${products.length} products`);
    
    return products.map((p) => ({
      ...p,
      id: p.id || Math.random().toString(36).substring(7),
      isEstimated: p.isEstimated || false
    }));
  } catch (e) {
    console.error(`[ProductImport] Failed to parse extracted data:`, e.message);
    throw new Error("Failed to extract products from scraped content. " + e.message);
  }
}

module.exports = { importProductsFromUrl };
