// server/utils/AncDocumentService.js
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class AncDocumentService {
  
  async generateAuditFile(quoteData, workspaceSlug) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ANC Enterprise Platform';
    workbook.created = new Date();

    const ancBlue = 'FF003D82';
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ancBlue } };

    const formatHeader = (sheet, rowNum = 1) => {
      sheet.getRow(rowNum).font = headerFont;
      sheet.getRow(rowNum).fill = headerFill;
      sheet.columns.forEach(col => col.width = 30);
    };

    // --- Tab 1: Executive Summary ---
    const summary = workbook.addWorksheet('Executive Summary');
    
    // Add Branding Row
    summary.mergeCells('A1:F1');
    summary.getCell('A1').value = 'ANC SPORTS ENTERPRISES - PROJECT SUMMARY';
    summary.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    summary.getCell('A1').fill = headerFill;
    summary.getCell('A1').alignment = { horizontal: 'center' };

    summary.addRow(['Project Address:', quoteData.meta.address || 'Not Provided']);
    summary.getRow(2).font = { italic: true };
    summary.addRow([]);

    summary.getRow(4).values = ['Screen #', 'Product Type', 'Dimensions', 'Pixel Pitch', 'Total Cost', 'Annual Service'];
    formatHeader(summary, 4);

    summary.addRow([1, quoteData.meta.type, quoteData.meta.dimensions, '10.0mm', quoteData.tabs.summary.sellPrice, quoteData.tabs.summary.sellPrice * 0.15]);
    summary.getCell('E5').numFmt = '"$"#,##0';
    summary.getCell('F5').numFmt = '"$"#,##0';

    summary.addRow([]);
    const totalRow = summary.addRow(['PROJECT TOTAL', '', '', '', quoteData.tabs.summary.sellPrice]);
    summary.getCell(`E${totalRow.number}`).font = { bold: true };
    summary.getCell(`E${totalRow.number}`).numFmt = '"$"#,##0';

    // --- Tab 2: LED Hardware ---
    const hw = workbook.addWorksheet('LED Hardware');
    hw.addRow(['LED HARDWARE BREAKDOWN']);
    hw.getRow(1).font = { bold: true, size: 14 };
    hw.addRow(['Component', 'Description', 'Internal Cost']);
    formatHeader(hw, 2);
    hw.addRow(['Primary Panels', `${quoteData.meta.area} sqft @ Panel Rate`, quoteData.tabs.hardware.base]);
    hw.addRow(['Spare Parts', 'Maintenance Kit', quoteData.tabs.hardware.spares]);
    hw.addRow(['Processing', 'Video Controllers', quoteData.tabs.hardware.processing]);
    hw.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 3: Structural Requirements ---
    const struc = workbook.addWorksheet('Structural Requirements');
    struc.addRow(['STRUCTURAL & MOUNTING']);
    struc.getRow(1).font = { bold: true, size: 14 };
    struc.addRow(['Item', 'Details', 'Cost']);
    formatHeader(struc, 2);
    struc.addRow(['Steel Materials', 'Mounts & Brackets', quoteData.tabs.structural.materials]);
    struc.addRow(['Engineering', 'PE Stamped Drawings', quoteData.tabs.structural.engineering]);
    struc.addRow(['Fabrication', 'Custom Steel Work', quoteData.tabs.structural.fabrication]);
    struc.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 4: Labor Analysis ---
    const labor = workbook.addWorksheet('Labor Analysis');
    labor.addRow(['LABOR & INSTALLATION']);
    labor.getRow(1).font = { bold: true, size: 14 };
    labor.addRow(['Role', 'Unit', 'Cost']);
    formatHeader(labor, 2);
    labor.addRow(['Union Installers', 'Field Labor', quoteData.tabs.labor.install]);
    labor.addRow(['Supervision', 'Lead Technician', quoteData.tabs.labor.supervision]);
    labor.addRow(['Travel', 'Mobilization', quoteData.tabs.labor.travel]);
    labor.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 5: Electrical Systems ---
    const elect = workbook.addWorksheet('Electrical Systems');
    elect.addRow(['ELECTRICAL REQUIREMENTS']);
    elect.getRow(1).font = { bold: true, size: 14 };
    elect.addRow(['Service', 'Spec', 'Cost']);
    formatHeader(elect, 2);
    elect.addRow(['Power Distribution', 'PDUs', quoteData.tabs.electrical.distribution]);
    elect.addRow(['Backup', 'UPS Systems', quoteData.tabs.electrical.backup]);
    elect.addRow(['Data', 'Fiber/Cat6', quoteData.tabs.electrical.connectivity]);
    elect.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 6: Installation Assessment ---
    const assess = workbook.addWorksheet('Installation Assessment');
    assess.addRow(['SITE ASSESSMENT']);
    assess.getRow(1).font = { bold: true, size: 14 };
    assess.addRow(['Requirement', 'Notes', 'Cost']);
    formatHeader(assess, 2);
    assess.addRow(['Scaffolding', 'Access Equipment', quoteData.tabs.installAssessment.scaffolding]);
    assess.addRow(['Freight', 'Shipping & Delivery', quoteData.tabs.installAssessment.freight]);
    assess.addRow(['Storage', 'Site Storage', quoteData.tabs.installAssessment.storage]);
    assess.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 7: Professional Services ---
    const prof = workbook.addWorksheet('Professional Services');
    prof.addRow(['PROFESSIONAL SERVICES']);
    prof.getRow(1).font = { bold: true, size: 14 };
    prof.addRow(['Service', 'Rate', 'Cost']);
    formatHeader(prof, 2);
    prof.addRow(['Project Management', '15% Construction', quoteData.tabs.proServices.pm]);
    prof.addRow(['Commissioning', 'System Turn-on', quoteData.tabs.proServices.commissioning]);
    prof.addRow(['Training', 'Operator Training', quoteData.tabs.proServices.training]);
    prof.getColumn(3).numFmt = '"$"#,##0.00';

    // --- Tab 8: Screen Details ---
    const details = workbook.addWorksheet('Screen Details');
    details.addRow(['TECHNICAL SPECIFICATIONS']);
    details.getRow(1).font = { bold: true, size: 14 };
    details.addRow(['Parameter', 'Value']);
    formatHeader(details, 2);
    details.addRow(['Width', `${quoteData.tabs.screenDetails.width} ft`]);
    details.addRow(['Height', `${quoteData.tabs.screenDetails.height} ft`]);
    details.addRow(['Total Area', `${quoteData.tabs.screenDetails.area} sqft`]);
    details.addRow(['Project Address', quoteData.meta.address || 'N/A']);
    details.addRow(['Resolution', 'Custom']);
    details.getColumn(2).width = 40;

    // --- SAVE FILE ---
    const outputDir = '/app/server/storage/documents';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `ANC_Audit_${Date.now()}_${workspaceSlug}.xlsx`;
    const filepath = path.join(outputDir, filename);

    console.log(`[ANC Service] Saving audit file to: ${filepath}`);
    await workbook.xlsx.writeFile(filepath);
    
    return filename;
  }
}

module.exports = new AncDocumentService();
