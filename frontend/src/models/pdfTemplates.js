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
        return await fetch(`${API_BASE}/templates`, {
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

    static async update(id, data) {
        return await fetch(`${API_BASE}/templates/${id}`, {
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
