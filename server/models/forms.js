const prisma = require("../utils/prisma");
const { v4: uuidv4 } = require("uuid");

const Form = {
    writable: ["title", "description", "isPublic", "fields", "settings"],

    create: async function (data = {}) {
        try {
            const form = await prisma.forms.create({
                data,
            });
            return { form, message: null };
        } catch (error) {
            console.error(error.message);
            return { form: null, message: error.message };
        }
    },

    get: async function (clause = {}) {
        try {
            const form = await prisma.forms.findFirst({
                where: clause,
                include: {
                    workspace: {
                        select: {
                            slug: true,
                            name: true
                        }
                    }
                }
            });
            if (form && form.fields) {
                form.fields = JSON.parse(form.fields || "[]");
            }
            if (form && form.settings) {
                form.settings = JSON.parse(form.settings || "{}");
            }
            return form || null;
        } catch (error) {
            console.error(error.message);
            return null;
        }
    },

    where: async function (
        clause = {},
        limit = null,
        orderBy = null
    ) {
        try {
            const results = await prisma.forms.findMany({
                where: clause,
                ...(limit !== null ? { take: limit } : {}),
                ...(orderBy !== null ? { orderBy } : {}),
            });

            return results.map(form => ({
                ...form,
                fields: JSON.parse(form.fields || "[]"),
                settings: JSON.parse(form.settings || "{}")
            }));
        } catch (error) {
            console.error(error.message);
            return [];
        }
    },

    update: async function (id = null, data = {}) {
        if (!id) throw new Error("No form id provided for update");

        const validKeys = Object.keys(data).filter((key) =>
            this.writable.includes(key)
        );
        if (validKeys.length === 0)
            return { form: { id }, message: "No valid fields to update!" };

        try {
            // Ensure JSON fields are stringified if passed as objects
            if (data.fields && typeof data.fields !== 'string') {
                data.fields = JSON.stringify(data.fields);
            }
            if (data.settings && typeof data.settings !== 'string') {
                data.settings = JSON.stringify(data.settings);
            }

            const form = await prisma.forms.update({
                where: { id },
                data,
            });
            return { form, message: null };
        } catch (error) {
            console.error(error.message);
            return { form: null, message: error.message };
        }
    },

    delete: async function (clause = {}) {
        try {
            await prisma.forms.deleteMany({ where: clause });
            return true;
        } catch (error) {
            console.error(error.message);
            return false;
        }
    },

    // Responses
    logResponse: async function (formId, responseData = {}, metadata = {}) {
        try {
            const response = await prisma.form_responses.create({
                data: {
                    formId,
                    response: JSON.stringify(responseData),
                    metadata: JSON.stringify(metadata)
                }
            });
            return { response, message: null };
        } catch (error) {
            console.error(error.message);
            return { response: null, message: error.message };
        }
    },

    getResponses: async function (formId, limit = 50, offset = 0) {
        try {
            const responses = await prisma.form_responses.findMany({
                where: { formId },
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });

            return responses.map(r => ({
                ...r,
                response: JSON.parse(r.response || "{}"),
                metadata: JSON.parse(r.metadata || "{}")
            }));
        } catch (error) {
            console.error(error.message);
            return [];
        }
    }
};

module.exports = { Form };
