const prisma = require("../utils/prisma");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");

function crmEndpoints(app) {
    if (!app) return;

    // ============================================
    // PIPELINES
    // ============================================

    // List all pipelines for current user
    app.get(
        "/crm/pipelines",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const pipelines = await prisma.crm_pipelines.findMany({
                    where: { userId: user?.id || null },
                    orderBy: { createdAt: "desc" },
                    include: {
                        _count: { select: { cards: true } },
                    },
                });

                return response.status(200).json({
                    success: true,
                    pipelines: pipelines.map((p) => ({
                        ...p,
                        stages: JSON.parse(p.stages || "[]"),
                        cardCount: p._count.cards,
                    })),
                });
            } catch (error) {
                console.error("Error listing pipelines:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Create a new pipeline
    app.post(
        "/crm/pipelines",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { name, description, type, stages, color, workspaceId } = request.body;

                if (!name) {
                    return response.status(400).json({ success: false, error: "Pipeline name is required" });
                }

                const defaultStages = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

                const pipeline = await prisma.crm_pipelines.create({
                    data: {
                        name,
                        description: description || null,
                        type: type || "custom",
                        stages: JSON.stringify(stages || defaultStages),
                        color: color || "#3b82f6",
                        userId: user?.id || null,
                        workspaceId: workspaceId || null,
                    },
                });

                return response.status(200).json({
                    success: true,
                    pipeline: {
                        ...pipeline,
                        stages: JSON.parse(pipeline.stages),
                    },
                });
            } catch (error) {
                console.error("Error creating pipeline:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Update a pipeline
    app.put(
        "/crm/pipelines/:id",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { id } = request.params;
                const { name, description, stages, color } = request.body;

                const existing = await prisma.crm_pipelines.findFirst({
                    where: { id: Number(id), userId: user?.id || null },
                });

                if (!existing) {
                    return response.status(404).json({ success: false, error: "Pipeline not found" });
                }

                const pipeline = await prisma.crm_pipelines.update({
                    where: { id: Number(id) },
                    data: {
                        name: name || existing.name,
                        description: description !== undefined ? description : existing.description,
                        stages: stages ? JSON.stringify(stages) : existing.stages,
                        color: color || existing.color,
                    },
                });

                return response.status(200).json({
                    success: true,
                    pipeline: {
                        ...pipeline,
                        stages: JSON.parse(pipeline.stages),
                    },
                });
            } catch (error) {
                console.error("Error updating pipeline:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Delete a pipeline
    app.delete(
        "/crm/pipelines/:id",
        [validatedRequest, flexUserRoleValid([ROLES.admin])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const { id } = request.params;

                const existing = await prisma.crm_pipelines.findFirst({
                    where: { id: Number(id), userId: user?.id || null },
                });

                if (!existing) {
                    return response.status(404).json({ success: false, error: "Pipeline not found" });
                }

                await prisma.crm_pipelines.delete({
                    where: { id: Number(id) },
                });

                return response.status(200).json({ success: true });
            } catch (error) {
                console.error("Error deleting pipeline:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // ============================================
    // CARDS
    // ============================================

    // List all cards in a pipeline
    app.get(
        "/crm/cards",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const { pipelineId } = request.query;

                if (!pipelineId) {
                    return response.status(400).json({ success: false, error: "pipelineId is required" });
                }

                const cards = await prisma.crm_cards.findMany({
                    where: { pipelineId: Number(pipelineId) },
                    orderBy: [{ stage: "asc" }, { position: "asc" }],
                });

                return response.status(200).json({
                    success: true,
                    cards: cards.map((c) => ({
                        ...c,
                        metadata: c.metadata ? JSON.parse(c.metadata) : null,
                    })),
                });
            } catch (error) {
                console.error("Error listing cards:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Create a new card
    app.post(
        "/crm/cards",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const user = response.locals.user;
                const {
                    pipelineId,
                    stage,
                    title,
                    name,
                    email,
                    phone,
                    company,
                    notes,
                    value,
                    embedSessionId,
                    threadId,
                    metadata,
                } = request.body;

                if (!pipelineId || !title) {
                    return response.status(400).json({
                        success: false,
                        error: "pipelineId and title are required",
                    });
                }

                // Verify pipeline exists
                const pipeline = await prisma.crm_pipelines.findUnique({
                    where: { id: Number(pipelineId) },
                });

                if (!pipeline) {
                    return response.status(404).json({ success: false, error: "Pipeline not found" });
                }

                const stages = JSON.parse(pipeline.stages);
                const defaultStage = stage || stages[0] || "New";

                // Get max position for the stage
                const maxPos = await prisma.crm_cards.aggregate({
                    where: { pipelineId: Number(pipelineId), stage: defaultStage },
                    _max: { position: true },
                });

                const card = await prisma.crm_cards.create({
                    data: {
                        pipelineId: Number(pipelineId),
                        stage: defaultStage,
                        position: (maxPos._max.position || 0) + 1,
                        title,
                        name: name || null,
                        email: email || null,
                        phone: phone || null,
                        company: company || null,
                        notes: notes || null,
                        value: value ? parseFloat(value) : null,
                        embedSessionId: embedSessionId || null,
                        threadId: threadId ? Number(threadId) : null,
                        metadata: metadata ? JSON.stringify(metadata) : null,
                        userId: user?.id || null,
                    },
                });

                return response.status(200).json({ success: true, card });
            } catch (error) {
                console.error("Error creating card:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Update a card
    app.put(
        "/crm/cards/:id",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const { id } = request.params;
                const updates = request.body;

                const existing = await prisma.crm_cards.findUnique({
                    where: { id: Number(id) },
                });

                if (!existing) {
                    return response.status(404).json({ success: false, error: "Card not found" });
                }

                // Build update data
                const updateData = {};
                if (updates.title !== undefined) updateData.title = updates.title;
                if (updates.name !== undefined) updateData.name = updates.name;
                if (updates.email !== undefined) updateData.email = updates.email;
                if (updates.phone !== undefined) updateData.phone = updates.phone;
                if (updates.company !== undefined) updateData.company = updates.company;
                if (updates.notes !== undefined) updateData.notes = updates.notes;
                if (updates.value !== undefined) updateData.value = updates.value ? parseFloat(updates.value) : null;
                if (updates.metadata !== undefined) updateData.metadata = JSON.stringify(updates.metadata);

                const card = await prisma.crm_cards.update({
                    where: { id: Number(id) },
                    data: updateData,
                });

                return response.status(200).json({ success: true, card });
            } catch (error) {
                console.error("Error updating card:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Move a card to a different stage
    app.put(
        "/crm/cards/:id/move",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const { id } = request.params;
                const { stage, position } = request.body;

                if (!stage) {
                    return response.status(400).json({ success: false, error: "stage is required" });
                }

                const existing = await prisma.crm_cards.findUnique({
                    where: { id: Number(id) },
                });

                if (!existing) {
                    return response.status(404).json({ success: false, error: "Card not found" });
                }

                // Update the card's stage and position
                const card = await prisma.crm_cards.update({
                    where: { id: Number(id) },
                    data: {
                        stage,
                        position: position !== undefined ? Number(position) : existing.position,
                    },
                });

                return response.status(200).json({ success: true, card });
            } catch (error) {
                console.error("Error moving card:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Delete a card
    app.delete(
        "/crm/cards/:id",
        [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
        async (request, response) => {
            try {
                const { id } = request.params;

                const existing = await prisma.crm_cards.findUnique({
                    where: { id: Number(id) },
                });

                if (!existing) {
                    return response.status(404).json({ success: false, error: "Card not found" });
                }

                await prisma.crm_cards.delete({
                    where: { id: Number(id) },
                });

                return response.status(200).json({ success: true });
            } catch (error) {
                console.error("Error deleting card:", error);
                return response.status(500).json({ success: false, error: error.message });
            }
        }
    );
}

module.exports = { crmEndpoints };
