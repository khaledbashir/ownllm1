import { ShadowlessElement } from "@blocksuite/block-std";
import { html } from "lit";

export class HeaderBlock extends ShadowlessElement {
  render() {
    return html`
      <div
        style="
        padding: 24px 0;
        border-bottom: 2px solid #e5e7eb;
        margin-bottom: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        user-select: none;
      "
        contenteditable="false"
      >
        <div style="display: flex; align-items: center; gap: 16px;">
          <div
            style="
            width: 48px;
            height: 48px;
            background-color: #3b82f6;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          "
          >
            LOGO
          </div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: bold; font-size: 18px; color: #111827;"
              >Company Name</span
            >
            <span style="font-size: 12px; color: #6b7280;"
              >123 Business Rd, Tech City</span
            >
          </div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #6b7280;">
          <div>${new Date().toLocaleDateString()}</div>
          <div>Ref: TMP-001</div>
        </div>
      </div>
    `;
  }
}

if (!window.customElements.get("header-block")) {
  window.customElements.define("header-block", HeaderBlock);
}

export const HeaderBlockSchema = {
  flavour: "custom:header",
  metadata: {
    version: 1,
    role: "content",
  },
  view: {
    component: "header-block",
  },
};
