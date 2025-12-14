const { chromium } = require('playwright-core');

/**
 * Generates a PDF from HTML content using a remote browser.
 * @param {string} htmlContent - The full HTML string to render
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent) {
    // Get base URL from env
    const baseUrl = process.env.PUPPETEER_WSS_URL || process.env.BROWSER_WS_URL || 'ws://browserless:3000';

    let browserWSEndpoint;
    if (baseUrl.includes('/playwright')) {
        // Already has playwright path, use as-is
        browserWSEndpoint = baseUrl;
    } else {
        // Parse URL to preserve query params (like token)
        const urlObj = new URL(baseUrl);
        const queryString = urlObj.search; // e.g. ?token=xxx
        const baseWithoutQuery = `${urlObj.protocol}//${urlObj.host}`;
        browserWSEndpoint = `${baseWithoutQuery}/playwright/chromium${queryString}`;
    }

    if (!htmlContent) throw new Error("HTML content is required");

    let browser;
    try {
        // Connect to the remote browser
        console.log('[PDF Export] Connecting to:', browserWSEndpoint);
        browser = await chromium.connect(browserWSEndpoint);
        const context = await browser.newContext();
        const page = await context.newPage();

        // Set content and wait for network to be idle (ensures images/fonts load)
        await page.setContent(htmlContent, { waitUntil: 'networkidle' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        });

        await page.close();
        await context.close();
        await browser.close();

        return pdfBuffer;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        // Cleanup if possible
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        throw new Error(`Failed to generate PDF: ${error.message}. Ensure BROWSER_WS_URL is accessible.`);
    }
}

module.exports = { generatePdf };
