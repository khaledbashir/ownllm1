const prisma = require("../prisma");

/**
 * Find or create a default "Proposals" pipeline for a workspace
 * @param {number} workspaceId - The workspace ID
 * @param {number} userId - The user ID (optional)
 * @returns {Promise<Object>} The pipeline object
 */
async function findOrCreateProposalPipeline(workspaceId, userId = null) {
  // First, check if workspace has a default proposal pipeline configured
  const workspace = await prisma.workspaces.findUnique({
    where: { id: workspaceId },
    select: { defaultProposalPipelineId: true, enableProposalCrmIntegration: true },
  });

  // If integration is disabled, return null
  if (workspace && !workspace.enableProposalCrmIntegration) {
    return null;
  }

  // If workspace has a default pipeline configured, use it
  if (workspace && workspace.defaultProposalPipelineId) {
    const pipeline = await prisma.crm_pipelines.findUnique({
      where: { id: workspace.defaultProposalPipelineId },
    });
    if (pipeline) {
      return pipeline;
    }
  }

  // First, try to find an existing proposal pipeline for this workspace
  let pipeline = await prisma.crm_pipelines.findFirst({
    where: {
      workspaceId,
      type: "proposal",
    },
  });

  // If not found, try to find any pipeline with "proposal" in the name
  if (!pipeline) {
    pipeline = await prisma.crm_pipelines.findFirst({
      where: {
        workspaceId,
        name: {
          contains: "proposal",
          mode: "insensitive",
        },
      },
    });
  }

  // If still not found, create a new one
  if (!pipeline) {
    const defaultStages = [
      "Sent",
      "Viewed",
      "Signed",
      "Negotiation",
      "Won",
      "Lost",
    ];

    pipeline = await prisma.crm_pipelines.create({
      data: {
        name: "Proposals",
        description: "Track proposal lifecycle from sending to closing",
        type: "proposal",
        stages: JSON.stringify(defaultStages),
        color: "#8b5cf6", // Purple color for proposals
        userId,
        workspaceId,
      },
    });

    // Set this as the default pipeline for the workspace
    await prisma.workspaces.update({
      where: { id: workspaceId },
      data: { defaultProposalPipelineId: pipeline.id },
    });
  }

  return pipeline;
}

/**
 * Create a CRM card when a proposal is signed
 * @param {Object} proposal - The proposal object
 * @param {Object} signatureData - The signature data { name, ip, date, signatureImage }
 * @returns {Promise<Object|null>} The created CRM card or null if integration is disabled
 */
async function createCardFromSignedProposal(proposal, signatureData) {
  // Find or create the proposal pipeline
  const pipeline = await findOrCreateProposalPipeline(
    proposal.workspaceId,
    null // userId can be null for public proposals
  );

  // If no pipeline found (integration disabled), return null
  if (!pipeline) {
    console.log(`[Proposal Integration] CRM integration disabled for workspace ${proposal.workspaceId}`);
    return null;
  }

  // Parse pipeline stages
  const stages = JSON.parse(pipeline.stages);
  const signedStage = stages.includes("Signed") ? "Signed" : stages[0];

  // Extract contact info from signature data
  const contactName = signatureData.name || "Unknown Contact";
  
  // Create the CRM card
  const card = await prisma.crm_cards.create({
    data: {
      pipelineId: pipeline.id,
      stage: signedStage,
      position: 0, // Will be auto-incremented
      title: `Proposal Signed - ${contactName}`,
      name: contactName,
      email: signatureData.email || null,
      company: signatureData.company || null,
      notes: `Proposal signed on ${new Date(signatureData.date).toLocaleDateString()}\nIP: ${signatureData.ip}`,
      metadata: JSON.stringify({
        proposalId: proposal.id,
        signatureDate: signatureData.date,
        signatureImage: signatureData.signatureImage,
        source: "proposal_signing",
      }),
      proposalId: proposal.id,
      userId: null, // Public proposals don't have a user
    },
  });

  // Update the proposal with the CRM card reference
  await prisma.public_proposals.update({
    where: { id: proposal.id },
    data: {
      pipelineId: pipeline.id,
      crmCardId: card.id,
    },
  });

  return card;
}

/**
 * Update CRM card when proposal status changes
 * @param {string} proposalId - The proposal ID
 * @param {string} status - The new status
 * @returns {Promise<Object>} The updated CRM card
 */
async function updateCardFromProposalStatus(proposalId, status) {
  const proposal = await prisma.public_proposals.findUnique({
    where: { id: proposalId },
    include: { pipeline: true },
  });

  if (!proposal || !proposal.pipeline) {
    return null;
  }

  if (!proposal.crmCardId) {
    return null;
  }

  // Map proposal status to CRM stage
  const stages = JSON.parse(proposal.pipeline.stages);
  let newStage = stages[0];

  const statusToStageMap = {
    active: "Sent",
    viewed: "Viewed",
    signed: "Signed",
    expired: "Lost",
    revoked: "Lost",
  };

  const mappedStage = statusToStageMap[status];
  if (mappedStage && stages.includes(mappedStage)) {
    newStage = mappedStage;
  }

  // Update the card
  const card = await prisma.crm_cards.update({
    where: { id: proposal.crmCardId },
    data: { stage: newStage },
  });

  return card;
}

module.exports = {
  findOrCreateProposalPipeline,
  createCardFromSignedProposal,
  updateCardFromProposalStatus,
};