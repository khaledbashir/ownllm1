import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const Organization = {
  /**
   * Get all organizations (super admin only)
   * @returns {Promise<Object>} Response with organizations array
   */
  getAll: async () => {
    return await fetch(`${API_BASE}/organizations`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching organizations:", e);
        return { organizations: [], error: e.message };
      });
  },

  /**
   * Get a single organization by ID
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with organization object
   */
  get: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching organization:", e);
        return { organization: null, error: e.message };
      });
  },

  /**
   * Get organization statistics
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with organization statistics
   */
  getStats: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}/stats`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching organization stats:", e);
        return { stats: null, error: e.message };
      });
  },

  /**
   * Get users in an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with users array
   */
  getUsers: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}/users`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching organization users:", e);
        return { users: [], error: e.message };
      });
  },

  /**
   * Get workspaces in an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with workspaces array
   */
  getWorkspaces: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}/workspaces`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching organization workspaces:", e);
        return { workspaces: [], error: e.message };
      });
  },

  /**
   * Get remaining seats for an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with remaining seats count
   */
  getRemainingSeats: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}/remaining-seats`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error fetching remaining seats:", e);
        return { remainingSeats: 0, error: e.message };
      });
  },

  /**
   * Create a new organization (super admin only)
   * @param {Object} data - Organization data
   * @param {string} data.name - Organization name
   * @param {string} data.slug - Organization slug (URL-friendly identifier)
   * @param {string} data.plan - Plan: "free", "pro", "enterprise"
   * @param {number|null} data.seatLimit - Maximum number of users (null = unlimited)
   * @returns {Promise<Object>} Response with created organization
   */
  create: async (data) => {
    return await fetch(`${API_BASE}/organizations/new`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error creating organization:", e);
        return { organization: null, error: e.message };
      });
  },

  /**
   * Update an organization
   * @param {number} id - Organization ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Response with success status
   */
  update: async (id, updates) => {
    return await fetch(`${API_BASE}/organizations/${id}`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .catch((e) => {
        console.error("Error updating organization:", e);
        return { success: false, error: e.message };
      });
  },

  /**
   * Delete an organization (super admin only)
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with success status
   */
  delete: async (id) => {
    return await fetch(`${API_BASE}/organizations/${id}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.ok)
      .catch((e) => {
        console.error("Error deleting organization:", e);
        return false;
      });
  },
};

export default Organization;
