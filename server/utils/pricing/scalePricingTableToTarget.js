const { clampPercent, toNumber, roundMoney } = require("./pricingMath");
const { normalizeRoleKey } = require("./normalizePricingTable");

function roundToIncrement(value, increment = 0.5) {
  const n = toNumber(value, 0);
  const inc = toNumber(increment, 0);
  if (!Number.isFinite(inc) || inc <= 0) return n;
  return Math.round(n / inc) * inc;
}

function subtotalExGstFromRows(rows = []) {
  return roundMoney(
    rows.reduce((sum, row) => {
      const hours = Math.max(0, toNumber(row?.hours, 0));
      const rate = Math.max(0, toNumber(row?.baseRate ?? row?.rate, 0));
      return sum + hours * rate;
    }, 0)
  );
}

function clampMandatoryMinimumHours(rows, mandatoryRoleKeySet, minHours = 0.5) {
  return rows.map((row) => {
    const roleKey = normalizeRoleKey(row?.role);
    if (mandatoryRoleKeySet.has(roleKey)) {
      return { ...row, hours: Math.max(minHours, toNumber(row?.hours, 0)) };
    }
    return row;
  });
}

/**
 * Scales row hours to hit a target *after discount* subtotal (ex GST).
 *
 * Budget interpretation (server-side default):
 * - `targetAfterDiscountExGst` is the desired client subtotal after discount, ex GST.
 */
function scalePricingTableToTarget(
  pricingTable,
  {
    targetAfterDiscountExGst,
    mandatoryRoleNames = [],
    hourIncrement = 0.5,
    maxIterations = 200,
  } = {}
) {
  const warnings = [];
  const table = pricingTable && typeof pricingTable === "object" ? pricingTable : {};
  const rows = Array.isArray(table.rows) ? table.rows.map((r) => ({ ...r })) : [];

  const targetAfter = toNumber(targetAfterDiscountExGst, NaN);
  if (!Number.isFinite(targetAfter) || targetAfter <= 0) {
    return { pricingTable: { ...table, rows }, warnings };
  }

  const discountPercent = clampPercent(table.discountPercent, 0);
  const denom = 1 - discountPercent / 100;
  if (denom <= 0) {
    warnings.push({ type: "discount_makes_budget_unscalable", discountPercent });
    return { pricingTable: { ...table, rows }, warnings };
  }

  const targetSubtotalExGst = roundMoney(targetAfter / denom);

  const mandatoryRoleKeySet = new Set(
    (Array.isArray(mandatoryRoleNames) ? mandatoryRoleNames : [])
      .map((r) => normalizeRoleKey(r))
      .filter(Boolean)
  );

  const currentSubtotal = subtotalExGstFromRows(rows);
  if (currentSubtotal <= 0) {
    warnings.push({ type: "cannot_scale_zero_subtotal" });
    return { pricingTable: { ...table, rows }, warnings };
  }

  const adjustableRows = rows.filter(
    (row) => !mandatoryRoleKeySet.has(normalizeRoleKey(row?.role))
  );

  const fixedRows = rows.filter((row) => !adjustableRows.includes(row));
  const fixedSubtotal = subtotalExGstFromRows(fixedRows);
  const adjustableSubtotal = subtotalExGstFromRows(adjustableRows);

  const makeAllAdjustable = adjustableRows.length === 0 || adjustableSubtotal === 0;

  let factor = 1;
  if (makeAllAdjustable) {
    factor = targetSubtotalExGst / currentSubtotal;
  } else {
    const remaining = targetSubtotalExGst - fixedSubtotal;
    if (remaining <= 0) {
      // Budget is below the implied mandatory cost. Allow scaling of mandatory rows too,
      // but keep a minimal non-zero footprint for visibility.
      warnings.push({
        type: "budget_below_mandatory_cost",
        targetSubtotalExGst,
        fixedSubtotal,
      });
      factor = targetSubtotalExGst / currentSubtotal;
    } else {
      factor = remaining / adjustableSubtotal;
    }
  }

  const inc = toNumber(hourIncrement, 0.5);

  const scaledRows = rows.map((row) => {
    const roleKey = normalizeRoleKey(row?.role);
    const isMandatory = mandatoryRoleKeySet.has(roleKey);
    const isAdjustable =
      makeAllAdjustable || (!isMandatory && adjustableRows.includes(row));

    if (!isAdjustable) return row;

    const scaledHours = Math.max(0, toNumber(row?.hours, 0) * factor);
    return { ...row, hours: roundToIncrement(scaledHours, inc) };
  });

  // Ensure mandatory roles never disappear when we had to scale everything.
  const finalRows = clampMandatoryMinimumHours(scaledRows, mandatoryRoleKeySet, inc);

  // Small heuristic to tweak hours to better hit the target.
  const adjustableForTweaks = finalRows.filter(
    (row) => makeAllAdjustable || !mandatoryRoleKeySet.has(normalizeRoleKey(row?.role))
  );

  const effectiveAdjustable = adjustableForTweaks.length ? adjustableForTweaks : finalRows;
  const minRate = Math.min(
    ...effectiveAdjustable.map((r) => Math.max(0, toNumber(r?.baseRate, 0))).filter((r) => r > 0)
  );
  const tolerance = Number.isFinite(minRate) && minRate > 0 ? minRate * inc * 0.5 : 50;

  let iter = 0;
  while (iter < maxIterations) {
    const subtotal = subtotalExGstFromRows(finalRows);
    const delta = targetSubtotalExGst - subtotal;
    if (Math.abs(delta) <= tolerance) break;

    if (delta > 0) {
      // Need to add cost: bump the row with largest hours.
      const candidate = effectiveAdjustable
        .filter((r) => Number.isFinite(toNumber(r?.baseRate, NaN)) && toNumber(r?.baseRate, 0) > 0)
        .sort((a, b) => toNumber(b.hours, 0) - toNumber(a.hours, 0))[0];
      if (!candidate) break;
      candidate.hours = roundToIncrement(toNumber(candidate.hours, 0) + inc, inc);
    } else {
      // Need to reduce cost: reduce the row with the largest hours.
      const candidate = effectiveAdjustable
        .filter((r) => toNumber(r?.hours, 0) > inc)
        .sort((a, b) => toNumber(b.hours, 0) - toNumber(a.hours, 0))[0];
      if (!candidate) break;
      candidate.hours = roundToIncrement(Math.max(0, toNumber(candidate.hours, 0) - inc), inc);
      // If it's mandatory, don't go below minimum.
      const roleKey = normalizeRoleKey(candidate?.role);
      if (mandatoryRoleKeySet.has(roleKey)) {
        candidate.hours = Math.max(inc, candidate.hours);
      }
    }

    iter++;
  }

  return {
    pricingTable: { ...table, rows: finalRows },
    warnings: warnings.concat(
      iter >= maxIterations ? [{ type: "budget_tweak_max_iterations" }] : []
    ),
    targetSubtotalExGst,
  };
}

module.exports = {
  scalePricingTableToTarget,
  subtotalExGstFromRows,
};
