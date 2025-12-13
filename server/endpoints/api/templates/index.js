const { reqBody, userFromSession } = require("../../../utils/http");
const PdfTemplates = require("../../../models/pdfTemplates");

function apiTemplatesEndpoints(app) {
    if (!app) return;

    app.get("/v1/templates", async (request, response) => {
        try {
            const user = await userFromSession(request, response);
            const templates = await PdfTemplates.list(user?.id);
            response.status(200).json({ templates });
        } catch (e) {
            console.error(e);
            response.status(500).json({ error: e.message });
        }
    });

    app.post("/v1/templates", async (request, response) => {
        try {
            const user = await userFromSession(request, response);
            const data = reqBody(request);
            const { template, message } = await PdfTemplates.create(data, user?.id);
            response.status(200).json({ template, message });
        } catch (e) {
            console.error(e);
            response.status(500).json({ error: e.message });
        }
    });

    app.put("/v1/templates/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const data = reqBody(request);
            const { template, message } = await PdfTemplates.update(id, data);
            response.status(200).json({ template, message });
        } catch (e) {
            console.error(e);
            response.status(500).json({ error: e.message });
        }
    });

    app.delete("/v1/templates/:id", async (request, response) => {
        try {
            const { id } = request.params;
            const success = await PdfTemplates.delete(id);
            response.status(200).json({ success });
        } catch (e) {
            console.error(e);
            response.status(500).json({ error: e.message });
        }
    });
}

module.exports = { apiTemplatesEndpoints };
