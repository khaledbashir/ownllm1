const { renderPricingTableMarkdown } = require("./renderPricingTableMarkdown");

function asArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((l) => l.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean);
  }
  return [];
}

function renderBullets(items) {
  const list = asArray(items);
  if (!list.length) return "- None";
  return list.map((x) => `- ${x}`).join("\n");
}

function renderParagraph(text) {
  const t = typeof text === "string" ? text.trim() : "";
  return t ? t : "";
}

function renderOptionMarkdown(option, { pricingTable, targetAfterDiscountExGst } = {}) {
  const label = String(option?.label || option?.name || option?.title || "Option").trim();

  const lines = [];
  lines.push(`### ${label}`);

  const overview = renderParagraph(option?.overview);
  if (overview) {
    lines.push("#### Overview");
    lines.push(overview);
  }

  const objectives = asArray(option?.objectives);
  if (objectives.length) {
    lines.push("#### Objectives");
    lines.push(renderBullets(objectives));
  }

  lines.push("#### Scope");
  lines.push("**In Scope**");
  lines.push(renderBullets(option?.scopeIn ?? option?.inScope));
  lines.push("");
  lines.push("**Out of Scope**");
  lines.push(renderBullets(option?.scopeOut ?? option?.outOfScope));

  lines.push("#### Deliverables");
  lines.push(renderBullets(option?.deliverables));

  lines.push("#### Timeline");
  lines.push(renderBullets(option?.timeline));

  lines.push("#### Pricing");
  lines.push(
    renderPricingTableMarkdown(pricingTable, {
      targetAfterDiscountExGst,
    })
  );
  lines.push("");
  lines.push("_All totals are in AUD. Rates and subtotals are ex GST; totals inc GST._");

  lines.push("#### Assumptions");
  lines.push(renderBullets(option?.assumptions));

  lines.push("#### Risks");
  lines.push(renderBullets(option?.risks));

  lines.push("#### Next Steps");
  lines.push(renderBullets(option?.nextSteps));

  return lines.join("\n\n");
}

function renderMultiScopeSowMarkdown(payload, { optionsResolved = [] } = {}) {
  const title = String(payload?.title || "Statement of Work").trim();

  const lines = [];
  lines.push(`## ${title}`);

  const intro = renderParagraph(payload?.intro || payload?.summary);
  if (intro) {
    lines.push("");
    lines.push(intro);
  }

  const client = renderParagraph(payload?.client);
  const project = renderParagraph(payload?.project);
  if (client || project) {
    lines.push("");
    lines.push("**Client / Project**");
    if (client) lines.push(`- Client: ${client}`);
    if (project) lines.push(`- Project: ${project}`);
  }

  for (const resolved of optionsResolved) {
    lines.push("");
    lines.push(
      renderOptionMarkdown(resolved.option, {
        pricingTable: resolved.pricingTable,
        targetAfterDiscountExGst: resolved.targetAfterDiscountExGst,
      })
    );
  }

  return lines.join("\n").trim() + "\n";
}

module.exports = {
  renderMultiScopeSowMarkdown,
};
