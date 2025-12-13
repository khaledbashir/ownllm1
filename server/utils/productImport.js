const { CollectorApi } = require("./collectorApi");
const { PromptTemplate } = require("@langchain/core/prompts");
const Provider = require("./agents/aibitat/providers/ai-provider");
const { SystemSettings } = require("../models/systemSettings");

async function importProductsFromUrl(url) {
    // 1. Scrape Content
    const { success, content } = await new CollectorApi().getLinkContent(url);

    if (!success || !content || content.length === 0) {
        throw new Error(`Could not scrape content from ${url}`);
    }

    // 2. Prepare LLM
    // We need to get the default system LLM configuration since we are not in a workspace chat context fully
    // But we can fallback to defaults.
    // Actually, we should probably prefer the system default or just generic OpenAI if configured.
    // Let's rely on Provider default handling.

    const provider = process.env.LLM_PROVIDER || "openai";
    const model = process.env.LLM_MODEL || "gpt-3.5-turbo"; // Fallback

    const llm = Provider.LangChainChatModel(provider, {
        temperature: 0.7,
        model: model,
    });

    const truncatedContent = content.slice(0, 15000);

    const promptTemplate = new PromptTemplate({
        template: `
      You are an expert pricing analyst. 
      Analyze the following website content from {url}.
      
      GOAL: Extract a list of products/services and their prices.
      
      RULES:
      1. If explicit prices are found, use them (remove symbols like $).
      2. If NO prices are found, ESTIMATE a realistic market price based on the service description. 
      3. If you estimate a price, set a boolean flag "isEstimated": true.
      4. If you really cannot estimate, use 1.
      5. Return ONLY a valid JSON array. No markdown, no explanations.

      SCHEMA:
      [
        {{
          "id": "uuid",
          "name": "Product Name",
          "description": "Short description",
          "price": 1000, 
          "pricingType": "fixed" | "hourly",
          "category": "Service Category",
          "features": ["feature 1", "feature 2"],
          "isEstimated": boolean
        }}
      ]

      WEBSITE CONTENT:
      {content}

      JSON OUTPUT:
    `,
        inputVariables: ["url", "content"],
    });

    const formattedPrompt = await promptTemplate.format({
        url: url,
        content: truncatedContent
    });

    const response = await llm.invoke(formattedPrompt);

    let text = response.content || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        const products = JSON.parse(text);
        // Add UUIDs if missing
        return products.map(p => ({
            ...p,
            id: p.id || Math.random().toString(36).substring(7),
            isEstimated: p.isEstimated || false
        }));
    } catch (e) {
        throw new Error("Failed to parse AI response into JSON products.");
    }
}

module.exports = { importProductsFromUrl };
