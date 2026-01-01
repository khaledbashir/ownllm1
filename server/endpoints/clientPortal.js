const { PublicProposals } = require("../models/publicProposals");
const { ProposalComments } = require("../models/proposalComments");
const { ProposalVersions } = require("../models/proposalVersions");
const { ProposalApprovals } = require("../models/proposalApprovals");
const { reqBody } = require("../utils/http");
const { updateCardFromProposalStatus, appendCommentToCrmCard } = require("../utils/crm/proposalIntegration");

/**
 * Client Portal Endpoints
 * 
 * Public-facing API for proposal viewing, commenting, and approval
 * All endpoints require valid proposal access (check password, expiration, revocation)
 */

function clientPortalEndpoints(app) {
  if (!app) return;

  // ============================================================================
  // GET /api/client-portal/:id - Fetch proposal data with stats
  // ============================================================================
  app.get("/api/client-portal/:id", async (request, response) => {
    try {
      const { id } = request.params;
      const { password } = request.query;

      // Check access (password, expiration, revocation)
      const accessCheck = await PublicProposals.checkAccess(id, password);
      if (!accessCheck.access) {
        return response
          .status(accessCheck.reason === "Proposal has expired" ? 410 : 403)
          .json({ success: false, error: accessCheck.reason });
      }

      // Get proposal with stats
      const proposal = await PublicProposals.getWithStats(id);

      if (!proposal) {
        return response.status(404).json({ success: false, error: "Proposal not found" });
      }

      // Increment view count
      await PublicProposals.incrementViewCount(id);

      // Update CRM card stage to "Viewed" if proposal has CRM card
      try {
        await updateCardFromProposalStatus(id, "viewed");
        console.log(`[ClientPortal] Updated CRM card to 'Viewed' for proposal ${id}`);
      } catch (crmError) {
        // Log error but don't fail the request
        console.error("[ClientPortal] Failed to update CRM card stage:", crmError);
      }

      return response.status(200).json({
        success: true,
        proposal: {
          id: proposal.id,
          htmlContent: proposal.htmlContent,
          workspace: proposal.workspace,
          status: proposal.status,
          signatures: proposal.signatures ? JSON.parse(proposal.signatures) : null,
          commentCount: proposal.commentCount,
          versionCount: proposal.versions?.length || 0,
          currentVersion: proposal.versions?.[0] || null,
          approvals: proposal.approvals || [],
          createdAt: proposal.createdAt,
          updatedAt: proposal.updatedAt,
        },
      });
    } catch (e) {
      console.error("[ClientPortal] Get proposal error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // GET /api/client-portal/:id/comments - Get comments with replies
  // ============================================================================
  app.get("/api/client-portal/:id/comments", async (request, response) => {
    try {
      const { id } = request.params;
      const { limit = 50, offset = 0, lastViewTime } = request.query;

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Get comments
      const comments = await ProposalComments.get(id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeReplies: true,
      });

      // Count unread comments
      let unreadCount = 0;
      if (lastViewTime) {
        unreadCount = await ProposalComments.countUnread(id, lastViewTime);
      }

      return response.status(200).json({
        success: true,
        comments,
        unreadCount,
      });
    } catch (e) {
      console.error("[ClientPortal] Get comments error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/comments - Add new comment
  // ============================================================================
  app.post("/api/client-portal/:id/comments", async (request, response) => {
    try {
      const { id } = request.params;
      const { 
        content, 
        authorName, 
        authorEmail, 
        parentId = null 
      } = reqBody(request);

      if (!content || !authorName) {
        return response.status(400).json({ 
          success: false, 
          error: "Content and author name are required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Create comment
      const result = await ProposalComments.create({
        proposalId: id,
        parentId,
        authorName,
        authorEmail,
        content,
      });

      if (!result.comment) {
        return response.status(500).json({ success: false, error: result.message });
      }

      // Sync comment to CRM card
      try {
        await appendCommentToCrmCard(id, result.comment);
      } catch (crmError) {
        // Log error but don't fail the comment creation
        console.error("[ClientPortal] Failed to sync comment to CRM:", crmError);
      }

      return response.status(201).json({
        success: true,
        comment: result.comment,
      });
    } catch (e) {
      console.error("[ClientPortal] Add comment error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/approve - Submit approval
  // ============================================================================
  app.post("/api/client-portal/:id/approve", async (request, response) => {
    try {
      const { id } = request.params;
      const { 
        approverName, 
        approverEmail, 
        signatureData 
      } = reqBody(request);

      if (!approverName || !signatureData) {
        return response.status(400).json({ 
          success: false, 
          error: "Approver name and signature data are required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Check if approval already exists
      const existingApproval = await ProposalApprovals.getByEmail(id, approverEmail);
      let approvalId;

      if (existingApproval) {
        // Update existing approval
        const result = await ProposalApprovals.approve(existingApproval.id, signatureData);
        if (!result.success) {
          return response.status(500).json({ success: false, error: result.message });
        }
        approvalId = existingApproval.id;
      } else {
        // Create new approval
        const result = await ProposalApprovals.create({
          proposalId: id,
          approverName,
          approverEmail,
        });
        if (!result.approval) {
          return response.status(500).json({ success: false, error: result.message });
        }
        approvalId = result.approval.id;

        // Approve immediately
        const approveResult = await ProposalApprovals.approve(approvalId, signatureData);
        if (!approveResult.success) {
          return response.status(500).json({ success: false, error: approveResult.message });
        }
      }

      // Update CRM card stage to "Signed" or "Negotiation"
      try {
        await updateCardFromProposalStatus(id, "signed");
        console.log(`[ClientPortal] Updated CRM card to 'Signed' for proposal ${id}`);
      } catch (crmError) {
        // Log error but don't fail the request
        console.error("[ClientPortal] Failed to update CRM card stage:", crmError);
      }

      return response.status(200).json({
        success: true,
        approvalId,
      });
    } catch (e) {
      console.error("[ClientPortal] Approve error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/decline - Decline with reason
  // ============================================================================
  app.post("/api/client-portal/:id/decline", async (request, response) => {
    try {
      const { id } = request.params;
      const { 
        approverName, 
        approverEmail, 
        declineReason 
      } = reqBody(request);

      if (!approverName || !declineReason) {
        return response.status(400).json({ 
          success: false, 
          error: "Approver name and decline reason are required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Check if approval exists
      let existingApproval = await ProposalApprovals.getByEmail(id, approverEmail);
      let approvalId;

      if (existingApproval) {
        approvalId = existingApproval.id;
      } else {
        // Create pending approval first
        const result = await ProposalApprovals.create({
          proposalId: id,
          approverName,
          approverEmail,
        });
        if (!result.approval) {
          return response.status(500).json({ success: false, error: result.message });
        }
        approvalId = result.approval.id;
      }

      // Decline the approval
      const result = await ProposalApprovals.decline(approvalId, declineReason);
      if (!result.success) {
        return response.status(500).json({ success: false, error: result.message });
      }

      // Update CRM card stage to "Lost"
      try {
        await updateCardFromProposalStatus(id, "declined");
        console.log(`[ClientPortal] Updated CRM card to 'Lost' for proposal ${id}`);
      } catch (crmError) {
        // Log error but don't fail the request
        console.error("[ClientPortal] Failed to update CRM card stage:", crmError);
      }

      return response.status(200).json({
        success: true,
        approvalId,
      });
    } catch (e) {
      console.error("[ClientPortal] Decline error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/version - Create new version
  // ============================================================================
  app.post("/api/client-portal/:id/version", async (request, response) => {
    try {
      const { id } = request.params;
      const { 
        title, 
        changes, 
        notes, 
        authorName, 
        htmlContent 
      } = reqBody(request);

      if (!htmlContent || !authorName) {
        return response.status(400).json({ 
          success: false, 
          error: "HTML content and author name are required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Create version
      const result = await ProposalVersions.create({
        proposalId: id,
        title,
        changes: JSON.stringify(changes || []),
        notes,
        authorName,
        htmlContent,
      });

      if (!result.version) {
        return response.status(500).json({ success: false, error: result.message });
      }

      return response.status(201).json({
        success: true,
        version: result.version,
      });
    } catch (e) {
      console.error("[ClientPortal] Create version error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // GET /api/client-portal/:id/versions - Get version history
  // ============================================================================
  app.get("/api/client-portal/:id/versions", async (request, response) => {
    try {
      const { id } = request.params;
      const { limit = 20, offset = 0 } = request.query;

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Get version history
      const versions = await ProposalVersions.getHistory(id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Get current version
      const currentVersion = await ProposalVersions.getCurrent(id);

      return response.status(200).json({
        success: true,
        versions,
        currentVersionId: currentVersion?.id,
      });
    } catch (e) {
      console.error("[ClientPortal] Get versions error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/ai-query - AI assistant query
  // ============================================================================
  app.post("/api/client-portal/:id/ai-query", async (request, response) => {
    try {
      const { id } = request.params;
      const { question, selectedSection } = reqBody(request);

      if (!question) {
        return response.status(400).json({ 
          success: false, 
          error: "Question is required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Get proposal content for context
      const proposal = await PublicProposals.get(id);
      if (!proposal) {
        return response.status(404).json({ success: false, error: "Proposal not found" });
      }

      // AI QUERY IMPLEMENTATION
      // This would integrate with your existing LLM system
      // For now, return a placeholder response
      
      console.log(`[ClientPortal] AI Query for proposal ${id}:`, question);
      console.log(`[ClientPortal] Selected section:`, selectedSection);

      // TODO: Integrate with your existing AI/LLM system
      // const aiResponse = await callLLM(question, proposal.htmlContent, selectedSection);

      // Placeholder response
      const aiResponse = {
        summary: "This is a placeholder for AI assistant integration. Connect to your LLM system.",
        highlights: [
          { title: "Project Scope", description: "Key deliverables and milestones" },
          { title: "Pricing", description: "Budget breakdown and terms" },
          { title: "Timeline", description: "Project phases and deadlines" },
        ],
      };

      return response.status(200).json({
        success: true,
        response: aiResponse,
      });
    } catch (e) {
      console.error("[ClientPortal] AI query error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // ============================================================================
  // GET /api/client-portal/proposals - Get all proposals for a client
  // ============================================================================
  app.get("/api/client-portal/proposals", async (request, response) => {
    try {
      const { email, status, limit = 50, offset = 0 } = request.query;

      if (!email) {
        return response.status(400).json({ 
          success: false, 
          error: "Client email is required" 
        });
      }

      // Get proposals for this client
      const proposals = await PublicProposals.getClientProposals(email, {
        status,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return response.status(200).json({
        success: true,
        proposals,
        count: proposals.length,
      });
    } catch (e) {
      console.error("[ClientPortal] Get client proposals error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================================
  // POST /api/client-portal/:id/reactions - Add/remove reaction
  // ============================================================================
  app.post("/api/client-portal/:id/reactions/:commentId", async (request, response) => {
    try {
      const { id } = request.params;
      const { commentId } = request.params;
      const { emoji, userEmail } = reqBody(request);

      if (!emoji || !userEmail) {
        return response.status(400).json({ 
          success: false, 
          error: "Emoji and user email are required" 
        });
      }

      // Check access
      const accessCheck = await PublicProposals.checkAccess(id, request.query.password);
      if (!accessCheck.access) {
        return response.status(403).json({ success: false, error: accessCheck.reason });
      }

      // Update reaction
      const result = await ProposalComments.updateReaction(commentId, emoji, userEmail);
      
      return response.status(200).json({
        success: true,
        reactions: result.reactions,
      });
    } catch (e) {
      console.error("[ClientPortal] Reaction error:", e);
      return response.status(500).json({ success: false, error: e.message });
    }
  });
}

module.exports = { clientPortalEndpoints };