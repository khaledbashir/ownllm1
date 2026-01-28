const fs = require('fs');
const path = require('path');

/**
 * HELPER: SAFE INTROSPECT
 */
function log(context, message) {
  if (context && typeof context.introspect === 'function') {
    context.introspect(message);
  } else {
    console.log(`[anc-mirror] ${message}`);
  }
}

/**
 * HELPER: NATALIA MATH ROUNDING
 */
function roundNatalia(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * HELPER: HIGH-FIDELITY CSV PARSER
 * Handles quoted commas and multi-line cells
 */
function parseCSVLine(line) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result.map(c => c.replace(/^"|"$/g, '').trim());
}

/**
 * HELPER: DEEP SCAN WORKBOOK
 * Scans all sheets in the folder to find the best data source
 */
function deepScanWorkbook(folderPath) {
  const sheets = fs.readdirSync(folderPath).filter(f => f.startsWith('sheet-') && f.endsWith('.json'));
  const workbook = {};
  
  for (const sheet of sheets) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(folderPath, sheet), 'utf8'));
      const lines = content.pageContent.split('\n').filter(l => l.trim());
      const data = lines.map(parseCSVLine);
      const sheetName = sheet.replace('sheet-', '').replace('.json', '');
      workbook[sheetName] = data;
    } catch (e) {
      console.error(`Failed to parse sheet ${sheet}: ${e.message}`);
    }
  }
  return workbook;
}

/**
 * HELPER: FIND BEST SHEET FOR DATA
 */
/**
 * HELPER: FIND BEST SHEET FOR DATA
 */
function findBestSheet(workbook) {
  const priorityKeywords = ['margin', 'analysis', 'cost sheet', 'proposal', 'bid'];
  const sheetNames = Object.keys(workbook);
  
  // 1. Try priority names
  for (const kw of priorityKeywords) {
    const found = sheetNames.find(n => n.toLowerCase().includes(kw));
    if (found) return { name: found, data: workbook[found] };
  }
  
  // 2. Try sheets with most "ANC-like" columns
  for (const name of sheetNames) {
    const data = workbook[name];
    const header = findHeaderRow(data);
    if (header.found) return { name, data: workbook[name] };
  }
  
  return { name: sheetNames[0], data: workbook[sheetNames[0]] };
}

/**
 * HELPER: PARSE NUMERIC
 */
function parseNumeric(val) {
  if (typeof val === 'number') return val;
  const str = (val || '0').toString().replace(/[$,\s]/g, '');
  if (str.startsWith('(') && str.endsWith(')')) return -parseFloat(str.replace(/[()]/g, '')) || 0;
  return parseFloat(str) || 0;
}

/**
 * HELPER: CREATE LLM SUMMARY
 * Generates a structured JSON summary of the workbook for the AI to "read right"
 */
function createLLMSummary(workbook, activeSheetName, extractedData) {
  return {
    workbook_overview: {
      sheets_found: Object.keys(workbook),
      active_sheet_used: activeSheetName
    },
    project_summary: {
      total_displays: extractedData.displays.length,
      financials: {
        subtotal: extractedData.pricing.subtotal,
        tax: extractedData.pricing.tax,
        bond: extractedData.pricing.bond,
        grand_total: extractedData.pricing.total
      }
    },
    display_details: extractedData.displays.map(d => ({
      item: d.name,
      price: d.sellingPrice,
      specs: {
        pitch: d.pitch,
        qty: d.quantity,
        h: d.dimensions.height,
        w: d.dimensions.width
      }
    })),
    warnings: extractedData.warnings
  };
}

/**
 * HELPER: EXTRACT FROM STRING
 */
function extractFromString(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : null;
}

/**
 * HELPER: EXTRACT DIMENSIONS
 */
function extractDimensions(text) {
  const match = text.match(/(\d+\.?\d*)\s*(?:h)?\s*[xX×]\s*(\d+\.?\d*)\s*(?:w)?/i);
  return match ? { 
    height: roundNatalia(parseFloat(match[1])), 
    width: roundNatalia(parseFloat(match[2])) 
  } : { height: null, width: null };
}

