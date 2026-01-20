// server/endpoints/download.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { validatedRequest } = require("../utils/middleware/validatedRequest");

// GET /api/system/download/:filename
router.get('/download/:filename', async (request, response) => {
  try {
    const filename = request.params.filename;
    
    // SECURITY: Prevent directory traversal
    const safeName = path.basename(filename);
    const storageDir = path.join(__dirname, '..', 'storage', 'documents');
    const filepath = path.join(storageDir, safeName);
    const tmpPath = path.join('/tmp', safeName);

    // Check storage directory first, then fallback to /tmp
    let downloadPath = filepath;
    if (!fs.existsSync(filepath) && fs.existsSync(tmpPath)) {
      downloadPath = tmpPath;
    }

    if (fs.existsSync(downloadPath)) {
      response.download(downloadPath, safeName, (err) => {
        if (err) {
          console.error(`[Download Error] Failed to send file ${safeName}:`, err);
        }
      });
    } else {
      console.warn(`[Download Warning] File not found: ${safeName}`);
      response.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    console.error('[Download Error]', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = { systemDownloadEndpoints: router };
