const { chromium } = require('playwright-core');

/**
 * Generates a PDF from HTML content.
 * First tries to use a remote browser (browserless), falls back to local puppeteer.
 * @param {string} htmlContent - The full HTML string to render
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent) {
    if (!htmlContent) throw new Error("HTML content is required");

    // Check if remote browser is configured
    const remoteUrl = process.env.PUPPETEER_WSS_URL || process.env.BROWSER_WS_URL;

    if (remoteUrl && remoteUrl !== 'ws://browserless:3000') {
        // Try remote browser first (for prod with browserless service)
        try {
            return await generatePdfRemote(htmlContent, remoteUrl);
        } catch (error) {
            console.warn('[PDF Export] Remote browser failed, trying local puppeteer:', error.message);
        }
    }

    // Fall back to local puppeteer
    return await generatePdfLocal(htmlContent);
}

/**
 * Generate PDF using remote browser (Playwright + Browserless)
 */
async function generatePdfRemote(htmlContent, baseUrl) {
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
        console.log('[PDF Export] Connecting to remote browser:', browserWSEndpoint);
        browser = await chromium.connect(browserWSEndpoint, { timeout: 10000 });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle' });

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
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        throw error;
    }
}

/**
 * Generate PDF using local puppeteer with bundled chromium
 */
async function generatePdfLocal(htmlContent) {
    let puppeteer;
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        throw new Error('PDF export requires either BROWSER_WS_URL env var or puppeteer package installed');
    }

    let browser;
    try {
        console.log('[PDF Export] Using local puppeteer');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
            ]
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await page.close();
        await browser.close();

        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error('Local PDF Generation Error:', error);
        if (browser) {
            try { await browser.close(); } catch (e) { }
        }
        throw new Error(`Failed to generate PDF: ${error.message}`);
    }
}

module.exports = { generatePdf };
