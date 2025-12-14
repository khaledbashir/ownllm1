const prisma = require("../utils/prisma");

/**
 * Integration Vault - stores user's API keys, webhooks, and configs
 * Flow Builder checks this FIRST before asking user questions
 */
const IntegrationVault = {
    /**
     * Get a specific service config from vault
     */
    get: async function (userId, service) {
        try {
            const entry = await prisma.integration_vault.findFirst({
                where: {
                    userId: userId || null,
                    service: service.toLowerCase(),
                    isActive: true,
                },
                orderBy: { updatedAt: "desc" },
            });

            if (!entry) return null;

            // Parse the config JSON
            try {
                return {
                    id: entry.id,
                    service: entry.service,
                    name: entry.name,
                    category: entry.category,
                    config: JSON.parse(entry.configJson),
                };
            } catch {
                return null;
            }
        } catch (error) {
            console.error("[Vault] Get error:", error.message);
            return null;
        }
    },

    /**
     * Get all active vault entries for a user
     */
    getAll: async function (userId) {
        try {
            const entries = await prisma.integration_vault.findMany({
                where: {
                    userId: userId || null,
                    isActive: true,
                },
                orderBy: { service: "asc" },
            });

            return entries.map((e) => ({
                id: e.id,
                service: e.service,
                name: e.name,
                category: e.category,
                config: JSON.parse(e.configJson || "{}"),
                createdAt: e.createdAt,
            }));
        } catch (error) {
            console.error("[Vault] GetAll error:", error.message);
            return [];
        }
    },

    /**
     * Check if a service exists in vault (without returning secrets)
     */
    has: async function (userId, service) {
        try {
            const count = await prisma.integration_vault.count({
                where: {
                    userId: userId || null,
                    service: service.toLowerCase(),
                    isActive: true,
                },
            });
            return count > 0;
        } catch {
            return false;
        }
    },

    /**
     * Save/update a vault entry
     */
    save: async function (userId, { service, name, config, category }) {
        try {
            const existing = await prisma.integration_vault.findFirst({
                where: {
                    userId: userId || null,
                    service: service.toLowerCase(),
                    name: name,
                },
            });

            if (existing) {
                const updated = await prisma.integration_vault.update({
                    where: { id: existing.id },
                    data: {
                        configJson: JSON.stringify(config),
                        category: category || existing.category,
                        isActive: true,
                    },
                });
                return { success: true, entry: updated };
            }

            const created = await prisma.integration_vault.create({
                data: {
                    service: service.toLowerCase(),
                    name: name,
                    configJson: JSON.stringify(config),
                    category: category || "integration",
                    userId: userId || null,
                    isActive: true,
                },
            });

            return { success: true, entry: created };
        } catch (error) {
            console.error("[Vault] Save error:", error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete a vault entry
     */
    delete: async function (userId, entryId) {
        try {
            await prisma.integration_vault.deleteMany({
                where: {
                    id: entryId,
                    userId: userId || null,
                },
            });
            return { success: true };
        } catch (error) {
            console.error("[Vault] Delete error:", error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Search vault for matching services (for Flow Builder tool)
     */
    search: async function (userId, query) {
        try {
            const entries = await prisma.integration_vault.findMany({
                where: {
                    userId: userId || null,
                    isActive: true,
                    OR: [
                        { service: { contains: query.toLowerCase() } },
                        { name: { contains: query } },
                        { category: { contains: query.toLowerCase() } },
                    ],
                },
                take: 5,
            });

            return entries.map((e) => ({
                service: e.service,
                name: e.name,
                category: e.category,
                // Don't expose full config in search - just metadata
                hasConfig: !!e.configJson,
            }));
        } catch {
            return [];
        }
    },
};

module.exports = { IntegrationVault };
