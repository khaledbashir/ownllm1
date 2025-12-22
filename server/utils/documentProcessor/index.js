/**
 * Document Processor Module - Main export
 * Provides clean interface for document processing functionality
 */

const ProposalDocumentProcessor = require('./proposalProcessor');
const DocumentProcessor = require('./documentProcessor'); // This is the original DocumentProcessor class
const TemplateEngine = require('./templateEngine');
const FormatConverter = require('./formatConverter');
const TestWorkflow = require('./testWorkflow');

// Export main classes
module.exports = {
  ProposalDocumentProcessor,
  DocumentProcessor,
  TemplateEngine,
  FormatConverter,
  TestWorkflow
};

// Export utility functions
module.exports.createProcessor = (options = {}) => {
  return new ProposalDocumentProcessor(options);
};

module.exports.processDocument = async (rawText, config = {}) => {
  const processor = new ProposalDocumentProcessor(config);
  return await processor.processProposal(rawText, config);
};

module.exports.previewDocument = async (rawText, config = {}) => {
  const processor = new ProposalDocumentProcessor(config);
  return await processor.preview(rawText, config);
};

module.exports.runTest = async () => {
  const test = new TestWorkflow();
  return await test.runTest();
};