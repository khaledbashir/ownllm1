const { SystemSettings } = require("../models/systemSettings");
const { CollectorApi } = require("../collectorApi");
const Provider = require("./agents/aibitat/providers/ai-provider");

// Import Agent plugins
const { webBrowsing } = require("./agents/aibitat/plugins/web-browsing");
const { webScraping } = require("./agents/aibitat/plugins/web-scraping");
const { productExtraction } = require("./agents/aibitat/plugins/product-extraction");

/**
 * Mock aibitat object for plugin execution
 */
function createMockAibitat() {
  return {
    handlerProps: {
      log: (msg) => console.log(`[Agent] ${msg}`)
    },
    introspect: (msg) => console.log(`[Introspect] ${msg}`),
    caller: "ProductImport",
    provider: null, // Will be set later
    model: null, // Will be set later
    function: function(funcConfig) {
      // This stores the function config on the aibitat instance
      this.currentFunction = funcConfig;
      return funcConfig;
    }
  };
}

/**
 * Import products from URL or web search query
 * @param {string} url - Direct URL to scrape (optional)
 * @param {string} query - Search query to find products (optional)
 * @returns {Promise<Array>} - Array of imported products
 */
async function importProductsFromUrl(url, query = null) {
  let targetUrl = url;
  
  // Load system settings for LLM configuration
  const settings = await SystemSettings.currentSettings();
  const mockAibitat = createMockAibitat();
  mockAibitat.provider = settings.LLMProvider;
  mockAibitat.model = settings.LLMModel;

  // Step 1: Web Search if query provided (but no URL)
  if (query && !url) {
    console.log(`[ProductImport] Searching for products with query: "${query}"`);
    
    // Setup web-browsing plugin
    const pluginConfig = webBrowsing.plugin();
    const browseSetup = pluginConfig.setup(mockAibitat);
    
    // Get the search function from the setup
    const searchFunc = mockAibitat.currentFunction;
    
    // Execute the handler with the query
    const searchResults = await searchFunc.handler({ query });
    
    if (!searchResults || typeof searchResults !== 'string') {
      throw new Error(`Invalid search results for query: "${query}"`);
    }
    
    // Parse search results
    let parsedResults;
    try {
      parsedResults = JSON.parse(searchResults);
    } catch (e) {
      throw new Error(`Failed to parse search results: ${searchResults}`);
    }
    
    if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
      throw new Error(`No search results found for query: "${query}"`);
    }
    
    targetUrl = parsedResults[0].link;
    console.log(`[ProductImport] Found URL from search: ${targetUrl}`);
  }
  
  if (!targetUrl) {
    throw new Error("Either URL or query must be provided");
  }

  // Step 2: Scrape content using web-scraping plugin
  console.log(`[ProductImport] Scraping content from: ${targetUrl}`);
  
  const scrapePluginConfig = webScraping.plugin();
  scrapePluginConfig.setup(mockAibitat);
  const scrapeFunc = mockAibitat.currentFunction;
  
  const scrapedContent = await scrapeFunc.handler({ url: targetUrl });
  
  if (!scrapedContent || typeof scrapedContent !== 'string') {
    throw new Error(`Failed to scrape content from ${targetUrl}`);
  }
  
  console.log(`[ProductImport] Content scraped: ${scrapedContent.length} chars`);

  // Step 3: Extract products using product-extraction plugin
  console.log(`[ProductImport] Extracting products from scraped content`);
  
  const extractPluginConfig = productExtraction.plugin();
  extractPluginConfig.setup(mockAibitat);
  const extractFunc = mockAibitat.currentFunction;
  
  const extractedData = await extractFunc.handler({ url: targetUrl });
  
  if (!extractedData || typeof extractedData !== 'string') {
    throw new Error("Failed to extract products from content");
  }
  
  try {
    // Clean and parse JSON response
    let cleanedJson = extractedData
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    
    const products = JSON.parse(cleanedJson);
    
    if (!Array.isArray(products)) {
      throw new Error("Product extraction did not return an array");
    }
    
    console.log(`[ProductImport] Successfully extracted ${products.length} products`);
    
    return products.map((p) => ({
      ...p,
      id: p.id || Math.random().toString(36).substring(7),
      isEstimated: p.isEstimated || false
    }));
  } catch (e) {
    console.error(`[ProductImport] Failed to parse extracted data:`, e.message);
    console.error(`[ProductImport] Raw data:`, extractedData.substring(0, 500));
    throw new Error("Failed to extract products from scraped content. " + e.message);
  }
}

module.exports = { importProductsFromUrl };
