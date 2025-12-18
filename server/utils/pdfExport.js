const { chromium } = require('playwright-core');

/**
 * Generates a PDF from HTML content using a local Playwright/Chromium instance.
 * 
 * Uses the local Puppeteer executable (if set) or the one installed by Playwright.
 * 
 * @param {string} htmlContent - The full HTML string to render
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent, options = {}) {
    if (!htmlContent) throw new Error("HTML content is required");

    let browser;
    try {
        // Use local chromium dispatch
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
        console.log('[PDF Export] Launching local browser. Executable:', executablePath || 'bundled');

        browser = await chromium.launch({
            executablePath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
            headless: true
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        await page.setContent(htmlContent, { waitUntil: 'networkidle', timeout: 30000 });

        const pdfOptions = {
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        };

        // Add native header/footer if templates provided
        if (options.headerTemplate || options.footerTemplate) {
            pdfOptions.displayHeaderFooter = true;
            // Playwright requires explicit margins if header/footer are used, otherwise they might be overwritten
            // We increase top/bottom margins to make room
            pdfOptions.margin = { top: '80px', bottom: '80px', left: '20px', right: '20px' };

            if (options.headerTemplate) pdfOptions.headerTemplate = options.headerTemplate;
            if (options.footerTemplate) pdfOptions.footerTemplate = options.footerTemplate;
        }

        const pdfBuffer = await page.pdf(pdfOptions);

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
        if (error.message.includes('executablePath')) {
            throw new Error(
                `Failed to launch browser. Ensure Chromium is installed or PUPPETEER_EXECUTABLE_PATH is set. Error: ${error.message}`
            );
        }

        throw new Error(`PDF generation failed: ${error.message}`);
    }
}

module.exports = { generatePdf };
