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
    const filepath = path.join('/app/server/storage/documents', safeName);

    if (fs.existsSync(filepath)) {
      response.download(filepath, safeName, (err) => {
        if (err) {
          console.error(`[Download Error] Failed to send file ${safeName}:`, err);
        }
      });
    } else {
      console.warn(`[Download Warning] File not found: ${filepath}`);
      response.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    console.error('[Download Error]', error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = { systemDownloadEndpoints: router };
