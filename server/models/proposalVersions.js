const prisma = require("../utils/prisma");

const ProposalVersions = {
  writable: [],
  create: async (data) => {
    try {
      // Auto-increment version number for this proposal
      const lastVersion = await prisma.proposal_versions.findFirst({
        where: { proposalId: data.proposalId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });

      const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

      const version = await prisma.proposal_versions.create({
        data: {
          ...data,
          versionNumber: nextVersionNumber,
        },
      });

      return { version, message: "Version created successfully" };
    } catch (error) {
      console.error("[ProposalVersions] Create error:", error);
      return { version: null, message: error.message };
    }
  },

  getHistory: async (proposalId, options = {}) => {
    try {
      const { limit = 20, offset = 0 } = options;

      const versions = await prisma.proposal_versions.findMany({
        where: { proposalId },
        orderBy: { versionNumber: 'desc' },
        take: limit,
        skip: offset,
      });

      return versions;
    } catch (error) {
      console.error("[ProposalVersions] Get history error:", error);
      return [];
    }
  },

  get: async (id) => {
    try {
      const version = await prisma.proposal_versions.findUnique({
        where: { id },
      });
      return version;
    } catch (error) {
      console.error("[ProposalVersions] Get error:", error);
      return null;
    }
  },

  getCurrent: async (proposalId) => {
    try {
      const version = await prisma.proposal_versions.findFirst({
        where: { proposalId },
        orderBy: { versionNumber: 'desc' },
      });
      return version;
    } catch (error) {
      console.error("[ProposalVersions] Get current error:", error);
      return null;
    }
  },

  revert: async (proposalId, targetVersionId, authorName) => {
    try {
      const targetVersion = await prisma.proposal_versions.findUnique({
        where: { id: targetVersionId },
      });

      if (!targetVersion) {
        return { success: false, message: "Version not found" };
      }

      // Create new version from target (creates revert trail)
      const result = await ProposalVersions.create({
        proposalId,
        title: `Reverted to v${targetVersion.versionNumber}`,
        changes: JSON.stringify([
          { description: `Reverted to version ${targetVersion.versionNumber}`, type: 'revert' },
        ]),
        notes: `Reverted by ${authorName}`,
        authorName,
        htmlContent: targetVersion.htmlContent,
      });

      return result;
    } catch (error) {
      console.error("[ProposalVersions] Revert error:", error);
      return { success: false, message: error.message };
    }
  },
};

module.exports = { ProposalVersions };