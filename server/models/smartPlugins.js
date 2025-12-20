const prisma = require("../utils/prisma");

const MAX_PROMPT_CHARS = 2_000;
const MAX_NAME_CHARS = 64;
const MAX_DESC_CHARS = 500;
const MAX_FIELDS = 50;

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function deepFindForbidden(input) {
  const forbiddenKeys = new Set([
    "code",
    "js",
    "javascript",
    "function",
    "render",
    "eval",
    "onClick",
    "onLoad",
    "onError",
    "dangerouslySetInnerHTML",
  ]);

  const stack = [{ path: "$", value: input }];
  while (stack.length) {
    const { path, value } = stack.pop();
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower.includes("<script") || lower.includes("javascript:")) {
        return { path, reason: "script-like content" };
      }
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => stack.push({ path: `${path}[${i}]`, value: v }));
      continue;
    }
    if (!isPlainObject(value)) continue;

    for (const [k, v] of Object.entries(value)) {
      if (forbiddenKeys.has(k))
        return { path: `${path}.${k}`, reason: "forbidden key" };
      stack.push({ path: `${path}.${k}`, value: v });
    }
  }
  return null;
}

function validateSchema(schema) {
  if (!isPlainObject(schema))
    return { ok: false, error: "Schema must be an object" };
  if (schema.version !== 1)
    return { ok: false, error: "Schema.version must be 1" };
  if (!Array.isArray(schema.fields))
    return { ok: false, error: "Schema.fields must be an array" };
  if (schema.fields.length > MAX_FIELDS)
    return { ok: false, error: `Schema.fields max is ${MAX_FIELDS}` };

  const allowedTypes = new Set([
    "string",
    "number",
    "boolean",
    "date",
    "enum",
    "markdown",
  ]);

  for (const field of schema.fields) {
    if (!isPlainObject(field))
      return { ok: false, error: "Each field must be an object" };
    if (
      typeof field.key !== "string" ||
      !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(field.key)
    ) {
      return { ok: false, error: "Field.key must be a safe identifier" };
    }
    if (
      typeof field.label !== "string" ||
      field.label.length === 0 ||
      field.label.length > 80
    ) {
      return { ok: false, error: "Field.label must be 1-80 chars" };
    }
    if (!allowedTypes.has(field.type))
      return { ok: false, error: `Unsupported field.type: ${field.type}` };
    if (field.type === "enum") {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        return { ok: false, error: "Enum fields require options[]" };
      }
      if (field.options.some((o) => typeof o !== "string" || o.length > 80)) {
        return {
          ok: false,
          error: "Enum options must be strings (<=80 chars)",
        };
      }
    }
  }

  const forbidden = deepFindForbidden(schema);
  if (forbidden)
    return {
      ok: false,
      error: `Schema rejected (${forbidden.reason}) at ${forbidden.path}`,
    };
  return { ok: true };
}

function validateUiConfig(uiConfig) {
  if (uiConfig === null || uiConfig === undefined)
    return { ok: true, value: null };
  if (!isPlainObject(uiConfig))
    return { ok: false, error: "uiConfig must be an object" };

  const forbidden = deepFindForbidden(uiConfig);
  if (forbidden)
    return {
      ok: false,
      error: `uiConfig rejected (${forbidden.reason}) at ${forbidden.path}`,
    };

  if (uiConfig.prompt !== undefined) {
    if (typeof uiConfig.prompt !== "string")
      return { ok: false, error: "uiConfig.prompt must be a string" };
    if (uiConfig.prompt.length > MAX_PROMPT_CHARS)
      return {
        ok: false,
        error: `uiConfig.prompt max is ${MAX_PROMPT_CHARS} chars`,
      };
  }
  return { ok: true, value: uiConfig };
}

function validateCreatePayload(payload = {}) {
  const { name, description, schema, uiConfig, active } = payload;
  if (typeof name !== "string" || !name.trim())
    return { ok: false, error: "Name is required" };
  if (name.trim().length > MAX_NAME_CHARS)
    return { ok: false, error: `Name max is ${MAX_NAME_CHARS} chars` };
  if (description !== undefined && description !== null) {
    if (typeof description !== "string")
      return { ok: false, error: "Description must be a string" };
    if (description.length > MAX_DESC_CHARS)
      return { ok: false, error: `Description max is ${MAX_DESC_CHARS} chars` };
  }

  const schemaRes = validateSchema(schema);
  if (!schemaRes.ok) return schemaRes;
  const uiRes = validateUiConfig(uiConfig);
  if (!uiRes.ok) return uiRes;

  return {
    ok: true,
    value: {
      name: name.trim(),
      description: description ?? null,
      schema,
      uiConfig: uiRes.value ?? null,
      active: active === undefined ? true : !!active,
    },
  };
}

