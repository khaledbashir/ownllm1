/**
 * AI Slash Menu Configuration for BlockSuite Editor
 * 
 * Adds custom /ai commands to the slash menu:
 * - Ask AI: Opens prompt input for any AI query
 * - Continue Writing: Continues from previous text
 * - Summarize: Summarizes content above cursor
 * - Improve Writing: Enhances the writing style
 */

import { html } from "lit";

// Simple star icon for AI items
const AIStarIcon = html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
</svg>`;

// Create the AI menu items
export const createAISlashMenuItems = (onAIAction) => [
    { groupName: "AI" },
    {
        name: "Ask AI",
        icon: AIStarIcon,
        alias: ["ai", "generate", "write"],
        description: "Ask AI anything",
        action: ({ rootElement, model }) => {
            onAIAction("ask", { rootElement, model });
        },
    },
    {
        name: "Continue Writing",
        icon: AIStarIcon,
        alias: ["ai continue", "keep writing"],
        description: "Continue from previous text",
        action: ({ rootElement, model }) => {
            onAIAction("continue", { rootElement, model });
        },
    },
    {
        name: "Summarize Above",
        icon: AIStarIcon,
        alias: ["ai summarize", "tldr"],
        description: "Summarize content above cursor",
        action: ({ rootElement, model }) => {
            onAIAction("summarize", { rootElement, model });
        },
    },
    {
        name: "Improve Writing",
        icon: AIStarIcon,
        alias: ["ai improve", "rewrite"],
        description: "Improve writing style",
        action: ({ rootElement, model }) => {
            onAIAction("improve", { rootElement, model });
        },
    },
    {
        name: "Fix Grammar",
        icon: AIStarIcon,
        alias: ["ai grammar", "proofread"],
        description: "Fix spelling and grammar",
        action: ({ rootElement, model }) => {
            onAIAction("grammar", { rootElement, model });
        },
    },
    {
        name: "Translate",
        icon: AIStarIcon,
        alias: ["ai translate"],
        description: "Translate text",
        subMenu: [
            { groupName: "Translate to" },
            {
                name: "English",
                action: ({ rootElement, model }) => {
                    onAIAction("translate", { rootElement, model, lang: "English" });
                },
            },
            {
                name: "Spanish",
                action: ({ rootElement, model }) => {
                    onAIAction("translate", { rootElement, model, lang: "Spanish" });
                },
            },
            {
                name: "French",
                action: ({ rootElement, model }) => {
                    onAIAction("translate", { rootElement, model, lang: "French" });
                },
            },
            {
                name: "German",
                action: ({ rootElement, model }) => {
                    onAIAction("translate", { rootElement, model, lang: "German" });
                },
            },
            {
                name: "Arabic",
                action: ({ rootElement, model }) => {
                    onAIAction("translate", { rootElement, model, lang: "Arabic" });
                },
            },
        ],
    },
];

/**
 * Setup AI slash menu items in the editor
 * Call this after the editor is initialized and the slash menu widget is available
 */
export function setupAISlashMenu(slashMenuWidget, onAIAction) {
    if (!slashMenuWidget || !slashMenuWidget.config) {
        console.warn("[AI Slash Menu] Slash menu widget not found or not ready");
        return;
    }

    const aiItems = createAISlashMenuItems(onAIAction);

    // Insert AI items at the beginning of the menu
    const currentItems = slashMenuWidget.config.items.slice();
    currentItems.unshift(...aiItems);

    slashMenuWidget.config = {
        ...slashMenuWidget.config,
        items: currentItems,
    };

    console.log("[AI Slash Menu] Added AI items to slash menu");
}
