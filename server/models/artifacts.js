const prisma = require("../utils/prisma");

/**
 * Artifacts Model
 * Workspace-scoped code artifacts storage
 */
const Artifacts = {
  /**
   * Save an artifact to a workspace
   * @param {Object} params
   * @param {number} params.workspaceId
   * @param {number|null} params.userId
   * @param {string} params.name
   * @param {string} params.code
   * @param {string} params.language
   * @returns {Promise<{ok: boolean, artifact?: Object, error?: string}>}
   */
  async save({ workspaceId, userId = null, name, code, language = "text" }) {
    if (!name || !code) {
      return { ok: false, error: "Name and code are required" };
    }

    try {
      const artifact = await prisma.artifacts.create({
        data: {
          name,
          code,
          language,
          workspaceId,
          userId,
        },
      });
      return { ok: true, artifact };
    } catch (error) {
      console.error("Artifacts.save error:", error);
      return { ok: false, error: "Could not save artifact" };
    }
  },

  /**
   * List all artifacts for a workspace
   * @param {number} workspaceId
   * @returns {Promise<Object[]>}
   */
  async listForWorkspace(workspaceId) {
    try {
      return await prisma.artifacts.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true } } },
      });
    } catch (error) {
      console.error("Artifacts.listForWorkspace error:", error);
      return [];
    }
  },

  /**
   * Get a single artifact by ID (must belong to workspace)
   * @param {number} workspaceId
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async get(workspaceId, id) {
    try {
      return await prisma.artifacts.findFirst({
        where: { id, workspaceId },
      });
    } catch {
      return null;
    }
  },

  /**
   * Delete an artifact (must belong to workspace)
   * @param {number} workspaceId
   * @param {number} id
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async delete(workspaceId, id) {
    try {
      const existing = await prisma.artifacts.findFirst({
        where: { id, workspaceId },
      });
      if (!existing) {
        return { ok: false, error: "Artifact not found" };
      }

      await prisma.artifacts.delete({ where: { id } });
      return { ok: true };
    } catch (error) {
      console.error("Artifacts.delete error:", error);
      return { ok: false, error: "Could not delete artifact" };
    }
  },
};

module.exports = { Artifacts };
