const prisma = require("../utils/prisma");

const PublicProposals = {
  writable: [], // public api doesn't use this standard update pattern

  create: async (data) => {
    try {
      const proposal = await prisma.public_proposals.create({
        data,
      });
      return { proposal, message: "Proposal created successfully" };
    } catch (error) {
      console.error(error);
      return { proposal: null, message: error.message };
    }
  },

  get: async (id) => {
    try {
      const proposal = await prisma.public_proposals.findUnique({
        where: { id },
        include: {
          workspace: {
            select: {
              name: true,
              slug: true,
              pfpFilename: true,
            },
          },
        },
      });
      return proposal;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  getWithStats: async (id) => {
    try {
      const proposal = await prisma.public_proposals.findUnique({
        where: { id },
        include: {
          workspace: {
            select: {
              name: true,
              slug: true,
              pfpFilename: true,
            },
          },
          comments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
          approvals: {
            where: { status: { in: ['approved', 'declined', 'requested_changes'] } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Count total comments and views
      const commentCount = await prisma.proposal_comments.count({
        where: { proposalId: id },
      });

      return {
        ...proposal,
        commentCount,
        lastViewedAt: new Date(), // Update this from tracking
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  sign: async (id, signatureData) => {
    try {
      // signatureData: { name, ip, date, signatureImage }
      const proposal = await prisma.public_proposals.update({
        where: { id },
        data: {
          status: "signed",
          signatures: JSON.stringify(signatureData),
        },
      });
      return { success: true, proposal };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  },

  incrementViewCount: async (id) => {
    try {
      await prisma.public_proposals.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  },

  revoke: async (id) => {
    try {
      await prisma.public_proposals.update({
        where: { id },
        data: { status: "revoked" },
      });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  },

  checkAccess: async (id, password = null) => {
    try {
      const proposal = await prisma.public_proposals.findUnique({
        where: { id },
        select: {
          status: true,
          password: true,
          expiresAt: true,
        },
      });

      if (!proposal) {
        return { access: false, reason: "Proposal not found" };
      }

      if (proposal.status === "revoked") {
        return { access: false, reason: "Proposal has been revoked" };
      }

      if (proposal.expiresAt && new Date() > new Date(proposal.expiresAt)) {
        return { access: false, reason: "Proposal has expired" };
      }

      if (proposal.password && proposal.password !== password) {
        return { access: false, reason: "Invalid password" };
      }

      return { access: true };
    } catch (error) {
      console.error(error);
      return { access: false, reason: error.message };
    }
  },
};

module.exports = { PublicProposals };
