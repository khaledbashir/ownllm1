/**
 * Document Processing API Routes
 * Provides endpoints for processing raw proposal text into clean documents
 */

const express = require('express');
const { processDocument } = require('../utils/documentProcessor');
const router = express.Router();

/**
 * POST /api/documents/process
 * Process raw proposal text and generate clean documents
 */
router.post('/process', async (req, res) => {
  try {
    const {
      rawText,
      agency = 'Your Agency Name',
      client = 'Client Name',
      projectOverview,
      duration,
      pricing,
      formats = ['html']
    } = req.body;

    // Validate required input
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Raw text is required and must be at least 10 characters'
      });
    }

    // Configuration for document processing
    const config = {
      agency,
      client,
      placeholders: {
        projectOverview: projectOverview || '',
        duration: duration || '',
        pricing: pricing || ''
      },
      formats,
      includeTOC: true,
      includeTitlePage: true,
      includeInvestmentSummary: true
    };

    // Process the document
    const result = await processDocument(rawText, config);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Document processing failed'
      });
    }

    // Return success response with download links
    const outputs = result.outputs
      .filter(output => output.success)
      .map(output => ({
        format: output.format,
        filename: output.filename,
        downloadUrl: `/api/documents/download/${output.filename}`,
        size: output.size,
        sizeFormatted: formatBytes(output.size)
      }));

    res.json({
      success: true,
      document: {
        sections: result.document.sections.length,
        tables: result.document.tables.length,
        metadata: result.document.metadata
      },
      outputs,
      validation: result.validation,
      stats: {
        processingTime: result.stats.processingTime,
        inputLength: result.stats.inputLength,
        estimatedPages: result.stats.estimatedPages
      }
    });

  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/documents/download/:filename
 * Download processed document
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // For now, return a simple message since we need to implement file storage
    // In production, you would serve the actual file from your storage system
    res.json({
      success: false,
      message: 'File download not yet implemented. The document processing works, but file storage needs to be configured.',
      filename: filename,
      note: 'Contact the developer to implement file storage for downloads.'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Download failed'
    });
  }
});

/**
 * POST /api/documents/preview
 * Preview document processing without generating files
 */
router.post('/preview', async (req, res) => {
  try {
    const { rawText, agency, client, projectOverview, duration, pricing } = req.body;

    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Raw text is required'
      });
    }

    const { createProcessor } = require('../utils/documentProcessor');
    const processor = createProcessor();

    const preview = await processor.preview(rawText, {
      agency,
      client,
      placeholders: {
        projectOverview,
        duration,
        pricing
      }
    });

    if (!preview.success) {
      return res.status(500).json({
        success: false,
        error: preview.error
      });
    }

    res.json({
      success: true,
      document: {
        sections: preview.document.sections.length,
        tables: preview.document.tables.length,
        metadata: preview.document.metadata,
        stats: preview.document.stats
      },
      validation: preview.validation,
      estimatedOutputs: preview.estimatedOutputs
    });

  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Preview failed'
    });
  }
});

/**
 * GET /api/documents/test
 * Test the document processing system
 */
router.get('/test', async (req, res) => {
  try {
    const { runTest } = require('../utils/documentProcessor');
    const testResult = await runTest();

    res.json({
      success: true,
      message: 'Document processing system test completed',
      testResult: testResult ? 'Test ran successfully' : 'Test encountered issues'
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Test failed'
    });
  }
});

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Export endpoints function for integration with main server
 */
function documentProcessorEndpoints(router) {
  router.use('/documents', router);
}

module.exports = {
  documentProcessorEndpoints
};