const AncPricingEngine = require("../../../AncPricingEngine");
const AncDocumentService = require("../../../AncDocumentService");

const ancPricing = {
  name: "anc-pricing",
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
          description:
            "Calculates ANC Sports LED display pricing using Master Excel formulas. " +
            "Use this tool whenever a user asks for a price quote, estimate, or proposal for a screen. " +
            "It generates a binding price and an audit Excel file.",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            required: ["width", "height"],
            properties: {
              width: {
                type: "number",
                description: "Width of the display in feet",
                minimum: 1,
              },
              height: {
                type: "number",
                description: "Height of the display in feet",
                minimum: 1,
              },
              environment: {
                type: "string",
                description: "Installation environment: 'indoor' or 'outdoor'. Defaults to indoor.",
                enum: ["indoor", "outdoor"],
              },
            },
            additionalProperties: false,
          },
          handler: async function ({ width, height, environment }) {
            try {
              console.log(`[ANC Agent] Calculating Quote: ${width}x${height} ${environment}`);
              
              // 1. Run Math
              const quote = AncPricingEngine.calculate(width, height, environment || 'indoor');

              // 2. Generate File
              const filename = await AncDocumentService.generateAuditFile(quote, "agent-generated");
              
              // 3. Construct Download Link
              const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
              const downloadUrl = `${baseUrl}/api/system/download/${filename}`;

              // 4. Return Data to LLM
              return JSON.stringify({
                status: "success",
                message: "Quote calculated successfully.",
                data: {
                  configuration: quote.meta.type,
                  dimensions: quote.meta.dimensions,
                  total_price: `$${quote.financials.sellPrice.toLocaleString('en-US', {maximumFractionDigits: 2})}`,
                  audit_file_url: downloadUrl,
                  note: "Present the Total Price and the Download Link to the user."
                }
              });

            } catch (error) {
              return JSON.stringify({ error: error.message });
            }
          },
        });
      },
    };
  },
};

module.exports = { ancPricing };
