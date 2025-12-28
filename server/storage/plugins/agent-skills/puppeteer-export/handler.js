const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function handler(input) {
    const { html } = input || {};

    // Default test HTML if none provided
    const content = html || `
    <html>
      <head><title>Test PDF</title></head>
      <body>
        <h1>Hello World</h1>
        <table>
          <tr class="rate-card-header"><th>Header 1</th><th>Header 2</th></tr>
          <tr><td>Row 1 Col 1</td><td>Row 1 Col 2</td></tr>
        </table>
      </body>
    </html>
  `;

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setContent(content, { waitUntil: 'networkidle0' });

        // Inject "Sexy CSS"
        await page.addStyleTag({
            content: `
       body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
       table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
       th { background-color: #f3f4f6; color: #111827; font-weight: 600; padding: 12px; text-align: left; }
       td { border-bottom: 1px solid #e5e7eb; padding: 12px; color: #374151; }
       tr:nth-child(even) { background-color: #f9fafb; }
       .rate-card-header { background: #111827; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      `
        });

        // Ensure outputs directory exists
        // The skill is in /app/server/storage/plugins/agent-skills/puppeteer-export
        // outputs is in /app/server/storage/outputs
        // We can resolve it relative to __dirname or use absolute path if we know it.
        // Given the task, we know the structure.
        const storageDir = path.resolve(__dirname, '../../../../storage'); // plugins/agent-skills/puppeteer-export -> ../../../ -> storage? No.
        // __dirname = .../plugins/agent-skills/puppeteer-export
        // ../ -> agent-skills
        // ../../ -> plugins
        // ../../../ -> storage

        const outputDir = path.join(storageDir, 'outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filename = `export-${crypto.randomUUID()}.pdf`;
        const filepath = path.join(outputDir, filename);

        await page.pdf({
            path: filepath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px' }
        });

        return {
            success: true,
            filepath: filepath,
            filename: filename,
            downloadUrl: `/api/system/export-download?filename=${filename}` // Assuming a generic download endpoint or similar mechanism exists, or just returning the path for the caller to handle.
        };

    } catch (error) {
        console.error('Puppeteer Export Error:', error);
        return { success: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { handler };
