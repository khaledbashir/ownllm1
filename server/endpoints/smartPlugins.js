const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");
const {
  ROLES,
  flexUserRoleValid,
} = require("../utils/middleware/multiUserProtected");
const { SmartPlugins } = require("../models/smartPlugins");

function coerceId(value) {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

function smartPluginsEndpoints(app) {
  if (!app) return;

  // List plugins for workspace
  app.get(
    "/workspace/:slug/smart-plugins",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (_request, response) => {
      try {
        const workspace = response.locals.workspace;
        const plugins = await SmartPlugins.listForWorkspace(workspace.id);
        response.status(200).json({ success: true, plugins });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, error: "Could not fetch plugins" });
      }
    }
  );

  // Create plugin
  app.post(
    "/workspace/:slug/smart-plugins",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager]),
      validWorkspaceSlug,
    ],
    async (request, response) => {
      try {
        const workspace = response.locals.workspace;
        const user = response.locals.user;
        const result = await SmartPlugins.createForWorkspace({
          workspaceId: workspace.id,
          createdBy: user?.id ?? null,
          payload: request.body,
        });

        if (!result.ok) {
          response.status(400).json({ success: false, error: result.error });
          return;
        }

        response.status(200).json({ success: true, plugin: result.plugin });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, error: "Could not create plugin" });
      }
    }
  );

  // Update plugin
  app.put(
    "/workspace/:slug/smart-plugins/:id",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager]),
      validWorkspaceSlug,
    ],
    async (request, response) => {
      try {
        const workspace = response.locals.workspace;
        const id = coerceId(request.params.id);
        if (!id) {
          response
            .status(400)
            .json({ success: false, error: "Invalid plugin id" });
          return;
        }

        const result = await SmartPlugins.updateInWorkspace({
          workspaceId: workspace.id,
          id,
          payload: request.body,
        });

        if (!result.ok) {
          response
            .status(result.error === "Plugin not found" ? 404 : 400)
            .json({
              success: false,
              error: result.error,
            });
          return;
        }
        response.status(200).json({ success: true, plugin: result.plugin });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, error: "Could not update plugin" });
      }
    }
  );

  // Delete plugin
  app.delete(
    "/workspace/:slug/smart-plugins/:id",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager]),
      validWorkspaceSlug,
    ],
    async (request, response) => {
      try {
        const workspace = response.locals.workspace;
        const id = coerceId(request.params.id);
        if (!id) {
          response
            .status(400)
            .json({ success: false, error: "Invalid plugin id" });
          return;
        }

        const result = await SmartPlugins.deleteInWorkspace({
          workspaceId: workspace.id,
          id,
        });
        if (!result.ok) {
          response.status(404).json({ success: false, error: result.error });
          return;
        }
        response.status(200).json({ success: true });
      } catch (e) {
        console.error(e);
        response
          .status(500)
          .json({ success: false, error: "Could not delete plugin" });
      }
    }
  );
}

module.exports = { smartPluginsEndpoints };
