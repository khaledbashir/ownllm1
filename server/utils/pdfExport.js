const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

/**
 * Generates a PDF from HTML content using Puppeteer (Chromium-based).
 *
 * This uses the same rendering engine as SiYuan/Chrome for high-fidelity PDF output.
 *
 * @param {string} htmlContent - The full HTML string to render
 * @param {object} options - PDF generation options
 * @param {string} options.format - Page format (default: 'A4')
 * @param {boolean} options.printBackground - Print backgrounds (default: true)
 * @param {object} options.margin - Page margins
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent, options = {}) {
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
    console.log(`[PDF Export] Starting Puppeteer job ${jobId}`);

    // GOD-TIER CSS for print perfection
    const printCSS = `
      <style>
        /* RESET & BASE STYLES */
        *, *::before, *::after {
          box-sizing: border-box !important;
          page-break-inside: avoid;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* TABLE MAGIC - The fix for all table issues */
        table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          page-break-inside: auto !important;
          margin: 0 !important;
          border-spacing: 0 !important;
        }
        
        thead {
          display: table-header-group !important;
          page-break-inside: avoid !important;
        }
        
        tfoot {
          display: table-footer-group !important;
          page-break-inside: avoid !important;
        }
        
        tbody {
          display: table-row-group !important;
        }
        
        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        
        td, th {
          page-break-inside: avoid !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          hyphens: auto !important;
          vertical-align: top !important;
          padding: 8px !important;
          border: 1px solid #ccc !important;
        }
        
        th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
          text-align: left !important;
        }
        
        /* TEXT & TYPOGRAPHY */
        p, span, div {
          page-break-inside: avoid !important;
          orphans: 3 !important;
          widows: 3 !important;
        }
        
        strong, b {
          font-weight: bold !important;
        }
        
        /* SECTION BREAKS */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          margin-top: 20px !important;
          margin-bottom: 10px !important;
        }
        
        /* LOGO & HEADER */
        img {
          max-width: 150px !important;
          height: auto !important;
          page-break-inside: avoid !important;
        }
        
        /* PREVENT OVERFLOW */
        .overflow-content {
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: normal !important;
        }
        
        /* MULTI-CELL FIX */
        td[colspan], td[rowspan] {
          page-break-inside: avoid !important;
        }
        
        /* PAGE MARGINS & SPACING */
        .page-break {
          page-break-before: always !important;
        }
        
        .no-break {
          page-break-inside: avoid !important;
        }
        
        /* REMOVE EXCESSIVE SPACING */
        br {
          page-break-after: avoid !important;
        }
      </style>
    `;

    // Inject print CSS into HTML
    const enhancedHtml = htmlContent.replace(
      /<head>/i,
      `<head>${printCSS}`
    ).replace(
      /<html>/i,
      `<html>`
    );

    // Write HTML to temp file
    await fs.promises.writeFile(inputPath, enhancedHtml, "utf8");

    // Launch headless Chrome
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

    // Set viewport for proper rendering (A4 width at 96 DPI = ~794px, use 1200 for better quality)
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Load HTML content
    await page.goto(`file://${inputPath}`, { 
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000 
    });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF with GOD-TIER settings
    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
    });

    console.log(`[PDF Export] Puppeteer returned type: ${typeof pdfBuffer}, constructor: ${pdfBuffer?.constructor?.name}, length: ${pdfBuffer?.length}`);
    console.log(`[PDF Export] Successfully generated PDF ${jobId}, size: ${pdfBuffer.length} bytes`);
    
    // Validate PDF buffer
    let validatedBuffer = pdfBuffer;
    
    if (!Buffer.isBuffer(pdfBuffer)) {
      console.warn("[PDF Export] PDF is not a Buffer, attempting to convert:", typeof pdfBuffer);
      if (pdfBuffer && pdfBuffer.length > 0) {
        validatedBuffer = Buffer.from(pdfBuffer);
      } else {
        throw new Error(`Generated PDF is not a Buffer (type: ${typeof pdfBuffer})`);
      }
    }
    
    if (validatedBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }
    
    const header = validatedBuffer.slice(0, 4).toString();
    if (!header.startsWith("%PDF")) {
      throw new Error(`Invalid PDF: header is "${header}" instead of "%PDF"`);
    }
    
    return validatedBuffer;
  } catch (error) {
    console.error("[PDF Export] Puppeteer Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    try {
      if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
    } catch (cleanupError) {
      console.warn("[PDF Export] Cleanup warning:", cleanupError);
    }
  }
}

module.exports = { generatePdf };
