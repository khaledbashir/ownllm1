const path = require('path');

// Require paths relative to: server/storage/plugins/agent-skills/anc-pricing/handler.js
// Target: server/utils/AncPricingEngine.js and server/utils/AncDocumentService.js
const AncPricingEngine = require('../../../../utils/AncPricingEngine');
const AncDocumentService = require('../../../../utils/AncDocumentService');

module.exports.runtime = {
  handler: async function ({ width, height, environment }) {
    try {
      if (!width || !height) {
        return "Error: Missing width or height parameters. Please provide dimensions in feet.";
      }

      this.logger(`[ANC Custom Skill] Calculating: ${width}x${height} ${environment}`);
      this.introspect(`Calculating hardware and construction costs for a ${width}x${height} ${environment || 'indoor'} display...`);

      // 1. Run Math (Ensure numbers)
      const quote = AncPricingEngine.calculate(Number(width), Number(height), environment || 'indoor');

      // 2. Generate File
      this.introspect(`Generating detailed internal audit Excel file...`);
      const filename = await AncDocumentService.generateAuditFile(quote, "agent-generated");

      // 3. Construct Download Link
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const downloadUrl = `${baseUrl}/api/system/download/${filename}`;

      // 4. Return String (Required by documentation)
      return JSON.stringify({
        status: "success",
        pricing: {
          configuration: quote.meta.type,
          total_price: quote.financials.sellPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        },
        audit_file: downloadUrl,
        message: `Quote generated successfully. Total Project Sell Price: $${quote.financials.sellPrice.toFixed(2)}. Internal audit file available for download: ${downloadUrl}`
      });

    } catch (error) {
      this.logger(`ANC Skill Error: ${error.message}`);
      return `Error in calculation: ${error.message}`;
    }
  }
};
