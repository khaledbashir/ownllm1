import { API_BASE } from "../utils/constants";
import { baseHeaders } from "../utils/request";

export default class BlockTemplate {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.snapshot = data.snapshot; // Can be string or object
        this.workspaceId = data.workspaceId;
        this.isGlobal = data.isGlobal;
        this.createdAt = data.createdAt;
    }

    static async create(workspaceSlug, { name, description, snapshot }) {
        const res = await fetch(`${API_BASE}/workspace/${workspaceSlug}/block-templates`, {
            method: "POST",
            headers: baseHeaders(),
            body: JSON.stringify({ name, description, snapshot }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create template");
        return new BlockTemplate(data.template);
    }

    static async list(workspaceSlug) {
        const res = await fetch(`${API_BASE}/workspace/${workspaceSlug}/block-templates`, {
            headers: baseHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to list templates");
        return data.templates.map((t) => new BlockTemplate(t));
    }

    static async get(id) {
        const res = await fetch(`${API_BASE}/block-templates/${id}`, {
            headers: baseHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get template");
        return new BlockTemplate(data.template);
    }

    static async delete(id) {
        const res = await fetch(`${API_BASE}/block-templates/${id}`, {
            method: "DELETE",
            headers: baseHeaders(),
        });
        if (!res.ok) throw new Error("Failed to delete template");
        return true;
    }
}
