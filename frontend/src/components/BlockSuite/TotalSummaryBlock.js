import { LitElement, html, css } from 'lit';
import { BlockService } from '@blocksuite/blocks';

export class TotalSummaryBlockService extends BlockService {
  mounted() {
    // Re-render when the doc changes to catch table updates
    this.disposable = this.std.doc.slots.blockUpdated.on(() => {
      this.host.requestUpdate();
    });
  }
  dispose() {
    if (this.disposable) this.disposable.dispose();
  }
}

export class TotalSummaryBlock extends LitElement {
  static styles = css`
    .summary-container {
      background: #000;
      color: #fff;
      padding: 12px 20px;
      text-align: right;
      font-family: sans-serif;
      font-weight: bold;
      border-radius: 4px;
      margin-top: 4px;
    }
  `;

  calculateTotal() {
    const previousBlock = this.model.doc.getBlock(this.model.id)?.previousSibling;
    if (!previousBlock || previousBlock.flavour !== 'affine:database') return 0;

    let grandTotal = 0;
    const totalCol = previousBlock.model.columns.find(c => c.name.toLowerCase().includes('total'));
    if (!totalCol) return 0;

    // Iterate rows
    previousBlock.children.forEach(row => {
      const cell = previousBlock.model.cells[row.id]?.[totalCol.id];
      if (cell && cell.value) {
        const val = parseFloat(cell.value.replace(/[^0-9.]/g, ''));
        if (!isNaN(val)) grandTotal += val;
      }
    });
    return grandTotal;
  }

  render() {
    const total = this.calculateTotal();
    // Format as Currency
    const formatter = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    return html`<div class="summary-container">TOTAL INVESTMENT: ${formatter.format(total)}</div>`;
  }
}
// Note: Register this block in your Editor Specs (BlockSpecs)