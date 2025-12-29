const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { getLLMProvider } = require("../utils/helpers");

/**
 * Lab Endpoints - Simple LLM chat for the Test Lab
 */
function labEndpoints(app) {
    if (!app) return;

    // Simple chat completion for the Lab
    app.post("/lab/chat", validatedRequest, async (req, res) => {
        try {
            const { messages = [], model = null, temperature = 0.7 } = req.body;

            if (!messages.length) {
                return res.status(400).json({
                    success: false,
                    error: "No messages provided"
                });
            }

            const LLMConnector = getLLMProvider({ model });
            if (!LLMConnector) {
                return res.status(500).json({
                    success: false,
                    error: "No LLM provider configured. Please configure an AI provider in Settings.",
                });
            }

            console.log("[Lab] Chat request with", messages.length, "messages");

            const result = await LLMConnector.getChatCompletion(messages, {
                temperature: parseFloat(temperature),
            });

            if (!result?.textResponse) {
                return res.status(500).json({
                    success: false,
                    error: "No response from LLM"
                });
            }

            return res.status(200).json({
                success: true,
                response: result.textResponse,
                metrics: result.metrics || null,
            });
        } catch (error) {
            console.error("[Lab] Chat error:", error);
            return res.status(500).json({
                success: false,
                error: error.message || "Failed to get chat response",
            });
        }
    });

    // Get available models for the current LLM provider
    app.get("/lab/models", validatedRequest, async (req, res) => {
        try {
            const provider = process.env.LLM_PROVIDER || "openai";
            const currentModel = process.env.GENERIC_OPEN_AI_MODEL_PREF ||
                process.env.OPENROUTER_MODEL_PREF ||
                process.env.OPEN_MODEL_PREF ||
                "gpt-3.5-turbo";

            return res.status(200).json({
                success: true,
                provider,
                currentModel,
            });
        } catch (error) {
            console.error("[Lab] Get models error:", error);
            return res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });
}

module.exports = { labEndpoints };
