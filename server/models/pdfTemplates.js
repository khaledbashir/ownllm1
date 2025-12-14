const prisma = require("../utils/prisma");

/**
 * PdfTemplates Model
 * PDF branding templates for exports
 */
const PdfTemplates = {
    /**
     * Create a new PDF template
     * @param {Object} params
     * @param {number|null} params.userId
     * @param {Object} params.data - Template data
     * @returns {Promise<{ok: boolean, template?: Object, error?: string}>}
     */
    async create({ userId = null, data }) {
        const {
            name,
            logoPath,
            headerText,
            footerText,
            primaryColor = "#3b82f6",
            secondaryColor = "#1e293b",
            fontFamily = "Inter",
            backgroundImage,
            cssOverrides,
            isDefault = false,
        } = data;

        if (!name) {
            return { ok: false, error: "Template name is required" };
        }

        try {
            // If setting as default, unset other defaults for this user
            if (isDefault) {
                await prisma.pdf_templates.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            const template = await prisma.pdf_templates.create({
                data: {
                    name,
                    logoPath,
                    headerText,
                    footerText,
                    primaryColor,
                    secondaryColor,
                    fontFamily,
                    backgroundImage,
                    cssOverrides,
                    isDefault,
                    userId,
                },
            });
            return { ok: true, template };
        } catch (error) {
            console.error("PdfTemplates.create error:", error);
            return { ok: false, error: "Could not create template" };
        }
    },

    /**
     * Update an existing template
     * @param {number} id
     * @param {number|null} userId
     * @param {Object} data
     * @returns {Promise<{ok: boolean, template?: Object, error?: string}>}
     */
    async update(id, userId, data) {
        try {
            const existing = await prisma.pdf_templates.findFirst({
                where: { id, userId },
            });
            if (!existing) {
                return { ok: false, error: "Template not found" };
            }

            // If setting as default, unset other defaults
            if (data.isDefault) {
                await prisma.pdf_templates.updateMany({
                    where: { userId, isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                });
            }

            const template = await prisma.pdf_templates.update({
                where: { id },
                data,
            });
            return { ok: true, template };
        } catch (error) {
            console.error("PdfTemplates.update error:", error);
            return { ok: false, error: "Could not update template" };
        }
    },

    /**
     * List templates for a user (including system defaults)
     * @param {number|null} userId
     * @returns {Promise<Object[]>}
     */
    async listForUser(userId) {
        try {
            return await prisma.pdf_templates.findMany({
                where: {
                    OR: [{ userId }, { userId: null }],
                },
                orderBy: { createdAt: "desc" },
            });
        } catch (error) {
            console.error("PdfTemplates.listForUser error:", error);
            return [];
        }
    },

    /**
     * Get the default template for a user
     * @param {number|null} userId
     * @returns {Promise<Object|null>}
     */
    async getDefault(userId) {
        try {
            return await prisma.pdf_templates.findFirst({
                where: {
                    OR: [{ userId, isDefault: true }, { userId: null, isDefault: true }],
                },
                orderBy: { userId: "desc" }, // User's default takes precedence
            });
        } catch {
            return null;
        }
    },

    /**
     * Get a template by ID
     * @param {number} id
     * @returns {Promise<Object|null>}
     */
    async get(id) {
        try {
            return await prisma.pdf_templates.findUnique({ where: { id } });
        } catch {
            return null;
        }
    },

    /**
     * Delete a template
     * @param {number} id
     * @param {number|null} userId
     * @returns {Promise<{ok: boolean, error?: string}>}
     */
    async delete(id, userId) {
        try {
            const existing = await prisma.pdf_templates.findFirst({
                where: { id, userId },
            });
            if (!existing) {
                return { ok: false, error: "Template not found" };
            }

            await prisma.pdf_templates.delete({ where: { id } });
            return { ok: true };
        } catch (error) {
            console.error("PdfTemplates.delete error:", error);
            return { ok: false, error: "Could not delete template" };
        }
    },
};

module.exports = { PdfTemplates };