/**
 * HELPER: BUILD COLUMN MAP
 */
function buildColumnMap(headerRow) {
  const map = {};
  const columnPatterns = {
    displayName: ['display', 'name', 'description', 'item'],
    sellingPrice: ['selling price', 'sale price', 'price'],
    cost: ['cost', 'total cost'],
    margin: ['margin', 'profit'],
    pitch: ['pitch', 'mm pitch'],
    height: ['height', 'h'],
    width: ['width', 'w'],
    quantity: ['quantity', 'qty'],
    brightness: ['brightness', 'nit']
  };

  headerRow.forEach((cell, idx) => {
    const normalized = (cell || '').toLowerCase().trim();
    for (const [key, patterns] of Object.entries(columnPatterns)) {
      if (patterns.some(p => normalized.includes(p)) && map[key] === undefined) map[key] = idx;
    }
  });
  return map;
}

/**
 * HELPER: FIND HEADER ROW
 */
function findHeaderRow(rawData) {
  const REQUIRED_COLUMNS = ['selling price', 'cost', 'margin'];
  for (let rowIdx = 0; rowIdx < Math.min(30, rawData.length); rowIdx++) {
    const row = rawData[rowIdx].map(cell => (cell || '').toLowerCase().trim());
    const matchCount = REQUIRED_COLUMNS.filter(col => row.some(cell => cell.includes(col))).length;
    if (matchCount >= 2) return { found: true, rowIndex: rowIdx, columns: buildColumnMap(rawData[rowIdx]) };
  }
  return { found: false };
}

/**
 * HELPER: EXTRACT DISPLAY ROWS
 */
function extractDisplayRows(rawData, headerMap) {
  const displays = [];
  const { rowIndex, columns } = headerMap;
  const displayKeywords = ['display', 'ribbon', 'scoreboard', 'screen', 'led', 'lcd'];

  for (let i = rowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    const name = (row[columns.displayName] || '').trim();
    if (!name || name.toLowerCase().includes('total')) continue;
    
    const price = parseNumeric(row[columns.sellingPrice]);
    if (price <= 0 || !displayKeywords.some(kw => name.toLowerCase().includes(kw))) continue;

    displays.push({
      name,
      sellingPrice: price,
      pitch: extractFromString(name, /(\d+\.?\d*)\s*mm/i),
      dimensions: extractDimensions(name),
      brightness: extractFromString(name, /(\d+)\s*nits?/i),
      quantity: parseNumeric(row[columns.quantity]) || 1
    });
  }
  return displays;
}

/**
 * HELPER: EXTRACT PRICING TOTALS
 */
function extractPricingTotals(rawData, headerMap) {
  const pricing = { subtotal: 0, tax: 0, bond: 0, total: 0 };
  const { columns } = headerMap;

  rawData.forEach(row => {
    const firstCell = (row[0] || '').toString().toLowerCase().trim();
    const val = parseNumeric(row[columns.sellingPrice]);
    if (firstCell.includes('subtotal') && !firstCell.includes('bid')) pricing.subtotal = val;
    else if (firstCell.includes('tax')) pricing.tax = val;
    else if (firstCell.includes('bond')) pricing.bond = val;
    else if (firstCell === 'total' || firstCell.includes('grand total') || firstCell.includes('sub total bid')) {
      if (val > pricing.total) pricing.total = val;
    }
  });

  if (pricing.total === 0) pricing.total = pricing.subtotal + pricing.tax + pricing.bond;
  return pricing;
}

/**
 * HELPER: GENERATE SPEC TABLES
 */
function generateSpecTables(displays) {
  return displays.flatMap((d, i) => [
    { text: d.name.toUpperCase(), fontSize: 11, bold: true, color: '#0A52EF', margin: [0, i === 0 ? 0 : 15, 0, 5] },
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [{ text: 'Specification', style: 'tableHeader' }, { text: 'Value', style: 'tableHeader' }],
          ['MM Pitch', d.pitch ? `${d.pitch}mm` : '—'],
          ['Quantity', d.quantity],
          ['Active Display Height', d.dimensions.height ? `${d.dimensions.height}′` : '—'],
          ['Active Display Width', d.dimensions.width ? `${d.dimensions.width}′` : '—'],
          ['Brightness', d.brightness ? `${d.brightness} nits` : '—']
        ]
      }
    }
  ]);
}

