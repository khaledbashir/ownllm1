import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import CTAButton from "@/components/lib/CTAButton";
import showToast from "@/utils/toast";
import Workspace from "@/models/workspace";
import SmartPlugins from "@/models/smartPlugins";
import UniversalTable from "@/components/SmartPlugins/UniversalTable";
import InteractiveTable from "@/components/SmartPlugins/InteractiveTable";
import { Plus, FloppyDisk, Trash, Calculator } from "@phosphor-icons/react";

const STORAGE_KEY = "anythingllm-smart-plugins-workspace";

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function defaultSchema() {
  return {
    version: 1,
    fields: [
      { key: "name", label: "Name", type: "string" },
      { key: "value", label: "Value", type: "string" },
    ],
  };
}

// Rate card example with formulas for live calculation
function rateCardSchema() {
  return {
    version: 1,
    fields: [
      { key: "role", label: "Role", type: "string" },
      { key: "rate", label: "Hourly Rate", type: "currency" },
      { key: "hours", label: "Hours", type: "number" },
      { key: "discount", label: "Discount", type: "percentage" },
      { key: "total", label: "Total", type: "calculated", formula: "rate * hours * (1 - discount)" },
    ],
  };
}

function validateSchemaObject(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema))
    return "Schema must be an object";
  if (schema.version !== 1) return "Schema.version must be 1";
  if (!Array.isArray(schema.fields)) return "Schema.fields must be an array";
  if (!schema.fields.length) return "Schema.fields must have at least 1 field";
  for (const f of schema.fields) {
    if (!f || typeof f !== "object" || Array.isArray(f)) return "Each field must be an object";
    if (typeof f.key !== "string" || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(f.key))
      return "Field.key must be a safe identifier";
    if (typeof f.label !== "string" || !f.label.trim()) return "Field.label is required";
    if (typeof f.type !== "string" || !f.type.trim()) return "Field.type is required";
  }
  return null;
}

