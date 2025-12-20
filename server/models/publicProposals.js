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
};

module.exports = { PublicProposals };
