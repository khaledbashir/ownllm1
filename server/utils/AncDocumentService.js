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

    const formatHeader = (sheet) => {
      sheet.getRow(1).font = headerFont;
      sheet.getRow(1).fill = headerFill;
      sheet.columns.forEach(col => col.width = 30);
    };

    // --- Tab 1: Executive Summary ---
    const summary = workbook.addWorksheet('Executive Summary');
    summary.columns = [{ header: 'Category', key: 'category' }, { header: 'Value', key: 'value', style: { numFmt: '"$"#,##0.00' } }];
    summary.addRow({ category: 'Project Type', value: quoteData.meta.type });
    summary.addRow({ category: 'Total Area (SqFt)', value: quoteData.meta.area });
    summary.addRow({ category: 'Grand Total Sell Price', value: quoteData.tabs.summary.sellPrice });
    summary.addRow({ category: 'Total Cost Basis', value: quoteData.tabs.summary.costBasis });
    summary.addRow({ category: 'Gross Margin Amount', value: quoteData.tabs.summary.grossProfit });
    summary.addRow({ category: 'Margin Percentage', value: `${quoteData.tabs.summary.marginPct}%` });
    formatHeader(summary);

    // --- Tab 2: LED Hardware ---
    const hw = workbook.addWorksheet('LED Hardware');
    hw.columns = [{ header: 'Component', key: 'name' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    hw.addRow({ name: 'LED Panels (Primary)', cost: quoteData.tabs.hardware.base });
    hw.addRow({ name: 'Spare Parts Kit', cost: quoteData.tabs.hardware.spares });
    hw.addRow({ name: 'Video Processing / Controllers', cost: quoteData.tabs.hardware.processing });
    formatHeader(hw);

    // --- Tab 3: Structural Requirements ---
    const struc = workbook.addWorksheet('Structural Requirements');
    struc.columns = [{ header: 'Item', key: 'item' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    struc.addRow({ item: 'Steel Materials & Mounts', cost: quoteData.tabs.structural.materials });
    struc.addRow({ item: 'Structural Engineering Review', cost: quoteData.tabs.structural.engineering });
    struc.addRow({ item: 'Custom Fabrication', cost: quoteData.tabs.structural.fabrication });
    formatHeader(struc);

    // --- Tab 4: Labor Analysis ---
    const labor = workbook.addWorksheet('Labor Analysis');
    labor.columns = [{ header: 'Labor Type', key: 'type' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    labor.addRow({ type: 'Field Installation (Union)', cost: quoteData.tabs.labor.install });
    labor.addRow({ type: 'On-site Supervision', cost: quoteData.tabs.labor.supervision });
    labor.addRow({ type: 'Travel & Per Diem', cost: quoteData.tabs.labor.travel });
    formatHeader(labor);

    // --- Tab 5: Electrical Systems ---
    const elect = workbook.addWorksheet('Electrical Systems');
    elect.columns = [{ header: 'Requirement', key: 'desc' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    elect.addRow({ desc: 'Power Distribution Units', cost: quoteData.tabs.electrical.distribution });
    elect.addRow({ desc: 'Backup Systems / UPS', cost: quoteData.tabs.electrical.backup });
    elect.addRow({ desc: 'Connectivity & Data Cabling', cost: quoteData.tabs.electrical.connectivity });
    formatHeader(elect);

    // --- Tab 6: Installation Assessment ---
    const assess = workbook.addWorksheet('Installation Assessment');
    assess.columns = [{ header: 'Service', key: 'service' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    assess.addRow({ service: 'Scaffolding / Specialized Lift', cost: quoteData.tabs.installAssessment.scaffolding });
    assess.addRow({ service: 'Freight & Logistics', cost: quoteData.tabs.installAssessment.freight });
    assess.addRow({ service: 'On-site Storage', cost: quoteData.tabs.installAssessment.storage });
    formatHeader(assess);

    // --- Tab 7: Professional Services ---
    const prof = workbook.addWorksheet('Professional Services');
    prof.columns = [{ header: 'Service', key: 'service' }, { header: 'Cost', key: 'cost', style: { numFmt: '"$"#,##0.00' } }];
    prof.addRow({ service: 'Project Management (15%)', cost: quoteData.tabs.proServices.pm });
    prof.addRow({ service: 'System Commissioning', cost: quoteData.tabs.proServices.commissioning });
    prof.addRow({ service: 'Operator Training', cost: quoteData.tabs.proServices.training });
    formatHeader(prof);

    // --- Tab 8: Screen Details ---
    const details = workbook.addWorksheet('Screen Details');
    details.columns = [{ header: 'Parameter', key: 'param' }, { header: 'Value', key: 'val' }];
    details.addRow({ param: 'Width (ft)', val: quoteData.tabs.screenDetails.width });
    details.addRow({ param: 'Height (ft)', val: quoteData.tabs.screenDetails.height });
    details.addRow({ param: 'Total Area (sqft)', val: quoteData.tabs.screenDetails.area });
    details.addRow({ param: 'Target Environment', val: quoteData.meta.environment });
    formatHeader(details);

    // --- SAVE FILE ---
    const outputDir = path.resolve(__dirname, '../../storage/documents');
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