export default function SmartPluginsSettings() {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceSlug, setWorkspaceSlug] = useState(
    window.localStorage.getItem(STORAGE_KEY) || ""
  );

  const [plugins, setPlugins] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [draft, setDraft] = useState({
    id: null,
    name: "",
    description: "",
    active: true,
    schemaText: JSON.stringify(defaultSchema(), null, 2),
    prompt: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const ws = await Workspace.all();
      setWorkspaces(ws);
      const initialSlug =
        workspaceSlug || (ws.length ? ws[0].slug : "");
      setWorkspaceSlug(initialSlug);
      if (initialSlug) window.localStorage.setItem(STORAGE_KEY, initialSlug);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workspaceSlug) return;
    (async () => {
      const list = await SmartPlugins.list(workspaceSlug);
      setPlugins(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
      if (selectedId && !list.find((p) => p.id === selectedId)) {
        setSelectedId(list.length ? list[0].id : null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const selected = useMemo(
    () => plugins.find((p) => p.id === selectedId) || null,
    [plugins, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setDraft({
      id: selected.id,
      name: selected.name || "",
      description: selected.description || "",
      active: !!selected.active,
      schemaText: JSON.stringify(selected.schema ?? defaultSchema(), null, 2),
      prompt: selected?.uiConfig?.prompt || "",
    });
  }, [selected]);

  const schemaParse = useMemo(() => safeJsonParse(draft.schemaText), [draft.schemaText]);
  const schemaError = useMemo(() => {
    if (!schemaParse.ok) return schemaParse.error;
    return validateSchemaObject(schemaParse.value);
  }, [schemaParse]);

  const previewSchema = schemaParse.ok ? schemaParse.value : null;

  const onChangeWorkspace = async (slug) => {
    setWorkspaceSlug(slug);
    window.localStorage.setItem(STORAGE_KEY, slug);
    setSelectedId(null);
    const list = await SmartPlugins.list(slug);
    setPlugins(list);
    setSelectedId(list.length ? list[0].id : null);
  };

  const refresh = async (slug = workspaceSlug) => {
    if (!slug) return;
    const list = await SmartPlugins.list(slug);
    setPlugins(list);
  };

  const onNew = async () => {
    if (!workspaceSlug) return;
    setCreating(true);
    const payload = {
      name: "New Plugin",
      description: "",
      active: true,
      schema: defaultSchema(),
      uiConfig: { prompt: "" },
    };
    const res = await SmartPlugins.create(workspaceSlug, payload);
    setCreating(false);
    if (!res?.success) {
      showToast(res?.error || "Failed to create plugin", "error");
      return;
    }
    showToast("Plugin created", "success");
    await refresh();
    setSelectedId(res.plugin?.id || null);
  };

  const onSave = async () => {
    if (!workspaceSlug || !draft.id) return;
    if (schemaError) {
      showToast(`Fix schema: ${schemaError}`, "error");
      return;
    }
    const schema = schemaParse.value;

    setSaving(true);
    const res = await SmartPlugins.update(workspaceSlug, draft.id, {
      name: draft.name,
      description: draft.description,
      active: draft.active,
      schema,
      uiConfig: { prompt: draft.prompt || "" },
    });
    setSaving(false);

    if (!res?.success) {
      showToast(res?.error || "Failed to save plugin", "error");
      return;
    }
    showToast("Saved", "success");
    await refresh();
  };

  const onDelete = async () => {
    if (!workspaceSlug || !draft.id) return;
    if (!window.confirm("Delete this plugin?")) return;
    setDeleting(true);
    const res = await SmartPlugins.delete(workspaceSlug, draft.id);
    setDeleting(false);
    if (!res?.success) {
      showToast(res?.error || "Failed to delete plugin", "error");
      return;
    }
    showToast("Deleted", "success");
    await refresh();
    setSelectedId(null);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-theme-bg-container flex">
        <Sidebar />
        <div className="w-full h-full bg-theme-bg-secondary flex items-center justify-center text-theme-text-secondary">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <p className="text-lg leading-6 font-bold text-theme-text-primary">
              Smart Plugins
            </p>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
              Build schema-driven plugins (no executable code). Active plugins are injected into workspace chat instructions.
            </p>
          </div>

          <div className="flex flex-col gap-y-4 mt-6">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex flex-col gap-2 w-full md:w-[420px]">
                <label className="text-xs text-theme-text-secondary">Workspace</label>
                <select
                  value={workspaceSlug}
                  onChange={(e) => onChangeWorkspace(e.target.value)}
                  className="bg-theme-bg-container border border-white/10 rounded-lg px-3 py-2 text-theme-text-primary"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.slug} value={ws.slug}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <CTAButton
                  disabled={creating || !workspaceSlug}
                  onClick={onNew}
                  icon={<Plus className="h-5 w-5" />}
                >
                  New
                </CTAButton>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1 rounded-xl border border-white/10 bg-theme-bg-container p-3">
                <div className="text-sm font-semibold text-theme-text-primary mb-2">Plugins</div>
                {!plugins.length ? (
                  <div className="text-xs text-theme-text-secondary">No plugins yet.</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {plugins.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={`text-left rounded-lg px-3 py-2 border ${selectedId === p.id
                          ? "border-theme-sidebar-border bg-theme-bg-secondary"
                          : "border-transparent hover:bg-theme-bg-secondary"
                          }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-theme-text-primary truncate">{p.name}</div>
                          <div className={`text-[10px] ${p.active ? "text-green-400" : "text-theme-text-secondary"}`}>
                            {p.active ? "ACTIVE" : "OFF"}
                          </div>
                        </div>
                        {p.description ? (
                          <div className="text-xs text-theme-text-secondary truncate">{p.description}</div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 rounded-xl border border-white/10 bg-theme-bg-container p-4">
                {!selected ? (
                  <div className="text-sm text-theme-text-secondary">
                    Select a plugin to edit.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row gap-3 justify-between md:items-center">
                      <div>
                        <div className="text-sm font-semibold text-theme-text-primary">Editor</div>
                        <div className="text-xs text-theme-text-secondary">
                          Saved schema is validated server-side and must contain no HTML/JS.
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <CTAButton
                          disabled={saving}
                          onClick={onSave}
                          icon={<FloppyDisk className="h-5 w-5" />}
                        >
                          Save
                        </CTAButton>
                        <CTAButton
                          disabled={deleting}
                          onClick={onDelete}
                          className="bg-red-600 hover:bg-red-700"
                          icon={<Trash className="h-5 w-5" />}
                        >
                          Delete
                        </CTAButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-theme-text-secondary">Name</label>
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          className="bg-theme-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-theme-text-primary"
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-6">
                        <input
                          id="active"
                          type="checkbox"
                          checked={draft.active}
                          onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
                        />
                        <label htmlFor="active" className="text-sm text-theme-text-primary">
                          Active (inject into chat)
                        </label>
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-xs text-theme-text-secondary">Description</label>
                        <textarea
                          value={draft.description}
                          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                          rows={2}
                          className="bg-theme-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-theme-text-primary"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-xs text-theme-text-secondary">Prompt notes (optional)</label>
                        <textarea
                          value={draft.prompt}
                          onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
                          rows={2}
                          className="bg-theme-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-theme-text-primary"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-theme-text-primary">Schema (JSON)</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDraft((d) => ({ ...d, schemaText: JSON.stringify(rateCardSchema(), null, 2) }))}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Calculator size={12} />
                            Rate Card Template
                          </button>
                          <button
                            onClick={() => setDraft((d) => ({ ...d, schemaText: JSON.stringify(defaultSchema(), null, 2) }))}
                            className="text-xs text-theme-text-secondary hover:text-white"
                          >
                            Reset sample
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={draft.schemaText}
                        onChange={(e) => setDraft((d) => ({ ...d, schemaText: e.target.value }))}
                        rows={12}
                        className="mt-2 w-full font-mono text-xs bg-theme-bg-secondary border border-white/10 rounded-lg px-3 py-2 text-theme-text-primary"
                      />
                      {schemaError ? (
                        <div className="text-xs text-red-400 mt-2">{schemaError}</div>
                      ) : (
                        <div className="text-xs text-theme-text-secondary mt-2">Schema looks valid.</div>
                      )}
                    </div>

                    <div className="mt-6">
                      <div className="text-sm font-semibold text-theme-text-primary mb-2">
                        Preview {previewSchema?.fields?.some(f => f.type === "calculated") && (
                          <span className="text-xs text-blue-400 font-normal ml-2">
                            (Interactive - try editing!)
                          </span>
                        )}
                      </div>
                      {previewSchema?.fields?.some(f => f.type === "calculated") ? (
                        <InteractiveTable
                          schema={previewSchema}
                          rows={[{
                            role: "Senior Developer",
                            rate: 150,
                            hours: 40,
                            discount: 0.1,
                          }]}
                        />
                      ) : (
                        <UniversalTable schema={previewSchema} rows={[]} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
