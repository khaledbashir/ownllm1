/**
 * AI Format Bar Configuration for BlockSuite Editor
 * 
 * Adds AI button to the text selection toolbar (format bar)
 * When user selects text and clicks the AI button, they can:
 * - Improve the selected text
 * - Summarize it
 * - Translate it
 * - Ask AI anything about it
 */

import { html } from "lit";

// Simple star icon for AI button
const AIStarIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
</svg>`;

/**
 * Create AI config items for the format bar
 */
export function createAIFormatBarItems(onAIAction) {
    return [
        {
            type: "custom",
            render: (formatBar) => {
                // Create the AI button
                return html`
                    <div
                        class="ai-format-button"
                        style="
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            padding: 4px 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            color: #a78bfa;
                            transition: all 0.2s;
                        "
                        @click=${() => {
                        // Get selected text
                        const selection = window.getSelection();
                        const selectedText = selection?.toString() || "";

                        if (onAIAction && selectedText) {
                            onAIAction("selection", {
                                selectedText,
                                host: formatBar.host,
                            });
                        }
                    }}
                        @mouseenter=${(e) => {
                        e.target.style.background = "rgba(167, 139, 250, 0.15)";
                    }}
                        @mouseleave=${(e) => {
                        e.target.style.background = "transparent";
                    }}
                    >
                        <span .innerHTML=${AIStarIconSvg}></span>
                        <span style="font-size: 12px; font-weight: 500;">AI</span>
                    </div>
                `;
            },
        },
        { type: "divider" },
    ];
}

/**
 * Setup AI format bar items on the widget
 * Call this after the format bar widget is available
 */
export function setupAIFormatBar(formatBarWidget, onAIAction) {
    if (!formatBarWidget || !formatBarWidget.addRawConfigItems) {
        console.warn("[AI Format Bar] Format bar widget not found or not ready");
        return;
    }

    const aiItems = createAIFormatBarItems(onAIAction);

    // Add AI items at the beginning of the format bar (position 0)
    formatBarWidget.addRawConfigItems(aiItems, 0);

    console.log("[AI Format Bar] Added AI button to format bar");
}
