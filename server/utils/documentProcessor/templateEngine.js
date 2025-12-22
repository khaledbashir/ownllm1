/**
 * Template Engine - Generates clean, formatted documents from processed data
 * Handles HTML generation, CSS styling, and layout control
 */

class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.defaultStyles = this.getDefaultStyles();
  }

  /**
   * Register a template
   * @param {string} name 
   * @param {Object} template 
   */
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Generate HTML document from processed data
   * @param {Object} documentData 
   * @param {Object} options 
   * @returns {string}
   */
  generateHTML(documentData, options = {}) {
    const template = options.template || 'default';
    const templateConfig = this.templates.get(template) || this.getDefaultTemplate();

    return this.renderHTML(templateConfig, documentData, options);
  }

  /**
   * Render HTML with template
   * @param {Object} template 
   * @param {Object} data 
   * @param {Object} options 
   * @returns {string}
   */
  renderHTML(template, data, options) {
    const styles = this.generateStyles(template, options);
    const titlePage = this.generateTitlePage(data.metadata, options);
    const tableOfContents = this.generateTableOfContents(data.tableOfContents, options);
    const sections = this.generateSections(data.sections, data.tables, options);
    const investmentSummary = this.generateInvestmentSummary(data, options);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.metadata.title || 'Project Proposal'}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${titlePage}
    ${tableOfContents}
    ${sections}
    ${investmentSummary}
