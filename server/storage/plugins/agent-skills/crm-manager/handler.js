const prisma = require("../../../../utils/prisma");

const handler = {
    runtime: {
        handler: async function ({ action, params }) {
            const getUserId = (ctx) => ctx.super.handlerProps?.invocation?.user?.id;
            const userId = getUserId(this);

            if (!userId) {
                return JSON.stringify({ success: false, error: "Authentication required" });
            }

            try {
                switch (action) {
                    case "list_leads": {
                        this.super.introspect(`${this.caller}: Listing CRM leads...`);
                        const pipeline = await prisma.crm_pipelines.findFirst({ where: { userId } });
                        if (!pipeline) return JSON.stringify({ success: false, error: "No pipeline found" });

                        const cards = await prisma.crm_cards.findMany({
                            where: { pipelineId: pipeline.id },
                            orderBy: { createdAt: "desc" },
                            take: params?.limit || 20
                        });
                        return JSON.stringify({ success: true, count: cards.length, leads: cards });
                    }

                    case "create_lead": {
                        this.super.introspect(`${this.caller}: Creating lead "${params.name}"...`);
                        const pipeline = await prisma.crm_pipelines.findFirst({ where: { userId } });
                        if (!pipeline) return JSON.stringify({ success: false, error: "No pipeline found" });

                        const stages = JSON.parse(pipeline.stages || "[]");
                        const stage = params.pipeline || stages[0] || "New";

                        const card = await prisma.crm_cards.create({
                            data: {
                                pipelineId: pipeline.id,
                                title: params.name,
                                name: params.name,
                                stage: stage,
                                userId,
                                position: 0,
                                value: params.value ? parseFloat(params.value) : null
                            }
                        });
                        return JSON.stringify({ success: true, message: `Created lead ${card.id}`, lead: card });
                    }

                    case "update_lead": {
                        const { id, ...updates } = params;
                        this.super.introspect(`${this.caller}: Updating lead #${id}...`);
                        const card = await prisma.crm_cards.update({
                            where: { id: Number(id), userId },
                            data: updates
                        });
                        return JSON.stringify({ success: true, lead: card });
                    }

                    case "move_lead": {
                        const { id, stage } = params;
                        this.super.introspect(`${this.caller}: Moving lead #${id} to ${stage}...`);
                        const card = await prisma.crm_cards.update({
                            where: { id: Number(id), userId },
                            data: { stage }
                        });
                        return JSON.stringify({ success: true, lead: card });
                    }

                    case "delete_lead": {
                        const { id } = params;
                        this.super.introspect(`${this.caller}: Deleting lead #${id}...`);
                        await prisma.crm_cards.delete({
                            where: { id: Number(id), userId }
                        });
                        return JSON.stringify({ success: true, message: `Deleted lead #${id}` });
                    }

                    default:
                        return JSON.stringify({ success: false, error: `Unknown action: ${action}` });
                }
            } catch (error) {
                return JSON.stringify({ success: false, error: error.message });
            }
        }
    }
};

module.exports = handler;
