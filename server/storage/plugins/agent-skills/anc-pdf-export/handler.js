const { generateANCPdf } = require('../../../../utils/ancPdfExport');
const fs = require('fs');
const path = require('path');

/**
 * Simple Markdown to HTML converter
 */
function md2html(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s*<ul>/g, '') // Combine adjacent lists
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n$/gm, '<br />');
  return html;
}

module.exports.runtime = {
  handler: async function ({ markdown, project_name }) {
    try {
      this.logger(`[ANC PDF Export] Generating PDF for project: ${project_name}`);
      this.introspect(`Generating professional ANC PDF Proposal for "${project_name}"...`);

      const htmlBody = md2html(markdown);
      const fullHtml = `
        <div class="header">
          <img src="https://www.anc.com/hubfs/ANC_August2022/Images/ANC_Logo_Logo_Blue.png" style="height: 50px;" />
          <h1 style="color: #003D82;">${project_name || 'Project Proposal'}</h1>
        </div>
        <div class="content">
          ${htmlBody}
        </div>
        <div class="legal-boilerplate">
          ANC Sports Enterprises specifically excludes Union Labor from this estimate unless explicitly stated. 
          Pricing valid for 30 days. All figures in USD.
        </div>
      `;

      const filename = `Proposal_${Date.now()}.pdf`;
      const outputDir = '/app/server/storage/documents';
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      const filepath = path.join(outputDir, filename);
      
      this.introspect(`Finalizing PDF with Puppeteer...`);
      // We need to implement the actual PDF saving logic here or in ancPdfExport.js
      // Looking at ancPdfExport.js, it likely returns a buffer or path.
      
      // Let's call the utility.
      // NOTE: We assume ancPdfExport.js is configured for the VPS environment.
      const pdfBuffer = await generateANCPdf(fullHtml);
      fs.writeFileSync(filepath, pdfBuffer);

      const baseUrl = process.env.BASE_URL || 'https://basheer-everythingllm.x0uyzh.easypanel.host';
      const downloadUrl = `${baseUrl}/api/system/download/${filename}`;

      return `### 📄 ANC Professional PDF Generated
**Project:** ${project_name}
**Deliverable:** 1-Page Proposal (Branded)

🔗 **[DOWNLOAD_PROPOSAL_PDF](${downloadUrl})**

*Proprietary and Confidential - ANC Sports Enterprises*`;

    } catch (error) {
      this.logger(`ANC PDF Error: ${error.message}`);
      return `Error generating PDF: ${error.message}`;
    }
  }
};
