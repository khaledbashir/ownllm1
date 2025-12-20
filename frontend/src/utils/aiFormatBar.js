/**
 * AI Format Bar Configuration for BlockSuite Editor
 *
 * Adds AI dropdown to the text selection toolbar (format bar)
 * When user selects text and clicks the AI button, they see:
 * - Improve writing
 * - Simplify
 * - Make formal
 * - Make casual
 * - Summarize
 * - Custom prompt
 */

import { html } from "lit";

// AI Quick Actions
const AI_QUICK_ACTIONS = [
  {
    id: "improve",
    label: "✨ Improve",
    description: "Enhance clarity and flow",
  },
  {
    id: "simplify",
    label: "📝 Simplify",
    description: "Make easier to understand",
  },
  { id: "formal", label: "👔 Formal", description: "Professional tone" },
  { id: "casual", label: "💬 Casual", description: "Conversational tone" },
  { id: "summarize", label: "📋 Summarize", description: "Key points only" },
  { id: "expand", label: "📖 Expand", description: "Add more detail" },
  { id: "custom", label: "💭 Custom...", description: "Your own prompt" },
];

// Simple star icon for AI button
const AIStarIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
</svg>`;

const ChevronDownSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

/**
 * Create AI config items for the format bar
 */
export function createAIFormatBarItems(onAIAction) {
  return [
    {
      type: "custom",
      render: (formatBar) => {
        // Create the AI button with dropdown
        return html`
          <div class="ai-format-dropdown" style="position: relative;">
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
                user-select: none;
              "
              @click=${(e) => {
                const dropdown = e.target.closest(".ai-format-dropdown");
                const menu = dropdown.querySelector(".ai-dropdown-menu");
                if (menu) {
                  menu.style.display =
                    menu.style.display === "block" ? "none" : "block";
                }
              }}
              @mouseenter=${(e) => {
                const btn = e.target.closest(".ai-format-button");
                if (btn) btn.style.background = "rgba(167, 139, 250, 0.15)";
              }}
              @mouseleave=${(e) => {
                const btn = e.target.closest(".ai-format-button");
                if (btn) btn.style.background = "transparent";
              }}
            >
              <span .innerHTML=${AIStarIconSvg}></span>
              <span style="font-size: 12px; font-weight: 500;">AI</span>
              <span .innerHTML=${ChevronDownSvg}></span>
            </div>

            <!-- Dropdown Menu -->
            <div
              class="ai-dropdown-menu"
              style="
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 4px;
                min-width: 180px;
                background: #1e1e2e;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                z-index: 1000;
                overflow: hidden;
              "
            >
              ${AI_QUICK_ACTIONS.map(
                (action) => html`
                  <div
                    class="ai-action-item"
                    style="
                    padding: 10px 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: background 0.15s;
                    color: #e0e0e0;
                  "
                    @click=${() => {
                      console.log("[AI Format Bar] Action clicked:", action.id);
                      const selection = window.getSelection();
                      const selectedText = selection?.toString() || "";

                      if (onAIAction && selectedText) {
                        onAIAction("selection", {
                          actionType: action.id,
                          selectedText,
                          host: formatBar.host,
                        });
                      }

                      // Hide dropdown after click
                      const menu = document.querySelector(".ai-dropdown-menu");
                      if (menu) menu.style.display = "none";
                    }}
                    @mouseenter=${(e) => {
                      e.target.style.background = "rgba(167, 139, 250, 0.2)";
                    }}
                    @mouseleave=${(e) => {
                      e.target.style.background = "transparent";
                    }}
                  >
                    <span style="font-size: 14px;">${action.label}</span>
                  </div>
                `
              )}
            </div>
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
  console.log("[AI Format Bar] Setup called with widget:", formatBarWidget);

  if (!formatBarWidget) {
    console.warn("[AI Format Bar] Format bar widget not found");
    return;
  }

  // Try different methods that might exist on the widget
  if (typeof formatBarWidget.addRawConfigItems === "function") {
    const aiItems = createAIFormatBarItems(onAIAction);
    formatBarWidget.addRawConfigItems(aiItems, 0);
    console.log("[AI Format Bar] Added AI dropdown via addRawConfigItems");
  } else if (typeof formatBarWidget.addConfigItems === "function") {
    const aiItems = createAIFormatBarItems(onAIAction);
    formatBarWidget.addConfigItems(aiItems, 0);
    console.log("[AI Format Bar] Added AI dropdown via addConfigItems");
  } else {
    console.warn(
      "[AI Format Bar] No addRawConfigItems or addConfigItems method"
    );
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ai-format-dropdown")) {
      const menu = document.querySelector(".ai-dropdown-menu");
      if (menu) menu.style.display = "none";
    }
  });
}
