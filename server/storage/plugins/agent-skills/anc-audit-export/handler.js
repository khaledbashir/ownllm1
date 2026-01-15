const ExcelJS = require('exceljs');
const AncPricingEngine = require('../../../../utils/AncPricingEngine');

module.exports.runtime = {
  handler: async function ({ width, height, pixelPitch, environment, productClass, accessType, steelCondition, margin, timeline }) {
    try {
      this.logger(`[ANC Audit Export] Generating internal audit for ${width}x${height} at ${margin * 100}% margin`);

      // Run ANC Master Formulas
      const quote = AncPricingEngine.calculate(
        Number(width),
        Number(height),
        pixelPitch || '1.5mm',
        environment || 'indoor',
        margin || 0.30,
        null, // address not needed for internal audit
        productClass || null,
        steelCondition || 'existing',
        accessType || 'front',
        timeline || 'standard'
      );

      const workbook = new ExcelJS.Workbook();
      const ancBlue = '003D82';
      const headerFont = { bold: true, color: { argb: 'FFFFFFFF' } };
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ancBlue } };

      // ========================================
      // TAB 1: EXECUTIVE SUMMARY
      // ========================================
      const summary = workbook.addWorksheet('Executive Summary');
      summary.mergeCells('A1:F1', headerFont, headerFill);
      summary.getCell('A1').value = 'ANC SPORTS ENTERPRISES - INTERNAL AUDIT';
      summary.getCell('A1').alignment = { horizontal: 'center' };
      summary.getCell('A1').font = { size: 16, bold: true };

      summary.addRow([]);
      summary.addRow(['Metric', 'Value']);
      summary.addRow(['Project Dimensions', `${quote.meta.dimensions} (${quote.meta.area} sqft)`]);
      summary.addRow(['Product Type', quote.meta.type]);
      summary.addRow(['Environment', quote.meta.environment.toUpperCase()]);
      summary.addRow(['Base Cost (Hardware + Structural)', (quote.tabs.hardware.base + quote.tabs.structural.materials + quote.tabs.structural.labor).toLocaleString()]);
      summary.addRow(['Installation Labor', (quote.tabs.labor.install + quote.tabs.labor.supervision + quote.tabs.labor.travel).toLocaleString()]);
      summary.addRow(['Electrical & PM', (quote.tabs.electrical.pdus + quote.tabs.electrical.cabling + quote.tabs.electrical.subcontracting + quote.tabs.proServices.pm + quote.tabs.proServices.conditions + quote.tabs.proServices.submittals).toLocaleString()]);
      summary.addRow(['Install Assessment', (quote.tabs.installAssessment.scaffolding + quote.tabs.installAssessment.freight + quote.tabs.installAssessment.storage).toLocaleString()]);
      summary.addRow(['Contingency', quote.tabs.summary.contingency?.toLocaleString() || '$0']);
      summary.addRow(['Timeline Surcharge', quote.tabs.summary.timelineSurcharge?.toLocaleString() || '$0']);
      summary.addRow(['Total Cost Basis', quote.tabs.summary.costBasis.toLocaleString()]);
      summary.addRow(['Final Sell Price', quote.tabs.summary.sellPrice.toLocaleString()]);
      summary.addRow(['Target Margin', `${quote.tabs.summary.marginPct.toFixed(2)}%`]);
      summary.addRow(['Gross Profit', quote.tabs.summary.grossProfit.toLocaleString()]);

      // ========================================
      // TAB 2: HARDWARE BREAKDOWN (WITH FORMULAS)
      // ========================================
      const hardware = workbook.addWorksheet('Hardware Breakdown');
      hardware.mergeCells('A1:F1', headerFont, headerFill);
      hardware.getCell('A1').value = 'HARDWARE (ANC MASTER FORMULAS)';
      
      hardware.addRow([]);
      hardware.addRow(['Component', 'Formula / Rate', 'Result', 'Note']);
      
      // Base Hardware
      const baseCost = quote.tabs.hardware.base || 0;
      const baseRate = pixelPitch && AncPricingEngine.PIXEL_PITCH_RATES[pixelPitch] 
        ? `$${AncPricingEngine.PIXEL_PITCH_RATES[pixelPitch].toFixed(2)}/sqft (${pixelPitch})` 
        : (quote.meta.environment === 'outdoor' ? '$2,500/sqft (Outdoor)' : '$1,200/sqft (Indoor)');
      hardware.addRow(['Base Hardware', baseRate, baseCost.toLocaleString()]);
      
      // Ribbon Surcharge
      if (quote.tabs.hardware.surcharge > 0) {
        const surcharge = quote.tabs.hardware.surcharge || 0;
        hardware.addRow(['Ribbon Board Surcharge', '+20% (Product Class)', surcharge.toLocaleString()]);
      }

      // Spares
      hardware.addRow(['Spare Parts (5% of Base)', 'Base × 5%', (quote.tabs.hardware.spares || 0).toLocaleString()]);

      // Processing
      hardware.addRow(['Video Processing', '$15,000 Fixed', (quote.tabs.hardware.processing || 0).toLocaleString()]);

      hardware.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // TAB 3: STRUCTURAL MATERIALS (WITH MODIFIERS)
      // ========================================
      const structural = workbook.addWorksheet('Structural Materials');
      structural.mergeCells('A1:F1', headerFont, headerFill);
      structural.getCell('A1').value = 'STRUCTURAL MODIFIERS & MATERIALS';

      structural.addRow([]);
      structural.addRow(['Condition', 'Modifier', 'Material Cost', 'Formula Applied']);

      // Materials
      const materials = quote.tabs.structural.materials || 0;
      structural.addRow(['Steel Condition', (quote.meta.modifiers?.steel || 'Existing'), materials.toLocaleString()]);
      
      // Calculate formula display
      let matFormula = 'Base Hardware × 20%';
      if (quote.meta.modifiers?.steel === 'new') matFormula += ' (+15% New Steel)';
      structural.addRow(['Materials Formula', matFormula, materials.toLocaleString()]);

      // Structural Labor
      const labor = quote.tabs.structural.labor || 0;
      structural.addRow(['Structural Labor', '(Hardware + Materials) × Factor', labor.toLocaleString()]);
      
      const laborFormula = 'Base Hardware × Structural Labor Factor';
      if (quote.meta.modifiers?.steel === 'new') laborFormula += ' (+15% New Steel)';
      structural.addRow(['Labor Formula', laborFormula, labor.toLocaleString()]);

      // ========================================
      // TAB 4: LABOR BREAKDOWN
      // ========================================
      const laborSheet = workbook.addWorksheet('Labor Analysis');
      laborSheet.mergeCells('A1:F1', headerFont, headerFill);
      laborSheet.getCell('A1').value = 'LABOR (ANC MASTER FORMULAS)';

      laborSheet.addRow([]);
      laborSheet.addRow(['Role', 'Rate/Formula', 'Cost', 'Notes']);
      
      laborSheet.addRow(['Installation', '$150/hr × sqft', (quote.tabs.labor.install || 0).toLocaleString()]);
      laborSheet.addRow(['Supervision', '$7,500 Fixed', (quote.tabs.labor.supervision || 0).toLocaleString()]);
      laborSheet.addRow(['Travel', '$3,000 Fixed', (quote.tabs.labor.travel || 0).toLocaleString()]);

      laborSheet.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // TAB 5: ELECTRICAL & DATA
      // ========================================
      const electrical = workbook.addWorksheet('Electrical & Data');
      electrical.mergeCells('A1:F1', headerFont, headerFill);
      electrical.getCell('A1').value = 'ELECTRICAL SYSTEMS';

      electrical.addRow([]);
      electrical.addRow(['Component', 'Formula / Spec', 'Cost', 'Note']);
      
      electrical.addRow(['PDUs', '1.5 units per 500 sqft @ $2,500', (quote.tabs.electrical.pdus || 0).toLocaleString()]);
      electrical.addRow(['Cabling', `$15/ft (${quote.meta.modifiers?.cableDistance || 'Medium'})`, (quote.tabs.electrical.cabling || 0).toLocaleString()]);
      electrical.addRow(['Subcontracting', '~80 hrs @ $150/hr', (quote.tabs.electrical.subcontracting || 0).toLocaleString()]);

      electrical.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // TAB 6: PROFESSIONAL SERVICES
      // ========================================
      const pro = workbook.addWorksheet('Professional Services');
      pro.mergeCells('A1:F1', headerFont, headerFill);
      pro.getCell('A1').value = 'PROFESSIONAL SERVICES (ANC MASTER FORMULAS)';

      pro.addRow([]);
      pro.addRow(['Service', 'Formula', 'Cost']);

      pro.addRow(['Project Management', `Subtotal × ${AncPricingEngine.RATES.PM_FEE * 100}%`, (quote.tabs.proServices.pm || 0).toLocaleString()]);
      pro.addRow(['General Conditions', `Subtotal × 5%`, (quote.tabs.proServices.conditions || 0).toLocaleString()]);
      pro.addRow(['Submittals', '$2,500 per display type', (quote.tabs.proServices.submittals || 0).toLocaleString()]);

      pro.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // TAB 7: INSTALLATION ASSESSMENT
      // ========================================
      const install = workbook.addWorksheet('Installation Assessment');
      install.mergeCells('A1:F1', headerFont, headerFill);
      install.getCell('A1').value = 'SITE ASSESSMENT';

      install.addRow([]);
      install.addRow(['Requirement', 'Formula / Status', 'Cost']);
      
      install.addRow(['Scaffolding', quote.meta.environment === 'outdoor' ? 'Outdoor Rate' : 'Indoor Rate', (quote.tabs.installAssessment.scaffolding || 0).toLocaleString()]);
      install.addRow(['Freight', '$4,500 Fixed', (quote.tabs.installAssessment.freight || 0).toLocaleString()]);
      install.addRow(['Storage', '$2,000 Fixed', (quote.tabs.installAssessment.storage || 0).toLocaleString()]);
      install.addRow(['Timeline', quote.meta.modifiers?.timeline || 'standard', '']);

      install.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // TAB 8: FORMULA REFERENCE
      // ========================================
      const formulas = workbook.addWorksheet('ANC Master Formulas Reference');
      formulas.mergeCells('A1:F1', headerFont, headerFill);
      formulas.getCell('A1').value = 'USED FORMULAS FOR THIS AUDIT';

      formulas.addRow([]);
      formulas.addRow(['Category', 'Formula', 'Variables Used']);
      
      formulas.addRow(['Pixel Pitch Rates', '10mm: $2,500/sqft, 6mm: $2,200/sqft, 4mm: $1,800/sqft, 1.5mm: $1,500/sqft', `Used: ${pixelPitch || '1.5mm'}`]);
      formulas.addRow(['Hardware Base Rate', 'Indoor: $1,200/sqft, Outdoor: $2,500/sqft', quote.meta.environment.toUpperCase()]);
      formulas.addRow(['Materials Factor', 'Base × 20%', `Applied: ${quote.meta.modifiers?.steel || 'Existing'}`]);
      formulas.addRow(['Structural Modifiers', 'New Steel +15%, Rigging +10%, Curved +5%', `Access: ${quote.meta.modifiers?.accessType || 'Front'}`]);
      formulas.addRow(['Labor Factor', 'Base × Factor', `Mod: ${quote.meta.modifiers?.steel || 'Existing'}`]);
      formulas.addRow(['PM Fee', 'Subtotal × 8%', '8% of ANC']);
      formulas.addRow(['Contingency', '5% if Outdoor AND New Steel', `Applied: ${(quote.meta.environment === 'outdoor' && quote.meta.modifiers?.steel === 'new') ? 'Yes' : 'No'}`]);
      formulas.addRow(['Timeline Charges', 'Standard, Rush +20%, ASAP +50%', `Status: ${quote.meta.modifiers?.timeline || 'standard'}`]);
      formulas.addRow(['Target Margin', `${(quote.tabs.summary.marginPct || 0).toFixed(2)}%`, '']);
      formulas.addRow(['Ribbon Surcharge', '+20% if Product Class = Ribbon Board', `Class: ${quote.meta.modifiers?.productClass || 'None'}`]);

      formulas.getColumn('B').eachCell({ includeEmpty: true, style: { font: { bold: true } } });

      // ========================================
      // SAVE FILE
      // ========================================
      const fs = require('fs');
      const path = require('path');
      
      const outputDir = '/app/server/storage/documents';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `ANC_Internal_Audit_${Date.now()}.xlsx`;
      const filepath = path.join(outputDir, filename);

      this.introspect('Saving internal audit Excel with all ANC Master formulas...');
      await workbook.xlsx.writeFile(filepath);
      
      const baseUrl = process.env.BASE_URL || 'https://basheer-everythingllm.x0uyzh.easypanel.host';
      const downloadUrl = `${baseUrl}/api/system/download/${filename}`;

      return `### 📊 ANC Internal Audit Generated
**Audit File:** ANC_Internal_Audit.xlsx
**Format:** 8-Tabs with ALL ANC Master Formulas
**Purpose:** For Estimators to verify calculations

🔗 **[DOWNLOAD_INTERNAL_AUDIT_EXCEL](${downloadUrl})**

*All formulas shown in 'Formula Reference' tab. Ready for estimator review.*`;

    } catch (error) {
      this.logger(`ANC Audit Export Error: ${error.message}`);
      return `Error generating audit: ${error.message}`;
    }
  }
};
