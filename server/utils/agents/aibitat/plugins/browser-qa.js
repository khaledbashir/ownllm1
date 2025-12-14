/**
 * Browser QA Agent Skill
 * Uses Browserless/Playwright to perform actual UI testing.
 * Clicks buttons, fills forms, navigates, and reports results.
 */

const { chromium } = require('playwright-core');

const browserQA = {
    name: "browser-qa",
    startupConfig: {
        params: {},
    },
    plugin: function () {
        return {
            name: this.name,
            setup(aibitat) {
                aibitat.function({
                    super: aibitat,
                    name: this.name,
                    controller: new AbortController(),
                    description:
                        "Performs UI testing by controlling a real browser. Can navigate to URLs, click elements, fill forms, and verify page content. Use this to test if web pages and applications work correctly.",
                    examples: [
                        {
                            prompt: "Test if the login page works",
                            call: JSON.stringify({
                                action: "test_flow",
                                url: "https://app.example.com/login",
                                steps: [
                                    { action: "type", selector: "input[name=email]", value: "test@test.com" },
                                    { action: "type", selector: "input[name=password]", value: "password123" },
                                    { action: "click", selector: "button[type=submit]" },
                                    { action: "wait", selector: ".dashboard" },
                                    { action: "verify", text: "Welcome" }
                                ]
                            }),
                        },
                        {
                            prompt: "Check if the Template Builder page loads",
                            call: JSON.stringify({
                                action: "test_flow",
                                url: "https://app.example.com/settings/template-builder",
                                steps: [
                                    { action: "wait", selector: ".template-builder" },
                                    { action: "screenshot" }
                                ]
                            }),
                        },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            action: {
                                type: "string",
                                enum: ["test_flow", "screenshot", "get_content"],
                                description: "The main action to perform",
                            },
                            url: {
                                type: "string",
                                description: "URL to navigate to",
                            },
                            steps: {
                                type: "array",
                                description: "Array of steps to execute. Each step has: action (click/type/wait/verify/screenshot), selector (CSS), value (for type), text (for verify)",
                                items: {
                                    type: "object",
                                    properties: {
                                        action: { type: "string" },
                                        selector: { type: "string" },
                                        value: { type: "string" },
                                        text: { type: "string" }
                                    }
                                }
                            },
                            timeout: {
                                type: "number",
                                description: "Timeout in milliseconds (default 30000)",
                            },
                        },
                        required: ["action", "url"],
                        additionalProperties: false,
                    },
                    handler: async function ({ action, url, steps = [], timeout = 30000 }) {
                        try {
                            this.super.introspect(
                                `${this.caller}: Starting browser QA test on ${url}`
                            );

                            const result = await this.runTest(url, steps, timeout);

                            return JSON.stringify(result);
                        } catch (error) {
                            this.super.handlerProps.log(
                                `Browser QA Error: ${error.message}`
                            );
                            return JSON.stringify({
                                success: false,
                                error: error.message,
                            });
                        }
                    },

                    /**
                     * Connect to Browserless/Playwright
                     */
                    getBrowserEndpoint: function () {
                        const baseUrl = process.env.PUPPETEER_WSS_URL ||
                            process.env.BROWSER_WS_URL ||
                            'ws://browserless:3000';

                        // If URL already has /playwright in it, use as-is
                        if (baseUrl.includes('/playwright')) {
                            return baseUrl;
                        }

                        // Parse URL to preserve query params (like token)
                        const urlObj = new URL(baseUrl);
                        const queryString = urlObj.search; // e.g. ?token=xxx
                        const baseWithoutQuery = `${urlObj.protocol}//${urlObj.host}`;

                        // Add playwright path and preserve query params
                        return `${baseWithoutQuery}/chromium/playwright${queryString}`;
                    },

                    /**
                     * Run a test flow with multiple steps
                     */
                    runTest: async function (url, steps, timeout) {
                        const results = {
                            success: true,
                            url,
                            startTime: Date.now(),
                            steps: [],
                            screenshots: [],
                            errors: []
                        };

                        let browser;
                        try {
                            // Connect to browser
                            this.super.introspect(
                                `${this.caller}: Connecting to Browserless...`
                            );
                            const endpoint = this.getBrowserEndpoint();
                            browser = await chromium.connect(endpoint);
                            const context = await browser.newContext({
                                viewport: { width: 1280, height: 720 }
                            });
                            const page = await context.newPage();

                            // Navigate to URL
                            this.super.introspect(
                                `${this.caller}: Navigating to ${url}...`
                            );
                            const navStart = Date.now();
                            await page.goto(url, { waitUntil: 'networkidle', timeout });
                            results.steps.push({
                                action: 'navigate',
                                url,
                                success: true,
                                duration: Date.now() - navStart
                            });

                            // Execute steps
                            for (const step of steps) {
                                const stepResult = await this.executeStep(page, step, timeout);
                                results.steps.push(stepResult);

                                if (!stepResult.success) {
                                    results.success = false;
                                    results.errors.push(stepResult.error);
                                    this.super.introspect(
                                        `${this.caller}: ❌ Step failed: ${step.action} - ${stepResult.error}`
                                    );
                                } else {
                                    this.super.introspect(
                                        `${this.caller}: ✅ Step passed: ${step.action}`
                                    );
                                }

                                // If screenshot step, save the data
                                if (step.action === 'screenshot' && stepResult.screenshot) {
                                    results.screenshots.push(stepResult.screenshot);
                                }
                            }

                            // Cleanup
                            await page.close();
                            await context.close();
                            await browser.close();

                            results.endTime = Date.now();
                            results.totalDuration = results.endTime - results.startTime;

                            // Summary
                            const passed = results.steps.filter(s => s.success).length;
                            const failed = results.steps.filter(s => !s.success).length;

                            this.super.introspect(
                                `${this.caller}: Test completed: ${passed} passed, ${failed} failed, ${results.totalDuration}ms total`
                            );

                            results.summary = {
                                passed,
                                failed,
                                total: results.steps.length,
                                duration: results.totalDuration
                            };

                            return results;

                        } catch (error) {
                            if (browser) {
                                try { await browser.close(); } catch (e) { }
                            }
                            results.success = false;
                            results.errors.push(error.message);
                            return results;
                        }
                    },

                    /**
                     * Execute a single test step
                     */
                    executeStep: async function (page, step, timeout) {
                        const result = {
                            action: step.action,
                            success: false,
                            startTime: Date.now()
                        };

                        try {
                            switch (step.action) {
                                case 'click':
                                    await page.click(step.selector, { timeout });
                                    result.selector = step.selector;
                                    result.success = true;
                                    break;

                                case 'type':
                                    await page.fill(step.selector, step.value || '', { timeout });
                                    result.selector = step.selector;
                                    result.success = true;
                                    break;

                                case 'wait':
                                    await page.waitForSelector(step.selector, { timeout });
                                    result.selector = step.selector;
                                    result.success = true;
                                    break;

                                case 'wait_text':
                                    await page.waitForFunction(
                                        (text) => document.body.textContent.includes(text),
                                        step.text,
                                        { timeout }
                                    );
                                    result.text = step.text;
                                    result.success = true;
                                    break;

                                case 'verify':
                                    const content = await page.textContent('body');
                                    if (content.includes(step.text)) {
                                        result.success = true;
                                        result.found = true;
                                    } else {
                                        result.success = false;
                                        result.error = `Text "${step.text}" not found on page`;
                                    }
                                    result.text = step.text;
                                    break;

                                case 'verify_selector':
                                    const element = await page.$(step.selector);
                                    if (element) {
                                        result.success = true;
                                        result.found = true;
                                    } else {
                                        result.success = false;
                                        result.error = `Selector "${step.selector}" not found`;
                                    }
                                    result.selector = step.selector;
                                    break;

                                case 'screenshot':
                                    const buffer = await page.screenshot({
                                        type: 'png',
                                        fullPage: step.fullPage || false
                                    });
                                    result.screenshot = buffer.toString('base64');
                                    result.success = true;
                                    break;

                                case 'get_text':
                                    const text = await page.textContent(step.selector);
                                    result.text = text;
                                    result.success = true;
                                    break;

                                case 'get_value':
                                    const value = await page.inputValue(step.selector);
                                    result.value = value;
                                    result.success = true;
                                    break;

                                case 'select':
                                    await page.selectOption(step.selector, step.value);
                                    result.success = true;
                                    break;

                                case 'check':
                                    await page.check(step.selector);
                                    result.success = true;
                                    break;

                                case 'uncheck':
                                    await page.uncheck(step.selector);
                                    result.success = true;
                                    break;

                                case 'press':
                                    await page.press(step.selector || 'body', step.key || 'Enter');
                                    result.success = true;
                                    break;

                                case 'wait_time':
                                    await page.waitForTimeout(step.ms || 1000);
                                    result.success = true;
                                    break;

                                case 'scroll':
                                    await page.evaluate(() => window.scrollBy(0, 500));
                                    result.success = true;
                                    break;

                                default:
                                    result.error = `Unknown action: ${step.action}`;
                            }
                        } catch (error) {
                            result.success = false;
                            result.error = error.message;
                        }

                        result.duration = Date.now() - result.startTime;
                        return result;
                    },
                });
            },
        };
    },
};

module.exports = {
    browserQA,
};
