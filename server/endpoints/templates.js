const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { Telemetry } = require("../models/telemetry");
const { getLLMProvider } = require("../utils/helpers");
const { generatePdf } = require("../utils/pdfExport");

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
      res
        .status(500)
        .json({ error: "Failed to list templates", details: error.message });
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
        cssOverrides, // Can contain full HTML template from Template Builder
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
          cssOverrides: cssOverrides || null,
          userId: req.user?.id || null,
        },
      });

      await Telemetry.sendTelemetry("template_created");
      res.status(201).json({ success: true, template });
    } catch (error) {
      console.error("[Templates] Create error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to create template" });
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
        return res
          .status(404)
          .json({ success: false, error: "Template not found" });
      }

      const template = await prisma.pdf_templates.update({
        where: { id: parseInt(id) },
        data: {
          name: name?.trim() || existing.name,
          logoPath: logoPath !== undefined ? logoPath : existing.logoPath,
          headerText:
            headerText !== undefined ? headerText : existing.headerText,
          footerText:
            footerText !== undefined ? footerText : existing.footerText,
          primaryColor: primaryColor || existing.primaryColor,
          secondaryColor: secondaryColor || existing.secondaryColor,
          fontFamily: fontFamily || existing.fontFamily,
        },
      });

      res.status(200).json({ success: true, template });
    } catch (error) {
      console.error("[Templates] Update error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to update template" });
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
        return res
          .status(404)
          .json({ success: false, error: "Template not found" });
      }

      await prisma.pdf_templates.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({ success: true, message: "Template deleted" });
    } catch (error) {
      console.error("[Templates] Delete error:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to delete template" });
    }
  });

  // AI Template Generation
  app.post("/templates/generate", validatedRequest, async (req, res) => {
    try {
      const { messages = [], brandContext = {} } = req.body;

      if (!messages.length) {
        return res
          .status(400)
          .json({ success: false, error: "No messages provided" });
      }

      const LLMConnector = getLLMProvider();
      if (!LLMConnector) {
        return res.status(500).json({
          success: false,
          error:
            "No LLM provider configured. Please configure an AI provider in Settings.",
        });
      }

      // Build system prompt for HTML template generation
      const systemPrompt = `You are an expert HTML/CSS template designer. Generate beautiful, professional document templates.

RULES:
1. Return ONLY valid HTML with embedded CSS in a <style> tag
2. Use modern, clean design with good typography
3. Include placeholders like {{date}}, {{company}}, {{client}} where appropriate
4. Make it print-friendly (no dark backgrounds, good contrast)
5. Use the brand context if provided: 
   - Logo: ${brandContext.logoPath || "No logo"}
   - Primary Color: ${brandContext.primaryColor || "#3b82f6"}
   - Font: ${brandContext.fontFamily || "Inter, sans-serif"}

Return the complete HTML document wrapped in \`\`\`html code blocks.`;

      const llmMessages = [
        { role: "system", content: systemPrompt },
        ...messages, // Include conversation history
      ];

      console.log("[Templates] Generating template with LLM...");
      const response = await LLMConnector.sendChat(llmMessages, {
        temperature: 0.7,
      });

      if (!response) {
        return res
          .status(500)
          .json({ success: false, error: "No response from LLM" });
      }

      // Extract HTML from response (look for ```html blocks)
      let templateHtml = null;
      const htmlMatch = response.match(/```html\s*([\s\S]*?)```/i);
      if (htmlMatch && htmlMatch[1]) {
        templateHtml = htmlMatch[1].trim();
      } else if (response.includes("<!DOCTYPE") || response.includes("<html")) {
        // Direct HTML response
        templateHtml = response;
      }

      res.status(200).json({
        success: true,
        templateHtml,
        message: response,
      });
    } catch (error) {
      console.error("[Templates] Generate error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate template",
      });
    }
  });

  // Export Template as PDF
  app.post("/templates/export-pdf", validatedRequest, async (req, res) => {
    try {
      const { html, filename = "template" } = req.body;

      if (!html) {
        return res
          .status(400)
          .json({ success: false, error: "No HTML content provided" });
      }

      console.log("[Templates] Exporting PDF...");
      const pdfBuffer = await generatePdf(html, {
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      });

      console.log(`[Templates] PDF generated successfully, size: ${pdfBuffer.length} bytes`);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[Templates] Export PDF error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to export PDF",
      });
    }
  });
}

module.exports = { templatesEndpoints };
