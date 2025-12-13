import { baseHeaders } from "@/utils/request";

const FlowGenerator = {
    /**
     * Send messages to AI to generate or continue flow building conversation
     * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
     * @returns {Promise<{success: boolean, message: string, flow: object|null}>}
     */
    generate: async (messages) => {
        return fetch(`/api/agent-flows/generate`, {
            method: "POST",
            headers: {
                ...baseHeaders(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages }),
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
