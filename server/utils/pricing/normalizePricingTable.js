const levenshtein = require("fast-levenshtein");

function clampPercent(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, n));
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRoleKey(roleName) {
  return String(roleName || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s\-\(\)\.]/g, "")
    .trim();
}

function buildRateCardIndex(rateCardEntries = []) {
  const byKey = new Map();
  const normalizedToOriginal = new Map();

  for (const entry of rateCardEntries) {
    if (!entry || typeof entry !== "object") continue;

    const role = entry.role ?? entry.name ?? entry.title;
    const rate = entry.rate ?? entry.hourlyRate ?? entry.baseRate;
    if (!role) continue;

    const key = normalizeRoleKey(role);
    if (!key) continue;

    const numericRate = toNumber(rate, NaN);
    if (!Number.isFinite(numericRate)) continue;

    byKey.set(key, numericRate);
    normalizedToOriginal.set(key, String(role));
  }

  return { byKey, normalizedToOriginal };
}

function chooseBestRateCardMatch(
  inputRole,
  rateCardIndex,
  { maxDistance = 4 } = {}
) {
  const key = normalizeRoleKey(inputRole);
  if (!key) return null;

  if (rateCardIndex.byKey.has(key)) {
    return {
      matchedKey: key,
      matchedRole: rateCardIndex.normalizedToOriginal.get(key),
      hourlyRate: rateCardIndex.byKey.get(key),
      matchType: "exact",
    };
  }

  // Conservative fuzzy match: only accept if edit-distance is small and unique.
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let tied = false;

  for (const candidateKey of rateCardIndex.byKey.keys()) {
    const distance = levenshtein.get(key, candidateKey);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidateKey;
      tied = false;
    } else if (distance === bestDistance) {
      tied = true;
    }
  }

  if (best && !tied && bestDistance <= maxDistance) {
    return {
      matchedKey: best,
      matchedRole: rateCardIndex.normalizedToOriginal.get(best),
      hourlyRate: rateCardIndex.byKey.get(best),
      matchType: "fuzzy",
      distance: bestDistance,
    };
  }

  return null;
}

function roleRank(roleName) {
  const r = normalizeRoleKey(roleName);
  if (
    r.includes("tech") &&
    r.includes("head") &&
    r.includes("senior project management")
  ) {
    return 0;
  }
  if (r.includes("project coordination")) return 1;
  if (r.includes("account management")) return 999;
  return 2;
}

function normalizeRows(rows, rateCardIndex, warnings) {
  const rawRows = Array.isArray(rows) ? rows : [];

  const cleaned = rawRows.map((row, idx) => {
    const safeRow = row && typeof row === "object" ? row : {};

    const role = String(safeRow.role || "").trim();
    const hours = Math.max(0, toNumber(safeRow.hours, 0));

    const inputRate = toNumber(
      safeRow.baseRate ?? safeRow.rate ?? safeRow.hourlyRate,
      0
    );

    const match = chooseBestRateCardMatch(role, rateCardIndex);
    if (match) {
      if (match.matchType === "fuzzy") {
        warnings.push({
          type: "role_fuzzy_match",
          inputRole: role,
          matchedRole: match.matchedRole,
          distance: match.distance,
        });
      }

      if (Number.isFinite(inputRate) && inputRate !== match.hourlyRate) {
        warnings.push({
          type: "rate_overridden",
          role: match.matchedRole,
          inputRate,
          rateCardRate: match.hourlyRate,
        });
      }
    } else if (role) {
      warnings.push({ type: "unknown_role", role });
    }

    return {
      id: safeRow.id || `${Date.now()}-${idx}`,
      role: match?.matchedRole ?? role,
      description: String(safeRow.description || ""),
      hours,
      baseRate: match ? match.hourlyRate : 0,
    };
  });

  return cleaned
    .map((row, originalIndex) => ({ row, originalIndex }))
    .sort((a, b) => {
      const ra = roleRank(a.row.role);
      const rb = roleRank(b.row.role);
      if (ra !== rb) return ra - rb;
      return a.originalIndex - b.originalIndex;
    })
    .map((x) => x.row);
}

