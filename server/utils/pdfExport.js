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

    // Write HTML to temp file
    await fs.promises.writeFile(inputPath, htmlContent, "utf8");

    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Prevents memory issues on VPS
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for responsive rendering
    await page.setViewport({ width: 1200, height: 1600 });

    // Load HTML content
    await page.goto(`file://${inputPath}`, { waitUntil: "networkidle0" });

    // Generate PDF (The "SiYuan Magic")
    const pdfBuffer = await page.pdf({
      format: options.format || "A4",
      printBackground: options.printBackground !== false,
      margin: options.margin || {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    console.log(`[PDF Export] Puppeteer returned type: ${typeof pdfBuffer}, constructor: ${pdfBuffer?.constructor?.name}, length: ${pdfBuffer?.length}`);
    console.log(`[PDF Export] Successfully generated PDF ${jobId}, size: ${pdfBuffer.length} bytes`);
    
    // Validate PDF buffer
    let validatedBuffer = pdfBuffer;
    
    // Handle cases where Puppeteer might return a non-Buffer object
    if (!Buffer.isBuffer(pdfBuffer)) {
      console.warn("[PDF Export] PDF is not a Buffer, attempting to convert:", typeof pdfBuffer);
      if (pdfBuffer && pdfBuffer.length > 0) {
        // Try to convert to Buffer
        validatedBuffer = Buffer.from(pdfBuffer);
      } else {
        throw new Error(`Generated PDF is not a Buffer (type: ${typeof pdfBuffer})`);
      }
    }
    
    if (validatedBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }
    
    // Check PDF header (should start with %PDF)
    const header = validatedBuffer.slice(0, 4).toString();
    console.log(`[PDF Export] Buffer type: ${validatedBuffer.constructor.name}, Length: ${validatedBuffer.length}, Header: "${header}"`);
    
    // Log first 100 bytes in hex for debugging
    const hexPreview = validatedBuffer.slice(0, 100).toString('hex');
    console.log(`[PDF Export] First 100 bytes (hex): ${hexPreview}`);
    
    if (!header.startsWith("%PDF")) {
      throw new Error(`Invalid PDF: header is "${header}" instead of "%PDF", buffer type: ${validatedBuffer.constructor.name}`);
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