/**
 * HELPER: GENERATE PRICING TABLE
 */
function generatePricingTable(displays, pricing) {
  const rows = displays.map(d => [d.name, `$${d.sellingPrice.toLocaleString()}`]);
  rows.push(['Structural, Electrical, Labor, PM', 'INCLUDED']);
  return {
    table: {
      widths: ['*', 'auto'],
      body: [
        [{ text: 'Description', style: 'tableHeader' }, { text: 'Amount', style: 'tableHeader' }],
        ...rows,
        [{ text: 'SUBTOTAL:', bold: true }, { text: `$${pricing.subtotal.toLocaleString()}`, alignment: 'right' }],
        ['TAX:', `$${pricing.tax.toLocaleString()}`],
        ['BOND (1.5%):', `$${pricing.bond.toLocaleString()}`],
        [{ text: 'TOTAL:', bold: true, fillColor: '#0A52EF', color: 'white' }, { text: `$${pricing.total.toLocaleString()}`, alignment: 'right', fillColor: '#0A52EF', color: 'white' }]
      ]
    }
  };
}

/**
 * HELPER: GENERATE SOW
 */
function generateSOW() {
  const frenchBlue = '#0A52EF';
  const sections = [
    {
      title: 'PHYSICAL INSTALLATION',
      content: 'ANC will provide all labor and materials necessary to install the LED display system(s) in accordance with manufacturer specifications and applicable building codes. Installation includes mounting hardware, structural brackets, LED modules, cabinets, PDUs, and signal distribution.'
    },
    {
      title: 'ELECTRICAL & DATA',
      content: 'Client is responsible for providing dedicated electrical circuits and network connectivity to control locations. ANC will provide internal power distribution, data network switches, and integration with client infrastructure.'
    },
    {
      title: 'CONTROL SYSTEM',
      content: 'ANC will provide a complete content management and display control system including CMS licenses, display processors, remote monitoring, and initial operator training (up to 8 hours).'
    },
    {
      title: 'GENERAL CONDITIONS',
      content: 'Standard terms include Net 30 payment, 12-16 week lead time, 5-year manufacturer warranty on LED modules, and 2-year warranty on electronics. Prices are quoted in USD.'
    }
  ];

  return sections.flatMap(s => [
    { text: s.title, fontSize: 11, bold: true, color: frenchBlue, margin: [0, 10, 0, 5] },
    { text: s.content, fontSize: 10, color: '#374151', margin: [0, 0, 0, 10], alignment: 'justify' }
  ]);
}

/**
 * HELPER: BUILD ANC PROPOSAL
 */
