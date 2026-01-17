module.exports.runtime = {
    handler: async function ({ quoteData }) {
        const fetch = require('node-fetch');
        const callerId = `${this.config.name}-v${this.config.version}`;
        
        // Define your n8n webhook URL here. 
        // In production, this should be in process.env or settings, 
        // but for this MVP we hardcode the specific workflow hook.
        const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/anc-audit-generator";

        this.introspect(`${callerId}: Sending quote data to n8n for Excel generation...`);

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(quoteData)
            });

            if (!response.ok) {
                throw new Error(`n8n Error: ${response.statusText}`);
            }

            const result = await response.json();
            this.introspect(`${callerId}: Success! File emailed.`);
            
            return JSON.stringify({ 
                success: true, 
                message: "Audit file generated and emailed to estimators.",
                n8n_response: result 
            });

        } catch (error) {
            this.introspect(`${callerId} failed: ${error.message}`);
            return JSON.stringify({ 
                success: false, 
                error: `Failed to generate audit file: ${error.message}` 
            });
        }
    }
};