function roundToIncrement(value, increment = 0.5) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const inc = Number(increment);
  if (!Number.isFinite(inc) || inc <= 0) return n;
  return Math.round(n / inc) * inc;
}

function ensureMandatoryRoles(
  rows,
  rateCardIndex,
  warnings,
  { mandatoryRoleNames, hoursStrategy = "estimate" }
) {
  const required = Array.isArray(mandatoryRoleNames)
    ? mandatoryRoleNames
    : [
        "Tech - Head Of- Senior Project Management",
        "Tech - Delivery - Project Coordination",
        "Account Management - (Account Manager)",
      ];

  const existingKeys = new Set(rows.map((r) => normalizeRoleKey(r.role)));

  const existingHoursTotal = rows.reduce(
    (sum, row) => sum + Math.max(0, toNumber(row?.hours, 0)),
    0
  );

  const estimateHoursForRole = (role) => {
    const key = normalizeRoleKey(role);

    if (hoursStrategy === "zero") return 0;

    // If we already have some hours in the table, allocate a sensible %.
    if (existingHoursTotal > 0) {
      if (key.includes("senior project management"))
        return Math.max(2, roundToIncrement(existingHoursTotal * 0.1));
      if (key.includes("project coordination"))
        return Math.max(1, roundToIncrement(existingHoursTotal * 0.05));
      if (key.includes("account management"))
        return Math.max(1, roundToIncrement(existingHoursTotal * 0.05));
    }

    // Otherwise fall back to conservative default hours.
    if (key.includes("senior project management")) return 4;
    if (key.includes("project coordination")) return 2;
    if (key.includes("account management")) return 2;
    return 1;
  };

  const injected = [];
  for (const requiredRole of required) {
    const match = chooseBestRateCardMatch(requiredRole, rateCardIndex);
    if (!match) {
      warnings.push({
        type: "mandatory_role_missing_from_rate_card",
        role: requiredRole,
      });
      continue;
    }

    const roleKey = normalizeRoleKey(match.matchedRole);
    if (existingKeys.has(roleKey)) continue;

    const hours = estimateHoursForRole(match.matchedRole);
    warnings.push({
      type: "mandatory_role_injected",
      role: match.matchedRole,
      hours,
    });

    injected.push({
      id: `mandatory-${roleKey}`,
      role: match.matchedRole,
      description: "",
      hours,
      baseRate: match.hourlyRate,
    });
  }

  return [...rows, ...injected].sort(
    (a, b) => roleRank(a.role) - roleRank(b.role)
  );
}

function normalizePricingTablePayload(
  rawPayload,
  {
    rateCardEntries = [],
    currency = "AUD",
    defaultGstPercent = 10,
    injectMandatoryRoles = false,
    mandatoryRoleNames = null,
  } = {}
) {
  const warnings = [];

  const payload =
    rawPayload && typeof rawPayload === "object" ? rawPayload : {};
  const rateCardIndex = buildRateCardIndex(rateCardEntries);

  const normalized = {
    title:
      typeof payload.title === "string" ? payload.title : "Project Pricing",
    currency,
    discountPercent: clampPercent(payload.discountPercent, 0),
    gstPercent: clampPercent(payload.gstPercent, defaultGstPercent),
    rows: [],
  };

  normalized.rows = normalizeRows(payload.rows, rateCardIndex, warnings);

  if (injectMandatoryRoles) {
    normalized.rows = ensureMandatoryRoles(
      normalized.rows,
      rateCardIndex,
      warnings,
      {
        mandatoryRoleNames,
        hoursStrategy: "estimate",
      }
    );
  }

  return { pricingTable: normalized, warnings };
}

module.exports = {
  normalizePricingTablePayload,
  buildRateCardIndex,
  normalizeRoleKey,
};
