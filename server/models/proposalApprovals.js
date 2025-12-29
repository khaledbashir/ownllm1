const prisma = require("../utils/prisma");

const ProposalApprovals = {
  writable: [],
  create: async (data) => {
    try {
      const approval = await prisma.proposal_approvals.create({
        data,
      });
      return { approval, message: "Approval record created successfully" };
    } catch (error) {
      console.error("[ProposalApprovals] Create error:", error);
      return { approval: null, message: error.message };
    }
  },

  get: async (proposalId) => {
    try {
      const approvals = await prisma.proposal_approvals.findMany({
        where: { proposalId },
        orderBy: { createdAt: 'desc' },
      });
      return approvals;
    } catch (error) {
      console.error("[ProposalApprovals] Get error:", error);
      return [];
    }
  },

  approve: async (approvalId, signatureData) => {
    try {
      const approval = await prisma.proposal_approvals.update({
        where: { id: approvalId },
        data: {
          status: 'approved',
          signatureData: JSON.stringify(signatureData), // { type: "drawn"|"typed", signatureImage, timestamp, ip }
        },
      });

      return { success: true, approval };
    } catch (error) {
      console.error("[ProposalApprovals] Approve error:", error);
      return { success: false, message: error.message };
    }
  },

  decline: async (approvalId, declineReason) => {
    try {
      const approval = await prisma.proposal_approvals.update({
        where: { id: approvalId },
        data: {
          status: 'declined',
          declineReason,
        },
      });

      return { success: true, approval };
    } catch (error) {
      console.error("[ProposalApprovals] Decline error:", error);
      return { success: false, message: error.message };
    }
  },

  requestChanges: async (approvalId, changeNotes) => {
    try {
      const approval = await prisma.proposal_approvals.update({
        where: { id: approvalId },
        data: {
          status: 'requested_changes',
          changeNotes,
        },
      });

      return { success: true, approval };
    } catch (error) {
      console.error("[ProposalApprovals] Request changes error:", error);
      return { success: false, message: error.message };
    }
  },

  getByEmail: async (proposalId, approverEmail) => {
    try {
      const approval = await prisma.proposal_approvals.findFirst({
        where: {
          proposalId,
          approverEmail,
        },
        orderBy: { createdAt: 'desc' },
      });
      return approval;
    } catch (error) {
      console.error("[ProposalApprovals] Get by email error:", error);
      return null;
    }
  },
};

module.exports = { ProposalApprovals };