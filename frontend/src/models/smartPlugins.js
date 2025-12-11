import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

export default class SmartPlugins {
  static async list(workspaceSlug) {
    if (!workspaceSlug) return [];
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.plugins || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  }

  static async create(workspaceSlug, data) {
    if (!workspaceSlug) return { success: false, error: "Missing workspace" };
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/smart-plugins`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
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
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
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
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }
}
