const { IntegrationVault } = require("../models/integrationVault");
const { PublicApiRegistry } = require("../models/publicApiRegistry");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");

/**
 * Vault endpoints for managing integration configs
 */
function vaultEndpoints(app) {
    if (!app) return;

    // List all vault entries for user
    app.get(
        "/vault",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const entries = await IntegrationVault.getAll(user?.id);
                response.status(200).json({ success: true, entries });
            } catch (error) {
                console.error("[Vault] List error:", error);
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Get specific service from vault
    app.get(
        "/vault/:service",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { service } = request.params;
                const entry = await IntegrationVault.get(user?.id, service);

                if (!entry) {
                    return response.status(404).json({ success: false, error: "Not found" });
                }

                response.status(200).json({ success: true, entry });
            } catch (error) {
                console.error("[Vault] Get error:", error);
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Save vault entry
    app.post(
        "/vault",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { service, name, config, category } = request.body;

                if (!service || !name) {
                    return response.status(400).json({
                        success: false,
                        error: "Service and name are required",
                    });
                }

                const result = await IntegrationVault.save(user?.id, {
                    service,
                    name,
                    config: config || {},
                    category,
                });

                response.status(200).json(result);
            } catch (error) {
                console.error("[Vault] Save error:", error);
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Delete vault entry
    app.delete(
        "/vault/:id",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { id } = request.params;
                const result = await IntegrationVault.delete(user?.id, parseInt(id));
                response.status(200).json(result);
            } catch (error) {
                console.error("[Vault] Delete error:", error);
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Search vault (for Flow Builder tool)
    app.get(
        "/vault/search/:query",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { query } = request.params;
                const results = await IntegrationVault.search(user?.id, query);
                response.status(200).json({ success: true, results });
            } catch (error) {
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // =========================================
    // Public API Registry
    // =========================================

    // Search public APIs
    app.get(
        "/public-apis/search/:query",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const { query } = request.params;
                const results = await PublicApiRegistry.search(query);
                response.status(200).json({ success: true, results });
            } catch (error) {
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Get APIs by category
    app.get(
        "/public-apis/category/:category",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const { category } = request.params;
                const apis = await PublicApiRegistry.findByCategory(category);
                response.status(200).json({ success: true, apis });
            } catch (error) {
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Seed public API registry (admin only)
    app.post(
        "/public-apis/seed",
        [validatedRequest, flexUserRoleValid([ROLES.admin])],
        async (_request, response) => {
            try {
                const result = await PublicApiRegistry.seed();
                response.status(200).json(result);
            } catch (error) {
                response.status(500).json({ success: false, error: error.message });
            }
        }
    );
}

module.exports = { vaultEndpoints };
