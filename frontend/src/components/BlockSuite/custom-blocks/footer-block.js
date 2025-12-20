import { ShadowlessElement } from "@blocksuite/block-std";
import { html } from "lit";

export class FooterBlock extends ShadowlessElement {
  render() {
    return html`
      <div
        style="
        padding: 24px 0;
        border-top: 2px solid #e5e7eb;
        margin-top: 24px;
        text-align: center;
        color: #9ca3af;
        font-size: 11px;
        width: 100%;
        user-select: none;
      "
        contenteditable="false"
      >
        <p>
          CONFIDENTIALITY NOTICE: The contents of this document are intended for
          the named addressee only.
        </p>
        <p>
          &copy; ${new Date().getFullYear()} Company Name. All rights reserved.
        </p>
      </div>
    `;
  }
}

if (!window.customElements.get("footer-block")) {
  window.customElements.define("footer-block", FooterBlock);
}

export const FooterBlockSchema = {
  flavour: "custom:footer",
  metadata: {
    version: 1,
    role: "content",
  },
  view: {
    component: "footer-block",
  },
};
