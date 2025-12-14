const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const { getLLMProvider } = require("../utils/helpers");

const TEMPLATE_BUILDER_SYSTEM_PROMPT = `You are an expert template designer specializing in beautiful, professional HTML templates for business documents.

## YOUR ROLE
Create stunning HTML templates for proposals, invoices, quotes, contracts, and other business documents.

## OUTPUT FORMAT
Always output COMPLETE, valid HTML including:
- <!DOCTYPE html>
- <html>, <head>, <body> tags
- All CSS inline in a <style> tag in the head
- Modern CSS: flexbox, grid, gradients, shadows, rounded corners
- Print-friendly styles for PDF export

## DESIGN PRINCIPLES
1. Professional and premium aesthetic
2. Clean typography with proper hierarchy
3. Consistent spacing and alignment
4. Brand-appropriate color usage
5. Clear sections with visual separation

## PLACEHOLDERS
Use {{variable_name}} format for dynamic content:
- {{company_name}} - Client's company name
- {{client_name}} - Client's name
- {{date}} - Current date
- {{project_name}} - Project title
- {{total}} - Total amount
- {{items}} - Line items (for invoices)

## BRAND CONTEXT (if provided)
Apply user's brand colors, fonts, and logo when specified in the context.

## RESPONSE FORMAT
When generating a template, wrap the HTML in:
\`\`\`html
[complete HTML here]
\`\`\`

When the user asks for changes, output the COMPLETE updated HTML template.
Be conversational but efficient - confirm what you're building and deliver.`;

function templateGenerationEndpoints(app) {
    if (!app) return;

    // Generate template via AI conversation
    app.post(
        "/templates/generate",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const { messages, brandContext } = request.body;

                if (!messages || !Array.isArray(messages)) {
                    return response.status(400).json({
                        success: false,
                        error: "Messages array is required",
                    });
                }

                // Get the LLM provider
                const LLMConnector = getLLMProvider();

                if (!LLMConnector) {
                    return response.status(500).json({
                        success: false,
                        error: "No LLM provider configured. Please set up your LLM in Settings.",
                    });
                }

                // Build brand context if provided
                let brandPrompt = "";
                if (brandContext) {
                    brandPrompt = `\n\n## BRAND SETTINGS TO USE:
- Primary Color: ${brandContext.primaryColor || "#3b82f6"}
- Secondary Color: ${brandContext.secondaryColor || "#1e293b"}
- Font Family: ${brandContext.fontFamily || "Inter, sans-serif"}
- Logo URL: ${brandContext.logoPath || "Not provided"}
- Background: ${brandContext.backgroundImage || "None"}

Apply these brand settings to the template design.`;
                }

                // Prepare messages for the LLM
                const chatMessages = [
                    { role: "system", content: TEMPLATE_BUILDER_SYSTEM_PROMPT + brandPrompt },
                    ...messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ];

                // Get response from LLM
                const result = await LLMConnector.getChatCompletion(chatMessages, {
                    temperature: 0.7,
                });

                if (!result || !result.textResponse) {
                    return response.status(500).json({
                        success: false,
                        error: "Failed to get response from LLM",
                    });
                }

                // Extract HTML from response if present
                const htmlMatch = result.textResponse.match(/```html\n?([\s\S]*?)```/) ||
                    result.textResponse.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);

                const templateHtml = htmlMatch
                    ? (htmlMatch[1] || htmlMatch[0])
                    : null;

                return response.status(200).json({
                    success: true,
                    message: result.textResponse,
                    templateHtml: templateHtml,
                });

            } catch (error) {
                console.error("[TemplateGeneration] Error:", error);
                return response.status(500).json({
                    success: false,
                    error: error.message || "Failed to generate template",
                });
            }
        }
    );

    // Export HTML to PDF
    app.post(
        "/templates/export-pdf",
        [validatedRequest, flexUserRoleValid([ROLES.all])],
        async (request, response) => {
            try {
                const { html, filename } = request.body;

                if (!html) {
                    return response.status(400).json({
                        success: false,
                        error: "HTML content is required",
                    });
                }

                const { generatePdf } = require("../utils/pdfExport");
                const pdfBuffer = await generatePdf(html);

                response.setHeader("Content-Type", "application/pdf");
                response.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${filename || "template"}.pdf"`
                );
                response.send(pdfBuffer);

            } catch (error) {
                console.error("[TemplateExport] Error:", error);
                return response.status(500).json({
                    success: false,
                    error: error.message || "Failed to export PDF",
                });
            }
        }
    );
}

module.exports = { templateGenerationEndpoints };

