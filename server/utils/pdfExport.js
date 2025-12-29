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

    console.log(`[PDF Export] Successfully generated PDF ${jobId}`);
    return pdfBuffer;
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
