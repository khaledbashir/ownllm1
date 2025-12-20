import { baseHeaders } from "@/utils/request";
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default class Artifacts {
  static async save(workspaceSlug, data) {
    if (!workspaceSlug) return { success: false, error: "Missing workspace" };
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/artifacts/save`,
      {
        method: "POST",
        headers: baseHeaders(),
        body: JSON.stringify(data),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }

  static async forWorkspace(workspaceSlug) {
    if (!workspaceSlug) return [];
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/artifacts`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.artifacts || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  }

  static async delete(workspaceSlug, id) {
    if (!workspaceSlug || !id)
      return { success: false, error: "Missing workspace or artifact id" };
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/artifacts/${id}`,
      {
        method: "DELETE",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }
}
