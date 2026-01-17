import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const MCPServers = {
  /**
   * Forces a reload of the MCP Hypervisor and its servers
   * @returns {Promise<{success: boolean, error: string | null, servers: Array<{name: string, running: boolean, tools: Array<{name: string, description: string, inputSchema: Object}>, error: string | null, process: {pid: number, cmd: string} | null}>}>}
   */
  forceReload: async () => {
    return await fetch(`${API_BASE}/mcp-servers/force-reload`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        servers: [],
        success: false,
        error: e.message,
      }));
  },

  /**
   * List all available MCP servers in the system
   * @returns {Promise<{success: boolean, error: string | null, servers: Array<{name: string, running: boolean, tools: Array<{name: string, description: string, inputSchema: Object}>, error: string | null, process: {pid: number, cmd: string} | null}>}>}
   */
  listServers: async () => {
    return await fetch(`${API_BASE}/mcp-servers/list`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        servers: [],
      }));
  },

  /**
   * Toggle the MCP server (start or stop)
   * @param {string} name - The name of the MCP server to toggle
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  toggleServer: async (name) => {
    return await fetch(`${API_BASE}/mcp-servers/toggle`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Delete the MCP server - will also remove it from the config file
   * @param {string} name - The name of the MCP server to delete
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  deleteServer: async (name) => {
    return await fetch(`${API_BASE}/mcp-servers/delete`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },
  /**
   * Add new MCP server to config file
   * @param {Object} config - MCP server configuration
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  addServer: async (config) => {
    return await fetch(`${API_BASE}/mcp-servers/add`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(config),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Edit existing MCP server in config file
   * @param {string} name - Name of server to edit
   * @param {Object} updates - Fields to update
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  editServer: async (name, updates) => {
    return await fetch(`${API_BASE}/mcp-servers/edit`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ name, updates }),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Validate MCP server configuration
   * @param {Object} config - MCP server configuration to validate
   * @returns {Promise<{valid: boolean, error: string | null, warnings: Array<string>}>}
   */
  validateServer: async (config) => {
    return await fetch(`${API_BASE}/mcp-servers/validate`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(config),
    })
      .then((res) => res.json())
      .catch((e) => ({
        valid: false,
        error: e.message,
        warnings: [],
      }));
  },
};

export default MCPServers;
