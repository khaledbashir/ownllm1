function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundMoney(value) {
  const n = toNumber(value, 0);
  return Math.round(n * 100) / 100;
}

function clampPercent(value, fallback = 0) {
  const n = toNumber(value, NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function computePricingSummary(pricingTable = {}) {
  const rows = Array.isArray(pricingTable.rows) ? pricingTable.rows : [];

  const subtotalExGst = roundMoney(
    rows.reduce((sum, row) => {
      const hours = Math.max(0, toNumber(row?.hours, 0));
      const rate = Math.max(0, toNumber(row?.baseRate ?? row?.rate, 0));
      return sum + hours * rate;
    }, 0)
  );

  const discountPercent = clampPercent(pricingTable.discountPercent, 0);
  const gstPercent = clampPercent(pricingTable.gstPercent, 10);

  const discountAmount = roundMoney(subtotalExGst * (discountPercent / 100));
  const discountedSubtotalExGst = roundMoney(subtotalExGst - discountAmount);

  const gstAmount = roundMoney(discountedSubtotalExGst * (gstPercent / 100));
  const totalIncGst = roundMoney(discountedSubtotalExGst + gstAmount);

  return {
    currency: pricingTable.currency || "AUD",
    subtotalExGst,
    discountPercent,
    discountAmount,
    discountedSubtotalExGst,
    gstPercent,
    gstAmount,
    totalIncGst,
  };
}

module.exports = {
  computePricingSummary,
  clampPercent,
  roundMoney,
  toNumber,
};
