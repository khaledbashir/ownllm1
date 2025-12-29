/**
 * CRM Manager Agent Skill
 * Full CRUD tools for managing CRM leads and pipelines via chat.
 */

const prisma = require("../../../../utils/prisma");

const crmManager = {
    name: "crm-manager",
    startupConfig: {
        params: {},
    },
    plugin: function () {
        return {
            name: this.name,
            setup(aibitat) {
                const getUserId = (ctx) => ctx.super.handlerProps?.invocation?.user?.id;

                // ========================================
                // TOOL: Create Lead
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "create_lead",
                    description:
                        "Creates a new lead/opportunity in the CRM. Use when the user asks to add a contact, lead, or opportunity.",
                    examples: [
                        {
                            prompt: "Add lead John Doe from Acme Corp worth $10k",
                            call: JSON.stringify({ title: "John Doe", company: "Acme Corp", value: 10000 }),
                        },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Lead name/title (required)" },
                            company: { type: "string", description: "Company name" },
                            email: { type: "string", description: "Email address" },
                            phone: { type: "string", description: "Phone number" },
                            value: { type: "number", description: "Deal value in dollars" },
                            stage: { type: "string", description: "Pipeline stage" },
                            notes: { type: "string", description: "Notes about the lead" },
                            priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority level" },
                        },
                        required: ["title"],
                    },
                    handler: async function ({ title, company, email, phone, value, stage, notes, priority }) {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Creating lead "${title}"...`);

                            const pipeline = await prisma.crm_pipelines.findFirst({ where: { userId } });
                            if (!pipeline) return JSON.stringify({ success: false, error: "No pipeline found. Create one first." });

                            const stages = JSON.parse(pipeline.stages || "[]");
                            const targetStage = stage || stages[0] || "New";

                            const card = await prisma.crm_cards.create({
                                data: {
                                    pipelineId: pipeline.id,
                                    title,
                                    name: title,
                                    company: company || null,
                                    email: email || null,
                                    phone: phone || null,
                                    value: value ? parseFloat(value) : null,
                                    stage: targetStage,
                                    notes: notes || null,
                                    priority: priority || "medium",
                                    userId,
                                    position: 0,
                                },
                            });

                            this.super.introspect(`${this.caller}: ✅ Created lead "${title}" in ${targetStage}`);
                            return JSON.stringify({ success: true, message: `Created "${title}" in ${targetStage}`, lead: { id: card.id, title, stage: targetStage, value } });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: Update Lead
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "update_lead",
                    description:
                        "Updates an existing lead. Use to change notes, value, email, phone, company, priority, or other details.",
                    examples: [
                        { prompt: "Update lead 5, set value to $50k", call: JSON.stringify({ id: 5, value: 50000 }) },
                        { prompt: "Add note to lead 3: 'Follow up next week'", call: JSON.stringify({ id: 3, notes: "Follow up next week" }) },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            id: { type: "number", description: "Lead ID (required)" },
                            title: { type: "string" },
                            company: { type: "string" },
                            email: { type: "string" },
                            phone: { type: "string" },
                            value: { type: "number" },
                            notes: { type: "string" },
                            priority: { type: "string", enum: ["low", "medium", "high"] },
                        },
                        required: ["id"],
                    },
                    handler: async function ({ id, ...updates }) {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Updating lead #${id}...`);

                            const existing = await prisma.crm_cards.findUnique({ where: { id: Number(id) } });
                            if (!existing) return JSON.stringify({ success: false, error: "Lead not found" });
                            if (existing.userId !== userId) return JSON.stringify({ success: false, error: "Unauthorized" });

                            const data = {};
                            if (updates.title !== undefined) data.title = updates.title;
                            if (updates.company !== undefined) data.company = updates.company;
                            if (updates.email !== undefined) data.email = updates.email;
                            if (updates.phone !== undefined) data.phone = updates.phone;
                            if (updates.value !== undefined) data.value = parseFloat(updates.value);
                            if (updates.notes !== undefined) data.notes = updates.notes;
                            if (updates.priority !== undefined) data.priority = updates.priority;

                            const card = await prisma.crm_cards.update({ where: { id: Number(id) }, data });
                            this.super.introspect(`${this.caller}: ✅ Updated lead #${id}`);
                            return JSON.stringify({ success: true, message: `Updated lead #${id}`, lead: card });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: Move Lead (Change Stage)
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "move_lead",
                    description:
                        "Moves a lead to a different pipeline stage. Use when user says 'move to Won', 'change stage to Proposal', etc.",
                    examples: [
                        { prompt: "Move lead 7 to Won", call: JSON.stringify({ id: 7, stage: "Won" }) },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            id: { type: "number", description: "Lead ID (required)" },
                            stage: { type: "string", description: "New stage name (required)" },
                        },
                        required: ["id", "stage"],
                    },
                    handler: async function ({ id, stage }) {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Moving lead #${id} to "${stage}"...`);

                            const existing = await prisma.crm_cards.findUnique({ where: { id: Number(id) } });
                            if (!existing) return JSON.stringify({ success: false, error: "Lead not found" });
                            if (existing.userId !== userId) return JSON.stringify({ success: false, error: "Unauthorized" });

                            const card = await prisma.crm_cards.update({ where: { id: Number(id) }, data: { stage } });
                            this.super.introspect(`${this.caller}: ✅ Moved lead #${id} to "${stage}"`);
                            return JSON.stringify({ success: true, message: `Moved lead to ${stage}`, lead: { id: card.id, title: card.title, stage } });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: Delete Lead
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "delete_lead",
                    description: "Deletes a lead from the CRM. Use when user says 'remove lead', 'delete lead #X'.",
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            id: { type: "number", description: "Lead ID to delete (required)" },
                        },
                        required: ["id"],
                    },
                    handler: async function ({ id }) {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Deleting lead #${id}...`);

                            const existing = await prisma.crm_cards.findUnique({ where: { id: Number(id) } });
                            if (!existing) return JSON.stringify({ success: false, error: "Lead not found" });
                            if (existing.userId !== userId) return JSON.stringify({ success: false, error: "Unauthorized" });

                            await prisma.crm_cards.delete({ where: { id: Number(id) } });
                            this.super.introspect(`${this.caller}: ✅ Deleted lead #${id}`);
                            return JSON.stringify({ success: true, message: `Deleted lead #${id}` });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: List Leads
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "list_leads",
                    description:
                        "Lists leads from the CRM. Use to show all leads, filter by stage, or get statistics.",
                    examples: [
                        { prompt: "Show leads in Proposal stage", call: JSON.stringify({ stage: "Proposal" }) },
                        { prompt: "How many leads do we have?", call: JSON.stringify({}) },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            stage: { type: "string", description: "Filter by stage" },
                            limit: { type: "number", description: "Max results (default 20)" },
                        },
                    },
                    handler: async function ({ stage, limit = 20 }) {
                        try {
                            const userId = getUserId(this);
                            this.super.introspect(`${this.caller}: Fetching leads...`);

                            const pipeline = await prisma.crm_pipelines.findFirst({ where: { userId } });
                            if (!pipeline) return JSON.stringify({ success: false, error: "No pipeline found" });

                            const cards = await prisma.crm_cards.findMany({
                                where: {
                                    pipelineId: pipeline.id,
                                    ...(stage ? { stage: { equals: stage, mode: 'insensitive' } } : {})
                                },
                                orderBy: { createdAt: "desc" },
                                take: limit,
                            });

                            const totalValue = cards.reduce((s, c) => s + (Number(c.value) || 0), 0);
                            this.super.introspect(`${this.caller}: Found ${cards.length} leads ($${totalValue.toLocaleString()})`);

                            return JSON.stringify({
                                success: true,
                                count: cards.length,
                                totalValue,
                                leads: cards.map((c) => ({ id: c.id, title: c.title, company: c.company, stage: c.stage, value: c.value, email: c.email })),
                            });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: Create Pipeline
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "create_pipeline",
                    description: "Creates a new CRM pipeline with custom stages.",
                    examples: [
                        { prompt: "Create pipeline 'Hiring' with stages Interview, Offer, Hired", call: JSON.stringify({ name: "Hiring", stages: ["Interview", "Offer", "Hired"] }) },
                    ],
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Pipeline name (required)" },
                            description: { type: "string" },
                            stages: { type: "array", items: { type: "string" }, description: "List of stage names" },
                        },
                        required: ["name"],
                    },
                    handler: async function ({ name, description, stages }) {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Creating pipeline "${name}"...`);

                            const defaultStages = stages || ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

                            const pipeline = await prisma.crm_pipelines.create({
                                data: {
                                    name,
                                    description: description || null,
                                    type: "custom",
                                    stages: JSON.stringify(defaultStages),
                                    color: "#3b82f6",
                                    userId,
                                },
                            });

                            this.super.introspect(`${this.caller}: ✅ Created pipeline "${name}"`);
                            return JSON.stringify({ success: true, message: `Created pipeline "${name}"`, pipeline: { id: pipeline.id, name, stages: defaultStages } });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });

                // ========================================
                // TOOL: List Pipelines
                // ========================================
                aibitat.function({
                    super: aibitat,
                    name: "list_pipelines",
                    description: "Lists all CRM pipelines for the user.",
                    parameters: {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {},
                    },
                    handler: async function () {
                        try {
                            const userId = getUserId(this);
                            if (!userId) return JSON.stringify({ success: false, error: "Authentication required" });
                            this.super.introspect(`${this.caller}: Fetching pipelines...`);

                            const pipelines = await prisma.crm_pipelines.findMany({
                                where: { userId },
                                include: { _count: { select: { cards: true } } },
                            });

                            return JSON.stringify({
                                success: true,
                                pipelines: pipelines.map((p) => ({
                                    id: p.id,
                                    name: p.name,
                                    stages: JSON.parse(p.stages || "[]"),
                                    cardCount: p._count.cards,
                                })),
                            });
                        } catch (e) {
                            return JSON.stringify({ success: false, error: e.message });
                        }
                    },
                });
            },
        };
    },
};

module.exports = { crmManager };
