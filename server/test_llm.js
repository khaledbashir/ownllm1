
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Try to load from root .env if exists

const { getLLMProvider } = require('./utils/helpers');

async function test() {
    console.log("Starting LLM Test...");
    console.log("LLM_PROVIDER:", process.env.LLM_PROVIDER);

    try {
        const LLMConnector = getLLMProvider();
        console.log("LLMConnector initialized:", !!LLMConnector);

        if (!LLMConnector) {
            console.error("FAIL: LLMConnector is null");
            process.exit(1);
        }

        console.log("Provider Class:", LLMConnector.constructor.name);

        const messages = [
            { role: "system", content: "You are a helper." },
            { role: "user", content: "Test." }
        ];

        console.log("Sending chat request...");
        const result = await LLMConnector.sendChat(messages, { temperature: 0.7 });
        console.log("Result received:", result);

    } catch (e) {
        console.error("CRITICAL ERROR:", e);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}

test();
