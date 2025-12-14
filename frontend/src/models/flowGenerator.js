import { baseHeaders } from "@/utils/request";

const FlowGenerator = {
    /**
     * Send messages to AI to generate or continue flow building conversation
     * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
     * @param {string|null} model - Optional model to use for generation
     * @param {Array} attachments - Optional array of file attachments
     * @returns {Promise<{success: boolean, message: string, flow: object|null}>}
     */
    generate: async (messages, model = null, attachments = []) => {
        // Process attachments - convert file previews to base64 content
        const processedAttachments = attachments.map(att => ({
            name: att.name,
            type: att.type,
            size: att.size,
            content: att.preview || null, // base64 for images
        }));

        return fetch(`/api/agent-flows/generate`, {
            method: "POST",
            headers: {
                ...baseHeaders(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages,
                model,
                attachments: processedAttachments,
            }),
        })
            .then((res) => res.json())
            .catch((e) => {
                console.error("[FlowGenerator] Error:", e);
                return { success: false, error: e.message };
            });
    },

    /**
     * Get the available block types schema
     * @returns {Promise<{success: boolean, schema: object}>}
     */
    getSchema: async () => {
        return fetch(`/api/agent-flows/schema`, {
            method: "GET",
            headers: baseHeaders(),
        })
            .then((res) => res.json())
            .catch((e) => {
                console.error("[FlowGenerator] Error:", e);
                return { success: false, error: e.message };
            });
    },
};

export default FlowGenerator;
