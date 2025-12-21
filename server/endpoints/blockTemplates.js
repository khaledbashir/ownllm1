/* eslint-disable no-console */
const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");

function blockTemplatesEndpoints(app) {
  if (!app) return;

  // List templates for a workspace (metadata only)
  app.get(
    "/workspace/:slug/block-templates",
    validatedRequest,
    async (req, res) => {
      try {
        const { slug } = req.params;
        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!workspace) {
          return res.status(404).json({ error: "Workspace not found" });
        }

        const templates = await prisma.block_templates.findMany({
          where: { workspaceId: workspace.id },
          select: {
            id: true,
            name: true,
            description: true,
            isGlobal: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ templates });
      } catch (error) {
        console.error("[BlockTemplates] List error:", error);
        res
          .status(500)
          .json({
            error: "Failed to list block templates",
            details: error.message,
          });
      }
    }
  );

  // Get single template snapshot (full content)
  app.get("/block-templates/:id", validatedRequest, async (req, res) => {
    try {
      const { id } = req.params;
      const template = await prisma.block_templates.findUnique({
        where: { id: parseInt(id) },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Return the full template including snapshot
      res.status(200).json({ template });
    } catch (error) {
      console.error("[BlockTemplates] Get error:", error);
      res.status(500).json({ error: "Failed to get template" });
    }
  });

  // Create template
  app.post(
    "/workspace/:slug/block-templates",
    validatedRequest,
    async (req, res) => {
      try {
        const { slug } = req.params;
        const { name, description, snapshot } = req.body;
        const user = req.user;

        if (!name || !snapshot) {
          return res
            .status(400)
            .json({ error: "Name and snapshot are required" });
        }

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!workspace)
          return res.status(404).json({ error: "Workspace not found" });

        const template = await prisma.block_templates.create({
          data: {
            name,
            description,
            snapshot:
              typeof snapshot === "object"
                ? JSON.stringify(snapshot)
                : snapshot,
            workspaceId: workspace.id,
            createdBy: user ? user.id : null,
          },
        });

        res.status(201).json({ success: true, template });
      } catch (error) {
        console.error("[BlockTemplates] Create error:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to create template" });
      }
    }
  );

  // Delete template
  app.delete("/block-templates/:id", validatedRequest, async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.block_templates.delete({
        where: { id: parseInt(id) },
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("[BlockTemplates] Delete error:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });
}

module.exports = { blockTemplatesEndpoints };
