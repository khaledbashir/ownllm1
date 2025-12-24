import { fetchNew } from "./system";

const Organization = {
  /**
   * Get all organizations (super admin only)
   * @returns {Promise<Object>} Response with organizations array
   */
  getAll: async () => {
    return await fetchNew(`/organizations`, {
      method: "GET",
    });
  },

  /**
   * Get a single organization by ID
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with organization object
   */
  get: async (id) => {
    return await fetchNew(`/organizations/${id}`, {
      method: "GET",
    });
  },

  /**
   * Get organization statistics
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with organization statistics
   */
  getStats: async (id) => {
    return await fetchNew(`/organizations/${id}/stats`, {
      method: "GET",
    });
  },

  /**
   * Get users in an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with users array
   */
  getUsers: async (id) => {
    return await fetchNew(`/organizations/${id}/users`, {
      method: "GET",
    });
  },

  /**
   * Get workspaces in an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with workspaces array
   */
  getWorkspaces: async (id) => {
    return await fetchNew(`/organizations/${id}/workspaces`, {
      method: "GET",
    });
  },

  /**
   * Get remaining seats for an organization
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with remaining seats count
   */
  getRemainingSeats: async (id) => {
    return await fetchNew(`/organizations/${id}/remaining-seats`, {
      method: "GET",
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
    return await fetchNew(`/organizations/new`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an organization
   * @param {number} id - Organization ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Response with success status
   */
  update: async (id, updates) => {
    return await fetchNew(`/organizations/${id}`, {
      method: "POST",
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete an organization (super admin only)
   * @param {number} id - Organization ID
   * @returns {Promise<Object>} Response with success status
   */
  delete: async (id) => {
    return await fetchNew(`/organizations/${id}`, {
      method: "DELETE",
    });
  },
};

export default Organization;