function validateUpdatePayload(payload = {}) {
  const out = {};
  if (payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim())
      return { ok: false, error: "Name must be non-empty" };
    if (payload.name.trim().length > MAX_NAME_CHARS)
      return { ok: false, error: `Name max is ${MAX_NAME_CHARS} chars` };
    out.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    if (payload.description !== null && typeof payload.description !== "string")
      return { ok: false, error: "Description must be a string or null" };
    if (
      typeof payload.description === "string" &&
      payload.description.length > MAX_DESC_CHARS
    )
      return { ok: false, error: `Description max is ${MAX_DESC_CHARS} chars` };
    out.description = payload.description;
  }
  if (payload.schema !== undefined) {
    const schemaRes = validateSchema(payload.schema);
    if (!schemaRes.ok) return schemaRes;
    out.schema = payload.schema;
  }
  if (payload.uiConfig !== undefined) {
    const uiRes = validateUiConfig(payload.uiConfig);
    if (!uiRes.ok) return uiRes;
    out.uiConfig = uiRes.value ?? null;
  }
  if (payload.active !== undefined) out.active = !!payload.active;
  return { ok: true, value: out };
}

const SmartPlugins = {
  listForWorkspace: async function (workspaceId) {
    const plugins = await prisma.smart_plugins.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    });
    return plugins.map((p) => ({
      ...p,
      schema: tryParse(p.schema),
      uiConfig: tryParse(p.uiConfig),
    }));
  },

  activeForWorkspace: async function (workspaceId) {
    const plugins = await prisma.smart_plugins.findMany({
      where: { workspaceId, active: true },
      orderBy: { updatedAt: "desc" },
    });
    return plugins.map((p) => ({
      ...p,
      schema: tryParse(p.schema),
      uiConfig: tryParse(p.uiConfig),
    }));
  },

  createForWorkspace: async function ({
    workspaceId,
    createdBy = null,
    payload,
  }) {
    const valid = validateCreatePayload(payload);
    if (!valid.ok) return { ok: false, error: valid.error };
    try {
      const plugin = await prisma.smart_plugins.create({
        data: {
          ...valid.value,
          schema: JSON.stringify(valid.value.schema),
          uiConfig: valid.value.uiConfig
            ? JSON.stringify(valid.value.uiConfig)
            : null,
          workspaceId,
          createdBy,
        },
      });
      return {
        ok: true,
        plugin: {
          ...plugin,
          schema: tryParse(plugin.schema),
          uiConfig: tryParse(plugin.uiConfig),
        },
      };
    } catch (e) {
      if (
        String(e?.message || "")
          .toLowerCase()
          .includes("unique")
      ) {
        return {
          ok: false,
          error: "A plugin with this name already exists in this workspace",
        };
      }
      return { ok: false, error: "Could not create plugin" };
    }
  },

  updateInWorkspace: async function ({ workspaceId, id, payload }) {
    const valid = validateUpdatePayload(payload);
    if (!valid.ok) return { ok: false, error: valid.error };

    const existing = await prisma.smart_plugins.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return { ok: false, error: "Plugin not found" };

    try {
      const data = { ...valid.value };
      if (data.schema !== undefined) data.schema = JSON.stringify(data.schema);
      if (data.uiConfig !== undefined)
        data.uiConfig = data.uiConfig ? JSON.stringify(data.uiConfig) : null;

      const plugin = await prisma.smart_plugins.update({
        where: { id },
        data,
      });
      return {
        ok: true,
        plugin: {
          ...plugin,
          schema: tryParse(plugin.schema),
          uiConfig: tryParse(plugin.uiConfig),
        },
      };
    } catch (e) {
      if (
        String(e?.message || "")
          .toLowerCase()
          .includes("unique")
      ) {
        return {
          ok: false,
          error: "A plugin with this name already exists in this workspace",
        };
      }
      return { ok: false, error: "Could not update plugin" };
    }
  },

  deleteInWorkspace: async function ({ workspaceId, id }) {
    const existing = await prisma.smart_plugins.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return { ok: false, error: "Plugin not found" };
    await prisma.smart_plugins.delete({ where: { id } });
    return { ok: true };
  },
};

function tryParse(input) {
  try {
    return typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return input;
  }
}

module.exports = { SmartPlugins };
