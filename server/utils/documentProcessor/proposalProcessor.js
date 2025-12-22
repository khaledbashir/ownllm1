/**
 * Proposal Document Processor - Main workflow orchestrator
 * Coordinates document processing, formatting, and output generation
 */

const DocumentProcessor = require('./documentProcessor');
const TemplateEngine = require('./templateEngine');
const FormatConverter = require('./formatConverter');

class ProposalDocumentProcessor {
  constructor(options = {}) {
    this.documentProcessor = new DocumentProcessor();
    this.templateEngine = new TemplateEngine();
    this.formatConverter = new FormatConverter();
    this.options = {
      defaultFormat: options.defaultFormat || 'html',
      autoGenerateTOC: options.autoGenerateTOC !== false,
      validatePlaceholders: options.validatePlaceholders !== false,
      ...options
    };
  }

  /**
   * Process raw proposal text and generate clean document
   * @param {string} rawText - Raw proposal export text
   * @param {Object} config - Processing configuration
   * @returns {Object} - Processing result
   */
  async processProposal(rawText, config = {}) {
    try {
      // Validate input
      this.validateInput(rawText, config);

      // Process document structure
      const documentData = await this.documentProcessor.process(rawText, {
        placeholders: config.placeholders || {}
      });

      // Generate template
      const template = this.generateTemplate(documentData, config);

      // Validate processing results
      const validation = this.validateProcessingResults(documentData);
      
      if (!validation.isValid && this.options.validatePlaceholders) {
        throw new Error(`Document validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate output files
      const outputs = await this.generateOutputs(documentData, template, config);

      return {
        success: true,
        document: documentData,
        template,
        outputs,
        validation,
        stats: {
          processingTime: Date.now(),
          inputLength: rawText.length,
          outputFiles: outputs.length,
          sectionsProcessed: documentData.sections.length,
          tablesProcessed: documentData.tables.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        document: null,
        outputs: [],
        validation: { isValid: false, errors: [error.message] }
      };
    }
  }

  /**
   * Validate input data
   * @param {string} rawText 
   * @param {Object} config 
   */
  validateInput(rawText, config) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Raw text is required and must be a string');
    }

    if (rawText.trim().length < 100) {
      throw new Error('Raw text appears too short for a proposal document');
    }

    // Check for obvious placeholders that should be replaced
    const obviousPlaceholders = [
      /Brief overview of the proposed project/,
      /\bX weeks\b/,
      /\$[X,]+/,
      /\b[A-Z]{2,}\b/g // Acronyms that might be undefined
    ];

    const foundPlaceholders = obviousPlaceholders.filter(pattern => pattern.test(rawText));
    if (foundPlaceholders.length > 0 && this.options.validatePlaceholders) {
      console.warn('Found potential placeholders in input:', foundPlaceholders);
    }
  }

  /**
   * Generate document template configuration
   * @param {Object} documentData 
   * @param {Object} config 
   * @returns {Object}
   */
  generateTemplate(documentData, config) {
    return {
      name: config.templateName || 'professional-proposal',
      metadata: {
        title: documentData.metadata.title || 'Project Proposal',
        client: documentData.metadata.client || 'Client Name',
        agency: config.agency || 'Your Agency Name',
        date: documentData.metadata.date,
        version: documentData.metadata.version || '1.0'
      },
      styling: {
        colors: config.colors || {
          primary: '#2c3e50',
          secondary: '#34495e',
          accent: '#e74c3c',
          text: '#333',
          background: '#fff'
        },
        fonts: config.fonts || {
          body: 'Arial, sans-serif',
          headings: 'Georgia, serif'
        }
      },
      layout: {
        includeTOC: config.includeTOC !== false,
        includeTitlePage: config.includeTitlePage !== false,
        includeInvestmentSummary: config.includeInvestmentSummary !== false,
        pageSize: config.pageSize || 'A4'
      }
    };
  }

  /**
   * Validate processing results
   * @param {Object} documentData 
   * @returns {Object}
   */
  validateProcessingResults(documentData) {
    const errors = [];
    const warnings = [];

    // Check for empty sections
    const emptySections = documentData.sections.filter(s => !s.content || s.content.trim().length === 0);
    if (emptySections.length > 0) {
      warnings.push(`Found ${emptySections.length} empty sections`);
    }

    // Check for remaining placeholders
    if (documentData.stats.remainingPlaceholders.length > 0) {
      warnings.push(`Found ${documentData.stats.remainingPlaceholders.length} unresolved placeholders`);
    }

    // Check for tables without headers
    const malformedTables = documentData.tables.filter(t => !t.headers || t.headers.length === 0);
    if (malformedTables.length > 0) {
      errors.push(`Found ${malformedTables.length} tables without proper headers`);
    }

    // Check for very short content
    const shortSections = documentData.sections.filter(s => 
      s.content && s.content.replace(/<[^>]*>/g, '').split(/\s+/).length < 10
    );
    if (shortSections.length > 0) {
      warnings.push(`Found ${shortSections.length} sections with very short content`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalSections: documentData.sections.length,
        emptySections: emptySections.length,
        totalTables: documentData.tables.length,
        malformedTables: malformedTables.length,
        remainingPlaceholders: documentData.stats.remainingPlaceholders.length
      }
    };
  }

  /**
   * Generate output files in specified formats
   * @param {Object} documentData 
   * @param {Object} template 
   * @param {Object} config 
   * @returns {Promise<Array>}
   */
  async generateOutputs(documentData, template, config) {
    const formats = config.formats || [this.options.defaultFormat];
    const outputs = [];

    for (const format of formats) {
      try {
        const result = await this.formatConverter.convert(documentData, format, {
          template: template,
          metadata: template.metadata,
          ...config
        });

        outputs.push(result);
      } catch (error) {
        console.error(`Failed to generate ${format} output:`, error.message);
        outputs.push({
          success: false,
          format,
          error: error.message,
          filename: null,
          filepath: null
        });
      }
    }

    return outputs;
  }

  /**
   * Quick preview of processing without generating files
   * @param {string} rawText 
   * @param {Object} config 
   * @returns {Object}
   */
  async preview(rawText, config = {}) {
    try {
      const documentData = await this.documentProcessor.process(rawText, {
        placeholders: config.placeholders || {}
      });

      const validation = this.validateProcessingResults(documentData);
      const template = this.generateTemplate(documentData, config);

      return {
        success: true,
        document: documentData,
        template,
        validation,
        estimatedOutputs: {
          html: this.estimateOutputSize(documentData, 'html'),
          pdf: this.estimateOutputSize(documentData, 'pdf'),
          docx: this.estimateOutputSize(documentData, 'docx')
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        document: null,
        validation: { isValid: false, errors: [error.message] }
      };
    }
  }

  /**
   * Estimate output file size
   * @param {Object} documentData 
   * @param {string} format 
   * @returns {Object}
   */
  estimateOutputSize(documentData, format) {
    const baseTextLength = documentData.sections.reduce((sum, section) => 
      sum + section.content.replace(/<[^>]*>/g, '').length, 0
    );

    let multiplier = 1;
    switch (format) {
      case 'html':
        multiplier = 1.2; // HTML tags and styling
        break;
      case 'pdf':
        multiplier = 0.8; // PDF compression
        break;
      case 'docx':
        multiplier = 1.1; // DOCX compression
        break;
    }

    const estimatedBytes = Math.ceil(baseTextLength * multiplier);
    
    return {
      bytes: estimatedBytes,
      kilobytes: Math.ceil(estimatedBytes / 1024),
      readable: this.formatBytes(estimatedBytes)
    };
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes 
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get processing statistics
   * @param {Object} result 
   * @returns {Object}
   */
  getProcessingStats(result) {
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    const { document, validation, stats, outputs } = result;

    return {
      success: true,
      input: {
        rawTextLength: stats.inputLength,
        estimatedWords: Math.ceil(stats.inputLength / 5)
      },
      processing: {
        sectionsProcessed: stats.sectionsProcessed,
        tablesProcessed: stats.tablesProcessed,
        processingTime: stats.processingTime
      },
      validation: {
        isValid: validation.isValid,
        warnings: validation.warnings.length,
        errors: validation.errors.length
      },
      output: {
        totalFiles: outputs.length,
        successfulFiles: outputs.filter(o => o.success).length,
        failedFiles: outputs.filter(o => !o.success).length,
        totalSize: outputs.reduce((sum, o) => sum + (o.size || 0), 0)
      },
      quality: {
        completeness: this.calculateCompleteness(document, validation),
        estimatedPages: Math.ceil(stats.inputLength / 2000)
      }
    };
  }

  /**
   * Calculate document completeness score
   * @param {Object} document 
   * @param {Object} validation 
   * @returns {number}
   */
  calculateCompleteness(document, validation) {
    let score = 100;
    
    // Deduct for validation issues
    score -= validation.errors.length * 20;
    score -= validation.warnings.length * 5;
    
    // Deduct for missing metadata
    if (!document.metadata.title) score -= 10;
    if (!document.metadata.client) score -= 10;
    
    // Deduct for empty sections
    const emptySections = document.sections.filter(s => !s.content || s.content.trim().length === 0);
    score -= emptySections.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = ProposalDocumentProcessor;