# Easypanel Deployment Guide - Document Processing Solution

## 🚀 How to Deploy in Easypanel

### Method 1: Direct Git Deployment (Recommended)

1. **Login to Easypanel Dashboard**
   - Go to your Easypanel instance
   - Navigate to your project

2. **Update Environment Variables**
   In your Easypanel project settings, add these environment variables:
   ```bash
   # For PDF generation support
   PUPPETEER_SKIP_DOWNLOAD=false
   
   # For document processing
   ENABLE_DOCUMENT_PROCESSING=true
   DOCUMENT_OUTPUT_DIR=/app/tmp/documents
   ```

3. **Update Dockerfile (if using custom Docker)**
   Add these lines to your Dockerfile:
   ```dockerfile
   # Install dependencies for document processing
   RUN npm install puppeteer docx
   
   # Create output directory
   RUN mkdir -p /app/tmp/documents
   
   # Install system dependencies for Puppeteer
   RUN apt-get update && apt-get install -y \
       chromium \
       && rm -rf /var/lib/apt/lists/*
   ```

### Method 2: Manual Installation in Container Console

1. **Access Container Console**
   - In Easypanel, click on your project
   - Go to "Console" tab
   - Select your container

2. **Install Dependencies**
   ```bash
   # Navigate to your project directory
   cd /app
   
   # Install the document processing dependencies
   npm install puppeteer docx
   
   # Create output directory
   mkdir -p tmp/documents
   ```

3. **Test Installation**
   ```bash
   # Navigate to document processor directory
   cd server/utils/documentProcessor
   
   # Run the test
   node testWorkflow.js
   ```

## 🔧 Integration with Your Application

### Add to Your Server Routes

Create a new route in your server for document processing:

```javascript
// server/routes/documentProcessing.js
const express = require('express');
const { processDocument } = require('../utils/documentProcessor');
const multer = require('multer');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Process document endpoint
router.post('/process', upload.single('rawText'), async (req, res) => {
  try {
    let rawText = req.body.rawText;
    
    // If file uploaded, read it
    if (req.file) {
      const fs = require('fs');
      rawText = fs.readFileSync(req.file.path, 'utf8');
    }
    
    const config = {
      agency: req.body.agency || 'Your Agency',
      client: req.body.client || 'Client',
      placeholders: {
        projectOverview: req.body.projectOverview,
        duration: req.body.duration,
        pricing: req.body.pricing
      },
      formats: ['html'],
      includeTOC: true,
      includeTitlePage: true
    };
    
    const result = await processDocument(rawText, config);
    
    res.json({
      success: result.success,
      document: result.document,
      outputs: result.outputs.map(output => ({
        format: output.format,
        downloadUrl: `/api/download/${output.filename}`,
        size: output.size
      }))
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download processed document
router.get('/download/:filename', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const filepath = path.join(__dirname, '../../tmp/documents', req.params.filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;
```

### Add to Your Main Server File

```javascript
// server/index.js
const documentProcessingRoutes = require('./routes/documentProcessing');

// Add the routes
app.use('/api/documents', documentProcessingRoutes);
```

## 📱 Frontend Integration Example

Create a React component for document processing:

```jsx
// frontend/src/components/DocumentProcessor/index.jsx
import React, { useState } from 'react';
import axios from 'axios';

const DocumentProcessor = () => {
  const [rawText, setRawText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState({
    agency: 'Your Agency Name',
    client: '',
    projectOverview: '',
    duration: '',
    pricing: ''
  });

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const response = await axios.post('/api/documents/process', {
        rawText,
        ...config
      });
      
      setResult(response.data);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="document-processor">
      <h2>Document Processing</h2>
      
      <div className="config-section">
        <input
          placeholder="Agency Name"
          value={config.agency}
          onChange={(e) => setConfig({...config, agency: e.target.value})}
        />
        <input
          placeholder="Client Name"
          value={config.client}
          onChange={(e) => setConfig({...config, client: e.target.value})}
        />
        <input
          placeholder="Project Overview"
          value={config.projectOverview}
          onChange={(e) => setConfig({...config, projectOverview: e.target.value})}
        />
        <input
          placeholder="Duration (e.g., 16 weeks)"
          value={config.duration}
          onChange={(e) => setConfig({...config, duration: e.target.value})}
        />
        <input
          placeholder="Total Price (e.g., $77,000 inc GST)"
          value={config.pricing}
          onChange={(e) => setConfig({...config, pricing: e.target.value})}
        />
      </div>
      
      <textarea
        placeholder="Paste your raw proposal text here..."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        rows={20}
        style={{ width: '100%', margin: '10px 0' }}
      />
      
      <button 
        onClick={handleProcess} 
        disabled={processing || !rawText}
        style={{ padding: '10px 20px' }}
      >
        {processing ? 'Processing...' : 'Process Document'}
      </button>
      
      {result && (
        <div className="results">
          <h3>Results</h3>
          <p>Success: {result.success ? 'Yes' : 'No'}</p>
          <p>Sections: {result.document?.sections?.length || 0}</p>
          <p>Tables: {result.document?.tables?.length || 0}</p>
          
          {result.outputs && result.outputs.map((output, index) => (
            <div key={index}>
              <a href={output.downloadUrl} target="_blank" rel="noopener noreferrer">
                Download {output.format.toUpperCase()} ({Math.round(output.size/1024)}KB)
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentProcessor;
```

## 🔍 Testing in Easypanel

1. **Check Container Status**
   - Go to your project in Easypanel
   - Check "Logs" to ensure no errors
   - Verify all services are running

2. **Test Document Processing**
   - Access your application
   - Navigate to document processing feature
   - Test with sample data

3. **Monitor Performance**
   - Check resource usage in Easypanel
   - Monitor output directory size
   - Review logs for any issues

## 🛠️ Troubleshooting

### Common Issues

1. **Dependencies Not Installing**
   ```bash
   # In container console
   npm install --force puppeteer docx
   ```

2. **Permission Issues**
   ```bash
   # Create output directory with proper permissions
   mkdir -p /app/tmp/documents
   chmod 755 /app/tmp/documents
   ```

3. **Puppeteer Issues**
   ```bash
   # Install system dependencies
   apt-get update && apt-get install -y chromium-browser
   ```

4. **Memory Issues**
   - Increase container memory in Easypanel settings
   - Consider using `puppeteer-core` with system Chrome

### Environment Variables for Production

Add these to your Easypanel environment:

```bash
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
DOCUMENT_PROCESSING_ENABLED=true
OUTPUT_RETENTION_DAYS=7
MAX_DOCUMENT_SIZE=10MB
```

## 📊 Monitoring

1. **Container Resources**
   - CPU usage during processing
   - Memory consumption
   - Disk space for output files

2. **Application Logs**
   - Document processing success/failure
   - Output file generation
   - User activity

3. **File Management**
   - Automatic cleanup of old files
   - Storage monitoring
   - Backup important documents

## 🎯 Quick Deployment Commands

Run these in your Easypanel container console:

```bash
# 1. Install dependencies
cd /app && npm install puppeteer docx

# 2. Create directories
mkdir -p tmp/documents uploads

# 3. Test the system
cd server/utils/documentProcessor && node testWorkflow.js

# 4. Check if everything is working
curl http://localhost:3000/api/health  # Adjust port as needed
```

Your document processing solution is now ready to use in your Easypanel environment! 🚀