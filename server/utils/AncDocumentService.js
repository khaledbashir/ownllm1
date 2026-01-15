// server/utils/AncDocumentService.js
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class AncDocumentService {
  
  async generateAuditFile(quoteData, workspaceSlug) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ANC Enterprise Platform';
    workbook.created = new Date();

    // --- SHEET 1: ESTIMATOR AUDIT ---
    const sheet = workbook.addWorksheet('Cost Breakdown');

    // Define Columns with Widths
    sheet.columns = [
      { header: 'Cost Category', key: 'category', width: 25 },
      { header: 'Details / Formula', key: 'details', width: 40 },
      { header: 'Internal Cost ($)', key: 'cost', width: 20, style: { numFmt: '"$"#,##0.00' } }
    ];

    // Styling the Header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003D82' } }; // ANC Blue

    // Add Data Rows
    sheet.addRow({ category: 'Hardware', details: `${quoteData.meta.area} sqft @ Panel Rate`, cost: quoteData.lineItems.hardware });
    sheet.addRow({ category: 'Structural', details: 'Steel + Mounts (Base + Var)', cost: quoteData.lineItems.structural });
    sheet.addRow({ category: 'Installation Labor', details: 'Union Rate Allocation', cost: quoteData.lineItems.labor });
    sheet.addRow({ category: 'Electrical', details: 'Data/Power Run Est.', cost: quoteData.lineItems.electrical });
    sheet.addRow({ category: 'Project Management', details: '15% of Construction Subtotal', cost: quoteData.lineItems.projectManagement });
    
    // Add Spacer
    sheet.addRow({});

    // Financials
    const rowCost = sheet.addRow({ category: 'TOTAL COST BASIS', details: '', cost: quoteData.financials.costBasis });
    rowCost.font = { bold: true };

    const rowMargin = sheet.addRow({ category: 'Gross Margin', details: `${quoteData.financials.marginPct}% Target`, cost: quoteData.financials.marginAmt });
    
    const rowTotal = sheet.addRow({ category: 'CLIENT SELL PRICE', details: 'Final Quote Amount', cost: quoteData.financials.sellPrice });
    rowTotal.font = { bold: true, size: 12 };
    rowTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } }; // Light Grey

    // --- SAVE FILE ---
    // Ensure directory exists. In production, we might push to S3, but local storage is fine for VPS.
    // Use the existing 'storage' folder in the RAG structure.
    const outputDir = path.resolve(__dirname, '../../server/storage/documents');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `ANC_Audit_${Date.now()}_${workspaceSlug}.xlsx`;
    const filepath = path.join(outputDir, filename);

    await workbook.xlsx.writeFile(filepath);
    
    return filename;
  }
}

module.exports = new AncDocumentService();
