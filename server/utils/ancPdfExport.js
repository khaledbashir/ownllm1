const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const DOMPurify = require("isomorphic-dompurify");

async function generateANCPdf(htmlContent, options = {}) {
  if (!htmlContent) throw new Error("HTML content is required");

  // Lazy load puppeteer (only when needed)
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (error) {
    throw new Error("Puppeteer is not installed. Run: npm install puppeteer");
  }

  const jobId = uuidv4();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${jobId}.html`);

  let browser = null;

  try {
    console.log(`[ANC PDF Export] Starting Puppeteer job ${jobId}`);

    // ANC Custom CSS - Blue Theme
    const printCSS = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        *, *::before, *::after {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Roboto', sans-serif;
          font-size: 11pt;
          color: #333;
          margin: 0;
          padding: 0;
        }

        @page {
          size: A4;
          margin: 2cm;
        }

        h1, h2, h3, h4, h5, h6 {
          color: #0056b3; /* ANC Blue */
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }

        h1 {
          font-size: 24pt;
          border-bottom: 3px solid #0056b3;
          padding-bottom: 10px;
        }

        h2 {
          font-size: 18pt;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        th, td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }

        th {
          background-color: #f2f8ff; /* Light Blue */
          color: #0056b3;
          font-weight: bold;
        }

        .legal-boilerplate {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 9pt;
          color: #666;
          text-align: justify;
        }

        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8pt;
          color: #999;
          padding: 10px;
        }
      </style>
    `;

    // Process HTML similar to original but focused on ANC needs
    let processedHtml = htmlContent;

    // Wrap tables
    processedHtml = processedHtml.replace(
      /<table([^>]*)>([\s\S]*?)<\/table>/gi,
      (match, attrs, content) => {
        if (content.includes('<thead>') && content.includes('<tbody>')) return match;
        const rows = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
        if (rows.length === 0) return match;
        const headerRow = rows[0];
        const bodyRows = rows.slice(1).join('');
        const fixedBodyRows = bodyRows.replace(/<th/gi, '<td').replace(/<\/th>/gi, '</td>');
        return `<table${attrs}><thead>${headerRow}</thead><tbody>${fixedBodyRows}</tbody></table>`;
      }
    );

    const enhancedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${printCSS}</style>
      </head>
      <body>
        ${processedHtml}
        
        <div class="legal-boilerplate">
          <strong>Terms and Conditions:</strong><br/>
          1. This estimate is valid for 30 days from the date of issue.<br/>
          2. ANC Sports is not responsible for structural modifications required unless explicitly stated.<br/>
          3. Final pricing is subject to site survey and confirmation of dimensions.<br/>
          4. Payment terms: 50% deposit, 50% upon completion.<br/>
        </div>
      </body>
      </html>
    `;

    const finalSanitizedHtml = DOMPurify.sanitize(enhancedHtml, {
      ADD_TAGS: ["style", "html", "head", "body", "meta", "div", "br", "strong"],
      ADD_ATTR: ["name", "content", "charset", "class"],
      WHOLE_DOCUMENT: true,
    });

    await fs.promises.writeFile(inputPath, finalSanitizedHtml, "utf8");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    // Use setContent with timeout
    await page.setContent(enhancedHtml, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "2cm",
        bottom: "2cm",
        left: "2cm",
        right: "2cm",
      },
    });

    return pdfBuffer;

  } catch (error) {
    console.error("[ANC PDF Export] Error:", error);
    throw error;
  } finally {
    if (browser) await browser.close();
    if (fs.existsSync(inputPath)) fs.promises.unlink(inputPath).catch(() => {});
  }
}

module.exports = { generateANCPdf };
