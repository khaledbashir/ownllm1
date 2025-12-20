import { baseHeaders } from "@/utils/request";
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default class PdfTemplates {
  static async list() {
    return await fetch(`${API_BASE}/templates`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => res.templates || [])
      .catch((e) => {
        console.error(e);
        return [];
      });
  }

  static async create(data) {
    try {
      const response = await fetch(`${API_BASE}/templates`, {
        method: "POST",
        headers: {
          ...baseHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch((e) => {
        console.error("[PdfTemplates] JSON parse error:", e);
        return { success: false, error: "Invalid server response" };
      });

      console.log("[PdfTemplates] Response payload:", payload);

      if (response.ok) return payload;
      return { success: false, error: payload?.error || "Request failed" };
    } catch (e) {
      console.error("[PdfTemplates] Network error:", e);
      return { success: false, error: e.message };
    }
  }

  static async update(id, data) {
    return await fetch(`${API_BASE}/templates/${id}`, {
      method: "PUT",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const payload = await res
          .json()
          .catch(() => ({ success: false, error: "Invalid server response" }));
        if (res.ok) return payload;
        return { success: false, error: payload?.error || "Request failed" };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, error: e.message };
      });
  }

  static async delete(id) {
    return await fetch(`${API_BASE}/templates/${id}`, {
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
