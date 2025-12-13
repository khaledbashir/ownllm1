const { CollectorApi } = require("../../../collectorApi");
const { loadSummarizationChain } = require("langchain/chains");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const Provider = require("../providers/ai-provider");

const productExtraction = {
    name: "product-extraction",
    startupConfig: {
        params: {},
    },
    plugin: function () {
        return {
            name: this.name,
            setup(aibitat) {
                aibitat.function({
                    super: aibitat,
                    name: this.name,
                    controller: new AbortController(),
                    description:
                        "Scrapes a website URL to extract specific products and their prices. If prices are missing, it estimates them based on market rates. Returns a JSON list of products.",
                    examples: [
                        {
                            prompt: "Find products and prices from https://example.com",
                            call: JSON.stringify({ url: "https://example.com" }),
                        },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            url: {
                                type: "string",
                                format: "uri",
                                description:
                                    "The URL of the product or services page to scrape.",
                            },
                        },
                        additionalProperties: false,
                    },
                    handler: async function ({ url }) {
                        try {
                            if (url) return await this.extractProducts(url);
                            return "No URL provided.";
                        } catch (error) {
                            this.super.handlerProps.log(
                                `Product Extraction Error: ${error.message}`
                            );
                            return `Error extracting products: ${error.message}`;
                        }
                    },

                    extractProducts: async function (url) {
                        this.super.introspect(
                            `${this.caller}: Scraping ${url} for products...`
                        );

                        // 1. Scrape Content
                        const { success, content } = await new CollectorApi().getLinkContent(url);

                        if (!success || !content || content.length === 0) {
                            throw new Error(`Could not scrape content from ${url}`);
                        }

                        this.super.introspect(
                            `${this.caller}: Content scraped. Analyzing with AI for products & pricing...` // Introspection for UI
                        );

                        // 2. Call LLM to Extract/Hallucinate
                        return await this.analyzeContent(content, url);
                    },

                    analyzeContent: async function (content, url) {
                        const llm = Provider.LangChainChatModel(this.super.provider, {
                            temperature: 0.7, // Slight creativity for estimation if needed
                            model: this.super.model,
                        });

                        // Truncate content if too huge (naive approach, but safe)
                        // Ideally we use token splitting, but for product pages, headers usually have info.
                        // Let's us the summarize utils splitting logic if we want to be robust, 
                        // but here we might just take the first X chars to save time/tokens for now.
                        const truncatedContent = content.slice(0, 15000);

                        const promptTemplate = new PromptTemplate({
                            template: `
                  You are an expert pricing analyst. 
                  Analyze the following website content from {url}.
                  
                  GOAL: Extract a list of products/services and their prices.
                  
                  RULES:
                  1. If explicit prices are found, use them (remove symbols like $).
                  2. If NO prices are found, ESTIMATE a realistic market price based on the service description.
                  3. If it is a software/SAAS, estimate monthly cost.
                  4. If it is agency/service, estimate a fixed project price or hourly rate.
                  5. Return ONLY a valid JSON array. No markdown, no explanations.

                  SCHEMA:
                  [
                    {{
                      "name": "Product Name",
                      "description": "Short description",
                      "price": 1000, 
                      "pricingType": "fixed" | "hourly",
                      "category": "Service Category"
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

                        // Direct call (skipping chain overhead for single prompt)
                        const response = await llm.invoke(formattedPrompt);

                        // Clean response (sometimes they add backticks)
                        let text = response.content || "";
                        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

                        return text;
                    }
                });
            },
        };
    },
};

module.exports = {
    productExtraction,
};
