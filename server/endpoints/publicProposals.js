const { PublicProposals } = require("../models/publicProposals");
const { Workspace } = require("../models/workspace");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");
const { reqBody } = require("../utils/http");
const { createCardFromSignedProposal } = require("../utils/crm/proposalIntegration");

function publicProposalsEndpoints(app) {
  // Export proposal to PDF (Public)
  app.get("/proposal/:id/export-pdf", async (request, response) => {
    try {
      const { id } = request.params;
      const { generatePdf } = require("../utils/pdfExport");
      const proposal = await PublicProposals.get(id);

      if (!proposal) {
        return response
          .status(404)
          .json({ success: false, error: "Proposal not found" });
      }

      // Check expiration
      if (
        proposal.status === "expired" ||
        (proposal.expiresAt && new Date() > new Date(proposal.expiresAt))
      ) {
        return response
          .status(410)
          .json({ success: false, error: "This proposal has expired." });
      }

      const pdfBuffer = await generatePdf(proposal.htmlContent, {
        preset: "pixelPerfect",
        // Prefer template-defined @page rules; fallback is Letter in the generator.
        preferCSSPageSize: true,
      });

      response.setHeader("Content-Type", "application/pdf");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="Proposal-${id}.pdf"`
      );
      response.send(pdfBuffer);
    } catch (e) {
      console.error(e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // Get proposal comments (Public)
  app.get("/proposal/:id/comments", async (request, response) => {
    try {
      const { id } = request.params;
      const prisma = require("../utils/prisma").prisma;

      const comments = await prisma.proposal_comments.findMany({
        where: { proposalId: id },
        orderBy: { createdAt: "desc" },
        include: { replies: true }
      });

      return response.status(200).json({ success: true, comments });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // Add comment (Public)
  app.post("/proposal/:id/comments", async (request, response) => {
    try {
      const { id } = request.params;
      const { authorName, content, parentId } = reqBody(request);
      const prisma = require("../utils/prisma").prisma;

      if (!content || !authorName) {
        return response.status(400).json({ success: false, error: "Content and Name required" });
      }

      const comment = await prisma.proposal_comments.create({
        data: {
          proposalId: id,
          authorName,
          content,
          parentId: parentId || null
        }
      });

      return response.status(200).json({ success: true, comment });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // Create a new public proposal (Protected)
  app.post(
    "/workspace/:slug/proposals",
    [validatedRequest, validWorkspaceSlug, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { htmlContent, options = {} } = reqBody(request);
        const workspace = response.locals.workspace;

        if (!htmlContent) {
          return response
            .status(400)
            .json({ success: false, error: "HTML content required" });
        }

        const { proposal, message } = await PublicProposals.create({
          workspaceId: workspace.id,
          htmlContent,
          // Optional fields
          password: options.password || null,
          expiresAt: options.expiresAt ? new Date(options.expiresAt) : null,
        });

        if (!proposal) {
          return response.status(500).json({ success: false, error: message });
        }

        return response.status(200).json({
          success: true,
          proposalId: proposal.id,
          url: `/p/${proposal.id}`, // Frontend URL construction will happen on client
        });
      } catch (e) {
        console.error(e);
        return response.status(500).json({ success: false, error: e.message });
      }
    }
  );

  // Get proposal content (Public)
  app.get("/proposal/:id", async (request, response) => {
    try {
      const { id } = request.params;
      const proposal = await PublicProposals.get(id);

      if (!proposal) {
        return response
          .status(404)
          .json({ success: false, error: "Proposal not found" });
      }

      if (
        proposal.status === "expired" ||
        (proposal.expiresAt && new Date() > new Date(proposal.expiresAt))
      ) {
        return response
          .status(410)
          .json({ success: false, error: "This proposal has expired." });
      }

      return response.status(200).json({ success: true, proposal });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // Sign proposal (Public)
  app.post("/proposal/:id/sign", async (request, response) => {
    try {
      const { id } = request.params;
      const { signatureData } = reqBody(request); // { name, ip, date, signatureImage }

      if (!signatureData) {
        return response
          .status(400)
          .json({ success: false, error: "Signature data required" });
      }

      // Verify proposal exists and is active
      const proposal = await PublicProposals.get(id);
      if (!proposal)
        return response
          .status(404)
          .json({ success: false, error: "Proposal not found" });
      if (proposal.status !== "active")
        return response
          .status(400)
          .json({ success: false, error: "Proposal is not active" });

      const result = await PublicProposals.sign(id, signatureData);
      if (!result.success) {
        return response
          .status(500)
          .json({ success: false, error: result.message });
      }

      // Automatically create CRM card for signed proposal
      try {
        const crmCard = await createCardFromSignedProposal(proposal, signatureData);
        console.log(`[Proposal Integration] Created CRM card ${crmCard.id} for proposal ${id}`);
      } catch (crmError) {
        // Log error but don't fail the signing process
        console.error("[Proposal Integration] Failed to create CRM card:", crmError);
      }

      return response.status(200).json({ success: true });
    } catch (e) {
      console.error(e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });
}

module.exports = { publicProposalsEndpoints };
