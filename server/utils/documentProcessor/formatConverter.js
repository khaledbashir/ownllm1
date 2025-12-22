/**
 * Format Converter - Handles output to different file formats
 * Supports HTML, PDF, and DOCX generation
 */

const fs = require('fs').promises;
const path = require('path');

class FormatConverter {
  constructor() {
    this.outputDir = path.join(__dirname, '../../../../tmp/documents');
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Convert processed document to specified format
   * @param {Object} documentData - Processed document data
   * @param {string} format - Output format (html, pdf, docx)
   * @param {Object} options - Conversion options
   * @returns {Object} - Conversion result with file info
   */
  async convert(documentData, format, options = {}) {
    const filename = this.generateFilename(documentData, format);
    const filepath = path.join(this.outputDir, filename);

    try {
      let result;
      
      switch (format.toLowerCase()) {
        case 'html':
          result = await this.convertToHTML(documentData, filepath, options);
          break;
        case 'pdf':
          result = await this.convertToPDF(documentData, filepath, options);
          break;
        case 'docx':
          result = await this.convertToDOCX(documentData, filepath, options);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return {
        success: true,
        format,
        filename,
        filepath,
        size: result.size,
        metadata: documentData.metadata
      };
    } catch (error) {
      throw new Error(`Conversion to ${format} failed: ${error.message}`);
    }
  }

  /**
   * Generate unique filename
   * @param {Object} documentData 
   * @param {string} format 
   * @returns {string}
   */
  generateFilename(documentData, format) {
    const title = documentData.metadata.title || 'proposal';
    const client = documentData.metadata.client || 'client';
    const timestamp = Date.now();
    
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    
    const cleanClient = client
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    return `${cleanClient}-${cleanTitle}-${timestamp}.${format}`;
  }

  /**
   * Convert to HTML format
   * @param {Object} documentData 
   * @param {string} filepath 
   * @param {Object} options 
   * @returns {Object}
   */
  async convertToHTML(documentData, filepath, options) {
    const TemplateEngine = require('./templateEngine');
    const templateEngine = new TemplateEngine();
    
    const htmlContent = templateEngine.generateHTML(documentData, options);
    
    await fs.writeFile(filepath, htmlContent, 'utf8');
    
    return {
      size: Buffer.byteLength(htmlContent, 'utf8'),
      content: htmlContent
    };
  }

  /**
   * Convert to PDF format
   * @param {Object} documentData 
   * @param {string} filepath 
   * @param {Object} options 
   * @returns {Object}
   */
  async convertToPDF(documentData, filepath, options) {
    // First generate HTML
    const htmlResult = await this.convertToHTML(documentData, filepath.replace('.pdf', '.html'), options);
    
    try {
      // Try to use puppeteer for PDF generation
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlResult.content, { 
        waitUntil: 'networkidle0' 
      });
      
      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();
      
      const stats = await fs.stat(filepath);
      return {
        size: stats.size
      };
      
    } catch (puppeteerError) {
      // Fallback: return HTML with PDF instructions
      console.warn('PDF generation failed, falling back to HTML:', puppeteerError.message);
      
      // Clean up the HTML file and return it instead
      await fs.unlink(htmlResult.filepath).catch(() => {});
      
      throw new Error('PDF generation requires Puppeteer. Please install: npm install puppeteer');
    }
  }

  /**
   * Convert to DOCX format
   * @param {Object} documentData 
   * @param {string} filepath 
   * @param {Object} options 
   * @returns {Object}
   */
  async convertToDOCX(documentData, filepath, options) {
    try {
      const docx = require('docx');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docx;

      // Create document sections
      const doc = new Document({
        creator: documentData.metadata.agency || 'Document Generator',
        title: documentData.metadata.title || 'Proposal',
        description: 'Generated proposal document'
      });

      const sections = [];

      // Title page
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: documentData.metadata.title || 'Project Proposal',
              bold: true,
              size: 48
            })
          ],
          heading: HeadingLevel.TITLE
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Prepared for ${documentData.metadata.client || 'Client'}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Prepared by ${documentData.metadata.agency || 'Your Agency'}`,
              size: 24
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${documentData.metadata.date || new Date().toLocaleDateString()}`,
              size: 24
            })
          ]
        })
      );

      // Table of Contents
      if (documentData.tableOfContents && documentData.tableOfContents.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Table of Contents',
                bold: true,
                size: 32
              })
            ],
            heading: HeadingLevel.HEADING_1
          })
        );

        documentData.tableOfContents.forEach(item => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${' '.repeat((item.level - 1) * 4)}${item.title} (Page ${item.page})`,
                  size: 24
                })
              ]
            })
          );
        });
      }

      // Content sections
      documentData.sections.forEach(section => {
        // Section heading
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 32
              })
            ],
            heading: section.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2
          })
        );

        // Parse and add content (simplified)
        const contentParagraphs = this.parseHTMLContent(section.content);
        contentParagraphs.forEach(paragraph => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph,
                  size: 22
                })
              ]
            })
          );
        });

        // Add tables for this section
        const sectionTables = documentData.tables.filter(table => table.sectionId === section.id);
        sectionTables.forEach(table => {
          if (table.headers && table.rows) {
            const tableRows = [
              new TableRow({
                children: table.headers.map(header => 
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: header,
                            bold: true
                          })
                        ]
                      })
                    ]
                  })
                )
              })
            ];

            table.rows.forEach(row => {
              tableRows.push(
                new TableRow({
                  children: row.map(cell => 
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cell
                            })
                          ]
                        })
                      ]
                    })
                  )
                })
              );
            });

            sections.push(
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE
                },
                rows: tableRows
              })
            );
          }
        });
      });

      // Investment Summary
      if (documentData.tables.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Investment Summary',
                bold: true,
                size: 32
              })
            ],
            heading: HeadingLevel.HEADING_1
          })
        );

        // Simple investment summary table
        const summaryRows = [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Component',
                        bold: true
                      })
                    ]
                  })
                ]
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Subtotal (ex GST)',
                        bold: true
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ];

        // Add component totals (simplified calculation)
        const componentTotals = this.calculateComponentTotals(documentData);
        componentTotals.forEach(comp => {
          summaryRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: comp.name
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `$${comp.total.toLocaleString()}`
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        });

        sections.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: summaryRows
          })
        );
      }

      // Add all sections to document
      doc.addSection({
        children: sections
      });

      // Generate and save document
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(filepath, buffer);

      return {
        size: buffer.length
      };

    } catch (docxError) {
      throw new Error(`DOCX generation failed: ${docxError.message}`);
    }
  }

  /**
   * Parse HTML content for DOCX conversion
   * @param {string} htmlContent 
   * @returns {Array}
   */
  parseHTMLContent(htmlContent) {
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  /**
   * Calculate component totals from tables
   * @param {Object} documentData 
   * @returns {Array}
   */
  calculateComponentTotals(documentData) {
    const pricingTables = documentData.tables.filter(table => table.type === 'pricing');
    const componentTotals = [];

    pricingTables.forEach((table, index) => {
      const section = documentData.sections.find(s => s.id === table.sectionId);
      let tableTotal = 0;

      table.rows.forEach(row => {
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
    });

    return componentTotals;
  }

  /**
   * Get file info
   * @param {string} filepath 
   * @returns {Object}
   */
  async getFileInfo(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        modified: null
      };
    }
  }

  /**
   * Clean up temporary files
   * @param {string} filename 
   */
  async cleanup(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist
    }
  }
}

module.exports = FormatConverter;