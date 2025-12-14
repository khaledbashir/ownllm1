const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid } = require("../utils/middleware/multiUserProtected");

function templatesEndpoints(app) {
    if (!app) return;

    // List all templates for the current user
    app.get("/templates", [validatedRequest, flexUserRoleValid], async (request, response) => {
        try {
            const user = response.locals.user;
            const templates = await prisma.pdf_templates.findMany({
                where: { userId: user ? user.id : null },
                orderBy: { createdAt: "desc" },
            });
            response.status(200).json({ success: true, templates });
        } catch (e) {
            console.error(e);
            response.status(500).json({ success: false, error: "Could not fetch templates" });
        }
    });

    // Create a new template
    app.post("/templates", [validatedRequest, flexUserRoleValid], async (request, response) => {
        try {
            const user = response.locals.user;
            const { name, logoPath, headerText, footerText, primaryColor, secondaryColor, fontFamily, isDefault, backgroundImage, cssOverrides } = request.body;

            if (!name) {
                return response.status(400).json({ success: false, error: "Template name is required" });
            }

            // If this is being set as default, unset other defaults for this user
            if (isDefault && user) {
                await prisma.pdf_templates.updateMany({
                    where: { userId: user.id, isDefault: true },
                    data: { isDefault: false },
                });
            }

            const template = await prisma.pdf_templates.create({
                data: {
                    name,
                    logoPath: logoPath || null,
                    headerText: headerText || null,
                    footerText: footerText || null,
                    primaryColor: primaryColor || "#3b82f6",
                    secondaryColor: secondaryColor || "#1e293b",
                    fontFamily: fontFamily || "Inter",
                    userId: user ? user.id : null,
                    isDefault: isDefault || false,
                    backgroundImage: backgroundImage || null,
                    cssOverrides: cssOverrides || null,
                },
            });

            response.status(200).json({ success: true, template });
        } catch (e) {
            console.error("[Templates] Create error:", e.message);
            response.status(500).json({ success: false, error: "Could not create template. " + e.message });
        }
    });

    // Update a template
    app.put("/templates/:id", [validatedRequest, flexUserRoleValid], async (request, response) => {
        try {
            const user = response.locals.user;
            const { id } = request.params;
            const { name, logoPath, headerText, footerText, primaryColor, secondaryColor, fontFamily, isDefault, backgroundImage, cssOverrides } = request.body;

            // Verify ownership
            const existing = await prisma.pdf_templates.findFirst({
                where: { id: Number(id), userId: user ? user.id : null },
            });

            if (!existing) {
                return response.status(404).json({ success: false, error: "Template not found" });
            }

            // If this is being set as default, unset other defaults for this user
            if (isDefault && user) {
                await prisma.pdf_templates.updateMany({
                    where: { userId: user.id, isDefault: true, id: { not: Number(id) } },
                    data: { isDefault: false },
                });
            }

            const template = await prisma.pdf_templates.update({
                where: { id: Number(id) },
                data: {
                    name: name || existing.name,
                    logoPath: logoPath !== undefined ? logoPath : existing.logoPath,
                    headerText: headerText !== undefined ? headerText : existing.headerText,
                    footerText: footerText !== undefined ? footerText : existing.footerText,
                    primaryColor: primaryColor || existing.primaryColor,
                    secondaryColor: secondaryColor || existing.secondaryColor,
                    fontFamily: fontFamily || existing.fontFamily,
                    isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
                    backgroundImage: backgroundImage !== undefined ? backgroundImage : existing.backgroundImage,
                    cssOverrides: cssOverrides !== undefined ? cssOverrides : existing.cssOverrides,
                },
            });

            response.status(200).json({ success: true, template });
        } catch (e) {
            console.error(e);
            response.status(500).json({ success: false, error: "Could not update template" });
        }
    });

    // Delete a template
    app.delete("/templates/:id", [validatedRequest, flexUserRoleValid], async (request, response) => {
        try {
            const user = response.locals.user;
            const { id } = request.params;

            // Verify ownership
            const existing = await prisma.pdf_templates.findFirst({
                where: { id: Number(id), userId: user ? user.id : null },
            });

            if (!existing) {
                return response.status(404).json({ success: false, error: "Template not found" });
            }

            await prisma.pdf_templates.delete({
                where: { id: Number(id) },
            });

            response.status(200).json({ success: true });
        } catch (e) {
            console.error(e);
            response.status(500).json({ success: false, error: "Could not delete template" });
        }
    });
}

module.exports = { templatesEndpoints };