</body>
</html>`;
  }

  /**
   * Generate CSS styles
   * @param {Object} template 
   * @param {Object} options 
   * @returns {string}
   */
  generateStyles(template, options) {
    return `
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${template.fonts?.body || 'Arial, sans-serif'};
            line-height: 1.6;
            color: ${template.colors?.text || '#333'};
            background: ${template.colors?.background || '#fff'};
        }

        /* Page Control */
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 20mm;
            padding: 20mm;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: avoid;
        }

        /* Title Page */
        .title-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            min-height: 100vh;
        }

        .title-page h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
            color: ${template.colors?.primary || '#2c3e50'};
        }

        .title-page h2 {
            font-size: 1.5em;
            margin-bottom: 2em;
            color: ${template.colors?.secondary || '#7f8c8d'};
        }

        .title-page .metadata {
            margin-top: 2em;
        }

        .title-page .metadata p {
            margin: 0.5em 0;
        }

        /* Table of Contents */
        .toc {
            page-break-after: always;
        }

        .toc h1 {
            font-size: 2em;
            margin-bottom: 1em;
            color: ${template.colors?.primary || '#2c3e50'};
            border-bottom: 2px solid ${template.colors?.primary || '#2c3e50'};
            padding-bottom: 0.5em;
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            margin: 0.5em 0;
            padding: 0.5em 0;
            border-bottom: 1px dotted ${template.colors?.muted || '#bdc3c7'};
        }

        .toc-item.level-2 {
            margin-left: 2em;
        }

        .toc-item.level-3 {
            margin-left: 4em;
        }

        /* Section Styles */
        .section {
            margin-bottom: 2em;
            page-break-inside: avoid;
        }

        .section h1 {
            font-size: 2em;
            color: ${template.colors?.primary || '#2c3e50'};
            margin-bottom: 1em;
            padding-bottom: 0.5em;
            border-bottom: 2px solid ${template.colors?.primary || '#2c3e50'};
        }

        .section h2 {
            font-size: 1.5em;
            color: ${template.colors?.secondary || '#34495e'};
            margin: 1.5em 0 0.5em 0;
        }

        .section h3 {
            font-size: 1.2em;
            color: ${template.colors?.accent || '#e74c3c'};
            margin: 1em 0 0.5em 0;
        }

        /* Content Styles */
        .section p {
            margin-bottom: 1em;
            text-align: justify;
        }

        .section ul, .section ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        .section li {
            margin-bottom: 0.5em;
        }

        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            font-size: 0.9em;
        }

        table th {
            background: ${template.colors?.primary || '#2c3e50'};
            color: white;
            padding: 0.75em;
            text-align: left;
            font-weight: bold;
        }

        table td {
            padding: 0.75em;
            border-bottom: 1px solid ${template.colors?.muted || '#bdc3c7'};
        }

        table tr:nth-child(even) {
            background: ${template.colors?.light || '#f8f9fa'};
        }

        /* Investment Summary */
        .investment-summary {
            background: ${template.colors?.light || '#f8f9fa'};
            border: 2px solid ${template.colors?.primary || '#2c3e50'};
            border-radius: 8px;
            padding: 1.5em;
            margin: 2em 0;
        }

        .investment-summary h2 {
            color: ${template.colors?.primary || '#2c3e50'};
            margin-bottom: 1em;
            text-align: center;
        }

        .total-row {
            font-weight: bold;
            font-size: 1.1em;
            background: ${template.colors?.primary || '#2c3e50'} !important;
            color: white !important;
        }

        /* Component Sections */
        .component-section {
            border: 1px solid ${template.colors?.muted || '#bdc3c7'};
            border-radius: 8px;
            padding: 1.5em;
            margin-bottom: 2em;
        }

        .component-header {
            background: ${template.colors?.primary || '#2c3e50'};
            color: white;
            padding: 1em;
            margin: -1.5em -1.5em 1.5em -1.5em;
            border-radius: 8px 8px 0 0;
        }

        /* Print Styles */
        @media print {
            .page {
                margin: 0;
                box-shadow: none;
                page-break-after: always;
            }

            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .page {
                width: 100%;
                padding: 1em;
            }

            .title-page h1 {
                font-size: 2em;
            }

            .section h1 {
                font-size: 1.5em;
            }
        }
    `;
  }

  /**
   * Generate title page
   * @param {Object} metadata 
   * @param {Object} options 
   * @returns {string}
   */
  generateTitlePage(metadata, options) {
    const {
      title = 'Project Proposal',
      client = 'Client Name',
      agency = 'Your Agency Name',
      date = new Date().toLocaleDateString(),
      version = '1.0'
    } = metadata;

    return `
        <div class="page title-page">
            <h1>${title}</h1>
            <h2>Prepared for ${client}</h2>
            <div class="metadata">
                <p><strong>Prepared by:</strong> ${agency}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Version:</strong> ${version}</p>
            </div>
        </div>
    `;
  }

  /**
   * Generate table of contents
   * @param {Array} tocItems 
   * @param {Object} options 
   * @returns {string}
   */
  generateTableOfContents(tocItems, options) {
    if (!tocItems || tocItems.length === 0) return '';

    const items = tocItems.map(item => `
        <div class="toc-item level-${item.level}">
            <span>${item.title}</span>
            <span>${item.page}</span>
        </div>
    `).join('');

    return `
        <div class="page toc">
            <h1>Table of Contents</h1>
            ${items}
        </div>
    `;
  }

  /**
   * Generate document sections
   * @param {Array} sections 
   * @param {Array} tables 
   * @param {Object} options 
   * @returns {string}
   */
  generateSections(sections, tables, options) {
    return sections.map(section => {
      const sectionTables = tables.filter(table => table.sectionId === section.id);
      const tableHTML = sectionTables.map(table => this.formatTable(table)).join('');

      const isComponent = section.id.startsWith('component-');
      const sectionClass = isComponent ? 'component-section' : 'section';

      return `
        <div class="page">
            <div class="${sectionClass}">
                ${isComponent ? `
                    <div class="component-header">
                        <h1>${section.title}</h1>
                    </div>
                ` : `<h1>${section.title}</h1>`}
                <div class="section-content">
                    ${section.content}
                    ${tableHTML}
                </div>
            </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Format pricing table
   * @param {Object} table 
   * @returns {string}
   */
  formatTable(table) {
    if (!table.headers || !table.rows) return '';

    const headers = table.headers.map(header => `<th>${header}</th>`).join('');
    const rows = table.rows.map(row => `
        <tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
        </tr>
    `).join('');

    return `
        <table class="pricing-table">
            <thead>
                <tr>${headers}</tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
  }

  /**
   * Generate investment summary
   * @param {Object} data 
   * @param {Object} options 
   * @returns {string}
   */
  generateInvestmentSummary(data, options) {
    const pricingTables = data.tables.filter(table => table.type === 'pricing');
    
    if (pricingTables.length === 0) return '';

    // Calculate totals from pricing tables
    let subtotal = 0;
    const componentTotals = [];

    pricingTables.forEach((table, index) => {
      const section = data.sections.find(s => s.id === table.sectionId);
      let tableTotal = 0;

      table.rows.forEach(row => {
        // Look for total column
        const lastCell = row[row.length - 1];
        const totalMatch = lastCell.match(/[\d,]+/);
        if (totalMatch) {
          tableTotal += parseInt(totalMatch[0].replace(/,/g, ''));
        }
      });

      componentTotals.push({
        name: section?.title || `Component ${index + 1}`,
        total: tableTotal
      });
      
      subtotal += tableTotal;
    });

    const gst = subtotal * 0.1; // 10% GST
    const total = subtotal + gst;

    const componentRows = componentTotals.map(comp => `
        <tr>
            <td>${comp.name}</td>
            <td>$${comp.total.toLocaleString()}</td>
        </tr>
    `).join('');

    return `
        <div class="page">
            <div class="investment-summary">
                <h2>Investment Summary</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Subtotal (ex GST)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${componentRows}
                        <tr>
                            <td><strong>Subtotal (ex GST)</strong></td>
                            <td><strong>$${subtotal.toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>GST (10%)</strong></td>
                            <td><strong>$${gst.toLocaleString()}</strong></td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Total (inc GST)</strong></td>
                            <td><strong>$${total.toLocaleString()}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
  }

  /**
   * Get default template configuration
   * @returns {Object}
   */
  getDefaultTemplate() {
    return {
      name: 'default',
      colors: {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#e74c3c',
        text: '#333',
        background: '#fff',
        light: '#f8f9fa',
        muted: '#bdc3c7'
      },
      fonts: {
        body: 'Arial, sans-serif',
        headings: 'Georgia, serif'
      }
    };
  }

  /**
   * Get default styles
   * @returns {Object}
   */
  getDefaultStyles() {
    return {
      pageSize: 'A4',
      margins: '20mm',
      fontSize: '12pt',
      lineHeight: '1.6'
    };
  }
}

module.exports = TemplateEngine;