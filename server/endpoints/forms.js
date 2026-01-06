const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const { Form } = require("../models/forms");
const { Workspace } = require("../models/workspace");
const { v4: uuidv4 } = require("uuid");
const { userFromSession } = require("../utils/http");

function formsEndpoints(app) {
  if (!app) return;

  // ============================================
  // WORKSPACE FORMS (NATIVE)
  // ============================================

  // Get all forms for a workspace
  app.get(
    "/workspace/:slug/forms",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({ success: false, error: "Workspace not found" });
        }

        const forms = await Form.where({ workspaceId: workspace.id }, null, { updatedAt: 'desc' });

        return response.status(200).json({ success: true, forms });
      } catch (error) {
        console.error("Error listing forms:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Create a new form
  app.post(
    "/workspace/:slug/forms",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { title, description, fields = [], settings = {} } = request.body;
        const user = userFromSession(request);

        const workspace = await Workspace.get({ slug });
        if (!workspace) {
          return response.status(404).json({ success: false, error: "Workspace not found" });
        }

        const { form, message } = await Form.create({
          title: title || "New Form",
          description,
          workspaceId: workspace.id,
          createdBy: user?.id,
          uuid: uuidv4(),
          fields: JSON.stringify(fields),
          settings: JSON.stringify(settings)
        });

        if (!form) {
          return response.status(500).json({ success: false, error: message });
        }

        return response.status(200).json({ success: true, form });
      } catch (error) {
        console.error("Error creating form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // AI Generate Form
  app.post(
    "/workspace/:slug/forms/generate",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { prompt } = request.body;
        const user = await userFromSession(request, response);

        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
          return response.status(400).json({ success: false, error: "Prompt is required" });
        }

        const workspace = await Workspace.get({ slug });
        if (!workspace) {
          return response.status(404).json({ success: false, error: "Workspace not found" });
        }

        const { getLLMProvider } = require("../utils/helpers");
        const LLMConnector = getLLMProvider({
          provider: workspace?.chatProvider,
          model: workspace?.chatModel,
        });

        const systemPrompt = `You are an expert form builder AI. Your goal is to generate a JSON structure for a form based on the user's description.
The output MUST be a valid JSON array of form fields.
Each field object should have:
- id: string (unique)
- label: string
- type: string (text, textarea, number, email, date, select, checkbox, radio)
- required: boolean
- options: array of strings (only for select, checkbox, radio)
- placeholder: string (optional)

Example Output:
[
    { "id": "name", "label": "Full Name", "type": "text", "required": true, "placeholder": "John Doe" },
    { "id": "email", "label": "Email Address", "type": "email", "required": true, "placeholder": "john@example.com" }
]

Do not include any markdown formatting or explanation. Just return the JSON array.`;

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a form for: ${prompt}` }
        ];

        const { textResponse } = await LLMConnector.getChatCompletion(messages, {
          temperature: 0.7,
          user: user
        });

        // Parse response
        let fields = [];
        try {
          // Strip markdown code blocks if present
          const cleanText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
          fields = JSON.parse(cleanText);
        } catch (e) {
          console.error("Failed to parse AI response:", textResponse);
          return response.status(500).json({ success: false, error: "Failed to generate valid form structure" });
        }

        // Create the form
        const { form, message } = await Form.create({
          title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
          description: `Generated from prompt: "${prompt}"`,
          workspaceId: workspace.id,
          createdBy: user?.id,
          uuid: uuidv4(),
          fields: JSON.stringify(fields),
          settings: JSON.stringify({})
        });

        if (!form) return response.status(500).json({ success: false, error: message });

        return response.status(200).json({ success: true, form });

      } catch (error) {
        console.error("Error generating form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Get specific form details
  app.get(
    "/workspace/:slug/forms/:uuid",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { slug, uuid } = request.params;

        // ensure workspace exists and user has access (middleware handles role check but we need workspace id consistency)
        const workspace = await Workspace.get({ slug });
        if (!workspace) return response.status(404).json({ success: false, error: "Workspace not found" });

        const form = await Form.get({ uuid, workspaceId: workspace.id });
        if (!form) return response.status(404).json({ success: false, error: "Form not found" });

        return response.status(200).json({ success: true, form });
      } catch (error) {
        console.error("Error getting form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Update form
  app.put(
    "/workspace/:slug/forms/:uuid",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, uuid } = request.params;
        const updates = request.body;

        const workspace = await Workspace.get({ slug });
        if (!workspace) return response.status(404).json({ success: false, error: "Workspace not found" });

        const currentForm = await Form.get({ uuid, workspaceId: workspace.id });
        if (!currentForm) return response.status(404).json({ success: false, error: "Form not found" });

        const { form, message } = await Form.update(currentForm.id, updates);
        if (!form) return response.status(500).json({ success: false, error: message });

        return response.status(200).json({ success: true, form });
      } catch (error) {
        console.error("Error updating form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Delete form
  app.delete(
    "/workspace/:slug/forms/:uuid",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, uuid } = request.params;
        const workspace = await Workspace.get({ slug });
        if (!workspace) return response.status(404).json({ success: false, error: "Workspace not found" });

        const success = await Form.delete({ uuid, workspaceId: workspace.id });
        if (!success) return response.status(500).json({ success: false, error: "Failed to delete form" });

        return response.status(200).json({ success: true });
      } catch (error) {
        console.error("Error deleting form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // ============================================
  // PUBLIC FORM SUBMISSION & VIEW
  // ============================================

  // Get public form
  app.get(
    "/forms/:uuid",
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const form = await Form.get({ uuid });

        if (!form) return response.status(404).json({ success: false, error: "Form not found" });
        if (!form.isPublic) return response.status(403).json({ success: false, error: "Form is not public" });

        // Normalize fields/settings to JSON before sending (Form.get() already parses them to objects)
        return response.status(200).json({
          success: true, form: {
            title: form.title,
            description: form.description,
            fields: typeof form.fields === 'string' ? form.fields : JSON.stringify(form.fields || []),
            settings: typeof form.settings === 'string' ? form.settings : JSON.stringify(form.settings || {}),
            uuid: form.uuid
          }
        });
      } catch (error) {
        console.error("Error fetching public form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Submit form response
  app.post(
    "/forms/:uuid/submit",
    async (request, response) => {
      try {
        const { uuid } = request.params;
        const { response: responseData } = request.body;

        const form = await Form.get({ uuid });
        if (!form) return response.status(404).json({ success: false, error: "Form not found" });

        const { response: log, message } = await Form.logResponse(form.id, responseData, {
          ip: request.ip,
          userAgent: request.get('User-Agent')
        });

        if (!log) return response.status(500).json({ success: false, error: message });

        return response.status(200).json({ success: true });
      } catch (error) {
        console.error("Error submitting form:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Get Form Responses
  app.get(
    "/workspace/:slug/forms/:uuid/responses",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {  // Export Response as PDF
      try {
        const { slug, uuid } = request.params;
        const { limit = 50, offset = 0 } = request.query;

        const workspace = await Workspace.get({ slug });
        if (!workspace) return response.status(404).json({ success: false, error: "Workspace not found" });

        const form = await Form.get({ uuid, workspaceId: workspace.id });
        if (!form) return response.status(404).json({ success: false, error: "Form not found" });

        const responses = await Form.getResponses(form.id, parseInt(limit), parseInt(offset));

        return response.status(200).json({ success: true, responses });
      } catch (error) {
        console.error("Error getting form responses:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );

  // Export Response as PDF
  app.post(
    "/workspace/:slug/forms/:uuid/responses/:responseId/export",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { responseId } = request.params;
        const { templateId } = request.body;
        const prisma = require("../utils/prisma");
        const { generatePdf } = require("../utils/pdfExport");

        const formResponse = await Form.getResponse(responseId);
        if (!formResponse) {
          return response.status(404).json({ success: false, error: "Response not found" });
        }

        const template = await prisma.pdf_templates.findUnique({
          where: { id: parseInt(templateId) }
        });

        if (!template) {
          return response.status(404).json({ success: false, error: "Template not found" });
        }

        // Parse response data
        let responseData = {};
        try {
          responseData = typeof formResponse.response === 'string'
            ? JSON.parse(formResponse.response)
            : formResponse.response;
        } catch (e) {
          console.error("Failed to parse response JSON", e);
        }

        // Get Template HTML
        let html = template.cssOverrides || `
            <!DOCTYPE html>
            <html>
            <head><style>body { font-family: ${template.fontFamily}; color: ${template.secondaryColor}; }</style></head>
            <body>
                <h1 style="color: ${template.primaryColor}">${template.headerText || 'Document'}</h1>
                <div class="content">{{content}}</div>
                <footer>${template.footerText || ''}</footer>
            </body>
            </html>
        `;

        // Perform Substitution
        // 1. Standard keys
        html = html.replace(/{{date}}/g, new Date().toLocaleDateString());

        // 2. Form Fields
        Object.keys(responseData).forEach(key => {
          const val = responseData[key];
          const displayVal = Array.isArray(val) ? val.join(", ") : (val || "");
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, displayVal);
        });

        const pdfBuffer = await generatePdf(html, {
          format: "A4",
          printBackground: true,
          margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        });

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename="submission-${responseId}.pdf"`
        );
        return response.send(pdfBuffer);

      } catch (error) {
        console.error("Error exporting PDF:", error);
        return response.status(500).json({ success: false, error: error.message });
      }
    }
  );
}

module.exports = { formsEndpoints };
