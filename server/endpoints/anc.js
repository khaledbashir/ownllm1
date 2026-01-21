/**
 * ANC Direct Download Endpoints
 * POST /api/anc/generate-pdf
 * POST /api/anc/generate-excel
 */

const { validatedRequest } = require("../middleware/request");
const { multiUserMode } = require("../middleware/multiUserProtected");
const AncAuditExcelService = require("../services/AncAuditExcelService");
const { generateAncPdf } = require("../utils/ancPdfExport");

function ancEndpoints(app) {
  if (!app) return;

  /**
   * POST /api/anc/generate-pdf
   * Returns: application/pdf stream
   */
  app.post(
    "/api/anc/generate-pdf",
    [validatedRequest, multiUserMode],
    async (request, response) => {
      try {
        const { quoteData } = request.body;
        if (!quoteData) {
          return response.status(400).json({ error: "No quoteData provided" });
        }

        const pdfBuffer = await generateAncPdf(quoteData);

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename=ANC_Quote_${Date.now()}.pdf`
        );
        return response.send(pdfBuffer);
      } catch (error) {
        console.error("PDF Endpoint Error:", error);
        return response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/anc/generate-excel
   * Returns: Excel binary stream
   */
  app.post(
    "/api/anc/generate-excel",
    [validatedRequest, multiUserMode],
    async (request, response) => {
      try {
        const { quoteData } = request.body;
        if (!quoteData) {
          return response.status(400).json({ error: "No quoteData provided" });
        }

        const excelBuffer = await AncAuditExcelService.generateAuditExcel(quoteData);

        response.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        response.setHeader(
          "Content-Disposition",
          `attachment; filename=ANC_Audit_${Date.now()}.xlsx`
        );
        return response.send(excelBuffer);
      } catch (error) {
        console.error("Excel Endpoint Error:", error);
        return response.status(500).json({ error: error.message });
      }
    }
  );
}

module.exports = { ancEndpoints };
