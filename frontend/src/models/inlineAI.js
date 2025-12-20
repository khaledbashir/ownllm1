/**
 * Inline AI Service for BlockSuite Editor
 *
 * Handles AI generation requests from the editor:
 * - Ask AI: General query with optional context
 * - Continue Writing: Continue from previous text
 * - Summarize: Summarize given text
 * - Improve: Improve writing style
 * - Fix Grammar: Fix spelling and grammar
 * - Translate: Translate to specified language
 */

import { baseHeaders } from "@/utils/request";

const InlineAI = {
  /**
   * Generate AI content (non-streaming)
   * @param {string} action - Action type: ask, continue, summarize, improve, grammar, translate
   * @param {object} params - Action parameters
   * @param {string} params.query - User query (for ask action)
   * @param {string} params.context - Text context from editor
   * @param {string} params.selectedText - Selected text (for actions on selection)
   * @param {string} params.language - Target language (for translate action)
   * @returns {Promise<{success: boolean, content: string, error?: string}>}
   */
  generate: async function (action, params) {
    const prompt = InlineAI.buildPrompt(action, params);

    return fetch(`/api/inline-ai/generate`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        prompt,
        context: params.context || "",
        selectedText: params.selectedText || "",
        language: params.language || "English",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Normalize response: backend returns 'content', frontend expects 'response'
        if (data.success && data.content) {
          return { ...data, response: data.content };
        }
        return data;
      })
      .catch((e) => {
        console.error("[InlineAI] Error:", e);
        return { success: false, error: e.message };
      });
  },

  /**
   * Build prompt based on action type
   */
  buildPrompt: function (action, params) {
    const { query, context, selectedText, language } = params;

    switch (action) {
      case "ask":
        return query || "";

      case "continue":
        return context || "";

      case "summarize":
        return selectedText || context || "";

      case "improve":
        return selectedText || "";

      case "grammar":
        return selectedText || "";

      case "translate":
        return selectedText || "";

      case "selection":
        return query || selectedText || "";

      default:
        return query || "";
    }
  },
};

export default InlineAI;
