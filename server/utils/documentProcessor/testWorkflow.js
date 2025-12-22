/**
 * Test Workflow - Demonstrates the complete document processing pipeline
 * Uses sample raw proposal data to show transformation capabilities
 */

const ProposalDocumentProcessor = require('./proposalProcessor');

class TestWorkflow {
  constructor() {
    this.processor = new ProposalDocumentProcessor();
    this.sampleData = this.generateSampleData();
  }

  /**
   * Generate sample raw proposal data that demonstrates the issues
   * described in the original request
   */
  generateSampleData() {
    return `
NIDA Student Information System Enhancement Project

Executive Summary
Brief overview of the proposed project... X weeks / $X,XXX

This proposal outlines the enhancement of the National Institute of Development Administration (NIDA) Student Information System (SIS) to improve student data management and academic processes.

Project Outcomes
- Enhanced student data management capabilities
- Improved integration with existing systems
- Streamlined academic processes
- Better reporting and analytics functionality

Component 1: Database Architecture Redesign

Project Overview
Brief overview of the proposed project...

Objectives
- Redesign database schema for improved performance
- Implement data normalization best practices
- Create robust backup and recovery procedures
- Establish data security protocols

Project Phases
Phase 1: Analysis and Planning (2 weeks)
- Current system assessment
- Requirements gathering
- Database design documentation

Phase 2: Implementation (6 weeks)
- Schema development
- Data migration planning
- Testing and validation

Phase 3: Deployment (2 weeks)
- Production deployment
- User training
- Performance monitoring

Key Deliverables
- Redesigned database schema
- Data migration scripts
- Documentation and training materials
- Performance optimization report

Pricing Summary
ROLE          DESCRIPTION                    HOURS        RATE        TOTAL
Senior Database Architect   Database design and optimization     80          $150        $12,000
Data Migration Specialist   Data mapping and migration           40          $120        $4,800
QA Engineer           Testing and validation                 32          $100        $3,200
Project Manager       Account & Project Management Services    24          $130        $3,120

Budget Notes
- All rates are commercial rounding to nearest $10
- Travel expenses not included
- Timeline assumes client availability for reviews

Assumptions
- Client will provide access to existing systems
- Data backup procedures are in place
- Business requirements are clearly defined

Component 2: Integration Layer Development

Project Overview
Brief overview of the proposed project...

Objectives
- Develop RESTful API layer
- Implement iPaaS (Integration Platform as a Service) solutions
- Create secure authentication mechanisms
- Establish monitoring and logging

Project Phases
Phase 1: API Design (3 weeks)
- RESTful API specification
- Authentication design
- Integration architecture planning

Phase 2: Development (8 weeks)
- API implementation
- Integration development
- Security implementation
- Testing and documentation

Phase 3: Integration Testing (3 weeks)
- End-to-end testing
- Performance testing
- Security testing

Key Deliverables
- RESTful API documentation
- Integration middleware
- Security implementation
- Testing reports

Pricing Summary
ROLE          DESCRIPTION                    HOURS        RATE        TOTAL
Senior API Developer        API development and documentation    96          $140        $13,440
Integration Specialist      iPaaS implementation               64          $130        $8,320
Security Engineer           Authentication and security         48          $160        $7,680
QA Engineer           Testing and validation                 40          $100        $4,000

Budget Notes
- Integration testing may require additional resources
- Third-party API costs not included

Assumptions
- Existing systems support RESTful integration
- Security requirements are clearly defined
- Client will provide API access credentials

Component 3: User Interface Enhancement

Project Overview
Brief overview of the proposed project...

Objectives
- Redesign user interface for better UX
- Implement responsive design principles
- Create intuitive navigation structure
- Ensure accessibility compliance

Project Phases
Phase 1: UX Design (4 weeks)
- User research and analysis
- Wireframing and prototyping
- Design system development

Phase 2: Frontend Development (10 weeks)
- React component development
- Responsive layout implementation
- Accessibility features
- Performance optimization

Phase 3: Testing and Refinement (4 weeks)
- User acceptance testing
- Performance testing
- Accessibility testing

Key Deliverables
- Modern web application interface
- Mobile-responsive design
- Accessibility compliance report
- Performance optimization

Pricing Summary
ROLE          DESCRIPTION                    HOURS        RATE        TOTAL
UX/UI Designer         User experience design           64          $110        $7,040
Frontend Developer        React development             120         $125        $15,000
Accessibility Specialist   WCAG compliance testing        32          $140        $4,480
QA Engineer           Testing and validation           48          $100        $4,800

Budget Notes
- Design iterations may require additional time
- Cross-browser testing included

Assumptions
- Modern web standards are acceptable
- Accessibility requirements are clearly defined
- Client will provide user feedback

Combined Project Investment Summary

The total project investment is $70,000 ex GST, which includes all development, testing, and project management services across the three components.

Account & Project Management Services
- Project planning and scheduling
- Resource allocation and management
- Regular client communication and updates
- Risk management and issue resolution
- Quality assurance oversight

Budget Notes
- All pricing excludes GST
- Payment terms: 30% upfront, 40% mid-project, 30% completion
- Change requests may impact timeline and cost

Assumptions
- Client approval required for major changes
- Weekly status meetings included
- Email support available during business hours

Project Timeline
The estimated project duration is 16 weeks from project kickoff to final delivery, with parallel workstreams where possible to optimize efficiency.

Risk Management
We have identified potential risks and mitigation strategies:
- Data migration challenges: Comprehensive testing and rollback procedures
- Integration complexity: Early prototyping and validation
- Scope creep: Clear change management process

Next Steps
Upon acceptance of this proposal, we will:
1. Schedule project kickoff meeting
2. Finalize technical requirements
3. Begin Phase 1 workstreams
4. Establish communication protocols

We look forward to partnering with NIDA on this important enhancement project and delivering a solution that exceeds expectations.
    `;
  }

