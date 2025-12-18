const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { Telemetry } = require("../models/telemetry");

function templatesEndpoints(app) {
    if (!app) return;

    // List all templates
    app.get("/templates", validatedRequest, async (req, res) => {
        try {
            const templates = await prisma.pdf_templates.findMany({
                orderBy: { createdAt: "desc" },
            });
            res.status(200).json({ templates });
        } catch (error) {
            console.error("[Templates] List error:", error);
            res.status(500).json({ error: "Failed to list templates", details: error.message });
        }
    });

    // Get single template
    app.get("/templates/:id", validatedRequest, async (req, res) => {
        try {
            const { id } = req.params;
            const template = await prisma.pdf_templates.findUnique({
                where: { id: parseInt(id) },
            });
            if (!template) {
                return res.status(404).json({ error: "Template not found" });
            }
            res.status(200).json({ template });
        } catch (error) {
            console.error("[Templates] Get error:", error);
            res.status(500).json({ error: "Failed to get template" });
        }
    });

    // Create template
    app.post("/templates", validatedRequest, async (req, res) => {
        try {
            const {
                name,
                logoPath,
                headerText,
                footerText,
                primaryColor,
                secondaryColor,
                fontFamily,
            } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({ error: "Template name is required" });
            }

            const template = await prisma.pdf_templates.create({
                data: {
                    name: name.trim(),
                    logoPath: logoPath || null,
                    headerText: headerText || null,
                    footerText: footerText || null,
                    primaryColor: primaryColor || "#3b82f6",
                    secondaryColor: secondaryColor || "#1e293b",
                    fontFamily: fontFamily || "Inter",
                    userId: req.user?.id || null,
                },
            });

            await Telemetry.sendTelemetry("template_created");
            res.status(201).json({ success: true, template });
        } catch (error) {
            console.error("[Templates] Create error:", error);
            res.status(500).json({ success: false, error: "Failed to create template" });
        }
    });

    // Update template
    app.put("/templates/:id", validatedRequest, async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                logoPath,
                headerText,
                footerText,
                primaryColor,
                secondaryColor,
                fontFamily,
            } = req.body;

            const existing = await prisma.pdf_templates.findUnique({
                where: { id: parseInt(id) },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: "Template not found" });
            }

            const template = await prisma.pdf_templates.update({
                where: { id: parseInt(id) },
                data: {
                    name: name?.trim() || existing.name,
                    logoPath: logoPath !== undefined ? logoPath : existing.logoPath,
                    headerText: headerText !== undefined ? headerText : existing.headerText,
                    footerText: footerText !== undefined ? footerText : existing.footerText,
                    primaryColor: primaryColor || existing.primaryColor,
                    secondaryColor: secondaryColor || existing.secondaryColor,
                    fontFamily: fontFamily || existing.fontFamily,
                },
            });

            res.status(200).json({ success: true, template });
        } catch (error) {
            console.error("[Templates] Update error:", error);
            res.status(500).json({ success: false, error: "Failed to update template" });
        }
    });

    // Delete template
    app.delete("/templates/:id", validatedRequest, async (req, res) => {
        try {
            const { id } = req.params;

            const existing = await prisma.pdf_templates.findUnique({
                where: { id: parseInt(id) },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: "Template not found" });
            }

            await prisma.pdf_templates.delete({
                where: { id: parseInt(id) },
            });

            res.status(200).json({ success: true, message: "Template deleted" });
        } catch (error) {
            console.error("[Templates] Delete error:", error);
            res.status(500).json({ success: false, error: "Failed to delete template" });
        }
    });
}

module.exports = { templatesEndpoints };
