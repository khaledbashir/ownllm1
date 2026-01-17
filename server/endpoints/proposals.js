/**
 * ANC Proposals Endpoint
 * Unified interface for generating dual-output proposals (Excel + PDF)
 * 
 * POST /workspace/:slug/generate-proposal
 * Body: { width, height, pixelPitch, environment, clientName, productCategory, margin, serviceAccess, steelType }
 * Response: { success, excelUrl, pdfUrl, zipUrl, message }
 */

const { Router } = require("express");
const { validatedRequest } = require("../middleware/request");
const { multiUserMode } = require("../middleware/multiUserProtected");
const prisma = require("../prisma");
const AncPricingEngine = require("../utils/AncPricingEngine");
const AncAuditExcelService = require("../services/AncAuditExcelService");
const { generateAncPdf } = require("../utils/ancPdfExport");
const path = require("path");
const fs = require("fs");
const JSZip = require("jszip");

const router = Router();

/**
 * POST /workspace/:slug/generate-proposal
 * Unified endpoint to generate both Excel audit + Client PDF
 */
router.post(
  "/workspace/:slug/generate-proposal",
  [validatedRequest, multiUserMode],
  async (request, response) => {
    try {
      const { slug } = request.params;
      const {
        width,
        height,
        pixelPitch = "1.5mm",
        environment = "Indoor",
        clientName = "Unnamed Client",
        productCategory = "Premium",
        margin = 0.30,
        serviceAccess = "front",
        steelType = "existing",
      } = request.body;

      // ===== VALIDATION =====
      if (!width || width <= 0) {
        return response
          .status(400)
          .json({ error: "Invalid width - must be > 0" });
      }
      if (!height || height <= 0) {
        return response
          .status(400)
          .json({ error: "Invalid height - must be > 0" });
      }
      if (!clientName || clientName.trim() === "") {
        return response
          .status(400)
          .json({ error: "Client name is required" });
      }

      // ===== STEP 1: CALCULATE QUOTE =====
      const quoteData = AncPricingEngine.calculate(
        width,
        height,
        pixelPitch,
        environment,
        margin,
        clientName,
        productCategory,
        serviceAccess,
        steelType
      );

      // ===== STEP 2: GENERATE EXCEL (Internal Audit) =====
      const timestamp = Date.now();
      const sanitizedName = clientName.replace(/[^a-z0-9]/gi, "_");
      const excelFilename = `ANC_Audit_${sanitizedName}_${timestamp}.xlsx`;
      const excelPath = path.join(
        "/tmp",
        excelFilename
      );

      let excelBuffer;
      try {
        excelBuffer = await AncAuditExcelService.generateAuditExcel(quoteData);
        fs.writeFileSync(excelPath, excelBuffer);
      } catch (excelError) {
        console.error("Excel generation error:", {
          message: excelError.message,
          quoteData,
          stack: excelError.stack,
        });
        return response.status(500).json({
          error: "Failed to generate Excel audit",
          details: excelError.message,
        });
      }

      // ===== STEP 3: GENERATE PDF (Client Proposal) =====
      const pdfFilename = `ANC_Proposal_${sanitizedName}_${timestamp}.pdf`;
      const pdfPath = path.join(
        "/tmp",
        pdfFilename
      );

      let pdfBuffer;
      try {
        pdfBuffer = await generateAncPdf(quoteData);
        fs.writeFileSync(pdfPath, pdfBuffer);
      } catch (pdfError) {
        console.error("PDF generation error:", {
          message: pdfError.message,
          quoteData,
          stack: pdfError.stack,
        });
        // PDF failure is non-critical; still return Excel
        console.warn("PDF generation failed, but Excel succeeded");
      }

      // ===== STEP 4: CREATE ZIP (Optional) =====
      const zipFilename = `ANC_Proposal_${sanitizedName}_${timestamp}.zip`;
      const zipPath = path.join("/tmp", zipFilename);

      try {
        if (excelBuffer && pdfBuffer) {
          const zip = new JSZip();
          zip.file(`Audit_${sanitizedName}.xlsx`, excelBuffer);
          zip.file(`Proposal_${sanitizedName}.pdf`, pdfBuffer);
          const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
          fs.writeFileSync(zipPath, zipBuffer);
        }
      } catch (zipError) {
        console.warn("ZIP creation failed:", zipError.message);
      }

      // ===== STEP 5: RETURN SUCCESS =====
      return response.status(200).json({
        success: true,
        message: "Proposal generated successfully",
        clientName: clientName,
        quoteData: {
          screenWidth: quoteData.screenWidth,
          screenHeight: quoteData.screenHeight,
          screenArea: quoteData.screenArea,
          environment: quoteData.environment,
          totalCost: quoteData.totalCost,
          finalPrice: quoteData.finalPrice,
          grossProfit: quoteData.grossProfit,
        },
        files: {
          excel: {
            filename: excelFilename,
            size: excelBuffer.length,
            downloadUrl: `/api/system/download/${excelFilename}`,
          },
          pdf: pdfBuffer
            ? {
                filename: pdfFilename,
                size: pdfBuffer.length,
                downloadUrl: `/api/system/download/${pdfFilename}`,
              }
            : null,
          zip:
            fs.existsSync(zipPath) && excelBuffer && pdfBuffer
              ? {
                  filename: zipFilename,
                  downloadUrl: `/api/system/download/${zipFilename}`,
                }
              : null,
        },
      });
    } catch (error) {
      console.error("Proposal generation error:", {
        message: error.message,
        stack: error.stack,
        body: request.body,
      });
      return response.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

module.exports = router;
