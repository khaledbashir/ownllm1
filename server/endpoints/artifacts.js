const { Artifacts } = require("../models/artifacts");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
    ROLES,
    flexUserRoleValid,
} = require("../utils/middleware/multiUserProtected");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");

function coerceId(value) {
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
}

function artifactsEndpoints(app) {
    if (!app) return;

    // Save artifact to a workspace (workspace-scoped)
    app.post(
        "/workspace/:slug/artifacts/save",
        [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const workspace = response.locals.workspace;
                const { name, code, language } = request.body;

                const result = await Artifacts.save({
                    workspaceId: workspace.id,
                    userId: user?.id ?? null,
                    name,
                    code,
                    language,
                });

                if (!result.ok) {
                    response.status(400).json({ success: false, error: result.error });
                    return;
                }

                response.status(200).json({ success: true, artifact: result.artifact });
            } catch (e) {
                console.error(e);
                response.status(500).json({ success: false, error: "Could not save artifact" });
            }
        }
    );

    // List artifacts for a workspace (workspace-scoped)
    app.get(
        "/workspace/:slug/artifacts",
        [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
        async (_request, response) => {
            try {
                const workspace = response.locals.workspace;
                const artifacts = await Artifacts.listForWorkspace(workspace.id);
                response.status(200).json({ success: true, artifacts });
            } catch (e) {
                console.error(e);
                response.status(500).json({ success: false, error: "Could not fetch artifacts" });
            }
        }
    );

    // Delete an artifact (must belong to the workspace in URL)
    app.delete(
        "/workspace/:slug/artifacts/:id",
        [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
        async (request, response) => {
            try {
                const workspace = response.locals.workspace;
                const id = coerceId(request.params.id);
                if (!id) {
                    response.status(400).json({ success: false, error: "Invalid artifact id" });
                    return;
                }

                const result = await Artifacts.delete(workspace.id, id);
                if (!result.ok) {
                    response.status(404).json({ success: false, error: result.error });
                    return;
                }
                response.status(200).json({ success: true });
            } catch (e) {
                console.error(e);
                response.status(500).json({ success: false, error: "Could not delete artifact" });
            }
        }
    );
}

module.exports = { artifactsEndpoints };

