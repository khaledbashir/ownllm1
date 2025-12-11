const prisma = require("../utils/prisma");
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

            if (!name || !code) {
                response.status(400).json({ success: false, error: "Missing required fields" });
                return;
            }

            const artifact = await prisma.artifacts.create({
                data: {
                    name,
                    code,
                    language: language || "text",
                    workspaceId: workspace.id,
                    userId: user ? user.id : null,
                },
            });

            response.status(200).json({ success: true, artifact });
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
        async (request, response) => {
        try {
            const workspace = response.locals.workspace;
            const artifacts = await prisma.artifacts.findMany({
                where: { workspaceId: workspace.id },
                orderBy: { createdAt: "desc" },
                include: { user: { select: { username: true } } }
            });

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

            const existing = await prisma.artifacts.findFirst({
                where: { id, workspaceId: workspace.id },
            });
            if (!existing) {
                response.status(404).json({ success: false, error: "Artifact not found" });
                return;
            }

            await prisma.artifacts.delete({ where: { id } });
            response.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            response.status(500).json({ success: false, error: "Could not delete artifact" });
        }
        }
    );
}

module.exports = { artifactsEndpoints };
