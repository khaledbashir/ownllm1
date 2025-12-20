/**
 * Inline AI Endpoints
 *
 * Handles AI generation requests for the BlockSuite editor:
 * - /api/inline-ai/generate - Non-streaming AI generation
 * - /api/inline-ai/stream - Streaming AI generation (SSE)
 */

const { getLLMProvider } = require("../utils/helpers");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");

// System prompts for different actions
const ACTION_PROMPTS = {
  ask: (query, context) =>
    `${context ? `Context from the document:\n${context}\n\n` : ""}User's question: ${query}`,

  continue: (context) =>
    `Continue writing the following text naturally. Do not repeat what was already written. Just continue from where it left off:\n\n${context}`,

  summarize: (text) =>
    `Summarize the following text concisely and clearly:\n\n${text}`,

  improve: (text) =>
    `Improve the writing style of the following text. Make it clearer, more professional, and more engaging while keeping the same meaning:\n\n${text}`,

  grammar: (text) =>
    `Fix all spelling and grammar errors in the following text. Only return the corrected text, nothing else:\n\n${text}`,

  translate: (text, language) =>
    `Translate the following text to ${language}. Only return the translation, nothing else:\n\n${text}`,
};

function inlineAIEndpoints(app) {
  if (!app) return;

  // Non-streaming AI generation
  app.post(
    "/inline-ai/generate",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { action, prompt, context, selectedText, language } =
          request.body;

        if (!action || !prompt) {
          return response.status(400).json({
            success: false,
            error: "Action and prompt are required",
          });
        }

        // Get LLM provider
        const LLMConnector = getLLMProvider();
        if (!LLMConnector) {
          return response.status(500).json({
            success: false,
            error: "No LLM provider configured",
          });
        }

        // Build the appropriate prompt based on action
        let systemPrompt =
          "You are a helpful AI writing assistant. Be concise and direct.";
        let userPrompt;

        switch (action) {
          case "ask":
            userPrompt = ACTION_PROMPTS.ask(prompt, context);
            break;
          case "continue":
            userPrompt = ACTION_PROMPTS.continue(context || prompt);
            systemPrompt =
              "You are a writing assistant. Continue the text naturally and seamlessly.";
            break;
          case "summarize":
            userPrompt = ACTION_PROMPTS.summarize(selectedText || prompt);
            break;
          case "improve":
            userPrompt = ACTION_PROMPTS.improve(selectedText || prompt);
            break;
          case "grammar":
            userPrompt = ACTION_PROMPTS.grammar(selectedText || prompt);
            systemPrompt =
              "You are a proofreader. Only fix errors and return the corrected text.";
            break;
          case "translate":
            userPrompt = ACTION_PROMPTS.translate(
              selectedText || prompt,
              language || "English"
            );
            systemPrompt =
              "You are a translator. Only return the translation, nothing else.";
            break;
          default:
            userPrompt = prompt;
        }

        // Make the LLM call
        const chatHistory = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ];

        const result = await LLMConnector.getChatCompletion(chatHistory, {
          temperature: 0.7,
        });

        if (!result) {
          return response.status(500).json({
            success: false,
            error: "Failed to get AI response",
          });
        }

        return response.json({
          success: true,
          content: result,
          action,
        });
      } catch (error) {
        console.error("[InlineAI] Error:", error);
        return response.status(500).json({
          success: false,
          error: error.message || "Internal server error",
        });
      }
    }
  );

  // Streaming AI generation (Server-Sent Events)
  app.post(
    "/inline-ai/stream",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { action, prompt, context, selectedText, language } =
          request.body;

        if (!action || !prompt) {
          return response.status(400).json({
            success: false,
            error: "Action and prompt are required",
          });
        }

        // Get LLM provider
        const LLMConnector = getLLMProvider();
        if (!LLMConnector) {
          return response.status(500).json({
            success: false,
            error: "No LLM provider configured",
          });
        }

        // Set up SSE headers
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("Access-Control-Allow-Origin", "*");

        // Build prompt based on action
        let systemPrompt =
          "You are a helpful AI writing assistant. Be concise and direct.";
        let userPrompt;

        switch (action) {
          case "ask":
            userPrompt = ACTION_PROMPTS.ask(prompt, context);
            break;
          case "continue":
            userPrompt = ACTION_PROMPTS.continue(context || prompt);
            systemPrompt =
              "You are a writing assistant. Continue the text naturally.";
            break;
          case "summarize":
            userPrompt = ACTION_PROMPTS.summarize(selectedText || prompt);
            break;
          case "improve":
            userPrompt = ACTION_PROMPTS.improve(selectedText || prompt);
            break;
          case "grammar":
            userPrompt = ACTION_PROMPTS.grammar(selectedText || prompt);
            systemPrompt = "You are a proofreader. Only return corrected text.";
            break;
          case "translate":
            userPrompt = ACTION_PROMPTS.translate(
              selectedText || prompt,
              language || "English"
            );
            systemPrompt = "You are a translator. Only return the translation.";
            break;
          default:
            userPrompt = prompt;
        }

        const chatHistory = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ];

        let fullContent = "";

        // Stream handler
        const handleStream = (chunk) => {
          if (chunk.textResponse) {
            fullContent += chunk.textResponse;
            response.write(
              `data: ${JSON.stringify({ type: "chunk", content: chunk.textResponse })}\n\n`
            );
          }

          if (chunk.close) {
            response.write(
              `data: ${JSON.stringify({ type: "complete", fullContent })}\n\n`
            );
            response.end();
          }
        };

        // Check if provider supports streaming
        if (LLMConnector.streamGetChatCompletion) {
          await LLMConnector.streamGetChatCompletion(response, chatHistory, {
            temperature: 0.7,
          });
        } else {
          // Fallback to non-streaming
          const result = await LLMConnector.getChatCompletion(chatHistory, {
            temperature: 0.7,
          });
          response.write(
            `data: ${JSON.stringify({ type: "chunk", content: result })}\n\n`
          );
          response.write(
            `data: ${JSON.stringify({ type: "complete", fullContent: result })}\n\n`
          );
          response.end();
        }
      } catch (error) {
        console.error("[InlineAI Stream] Error:", error);
        response.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
        );
        response.end();
      }
    }
  );
}

module.exports = { inlineAIEndpoints };
