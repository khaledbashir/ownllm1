const ExcelJS = require("exceljs");
const moment = require("moment");

/**
 * AncAuditExcelService
 * Generates a professional 8-sheet Excel workbook with live formulas
 * for ANC quote calculations, allowing Natalia to verify pricing logic
 */

class AncAuditExcelService {
  /**
   * Generate complete audit Excel workbook from quote data
   * @param {Object} quoteData - Quote calculation data
   * @returns {Promise<Buffer>} Excel file buffer
   */
  static async generateAuditExcel(quoteData) {
    const workbook = new ExcelJS.Workbook();

    // Create all sheets
    this._createSummarySheet(workbook, quoteData);
    this._createHardwareSheet(workbook, quoteData);
    this._createStructuralSheet(workbook, quoteData);
    this._createLaborSheet(workbook, quoteData);
    this._createShippingSheet(workbook, quoteData);
    this._createPMEngineeringSheet(workbook, quoteData);
    this._createMarginsSheet(workbook, quoteData);
    this._createDataSourceSheet(workbook, quoteData);

    // Format all sheets
    this._formatAllSheets(workbook);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Sheet 1: Summary (Client-Facing)
   */
  static _createSummarySheet(workbook, data) {
    const sheet = workbook.addWorksheet("Summary", {
      tabColor: "FF0000",
      state: "visible",
    });

    const rows = [
      ["CLIENT INFORMATION", ""],
      ["Client Name", data.clientName || ""],
      ["Quote Date", data.quoteDate || moment().format("YYYY-MM-DD")],
      ["Project: Screen Dimensions", `${data.screenWidth || 0} ft W × ${data.screenHeight || 0} ft H`],
      ["Screen Area (sq ft)", data.screenArea || 0],
      ["Product", data.productType || ""],
      ["", ""],
      ["COST BREAKDOWN", ""],
      ["Hardware", `=Hardware!B12`],
      ["Structural Materials", `=Structural!B10`],
      ["Labor", `=Labor!B15`],
      ["Shipping", `=Shipping!B5`],
      ["PM Fee (8%)", `=PM_Engineering!B8`],
      ["Engineering", `=PM_Engineering!B12`],
      ["", ""],
      ["TOTAL COST", `=SUM(B9:B14)`],
      ["Desired Margin (%)", data.desiredMargin ? (data.desiredMargin * 100) : 30],
      ["", ""],
      ["FINAL PRICE", `=B16 / (1 - B17/100)`],
      ["GROSS PROFIT ($)", `=B19 - B16`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 8 || idx === 18) {
        excelRow.font = { bold: true, size: 12 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC000" } };
      }
      if (idx === 16 || idx === 19) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    // Format currency and percentage columns
    sheet.getColumn("B").width = 20;
    sheet.getColumn("A").width = 30;
    
    // Format number cells
    sheet.getCell("B9").numFmt = "$#,##0.00";
    sheet.getCell("B10").numFmt = "$#,##0.00";
    sheet.getCell("B11").numFmt = "$#,##0.00";
    sheet.getCell("B12").numFmt = "$#,##0.00";
    sheet.getCell("B13").numFmt = "$#,##0.00";
    sheet.getCell("B14").numFmt = "$#,##0.00";
    sheet.getCell("B16").numFmt = "$#,##0.00";
    sheet.getCell("B17").numFmt = "0.0";
    sheet.getCell("B19").numFmt = "$#,##0.00";
    sheet.getCell("B20").numFmt = "$#,##0.00";
  }

  /**
   * Sheet 2: Hardware
   */
  static _createHardwareSheet(workbook, data) {
    const sheet = workbook.addWorksheet("Hardware");

    const rows = [
      ["HARDWARE COST CALCULATION", ""],
      ["", ""],
      ["Input Parameters", "Value"],
      ["Screen Width (ft)", data.screenWidth || 0],
      ["Screen Height (ft)", data.screenHeight || 0],
      ["Screen Area (sq ft)", `=B4*B5`],
      ["", ""],
      ["Product Specification", ""],
      ["Product Type", data.productType || "10mm Outdoor Ribbon Board"],
      ["Base Price per SqFt", data.basePricePerSqFt || 2500],
      ["Hardware Cost (Base)", `=B6*B10`],
      ["", ""],
      ["Modifiers", "Amount"],
      ["Ribbon Board Surcharge (+20%)?", "Yes"],
      ["Ribbon Surcharge Amount", `=B11*0.20`],
      ["Outdoor Contingency (+5%)?", "Yes"],
      ["Outdoor Contingency Amount", `=(B11+B15)*0.05`],
      ["", ""],
      ["TOTAL HARDWARE COST (ADJUSTED)", `=B11+B15+B17`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 12) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 18) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    // Format currency
    [10, 11, 15, 17, 19].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
  }

  /**
   * Sheet 3: Structural
   */
  static _createStructuralSheet(workbook, data) {
    const sheet = workbook.addWorksheet("Structural");

    const rows = [
      ["STRUCTURAL MATERIALS CALCULATION", ""],
      ["", ""],
      ["Input", "Value"],
      ["Adjusted Hardware Cost", `=Hardware!B19`],
      ["Structural Materials (Base 20%)", `=B4*0.20`],
      ["", ""],
      ["Modifiers", ""],
      ["Mounting Type", data.mountingType || "Flat"],
      ["Is Curved Installation?", data.isCurved ? "Yes" : "No"],
      ["Curved Modifier (×1.15 if curved)", `=IF(B9="Yes", 1.15, 1.0)`],
      ["", ""],
      ["TOTAL STRUCTURAL COST", `=B5*B10`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 6) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 11) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    [4, 5, 10, 12].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
  }

  /**
   * Sheet 4: Labor
   */
  static _createLaborSheet(workbook, data) {
    const sheet = workbook.addWorksheet("Labor");

    const rows = [
      ["LABOR COST CALCULATION", ""],
      ["", ""],
      ["Screen Dimensions", ""],
      ["Screen Area (sq ft)", `=Hardware!B6`],
      ["", ""],
      ["Labor Hours Calculation", ""],
      ["Hours per 100 sq ft", 40],
      ["Total Labor Hours", `=B4 / 100 * B7`],
      ["", ""],
      ["Labor Rate & Factors", ""],
      ["Hourly Rate (Union)", 150],
      ["Service Type", data.mountingType || "Front Service"],
      ["Front Service Factor", 1.0],
      ["Rear Service Factor (if applicable)", 1.5],
      ["Complexity Factor (Curved +20%)", `=IF(Structural!B9="Yes", 1.2, 1.0)`],
      ["Applied Labor Factor", `=IF(B12="Front Service", B13, B14)`],
      ["", ""],
      ["TOTAL LABOR COST", `=B8 * B11 * B16`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 5 || idx === 9) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 17) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    [4, 11, 18].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
  }

  /**
   * Sheet 5: Shipping
   */
  static _createShippingSheet(workbook, data) {
    const sheet = workbook.addWorksheet("Shipping");

    const rows = [
      ["SHIPPING COST CALCULATION", ""],
      ["", ""],
      ["Screen Specifications", ""],
      ["Screen Area (sq ft)", `=Hardware!B6`],
      ["Weight per SqFt (lbs)", 45],
      ["Total Weight (lbs)", `=B4*B5`],
      ["", ""],
      ["Shipping Rate", ""],
      ["Cost per 100 lbs", 25],
      ["", ""],
      ["TOTAL SHIPPING COST", `=(B6/100)*B9`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 7) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 10) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    [4, 6, 9, 11].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
  }

  /**
   * Sheet 6: PM & Engineering
   */
  static _createPMEngineeringSheet(workbook, data) {
    const sheet = workbook.addWorksheet("PM_Engineering");

    const rows = [
      ["PM FEE & ENGINEERING CALCULATION", ""],
      ["", ""],
      ["Cost Components", "Amount"],
      ["Hardware Cost (Adjusted)", `=Hardware!B19`],
      ["Structural Cost", `=Structural!B12`],
      ["Labor Cost", `=Labor!B18`],
      ["Subtotal (for PM calc)", `=B4+B5+B6`],
      ["", ""],
      ["PM Fee Calculation", ""],
      ["PM Fee Percentage", 0.08],
      ["", ""],
      ["PM FEE", `=B7*B10`],
      ["", ""],
      ["Engineering Calculation", ""],
      ["Engineering Base (% of Hardware)", 0.03],
      ["Outdoor Contingency Add ($)", 5000],
      ["", ""],
      ["ENGINEERING FEE", `=(B4*B15)+B16`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 8 || idx === 13) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 11 || idx === 17) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    [4, 5, 6, 7, 10, 12, 15, 16, 18].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
  }

  /**
   * Sheet 7: Margins
   */
  static _createMarginsSheet(workbook, data) {
    const sheet = workbook.addWorksheet("Margins");

    const rows = [
      ["MARGIN & PRICING CALCULATION", ""],
      ["", ""],
      ["Cost Components", "Amount"],
      ["Hardware", `=Hardware!B19`],
      ["Structural", `=Structural!B12`],
      ["Labor", `=Labor!B18`],
      ["Shipping", `=Shipping!B11`],
      ["PM Fee", `=PM_Engineering!B12`],
      ["Engineering", `=PM_Engineering!B18`],
      ["", ""],
      ["TOTAL COST BASIS", `=SUM(B4:B9)`],
      ["", ""],
      ["Margin Target (%)", data.desiredMargin ? (data.desiredMargin * 100) : 30],
      ["", ""],
      ["FINAL SELL PRICE", `=B11 / (1 - B13/100)`],
      ["GROSS PROFIT ($)", `=B15 - B11`],
      ["GROSS PROFIT (%)", `=B16 / B11`],
    ];

    rows.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0) {
        excelRow.font = { bold: true, size: 11 };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D9E8F5" } };
      }
      if (idx === 10 || idx === 14 || idx === 15 || idx === 16) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "E2EFDA" } };
      }
    });

    sheet.getColumn("A").width = 35;
    sheet.getColumn("B").width = 20;

    [4, 5, 6, 7, 8, 9, 11, 13, 15, 16].forEach((row) => {
      sheet.getCell(`B${row}`).numFmt = "$#,##0.00";
    });
    sheet.getCell("B17").numFmt = "0.0%";
  }

  /**
   * Sheet 8: Data Source (Hidden)
   */
  static _createDataSourceSheet(workbook, data) {
    const sheet = workbook.addWorksheet("DataSource", { state: "hidden" });

    const sourceData = [
      ["QUOTE DATA SOURCE (Hidden Reference Sheet)", ""],
      ["", ""],
      ["Parameter", "Value"],
      ...Object.entries(data).map(([key, value]) => [key, value]),
    ];

    sourceData.forEach((row, idx) => {
      const excelRow = sheet.addRow(row);
      if (idx === 0 || idx === 2) {
        excelRow.font = { bold: true };
        excelRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "D3D3D3" } };
      }
    });

    sheet.getColumn("A").width = 30;
    sheet.getColumn("B").width = 40;
  }

  /**
   * Format all sheets with consistent styling
   */
  static _formatAllSheets(workbook) {
    workbook.worksheets.forEach((sheet) => {
      // Set page margins for printing
      sheet.pageSetup = {
        paperSize: 1, // 1 = Letter (8.5 x 11")
        orientation: "portrait",
        fitToPage: true,
        fitToHeight: 1,
        fitToWidth: 1,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      };

      // Set print options
      sheet.printOptions = {
        printGridLines: false,
        horizontalCentered: false,
        verticalCentered: false,
      };

      // Freeze header rows where applicable
      if (sheet.name !== "DataSource") {
        sheet.views = [{ state: "frozen", ySplit: 2 }];
      }
    });

    // Protect the data source sheet from editing
    workbook.worksheets[7].protect("AncAudit2026", {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false,
      sheet: true,
      objects: true,
      scenarios: true,
    });
  }
}

module.exports = { AncAuditExcelService };
