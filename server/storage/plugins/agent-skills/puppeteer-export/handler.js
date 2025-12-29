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

        // Inject "Premium CSS"
        await page.addStyleTag({
            content: `
       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
       
       body { 
         font-family: 'Inter', system-ui, -apple-system, sans-serif; 
         -webkit-print-color-adjust: exact; 
         color: #111827;
         line-height: 1.5;
         margin: 0;
         padding: 0;
       }

       /* Typography */
       h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #111827; }
       h2 { font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
       h3 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px; color: #374151; }
       p { margin-bottom: 12px; font-size: 14px; color: #374151; }
       
       /* Tables */
       table { 
         border-collapse: collapse; 
         width: 100%; 
         margin: 24px 0; 
         font-size: 14px; 
         background-color: #ffffff;
         border: 1px solid #e5e7eb;
         border-radius: 8px;
         overflow: hidden; /* For rounded corners on header */
         box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
       }
       
       th { 
         background-color: #f9fafb; 
         color: #111827; 
         font-weight: 600; 
         text-transform: uppercase;
         font-size: 12px;
         letter-spacing: 0.05em;
         padding: 12px 16px; 
         text-align: left; 
         border-bottom: 1px solid #e5e7eb;
       }
       
       td { 
         padding: 12px 16px; 
         color: #4b5563; 
         border-bottom: 1px solid #e5e7eb;
         vertical-align: top;
       }
       
       tr:last-child td {
         border-bottom: none;
       }
       
       tr:nth-child(even) { 
         background-color: #f9fafb; 
       }
       
       /* Code Blocks */
       pre {
         background-color: #f3f4f6;
         padding: 16px;
         border-radius: 8px;
         overflow-x: auto;
         font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
         font-size: 13px;
         border: 1px solid #e5e7eb;
         margin: 16px 0;
       }
       code {
         font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
         background-color: #f3f4f6;
         padding: 2px 4px;
         border-radius: 4px;
         font-size: 0.9em;
         color: #ef4444; /* Red hint for inline code */
       }
       pre code {
         padding: 0;
         background-color: transparent;
         color: inherit;
       }
       
       /* Links */
       a { color: #2563eb; text-decoration: none; }
       a:hover { text-decoration: underline; }

       /* Blockquotes */
       blockquote {
         border-left: 4px solid #3b82f6;
         padding-left: 16px;
         margin: 16px 0;
         color: #4b5563;
         font-style: italic;
         background-color: #eff6ff;
         padding: 12px 16px;
         border-radius: 0 4px 4px 0;
       }

       /* Lists */
       ul, ol { margin: 12px 0; padding-left: 24px; }
       li { margin-bottom: 6px; color: #374151; font-size: 14px; }
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
