/**
 * Document Processor - Transforms raw proposal exports into clean, client-ready documents
 * Handles parsing, formatting, table detection, and template generation
 */

class DocumentProcessor {
  constructor() {
    this.sections = [];
    this.tables = [];
    this.tocItems = [];
    this.placeholders = new Set();
  }

  /**
   * Process raw proposal text and convert to structured document
   * @param {string} rawText - Raw proposal export text
   * @param {Object} options - Processing options
   * @returns {Object} Processed document structure
   */
  async process(rawText, options = {}) {
    try {
      // Step 1: Clean and normalize text
      const cleanedText = this.cleanText(rawText);
      
      // Step 2: Parse structure and sections
      this.sections = this.parseSections(cleanedText);
      
      // Step 3: Detect and format tables
      this.tables = this.detectAndFormatTables(this.sections);
      
      // Step 4: Generate table of contents
      this.tocItems = this.generateTableOfContents(this.sections);
      
      // Step 5: Replace placeholders
      const processedSections = this.replacePlaceholders(this.sections, options.placeholders);
      
      // Step 6: Apply formatting and styling
      const formattedSections = this.applyFormatting(processedSections);
      
      return {
        sections: formattedSections,
        tables: this.tables,
        tableOfContents: this.tocItems,
        metadata: this.extractMetadata(cleanedText),
        stats: this.generateStats(formattedSections)
      };
    } catch (error) {
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize raw text
   * @param {string} text 
   * @returns {string}
   */
  cleanText(text) {
    return text
      // Remove broken bullet patterns
      .replace(/^- \s*$/gm, '') // Remove isolated bullet markers
      .replace(/\n- /g, '\n• ') // Convert remaining bullets to proper format
      .replace(/---\s*/g, '\n\n') // Replace separator lines
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/[ \t]+\n/g, '\n') // Remove trailing whitespace
      .trim();
  }

  /**
   * Parse document into structured sections
   * @param {string} text 
   * @returns {Array}
   */
  parseSections(text) {
    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;
    let sectionContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect section headers (simple heuristic)
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection) {
          currentSection.content = sectionContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          id: this.generateSectionId(line),
          title: this.cleanSectionTitle(line),
          level: this.getSectionLevel(line),
          content: ''
        };
        sectionContent = [];
      } else if (line) {
        sectionContent.push(line);
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.content = sectionContent.join('\n').trim();
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Detect if line is a section header
   * @param {string} line 
   * @returns {boolean}
   */
  isSectionHeader(line) {
    const headerPatterns = [
      /^Executive Summary/i,
      /^Project Outcomes?/i,
      /^Component \d+/i,
      /^Project Overview/i,
      /^Objectives?/i,
      /^Project Phases?/i,
      /^Pricing Summary/i,
      /^Budget Notes/i,
      /^Assumptions?/i,
      /^Investment Summary/i,
      /^Key Deliverables/i,
      /^Account.*Project Management/i
    ];

    return headerPatterns.some(pattern => pattern.test(line)) ||
           (line.length < 100 && line.match(/^[A-Z][^.]*:?$/));
  }

  /**
   * Clean section title
   * @param {string} title 
   * @returns {string}
   */
  cleanSectionTitle(title) {
    return title
      .replace(/:$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get section level for hierarchy
   * @param {string} title 
   * @returns {number}
   */
  getSectionLevel(title) {
    if (/^Component \d+/.test(title)) return 1;
    if (/^(Project Overview|Objectives|Project Phases|Pricing Summary)/.test(title)) return 2;
    return 3;
  }

  /**
   * Generate unique section ID
   * @param {string} title 
   * @returns {string}
   */
  generateSectionId(title) {
    return this.cleanSectionTitle(title)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Detect and format pricing tables
   * @param {Array} sections 
   * @returns {Array}
   */
  detectAndFormatTables(sections) {
    const tables = [];
    
    sections.forEach((section, sectionIndex) => {
      const lines = section.content.split('\n');
      let inTable = false;
      let tableData = [];
      let tableHeaders = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect table start (look for role/description patterns)
        if (this.isTableHeader(line)) {
          tableHeaders = line.split(/\s{2,}/).filter(h => h.trim());
          inTable = true;
          tableData = [];
        }
        // Detect table rows
        else if (inTable && this.isTableRow(line)) {
          const row = line.split(/\s{2,}/).filter(cell => cell.trim());
          if (row.length >= 3) {
            tableData.push(row);
          }
        }
        // End of table
        else if (inTable && !line) {
          if (tableData.length > 0) {
            tables.push({
              id: `${section.id}-table-${tables.length}`,
              sectionId: section.id,
              headers: tableHeaders,
              rows: tableData,
              type: 'pricing'
            });
          }
          inTable = false;
          tableData = [];
          tableHeaders = [];
        }
      }
    });

    return tables;
  }

  /**
   * Check if line is a table header
   * @param {string} line 
   * @returns {boolean}
   */
  isTableHeader(line) {
    const headerPatterns = ['role', 'description', 'hours', 'rate', 'total'];
    const lowerLine = line.toLowerCase();
    return headerPatterns.some(pattern => lowerLine.includes(pattern));
  }

  /**
   * Check if line is a table data row
   * @param {string} line 
   * @returns {boolean}
   */
  isTableRow(line) {
    // Look for lines with multiple space-separated values that could be table data
    const parts = line.split(/\s{2,}/);
    return parts.length >= 3 && !line.includes('$') && !line.includes('X');
  }

  /**
   * Generate table of contents
   * @param {Array} sections 
   * @returns {Array}
   */
  generateTableOfContents(sections) {
    const tocItems = [];
    let pageNumber = 1; // Starting page number (title page is 0)

    sections.forEach((section, index) => {
      // Title page doesn't count
      if (index > 0) {
        pageNumber += Math.ceil(section.content.length / 2000); // Rough page estimation
      }

      tocItems.push({
        title: section.title,
        level: section.level,
        page: pageNumber,
        id: section.id
      });
    });

    return tocItems;
  }

  /**
   * Replace placeholders with actual values
   * @param {Array} sections 
   * @param {Object} replacements 
   * @returns {Array}
   */
  replacePlaceholders(sections, replacements = {}) {
    return sections.map(section => {
      let content = section.content;

      // Replace common placeholders
      content = content.replace(/Brief overview of the proposed project[^.]*\./, replacements.projectOverview || '');
      content = content.replace(/\bX weeks\b/g, replacements.duration || '');
      content = content.replace(/\$[X,]+/g, (match) => {
        return replacements.pricing || match;
      });

      // Track remaining placeholders
      const placeholderMatches = content.match(/\b[A-Z][A-Z_]*\b/g) || [];
      placeholderMatches.forEach(placeholder => {
        if (placeholder.length > 2) {
          this.placeholders.add(placeholder);
        }
      });

      return {
        ...section,
        content: content
      };
    });
  }

  /**
   * Apply formatting and styling
   * @param {Array} sections 
   * @returns {Array}
   */
  applyFormatting(sections) {
    return sections.map(section => ({
      ...section,
      content: this.formatSectionContent(section.content, section.level)
    }));
  }

  /**
   * Format section content
   * @param {string} content 
   * @param {number} level 
   * @returns {string}
   */
  formatSectionContent(content, level) {
    return content
      // Format bullet points
      .replace(/^• (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // Format bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Format emphasized text
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Clean up multiple spaces
      .replace(/ +/g, ' ')
      // Preserve line breaks for paragraphs
      .split('\n\n')
      .map(paragraph => paragraph.trim() ? `<p>${paragraph}</p>` : '')
      .join('\n');
  }

  /**
   * Extract document metadata
   * @param {string} text 
   * @returns {Object}
   */
  extractMetadata(text) {
    const lines = text.split('\n');
    const metadata = {
      title: '',
      client: '',
      date: new Date().toISOString().split('T')[0],
      version: '1.0'
    };

    // Try to extract title and client from first few lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 5 && line.length < 100) {
        if (!metadata.title) metadata.title = line;
        else if (line.toLowerCase().includes('proposal') && !metadata.title.includes('proposal')) {
          metadata.title = line;
        }
      }
    }

    return metadata;
  }

  /**
   * Generate document statistics
   * @param {Array} sections 
   * @returns {Object}
   */
  generateStats(sections) {
    const totalSections = sections.length;
    const totalWords = sections.reduce((sum, section) => 
      sum + section.content.replace(/<[^>]*>/g, '').split(/\s+/).length, 0);
    const estimatedPages = Math.ceil(totalWords / 500);

    return {
      totalSections,
      totalWords,
      estimatedPages,
      totalTables: this.tables.length,
      remainingPlaceholders: Array.from(this.placeholders)
    };
  }
}

module.exports = DocumentProcessor;