const { chromium } = require('playwright-core');

/**
 * Generates a PDF from HTML content using a remote browser (browserless).
 * 
 * SETUP REQUIRED:
 * 1. Add a browserless service on Easypanel (image: browserless/chrome)
 * 2. Set BROWSER_WS_URL env var, e.g.: ws://browserless:3000?token=your-token
 * 
 * @param {string} htmlContent - The full HTML string to render
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent) {
    if (!htmlContent) throw new Error("HTML content is required");

    // Get browser WebSocket URL from environment
    const baseUrl = process.env.PUPPETEER_WSS_URL || process.env.BROWSER_WS_URL;

    if (!baseUrl) {
        throw new Error(
            "PDF export requires BROWSER_WS_URL environment variable. " +
            "Please add a browserless service on Easypanel and set BROWSER_WS_URL=ws://browserless:3000?token=your-token"
        );
    }

    // Build the WebSocket endpoint
    let browserWSEndpoint;
    if (baseUrl.includes('/playwright')) {
        browserWSEndpoint = baseUrl;
    } else {
        const urlObj = new URL(baseUrl);
        const queryString = urlObj.search;
        const baseWithoutQuery = `${urlObj.protocol}//${urlObj.host}`;
        browserWSEndpoint = `${baseWithoutQuery}/playwright/chromium${queryString}`;
    }

    let browser;
    try {
        console.log('[PDF Export] Connecting to:', browserWSEndpoint);
        browser = await chromium.connect(browserWSEndpoint, { timeout: 15000 });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle', timeout: 30000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await page.close();
        await context.close();
        await browser.close();

        return pdfBuffer;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }

        // Provide helpful error messages
        if (error.message.includes('ECONNREFUSED') || error.message.includes('WebSocket')) {
            throw new Error(
                `Cannot connect to browser service at ${browserWSEndpoint}. ` +
                `Ensure browserless service is running and BROWSER_WS_URL is correct.`
            );
        }

        throw new Error(`PDF generation failed: ${error.message}`);
    }
}

module.exports = { generatePdf };
