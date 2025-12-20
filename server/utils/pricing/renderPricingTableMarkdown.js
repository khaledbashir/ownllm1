const {
  computePricingSummary,
  roundMoney,
  toNumber,
} = require("./pricingMath");

function formatAud(amount) {
  const n = toNumber(amount, 0);
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function renderPricingTableMarkdown(
  pricingTable,
  { targetAfterDiscountExGst = null } = {}
) {
  const table =
    pricingTable && typeof pricingTable === "object" ? pricingTable : {};
  const rows = Array.isArray(table.rows) ? table.rows : [];

  const summary = computePricingSummary(table);

  const lines = [];

  lines.push(`Discount: ${summary.discountPercent}%`);
  lines.push(`GST: ${summary.gstPercent}%`);
  lines.push("");

  lines.push(
    "| Role | Description | Hours | Rate (AUD ex GST) | Line total (AUD ex GST) |"
  );
  lines.push("| --- | --- | ---: | ---: | ---: |");

  for (const row of rows) {
    const hours = roundMoney(toNumber(row?.hours, 0));
    const rate = roundMoney(toNumber(row?.baseRate ?? row?.rate, 0));
    const lineTotal = roundMoney(hours * rate);
    lines.push(
      `| ${String(row?.role || "").replace(/\|/g, "\\|")} | ${String(
        row?.description || ""
      ).replace(/\|/g, "\\|")} | ${hours} | ${rate} | ${lineTotal} |`
    );
  }

  lines.push("");
  lines.push("**Totals (AUD):**");
  lines.push(`- Subtotal (ex GST): ${formatAud(summary.subtotalExGst)}`);
  if (summary.discountPercent > 0) {
    lines.push(
      `- Discount (${summary.discountPercent}%): -${formatAud(summary.discountAmount)}`
    );
  }
  const afterDiscountLine = `- Subtotal after discount (ex GST): ${formatAud(
    summary.discountedSubtotalExGst
  )}`;
  if (Number.isFinite(toNumber(targetAfterDiscountExGst, NaN))) {
    lines.push(
      `${afterDiscountLine} (Target: ${formatAud(targetAfterDiscountExGst)})`
    );
  } else {
    lines.push(afterDiscountLine);
  }
  lines.push(`- GST (${summary.gstPercent}%): ${formatAud(summary.gstAmount)}`);
  lines.push(`- Total (inc GST): ${formatAud(summary.totalIncGst)}`);

  return lines.join("\n");
}

module.exports = {
  renderPricingTableMarkdown,
};
