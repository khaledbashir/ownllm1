const { validApiKey } = require("../middleware/api");
const { chromium } = require('playwright-core');

function agentTestLabEndpoints(app) {
    if (!app) return;

    app.post(
        "/agent/test-lab",
        [validApiKey],
        async (request, response) => {
            try {
                const { message } = request.body;
                if (!message) {
                    return response.status(400).json({ error: "Message is required" });
                }

                console.log(`[Test Lab] Running manual agent with message: ${message}`);

                // Simple Regex Parser for v1
                // "Go to google.com" -> url: google.com
                // "Navigate to https://example.com" -> url: ...
                let url = null;
                const lowerMsg = message.toLowerCase();

                if (lowerMsg.includes("http")) {
                    const match = message.match(/(https?:\/\/[^\s]+)/);
                    if (match) url = match[0];
                } else if (lowerMsg.includes("go to ") || lowerMsg.includes("navigate to ")) {
                    const parts = message.split(/go to |navigate to /i);
                    if (parts[1]) {
                        url = parts[1].split(" ")[0].trim();
                        if (!url.startsWith("http")) url = "https://" + url;
                    }
                }

                if (!url) {
                    // If no URL found, ask LLM? For v1 fast fix, just error or search google.
                    // Let's default to searching google if no URL.
                    url = `https://www.google.com/search?q=${encodeURIComponent(message)}`;
                }

                const steps = [
                    { action: "wait", selector: "body" },
                    { action: "screenshot" }
                ];

                // Run Playwright
                const result = await runBrowserTest(url, steps);

                return response.status(200).json(result);

            } catch (e) {
                console.error(e);
                return response.status(500).json({ error: e.message });
            }
        }
    );
}

// Re-implemented browser connector to avoid tight coupling with AgentHandler/Plugins
async function runBrowserTest(url, steps) {
    const baseUrl = process.env.PUPPETEER_WSS_URL || process.env.BROWSER_WS_URL || 'ws://browserless:3000';
    let browserWSEndpoint = baseUrl;
    if (!baseUrl.includes('/playwright')) {
        const urlObj = new URL(baseUrl);
        browserWSEndpoint = `${urlObj.protocol}//${urlObj.host}/chromium/playwright${urlObj.search}`;
    }

    console.log(`[Test Lab] Connecting to ${browserWSEndpoint}`);
    let browser;
    let context;
    let page;
    const screenshots = [];
    const stepLogs = [];
    const errors = [];

    try {
        browser = await chromium.connect(browserWSEndpoint);
        context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        page = await context.newPage();

        stepLogs.push({ action: `Navigating to ${url}`, success: true, duration: 0 });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        for (const step of steps) {
            const start = Date.now();
            try {
                if (step.action === 'wait') {
                    await page.waitForTimeout(2000);
                }
                if (step.action === 'screenshot') {
                    const buf = await page.screenshot();
                    screenshots.push(buf.toString('base64'));
                }
                stepLogs.push({ action: step.action, success: true, duration: Date.now() - start, selector: step.selector });
            } catch (err) {
                console.error("Step error:", err);
                stepLogs.push({ action: step.action, success: false, duration: Date.now() - start, error: err.message });
                errors.push(err.message);
            }
        }

        return {
            message: `Executed test on ${url}`,
            screenshots,
            results: {
                success: errors.length === 0,
                url,
                summary: { passed: steps.length - errors.length, total: steps.length, duration: 0 },
                steps: stepLogs,
                errors
            }
        };

    } catch (err) {
        console.error("Browser error:", err);
        throw err;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { agentTestLabEndpoints };
