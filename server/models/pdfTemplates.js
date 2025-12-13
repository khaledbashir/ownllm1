const prisma = require("../utils/prisma");

const PdfTemplates = {
    create: async (data = {}, userId = null) => {
        try {
            const template = await prisma.pdf_templates.create({
                data: {
                    name: data.name,
                    logoPath: data.logoPath,
                    headerText: data.headerText,
                    footerText: data.footerText,
                    primaryColor: data.primaryColor || "#3b82f6",
                    secondaryColor: data.secondaryColor || "#1e293b",
                    fontFamily: data.fontFamily || "Inter",
                    userId: userId,
                    isDefault: data.isDefault || false,
                },
            });
            return { template, message: "Template created successfully" };
        } catch (e) {
            console.error(e.message, e);
            return { template: null, message: e.message };
        }
    },

    list: async (userId = null) => {
        try {
            // Fetch system templates (userId null) + user templates
            const where = userId ? { OR: [{ userId: null }, { userId }] } : {};
            const templates = await prisma.pdf_templates.findMany({
                where,
                orderBy: { createdAt: "desc" },
            });
            return templates;
        } catch (e) {
            console.error(e.message, e);
            return [];
        }
    },

    update: async (id, data) => {
        try {
            const template = await prisma.pdf_templates.update({
                where: { id: parseInt(id) },
                data,
            });
            return { template, message: "Template updated successfully" };
        } catch (e) {
            console.error(e.message, e);
            return { template: null, message: e.message };
        }
    },

    delete: async (id) => {
        try {
            await prisma.pdf_templates.delete({
                where: { id: parseInt(id) },
            });
            return true;
        } catch (e) {
            console.error(e.message, e);
            return false;
        }
    },
};

module.exports = PdfTemplates;
