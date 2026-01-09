const fs = require("fs");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const DOMPurify = require("isomorphic-dompurify");

/**
 * Generates a PDF from HTML content using Puppeteer (Chromium-based).
 *
 * This uses the same rendering engine as SiYuan/Chrome for high-fidelity PDF output.
 *
 * @param {string} htmlContent - The full HTML string to render
 * @param {object} options - PDF generation options
 * @param {string} options.format - Page format (default: 'A4')
 * @param {boolean} options.printBackground - Print backgrounds (default: true)
 * @param {object} options.margin - Page margins
 * @returns {Promise<Buffer>} - The PDF buffer
 */
async function generatePdf(htmlContent, options = {}) {
  if (!htmlContent) throw new Error("HTML content is required");

  const preset = options.preset || "styled";

  // Lazy load puppeteer (only when needed)
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (error) {
    throw new Error("Puppeteer is not installed. Run: npm install puppeteer");
  }

  const jobId = uuidv4();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${jobId}.html`);

  let browser = null;

  try {
    console.log(`[PDF Export] Starting Puppeteer job ${jobId}`);

    const ensureHtmlDocument = (content) => {
      const trimmed = String(content || "").trim();
      if (/<!doctype\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
        return trimmed;
      }

      // Default to US Letter because ANC is US-based. Callers can override via @page in CSS.
      const minimalPrintCss = `
        <style>
          @page { size: Letter; margin: 0; }
          html, body { margin: 0; padding: 0; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        </style>
      `;

      return `<!DOCTYPE html><html><head><meta charset="UTF-8">${minimalPrintCss}</head><body>${trimmed}</body></html>`;
    };

    const resolvePdfOptions = () => {
      // Default behavior is the existing "styled" export.
      const base = {
        printBackground: options.printBackground !== false,
        displayHeaderFooter: false,
      };

      if (preset === "pixelPerfect") {
        return {
          ...base,
          // Use CSS @page size/margins from the template. This is the key to pixel-perfect.
          preferCSSPageSize: options.preferCSSPageSize !== false,
          // If preferCSSPageSize is true, margins should be handled in CSS.
          margin: options.margin || { top: "0", bottom: "0", left: "0", right: "0" },
          // Fall back to Letter only when template doesn't specify @page.
          format: options.format || "Letter",
          scale: options.scale || 1,
        };
      }

      return {
        ...base,
        format: options.format || "A4",
        margin: options.margin || {
          top: "15mm",
          bottom: "15mm",
          left: "18mm",
          right: "18mm",
        },
        preferCSSPageSize: false,
        scale: options.scale || 1.1,
        quality: 100,
      };
    };

    // STEP 1: GOD-TEACHING-GODS LEVEL CSS
    const printCSS = `
      <style>
        /* PREMIUM FONTS - Typography That Won Awards */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        
        /* FOUNDATION - The Building Blocks */
        *, *::before, *::after {
          box-sizing: border-box !important;
          page-break-inside: avoid;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        /* PAPER SETUP - Exhibition Level */
        @page {
          size: A4;
          margin: 1.4cm 2cm 1.4cm 2cm;
          orphans: 4;
          widows: 4;
        }
        
        /* PAPER TEXTURE - Subtle Realism */
        body {
          font-family: 'Inter', -apple-system, sans-serif !important;
          font-size: 11pt !important;
          line-height: 1.65 !important;
          color: #1a1a1a !important;
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%) !important;
          letter-spacing: -0.01em !important;
        }
        
        /* TYPOGRAPHY HIERARCHY - Museum Quality */
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Libre Baskerville', Georgia, serif !important;
          font-weight: 700 !important;
          color: #0d1b2a !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          letter-spacing: -0.02em !important;
        }
        
        h1 {
          font-size: 26pt !important;
          margin: 28pt 0 14pt 0 !important;
          padding-bottom: 12pt !important;
          border-bottom: 4px solid linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%) !important;
          position: relative !important;
        }
        
        h1::after {
          content: '' !important;
          position: absolute !important;
          bottom: -4px !important;
          left: 0 !important;
          width: 60px !important;
          height: 4px !important;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%) !important;
        }
        
        h2 {
          font-size: 19pt !important;
          margin: 22pt 0 11pt 0 !important;
          padding-bottom: 8pt !important;
          border-bottom: 2px solid #f1f5f9 !important;
          border-left: 4px solid #3b82f6 !important;
          padding-left: 12pt !important;
          color: #1e293b !important;
          /* CRITICAL: Ensure h2 stands out from body text */
          font-family: 'Libre Baskerville', Georgia, serif !important;
          font-weight: 700 !important;
          letter-spacing: -0.01em !important;
          page-break-before: avoid !important;
        }
        
        h3 {
          font-size: 15pt !important;
          margin: 18pt 0 9pt 0 !important;
          color: #334155 !important;
          font-weight: 600 !important;
          page-break-before: avoid !important;
        }
        
        /* Add spacing between sections to prevent orphaned headers */
        section, .section {
          margin: 24pt 0 !important;
          padding: 14pt !important;
          background: #ffffff !important;
          border-radius: 6px !important;
          page-break-inside: avoid !important;
          border: 1px solid #f1f5f9 !important;
        }
        
        /* Cover page styling */
        .cover-page {
          page-break-after: always !important;
          min-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 40pt !important;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%) !important;
        }
        
        .cover-title {
          font-family: 'Libre Baskerville', Georgia, serif !important;
          font-size: 32pt !important;
          font-weight: 700 !important;
          color: #0d1b2a !important;
          margin-bottom: 20pt !important;
          text-align: center !important;
          letter-spacing: -0.02em !important;
        }
        
        .cover-subtitle {
          font-family: 'Inter', sans-serif !important;
          font-size: 14pt !important;
          font-weight: 500 !important;
          color: #64748b !important;
          margin-bottom: 16pt !important;
          text-align: center !important;
        }
        
        .cover-info {
          font-family: 'Inter', sans-serif !important;
          font-size: 11pt !important;
          color: #475569 !important;
          margin-bottom: 12pt !important;
          text-align: center !important;
          line-height: 1.8 !important;
        }
        
        .cover-info strong {
          color: #0d1b2a !important;
          font-weight: 600 !important;
        }
        
        .cover-divider {
          width: 100px !important;
          height: 3px !important;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%) !important;
          margin: 24pt auto !important;
        }
        
        /* PARAGRAPHS - Editorial Quality */
        p {
          margin: 11pt 0 !important;
          text-align: justify !important;
          text-justify: inter-word !important;
          page-break-inside: avoid !important;
          orphans: 4 !important;
          widows: 4 !important;
          line-height: 1.7 !important;
          color: #2d3748 !important;
        }
        
        /* TABLES - The Crown Jewels */
        table {
          width: 100% !important;
          table-layout: fixed !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          page-break-inside: auto !important;
          margin: 16pt 0 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.08),
            0 4px 12px rgba(0,0,0,0.04) !important;
          background: #ffffff !important;
          /* CRITICAL: Prevent table overflow and ensure proper column distribution */
          max-width: 100% !important;
          min-width: 100% !important;
        }
        
        thead {
          display: table-header-group !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        }
        
        thead th {
          color: #ffffff !important;
          font-weight: 700 !important;
          font-size: 9.5pt !important;
          text-transform: uppercase !important;
          letter-spacing: 0.8pt !important;
          padding: 12pt 10pt !important;
          border: none !important;
          position: relative !important;
          /* CRITICAL: Allow text wrapping in headers */
          white-space: normal !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
          text-align: left !important;
          vertical-align: middle !important;
        }
        
        /* Column-specific widths for pricing tables */
        thead th:first-child {
          /* Role column - give it minimum width */
          width: 20% !important;
          min-width: 80px !important;
        }
        
        thead th:nth-child(2) {
          /* Description column - give it maximum space */
          width: 50% !important;
          min-width: 200px !important;
        }
        
        thead th:nth-child(3) {
          /* Hours column */
          width: 15% !important;
          min-width: 60px !important;
          text-align: center !important;
        }
        
        thead th:nth-child(4) {
          /* Rate column */
          width: 15% !important;
          min-width: 70px !important;
          text-align: right !important;
        }
        
        thead th:last-child {
          /* Total column */
          width: 15% !important;
          min-width: 70px !important;
          text-align: right !important;
        }
        
        thead th::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 1px !important;
          background: rgba(255,255,255,0.3) !important;
        }
        
        tbody {
          display: table-row-group !important;
        }
        
        tfoot {
          display: table-footer-group !important;
          page-break-inside: avoid !important;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        }
        
        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        tr:last-child {
          border-bottom: none !important;
        }
        
        /* PREMIUM ROW STYLING */
        tbody tr {
          background: #ffffff !important;
          transition: all 0.15s ease !important;
        }
        
        tbody tr:nth-child(even) {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
        }
        
        tbody tr:hover {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%) !important;
        }
        
        td, th {
          page-break-inside: avoid !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          hyphens: auto !important;
          vertical-align: top !important;
          padding: 11pt 10pt !important;
          border: 1px solid #f1f5f9 !important;
          max-width: 100% !important;
          color: #1a1a1a !important;
          font-size: 10pt !important;
          /* CRITICAL: Prevent vertical text stacking */
          white-space: normal !important;
          min-width: 1px !important;
          min-height: 1em !important;
        }
        
        /* Column-specific widths for table body cells */
        td:first-child {
          border-left: none !important;
          width: 20% !important;
          min-width: 80px !important;
        }
        
        td:nth-child(2) {
          width: 50% !important;
          min-width: 200px !important;
        }
        
        td:nth-child(3) {
          width: 15% !important;
          min-width: 60px !important;
          text-align: center !important;
        }
        
        td:nth-child(4) {
          width: 15% !important;
          min-width: 70px !important;
          text-align: right !important;
        }
        
        td:last-child {
          border-right: none !important;
          width: 15% !important;
          min-width: 70px !important;
          text-align: right !important;
        }
        
        td:first-child, th:first-child {
          border-left: none !important;
        }
        
        td:last-child, th:last-child {
          border-right: none !important;
        }
        
        /* EMPHASIS - Bold That Pops */
        strong, b, .bold {
          font-weight: 700 !important;
          color: #0d1b2a !important;
        }
        
        /* LISTS - Perfect Rhythm */
        ul, ol {
          margin: 12pt 0 12pt 24pt !important;
          page-break-inside: avoid !important;
        }
        
        li {
          margin: 6pt 0 !important;
          line-height: 1.6 !important;
          color: #2d3748 !important;
        }
        
        ul li::marker {
          color: #8b5cf6 !important;
        }
        
        /* CODE - Developer Friendly */
        code, pre {
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
          color: #e2e8f0 !important;
          padding: 10pt !important;
          border-radius: 6px !important;
          border: 1px solid #334155 !important;
          page-break-inside: avoid !important;
          font-size: 9.5pt !important;
          line-height: 1.5 !important;
        }
        
        code {
          padding: 2pt 5pt !important;
        }
        
        /* QUOTES - Elegant Pull Quotes */
        blockquote {
          border-left: 4px solid linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%) !important;
          margin: 16pt 0 !important;
          padding: 12pt 16pt !important;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important;
          font-style: italic !important;
          color: #5b21b6 !important;
          page-break-inside: avoid !important;
          border-radius: 0 6px 6px 0 !important;
          position: relative !important;
        }
        
        blockquote::before {
          content: '"' !important;
          font-size: 48pt !important;
          color: #8b5cf6 !important;
          position: absolute !important;
          top: -8pt !important;
          left: 8pt !important;
          opacity: 0.2 !important;
          font-family: 'Libre Baskerville', serif !important;
        }
        
        /* IMAGES - Museum Quality */
        img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid !important;
          display: block !important;
          margin: 14pt auto !important;
          border-radius: 8px !important;
          box-shadow: 
            0 4px 6px rgba(0,0,0,0.1),
            0 10px 20px rgba(0,0,0,0.06) !important;
        }
        
        /* SECTIONS - Clean Layout */
        section, .section {
          margin: 20pt 0 !important;
          padding: 14pt !important;
          background: #ffffff !important;
          border-radius: 6px !important;
          page-break-inside: avoid !important;
          border: 1px solid #f1f5f9 !important;
        }
        
        /* LINKS - Professional Underlines */
        a {
          color: #6366f1 !important;
          text-decoration: underline !important;
          text-decoration-color: #a5b4fc !important;
          text-decoration-thickness: 1pt !important;
          text-underline-offset: 3pt !important;
          transition: all 0.2s ease !important;
        }
        
        a:hover {
          color: #4f46e5 !important;
          text-decoration-color: #6366f1 !important;
        }
        
        /* FOOTERS - Branding */
        .footer {
          border-top: 2px solid linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          padding-top: 12pt !important;
          margin-top: 24pt !important;
          padding-bottom: 8pt !important;
          font-size: 9pt !important;
          color: #64748b !important;
          text-align: center !important;
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%) !important;
          border-radius: 6px !important;
        }
        
        /* PRICING TOTALS SECTION */
        .totals-section {
          margin-top: 24pt !important;
          padding: 16pt !important;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
          border-radius: 8px !important;
          border: 2px solid #e2e8f0 !important;
          page-break-inside: avoid !important;
        }
        
        .totals-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 8pt 0 !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        
        .totals-row:last-child {
          border-bottom: none !important;
        }
        
        .totals-label {
          font-family: 'Inter', sans-serif !important;
          font-size: 11pt !important;
          font-weight: 500 !important;
          color: #475569 !important;
          text-align: left !important;
        }
        
        .totals-value {
          font-family: 'Inter', sans-serif !important;
          font-size: 11pt !important;
          font-weight: 600 !important;
          color: #0d1b2a !important;
          text-align: right !important;
          min-width: 120px !important;
        }
        
        .totals-row.grand-total .totals-label {
          font-size: 13pt !important;
          font-weight: 700 !important;
          color: #0d1b2a !important;
        }
        
        .totals-row.grand-total .totals-value {
          font-size: 15pt !important;
          font-weight: 700 !important;
          color: #6366f1 !important;
        }
        
        /* TERMS AND CONDITIONS SECTION */
        .terms-section {
          margin-top: 32pt !important;
          padding: 16pt !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          page-break-inside: avoid !important;
        }
        
        .terms-section h4 {
          font-family: 'Libre Baskerville', Georgia, serif !important;
          font-size: 13pt !important;
          font-weight: 700 !important;
          color: #0d1b2a !important;
          margin-bottom: 12pt !important;
          page-break-after: avoid !important;
        }
        
        .terms-section p {
          font-size: 10pt !important;
          line-height: 1.6 !important;
          margin-bottom: 8pt !important;
        }
        
        /* HIGHLIGHTS - Attention Grabs */
        .highlight {
          background: linear-gradient(120deg, #fef3c7 0%, #fde68a 100%) !important;
          padding: 3pt 8pt !important;
          border-radius: 4px !important;
          color: #78350f !important;
          font-weight: 600 !important;
        }
        
        /* CALLOUTS - Information Cards */
        .callout {
          padding: 14pt !important;
          border-radius: 6px !important;
          margin: 14pt 0 !important;
          page-break-inside: avoid !important;
          border-left: 4px solid !important;
        }
        
        .callout-info {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
          border-color: #3b82f6 !important;
        }
        
        .callout-warning {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
          border-color: #f59e0b !important;
        }
        
        .callout-danger {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
          border-color: #ef4444 !important;
        }
        
        /* BADGES - Status Indicators */
        .badge {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 4pt 10pt !important;
          border-radius: 20px !important;
          font-size: 8pt !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.6pt !important;
          gap: 4pt !important;
        }
        
        .badge-success {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
          color: #166534 !important;
          border: 1px solid #86efac !important;
        }
        
        .badge-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
          color: #92400e !important;
          border: 1px solid #fcd34d !important;
        }
        
        .badge-danger {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%) !important;
          color: #991b1b !important;
          border: 1px solid #fca5a5 !important;
        }
        
        /* BUTTONS - Even in Print */
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 10pt 20pt !important;
          border-radius: 8px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          display: inline-block !important;
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3) !important;
        }
        
        /* PAGE BREAKS */
        .page-break {
          page-break-before: always !important;
        }
        
        .no-break {
          page-break-inside: avoid !important;
        }
        
        /* PREVENT ORPHANS AND WIDOWS */
        p, li, td, th {
          orphans: 2 !important;
          widows: 2 !important;
        }
        
        /* AVOID ORPHANED LISTS */
        ul, ol {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* AVOID ORPHANED TABLE ROWS */
        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        
        /* Ensure tables don't break awkwardly */
        table {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* If table must break, repeat headers */
        thead {
          display: table-header-group !important;
        }
        
        /* DIVIDER LINES - Elegant Separators */
        hr, .divider {
          border: none !important;
          height: 2px !important;
          background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%) !important;
          margin: 20pt 0 !important;
        }
      </style>
    `;

    // STEP 2: Pre-process HTML for semantic table structure
    let processedHtml = htmlContent;

    // Remove AI-generated meta-commentary and internal notes
    const aiCommentPatterns = [
      /The user['']s brief is for implementing[\s\S]*?/gi,
      /I['']ve calculated pricing[\s\S]*?/gi,
      /I['']ll include mandatory JSON block[\s\S]*?/gi,
      /I['']ll create[\s\S]*?/gi,
      /Based on[\s\S]*?/gi,
      /Here['']s the[\s\S]*?/gi,
      /The proposal[\s\S]*?/gi,
      /This document[\s\S]*?/gi,
    ];

    aiCommentPatterns.forEach(pattern => {
      processedHtml = processedHtml.replace(pattern, '');
    });

    // Remove duplicate sections (common in AI generation)
    const h2Matches = processedHtml.match(/<h2[^>]*>.*?<\/h2>/gi);
    if (h2Matches) {
      const seenHeaders = new Set();
      processedHtml = processedHtml.replace(/<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi, (match, header, content) => {
        const normalizedHeader = header.toLowerCase().trim();
        if (seenHeaders.has(normalizedHeader)) {
          console.log(`[PDF Export] Removing duplicate section: ${header}`);
          return '';
        }
        seenHeaders.add(normalizedHeader);
        return match;
      });
    }

    // Wrap tables without thead/tbody in proper structure
    processedHtml = processedHtml.replace(
      /<table([^>]*)>([\s\S]*?)<\/table>/gi,
      (match, attrs, content) => {
        // Check if it already has thead/tbody
        if (content.includes('<thead>') && content.includes('<tbody>')) {
          return match;
        }

        // Extract rows
        const rows = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

        if (rows.length === 0) return match;

        // First row becomes thead, rest become tbody
        const headerRow = rows[0];
        const bodyRows = rows.slice(1).join('');

        // Replace th with td in body rows if needed
        const fixedBodyRows = bodyRows.replace(/<th/gi, '<td').replace(/<\/th>/gi, '</td>');

        return `<table${attrs}><thead>${headerRow}</thead><tbody>${fixedBodyRows}</tbody></table>`;
      }
    );

    const enhancedHtml =
      preset === "pixelPerfect"
        ? ensureHtmlDocument(htmlContent)
        : `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${printCSS}
      </head>
      <body>
        ${processedHtml}
      </body>
      </html>
    `;

    // Write HTML to temp file (Sanitize one last time for safety)
    const finalSanitizedHtml = DOMPurify.sanitize(enhancedHtml, {
      ADD_TAGS: ["style", "html", "head", "body", "meta", "svg", "path"],
      ADD_ATTR: [
        "name",
        "content",
        "charset",
        "viewport",
        "class",
        "id",
        "style",
        "src",
        "href",
        "alt",
        "viewBox",
        "fill",
        "xmlns",
        "d",
        "fill-rule",
        "clip-rule",
      ],
      WHOLE_DOCUMENT: true,
    });
    await fs.promises.writeFile(inputPath, finalSanitizedHtml, "utf8");

    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Viewport affects layout for responsive content. For pixelPerfect, use Letter-ish viewport.
    if (preset === "pixelPerfect") {
      // US Letter at 96dpi ~= 816x1056
      await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
    } else {
      // A4 width at 96 DPI = ~794px, use 1200 for better quality
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    }

    // STEP 4: Set content directly (better than file:// for print emulation)
    await page.setContent(enhancedHtml, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000
    });

    // STEP 5: Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    // STEP 6: THE CRITICAL PIECE - Emulate print media
    await page.emulateMediaType('print');

    // STEP 6: Generate PDF with UNIVERSE-LEVEL settings
    const pdfOptions = resolvePdfOptions();
    const pdfBuffer = await page.pdf(pdfOptions);

    console.log(`[PDF Export] Puppeteer returned type: ${typeof pdfBuffer}, constructor: ${pdfBuffer?.constructor?.name}, length: ${pdfBuffer?.length}`);
    console.log(`[PDF Export] Successfully generated PDF ${jobId}, size: ${pdfBuffer.length} bytes`);

    // Validate PDF buffer
    let validatedBuffer = pdfBuffer;

    if (!Buffer.isBuffer(pdfBuffer)) {
      console.warn("[PDF Export] PDF is not a Buffer, attempting to convert:", typeof pdfBuffer);
      if (pdfBuffer && pdfBuffer.length > 0) {
        validatedBuffer = Buffer.from(pdfBuffer);
      } else {
        throw new Error(`Generated PDF is not a Buffer (type: ${typeof pdfBuffer})`);
      }
    }

    if (validatedBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }

    const header = validatedBuffer.slice(0, 4).toString();
    if (!header.startsWith("%PDF")) {
      throw new Error(`Invalid PDF: header is "${header}" instead of "%PDF"`);
    }

    return validatedBuffer;
  } catch (error) {
    console.error("[PDF Export] Puppeteer Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    try {
      if (fs.existsSync(inputPath)) await fs.promises.unlink(inputPath);
    } catch (cleanupError) {
      console.warn("[PDF Export] Cleanup warning:", cleanupError);
    }
  }
}

module.exports = { generatePdf };