function buildANCProposal(data) {
  const frenchBlue = '#0A52EF';
  return {
    defaultStyle: { font: 'WorkSans', fontSize: 10, color: '#111827', lineHeight: 1.3 },
    styles: {
      ancLogo: { fontSize: 32, bold: true, color: frenchBlue, margin: [0, 0, 0, 5] },
      projectTitle: { fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
      sectionHeader: { fontSize: 12, bold: true, color: frenchBlue, margin: [0, 15, 0, 8], decoration: 'none' },
      tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: frenchBlue, margin: [5, 5, 5, 5] },
      tableCell: { margin: [5, 3, 5, 3] },
      legal: { fontSize: 8, color: '#6B7280', alignment: 'justify', margin: [0, 5, 0, 5] }
    },
    content: [
      { text: 'ANC', style: 'ancLogo' },
      { text: data.projectName.toUpperCase(), style: 'projectTitle' },
      { text: 'SALES QUOTATION', style: 'sectionHeader', alignment: 'center' },
      { text: `This Sales Quotation sets forth terms for ${data.clientName} and ANC Sports Enterprises, LLC.`, style: 'legal', margin: [0, 0, 0, 20] },

      { text: 'SPECIFICATIONS', style: 'sectionHeader' },
      ...generateSpecTables(data.displays),

      { text: 'PRICING', style: 'sectionHeader', pageBreak: 'before' },
      generatePricingTable(data.displays, data.pricing),

      { text: 'STATEMENT OF WORK', style: 'sectionHeader', pageBreak: 'before' },
      ...generateSOW(),

      { text: 'AGREED TO AND ACCEPTED:', style: 'sectionHeader', pageBreak: 'before' },
      {
        columns: [
          { stack: [{ text: 'ANC SPORTS ENTERPRISES, LLC', bold: true }, { text: 'By: _________________', margin: [0, 20, 0, 0] }] },
          { stack: [{ text: data.clientName.toUpperCase(), bold: true }, { text: 'By: _________________', margin: [0, 20, 0, 0] }] }
        ]
      }
    ],
    footer: (cur, tot) => ({ 
      stack: [
        { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#D1D5DB' }] },
        {
          columns: [
            { text: 'ANC Intelligence Core - Confidential Proposal', alignment: 'left' },
            { text: `Page ${cur} of ${tot}`, alignment: 'right' }
          ],
          margin: [40, 5, 40, 0],
          fontSize: 8,
          color: '#94A3B8'
        }
      ]
    })
  };
}

/**
 * HELPER: EXTRACT PROPOSAL DATA
 */
function extractProposalData(context, rawData, projectName) {
  const results = {
    displays: [],
    pricing: { subtotal: 0, tax: 0, bond: 0, total: 0 },
    warnings: []
  };

  const headerMap = findHeaderRow(rawData);
  if (!headerMap.found) {
    results.warnings.push(`⚠️ Could not locate header row. Looking for columns: Selling Price, Cost, Margin`);
    return results;
  }

  results.displays = extractDisplayRows(rawData, headerMap);
  results.pricing = extractPricingTotals(rawData, headerMap);

  const expectedBond = results.pricing.subtotal * 0.015;
  if (Math.abs(expectedBond - results.pricing.bond) > (expectedBond * 0.01) && results.pricing.bond > 0) {
    results.warnings.push(`⚠️ **BOND MISMATCH**: Excel shows $${results.pricing.bond.toLocaleString()}, but ANC standard (1.5% of $${results.pricing.subtotal.toLocaleString()}) = $${expectedBond.toLocaleString()}`);
  }

  return results;
}

/**
 * MAIN HANDLER EXPORT
 */
module.exports.runtime = {
  handler: async function ({ filename, project_name = "PROJECT", client_name = "Valued Client" }) {
    try {
      const directUploadsPath = '/app/server/storage/direct-uploads';
      let targetFolder = null;

      // 1. AUTO-DETECT FILE
      if (filename) {
        log(this, `🔍 Searching for attached file: ${filename}...`);
        const folders = fs.readdirSync(directUploadsPath);
        targetFolder = folders.find(f => f.startsWith(filename) && fs.lstatSync(path.join(directUploadsPath, f)).isDirectory());
      }

      if (!targetFolder) {
        log(this, "📂 No filename provided or found. Searching for the most recent Excel attachment...");
        const folders = fs.readdirSync(directUploadsPath)
          .filter(f => f.includes('.xlsx-') && fs.lstatSync(path.join(directUploadsPath, f)).isDirectory())
          .map(f => ({
            name: f,
            time: fs.statSync(path.join(directUploadsPath, f)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);

        if (folders.length > 0) {
          targetFolder = folders[0].name;
          log(this, `✅ Found latest attachment: ${targetFolder}`);
        }
      }

      if (!targetFolder) {
        return "❌ Error: No Excel attachment found in this workspace. Please attach the cost analysis Excel file first.";
      }

      const folderPath = path.join(directUploadsPath, targetFolder);
      
      // 2. DEEP SCAN WORKBOOK (The New Attachment Engine)
      log(this, "📊 Deep Scanning Workbook... Extracting structured data...");
      const workbook = deepScanWorkbook(folderPath);
      if (Object.keys(workbook).length === 0) {
        return `❌ Error: Could not read any sheet data in ${targetFolder}. Ensure the file is a valid Excel/CSV.`;
      }

      // 3. FIND BEST DATA SOURCE
      const { name: activeSheetName, data: rawData } = findBestSheet(workbook);
      log(this, `📋 Smart Reader selected sheet: "${activeSheetName}"`);

      // 4. FERRARI EXTRACTION LOGIC
      log(this, "🏎️ Running Ferrari Extraction Engine...");
      const extractedData = extractProposalData(this, rawData, project_name);

      if (extractedData.displays.length === 0) {
        const sheetsFound = Object.keys(workbook).join(', ');
        return `❌ **EXTRACTION FAILED**\n\nCould not find any display items in sheet "${activeSheetName}".\n\n**Sheets scanned:** ${sheetsFound}\n\n**Warnings:**\n${extractedData.warnings.join('\n')}`;
      }

      // 5. CREATE LLM-OPTIMIZED SUMMARY (So the AI can "read right")
      const llmSummary = createLLMSummary(workbook, activeSheetName, extractedData);
      log(this, "🧠 Context injection successful. AI is now 'Reading Right'.");

      // 6. BUILD PDF
      log(this, "🎨 Applying ANC Branding... Generating PDF...");
      const docDefinition = buildANCProposal({
        projectName: project_name,
        clientName: client_name,
        displays: extractedData.displays,
        pricing: extractedData.pricing,
        warnings: extractedData.warnings,
        timestamp: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      });

      const PdfPrinter = require('pdfmake');
      
      const outputsDir = '/app/server/storage/outputs';
      if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });

      const outputFileName = `ANC_Proposal_${project_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const outputPath = path.join(outputsDir, outputFileName);
      
      // Load Work Sans from the Natalia project storage
      const fonts = {
        WorkSans: {
          normal: '/app/server/public/fonts/WorkSans-Regular.ttf',
          bold: '/app/server/public/fonts/WorkSans-Bold.ttf',
          italics: '/app/server/public/fonts/WorkSans-Regular.ttf',
          bolditalics: '/app/server/public/fonts/WorkSans-Bold.ttf'
        }
      };

      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument({
        ...docDefinition,
        defaultStyle: { font: 'WorkSans' }
      });
      
      return new Promise((resolve, reject) => {
        const chunks = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          fs.writeFileSync(outputPath, pdfBuffer);

          const warningSection = extractedData.warnings.length > 0 
            ? `\n\n⚠️ **WARNINGS:**\n${extractedData.warnings.map(w => `  • ${w}`).join('\n')}`
            : '';

          const base64Pdf = pdfBuffer.toString('base64');
          
          resolve(`✅ **ANC PROPOSAL GENERATED**\n\n📄 **File**: ${outputFileName}\n\n**Project**: ${project_name}\n**Client**: ${client_name}\n**Total Displays**: ${extractedData.displays.length}\n**Project Total**: $${extractedData.pricing.total.toLocaleString()}\n  - Subtotal: $${extractedData.pricing.subtotal.toLocaleString()}\n  - Tax: $${extractedData.pricing.tax.toLocaleString()}\n  - Bond: $${extractedData.pricing.bond.toLocaleString()}\n\n🔒 **THE VEIL**: Internal costs and margins hidden per Constitutional Law.${warningSection}\n\n[Download Proposal](data:application/pdf;base64,${base64Pdf})\n\n### 🤖 AGENT DATA BRIDGE (READ THIS)\n\`\`\`json\n${JSON.stringify(llmSummary, null, 2)}\n\`\`\``);
        });
        pdfDoc.on('error', (err) => {
          reject(new Error(`PDF Generation Failed: ${err.message}`));
        });
        pdfDoc.end();
      });

    } catch (error) {
      console.error(error);
      return `❌ **CRITICAL ERROR**: ${error.message}`;
    }
  }
};
