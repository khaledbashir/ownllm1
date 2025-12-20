import { baseHeaders } from "@/utils/request";

const CRM = {
  // ============================================
  // PIPELINES
  // ============================================

  listPipelines: async () => {
    return fetch(`/api/crm/pipelines`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error listing pipelines:", e);
        return { success: false, error: e.message, pipelines: [] };
      });
  },

  createPipeline: async (data) => {
    return fetch(`/api/crm/pipelines`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error creating pipeline:", e);
        return { success: false, error: e.message };
      });
  },

  updatePipeline: async (id, data) => {
    return fetch(`/api/crm/pipelines/${id}`, {
      method: "PUT",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error updating pipeline:", e);
        return { success: false, error: e.message };
      });
  },

  deletePipeline: async (id) => {
    return fetch(`/api/crm/pipelines/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error deleting pipeline:", e);
        return { success: false, error: e.message };
      });
  },

  // ============================================
  // CARDS
  // ============================================

  listCards: async (pipelineId) => {
    return fetch(`/api/crm/cards?pipelineId=${pipelineId}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error listing cards:", e);
        return { success: false, error: e.message, cards: [] };
      });
  },

  createCard: async (data) => {
    return fetch(`/api/crm/cards`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error creating card:", e);
        return { success: false, error: e.message };
      });
  },

  updateCard: async (id, data) => {
    return fetch(`/api/crm/cards/${id}`, {
      method: "PUT",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error updating card:", e);
        return { success: false, error: e.message };
      });
  },

  moveCard: async (id, stage, position) => {
    return fetch(`/api/crm/cards/${id}/move`, {
      method: "PUT",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stage, position }),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error moving card:", e);
        return { success: false, error: e.message };
      });
  },

  deleteCard: async (id) => {
    return fetch(`/api/crm/cards/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("[CRM] Error deleting card:", e);
        return { success: false, error: e.message };
      });
  },
};

export default CRM;
