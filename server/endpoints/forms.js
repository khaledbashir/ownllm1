const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { ProcessDocument } = require("../utils/documentProcessing");
const { v4: uuidv4 } = require("uuid");

function formsEndpoints(app) {
  if (!app) return;

  // ============================================
  // WORKSPACE FORMS
  // ============================================

  // Get all forms connected to a workspace
  app.get(
    "/workspace/:slug/forms",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check user has access
        const user = response.locals.user;
        const hasAccess =
          user?.role === "admin" ||
          (await prisma.workspace_users.findFirst({
            where: {
              user_id: user?.id || null,
              workspace_id: workspace.id,
            },
          }));

        if (!hasAccess) {
          return response.status(403).json({
            success: false,
            error: "Access denied",
          });
        }

        // Parse forms from workspace metadata
        const forms = workspace.forms ? JSON.parse(workspace.forms) : [];

        return response.status(200).json({
          success: true,
          forms,
        });
      } catch (error) {
        console.error("Error listing forms:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Connect a form to workspace
  app.post(
    "/workspace/:slug/forms",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { formId, formTitle, formUrl, aiAnalysis = false } = request.body;

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Get existing forms
        const existingForms = workspace.forms ? JSON.parse(workspace.forms) : [];

        // Check if form already connected
        if (existingForms.find((f) => f.formId === formId)) {
          return response.status(400).json({
            success: false,
            error: "Form already connected to workspace",
          });
        }

        // Add new form
        const newForm = {
          formId,
          formTitle,
          formUrl,
          aiAnalysis,
          connectedAt: new Date().toISOString(),
          responseCount: 0,
        };

        const updatedForms = [...existingForms, newForm];

        // Update workspace
        await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { forms: JSON.stringify(updatedForms) },
        });

        return response.status(200).json({
          success: true,
          form: newForm,
        });
      } catch (error) {
        console.error("Error connecting form:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Disconnect a form from workspace
  app.delete(
    "/workspace/:slug/forms/:formId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, formId } = request.params;

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Get existing forms
        const existingForms = workspace.forms ? JSON.parse(workspace.forms) : [];

        // Remove form
        const updatedForms = existingForms.filter((f) => f.formId !== formId);

        // Update workspace
        await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { forms: JSON.stringify(updatedForms) },
        });

        return response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Error disconnecting form:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // ============================================
  // FORM RESPONSES
  // ============================================

  // Webhook: Receive form responses from OpenForm
  app.post(
    "/workspace/:slug/forms/webhook",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { formId, responseId, responseData, sendToKnowledgeBase = true } = request.body;

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Update form response count
        const existingForms = workspace.forms ? JSON.parse(workspace.forms) : [];
        const updatedForms = existingForms.map((f) => {
          if (f.formId === formId) {
            return { ...f, responseCount: (f.responseCount || 0) + 1, lastResponseAt: new Date().toISOString() };
          }
          return f;
        });

        await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { forms: JSON.stringify(updatedForms) },
        });

        // If enabled, send response to workspace documents for RAG
        if (sendToKnowledgeBase) {
          try {
            // Create a document from the form response
            const responseText = JSON.stringify(responseData, null, 2);

            // Create a file-like object for processing
            const docData = {
              title: `Form Response - ${new Date().toISOString()}`,
              content: responseText,
              size: Buffer.byteLength(responseText, "utf8"),
              mime: "application/json",
            };

            // Process and store the document
            const processDoc = new ProcessDocument({
              workspaceId: workspace.id,
              userId: response.locals.user?.id || null,
            });

            const { document: uploadedDoc } = await processDoc.uploadDocument(
              docData,
              `form-response-${Date.now()}.json`,
              {
                from: "webhook",
                formId,
                responseId,
              }
            );

            if (uploadedDoc) {
              console.log(`Form response uploaded to workspace ${slug}`);
            }
          } catch (docError) {
            console.error("Error uploading form response to workspace:", docError);
            // Don't fail the webhook if doc upload fails
          }
        }

        return response.status(200).json({
          success: true,
          message: "Form response received and processed",
        });
      } catch (error) {
        console.error("Error processing form webhook:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Get form responses in workspace
  app.get(
    "/workspace/:slug/forms/:formId/responses",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { slug, formId } = request.params;
        const { limit = 50 } = request.query;

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check access
        const user = response.locals.user;
        const hasAccess =
          user?.role === "admin" ||
          (await prisma.workspace_users.findFirst({
            where: {
              user_id: user?.id || null,
              workspace_id: workspace.id,
            },
          }));

        if (!hasAccess) {
          return response.status(403).json({
            success: false,
            error: "Access denied",
          });
        }

        // Find documents created from form responses
        const formDocs = await prisma.workspace_documents.findMany({
          where: {
            workspace_id: workspace.id,
            metadata: {
              path: ["from"],
              equals: "webhook",
            },
          },
          take: parseInt(limit),
          orderBy: { created_at: "desc" },
        });

        // Filter by formId
        const filteredDocs = formDocs.filter((doc) => {
          const metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
          return metadata.formId === formId;
        });

        return response.status(200).json({
          success: true,
          responses: filteredDocs,
        });
      } catch (error) {
        console.error("Error listing form responses:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Update form settings
  app.patch(
    "/workspace/:slug/forms/:formId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, formId } = request.params;
        const { aiAnalysis } = request.body;

        const workspace = await prisma.workspaces.findUnique({
          where: { slug },
        });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Update form settings
        const existingForms = workspace.forms ? JSON.parse(workspace.forms) : [];
        const updatedForms = existingForms.map((f) => {
          if (f.formId === formId) {
            return { ...f, aiAnalysis };
          }
          return f;
        });

        await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { forms: JSON.stringify(updatedForms) },
        });

        return response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Error updating form:", error);
        return response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { formsEndpoints };