  /**
   * Run the complete test workflow
   */
  async runTest() {
    console.log('🚀 Starting Document Processing Test Workflow\n');

    try {
      // Step 1: Preview the document processing
      console.log('📋 Step 1: Previewing document processing...');
      const preview = await this.processor.preview(this.sampleData, {
        placeholders: {
          projectOverview: 'Enhancement of the National Institute of Development Administration (NIDA) Student Information System (SIS) to improve student data management, academic processes, and integration capabilities.',
          duration: '16 weeks',
          pricing: '$77,000 inc GST'
        }
      });

      if (!preview.success) {
        throw new Error(`Preview failed: ${preview.error}`);
      }

      console.log(`✅ Preview successful!`);
      console.log(`   - Sections detected: ${preview.document.sections.length}`);
      console.log(`   - Tables detected: ${preview.document.tables.length}`);
      console.log(`   - Estimated completeness: ${preview.validation.stats.totalSections - preview.validation.stats.emptySections}/${preview.validation.stats.totalSections} sections with content`);
      console.log(`   - Placeholders remaining: ${preview.validation.stats.remainingPlaceholders}`);

      // Step 2: Process the document with full output generation
      console.log('\n📄 Step 2: Processing document and generating outputs...');
      const result = await this.processor.processProposal(this.sampleData, {
        agency: 'Digital Solutions Agency',
        colors: {
          primary: '#1e3a8a',
          secondary: '#374151',
          accent: '#dc2626',
          text: '#111827',
          background: '#ffffff'
        },
        formats: ['html'], // Start with HTML for testing
        includeTOC: true,
        includeTitlePage: true,
        includeInvestmentSummary: true,
        placeholders: {
          projectOverview: 'Enhancement of the National Institute of Development Administration (NIDA) Student Information System (SIS) to improve student data management, academic processes, and integration capabilities.',
          duration: '16 weeks',
          pricing: '$77,000 inc GST'
        }
      });

      if (!result.success) {
        throw new Error(`Processing failed: ${result.error}`);
      }

      console.log(`✅ Processing successful!`);
      console.log(`   - Generated ${result.outputs.length} output files`);
      console.log(`   - Success rate: ${result.outputs.filter(o => o.success).length}/${result.outputs.length}`);

      // Step 3: Display detailed results
      console.log('\n📊 Step 3: Processing Results Summary...');
      const stats = this.processor.getProcessingStats(result);
      
      console.log('📈 Input Statistics:');
      console.log(`   - Raw text length: ${stats.input.rawTextLength.toLocaleString()} characters`);
      console.log(`   - Estimated words: ${stats.input.estimatedWords.toLocaleString()}`);

      console.log('\n🔄 Processing Statistics:');
      console.log(`   - Sections processed: ${stats.processing.sectionsProcessed}`);
      console.log(`   - Tables processed: ${stats.processing.tablesProcessed}`);
      console.log(`   - Processing time: ${stats.processing.processingTime}ms`);

      console.log('\n✅ Validation Results:');
      console.log(`   - Valid: ${stats.validation.isValid ? 'Yes' : 'No'}`);
      console.log(`   - Warnings: ${stats.validation.warnings}`);
      console.log(`   - Errors: ${stats.validation.errors}`);

      console.log('\n📁 Output Files:');
      result.outputs.forEach(output => {
        if (output.success) {
          console.log(`   ✅ ${output.format.toUpperCase()}: ${output.filename} (${this.formatBytes(output.size)})`);
        } else {
          console.log(`   ❌ ${output.format.toUpperCase()}: ${output.error}`);
        }
      });

      console.log('\n🎯 Quality Metrics:');
      console.log(`   - Completeness score: ${stats.quality.completeness}/100`);
      console.log(`   - Estimated pages: ${stats.quality.estimatedPages}`);

      // Step 4: Show sample transformed content
      console.log('\n📝 Step 4: Sample Transformed Content...');
      const titleSection = result.document.sections.find(s => s.title.includes('NIDA'));
      if (titleSection) {
        console.log('Original title section content:');
        console.log(titleSection.content.substring(0, 200) + '...');
      }

      const pricingTable = result.document.tables.find(t => t.type === 'pricing');
      if (pricingTable) {
        console.log('\nDetected pricing table:');
        console.log(`   Headers: ${pricingTable.headers.join(', ')}`);
        console.log(`   Rows detected: ${pricingTable.rows.length}`);
      }

      console.log('\n🎉 Test workflow completed successfully!');
      
      return result;

    } catch (error) {
      console.error('❌ Test workflow failed:', error.message);
      throw error;
    }
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Demonstrate specific issue fixes
   */
  async demonstrateIssueFixes() {
    console.log('\n🔧 Demonstrating Specific Issue Fixes...\n');

    const issues = [
      {
        name: 'Broken Bullet Lists',
        before: '-\nThis should be a proper bullet point\n-\nAnother broken bullet',
        after: '• This should be a proper bullet point\n• Another broken bullet'
      },
      {
        name: 'Table Formatting',
        before: 'ROLE          DESCRIPTION                    HOURS        RATE        TOTAL\nSenior Database Architect   Database design and optimization     80          $150        $12,000',
        after: 'Proper HTML table with headers and rows'
      },
      {
        name: 'Placeholder Replacement',
        before: 'Brief overview of the proposed project... X weeks / $X,XXX',
        after: 'Enhancement of the NIDA Student Information System... 16 weeks / $77,000 inc GST'
      }
    ];

    for (const issue of issues) {
      console.log(`${issue.name}:`);
      console.log(`   Before: ${issue.before}`);
      console.log(`   After:  ${issue.after}`);
      console.log('');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new TestWorkflow();
  test.runTest()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestWorkflow;