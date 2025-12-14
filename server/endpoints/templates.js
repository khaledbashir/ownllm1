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
            console.log("[POST /api/templates] Request received");
            const user = response.locals.user;
            console.log("[POST /api/templates] User:", user ? `ID: ${user.id}, Role: ${user.role}` : "No user (Single User Mode?)");

            const { name, logoPath, headerText, footerText, primaryColor, secondaryColor, fontFamily, isDefault, backgroundImage, cssOverrides } = request.body;
            console.log("[POST /api/templates] Body:", { name, isDefault, hasLogo: !!logoPath });

            if (!name) {
                console.log("[POST /api/templates] Error: Name missing");
                return response.status(400).json({ success: false, error: "Template name is required" });
            }

            // If this is being set as default, unset other defaults for this user
            if (isDefault && user) {
                console.log("[POST /api/templates] Unsetting previous defaults for user");
                await prisma.pdf_templates.updateMany({
                    where: { userId: user.id, isDefault: true },
                    data: { isDefault: false },
                });
            }

            console.log("[POST /api/templates] Creating database entry...");
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
            console.log("[POST /api/templates] Success. Template ID:", template.id);

            response.status(200).json({ success: true, template });
        } catch (e) {
            console.error("[POST /api/templates] Exception:", e);
            response.status(500).json({ success: false, error: "Could not create template" });
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
