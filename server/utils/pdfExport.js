const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const util = require("util");
const execPromise = util.promisify(exec);

/**
 * Generates a PDF from HTML content using WeasyPrint (via CLI).
 *
 * Requires WeasyPrint to be installed in the environment (e.g. Dockerfile).
 *
 * @param {string} htmlContent - The full HTML string to render
 * @param {object} options - Options (currently unused as styling is handled via CSS)
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent, options = {}) {
  if (!htmlContent) throw new Error("HTML content is required");

  const jobId = uuidv4();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${jobId}.html`);
  const outputPath = path.join(tempDir, `output_${jobId}.pdf`);

  try {
    console.log(`[PDF Export] Starting WeasyPrint job ${jobId}`);

    // Write HTML to temp file
    await fs.promises.writeFile(inputPath, htmlContent, "utf8");

    // Execute WeasyPrint
    // --presentational-hints enables support for HTML presentational attributes
    const command = `weasyprint "${inputPath}" "${outputPath}" --presentational-hints --encoding utf-8`;

    console.log(`[PDF Export] Executing: ${command}`);
    const { stdout, stderr } = await execPromise(command);

    if (stdout) console.log("[WeasyPrint stdout]:", stdout);
    if (stderr) console.error("[WeasyPrint stderr]:", stderr);

    // Read the generated PDF
    if (!fs.existsSync(outputPath)) {
      throw new Error("WeasyPrint failed to generate output file");
    }

    const pdfBuffer = await fs.promises.readFile(outputPath);
    return pdfBuffer;
  } catch (error) {
    console.error("[PDF Export] WeasyPrint Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
      if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
    } catch (cleanupError) {
      console.warn("[PDF Export] Cleanup warning:", cleanupError);
    }
  }
}

module.exports = { generatePdf };
