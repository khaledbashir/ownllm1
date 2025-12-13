import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

async function readJsonOrText(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      // fall through to text
    }
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text || "Invalid server response" };
  }
}

export default class SmartPlugins {
  static async list(workspaceSlug) {
    if (!workspaceSlug) return [];
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then(async (res) => {
        const payload = await readJsonOrText(res);
        if (!res.ok) return [];
        return payload.plugins || [];
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  }

  static async create(workspaceSlug, data) {
    if (!workspaceSlug) return { success: false, error: "Missing workspace" };
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const payload = await readJsonOrText(res);
        if (res.ok) return payload;
        return { success: false, error: payload?.error || "Request failed" };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }

  static async update(workspaceSlug, id, data) {
    if (!workspaceSlug || !id)
      return { success: false, error: "Missing workspace or plugin id" };
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins/${id}`, {
      method: "PUT",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const payload = await readJsonOrText(res);
        if (res.ok) return payload;
        return { success: false, error: payload?.error || "Request failed" };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }

  static async delete(workspaceSlug, id) {
    if (!workspaceSlug || !id)
      return { success: false, error: "Missing workspace or plugin id" };
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then(async (res) => {
        const payload = await readJsonOrText(res);
        if (res.ok) return payload;
        return { success: false, error: payload?.error || "Request failed" };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }
}
