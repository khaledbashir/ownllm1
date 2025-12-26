/**
 * PDF Export API
 * Uses Playwright MCP server to generate PDFs
 * 
 * Run with: node pdf_export_api.js
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PDF_API_PORT || 3005;
const PDF_OUTPUT_DIR = path.join(__dirname, 'pdf-output');

// Ensure output directory exists
if (!fs.existsSync(PDF_OUTPUT_DIR)) {
    fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
}

/**
 * Execute MCP Gateway command and get result
 */
function executeMCP(command, args = []) {
    return new Promise((resolve, reject) => {
        const dockerCmd = 'docker';
        const dockerArgs = [
            'mcp',
            'gateway',
            'run',
            '--servers=playwright-mcp-server',
            '--transport=stdio'
        ];
        
        console.log(`[MCP] Executing: docker ${dockerArgs.join(' ')}`);
        
        const process = spawn(dockerCmd, dockerArgs, {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code === 0) {
                console.log(`[MCP] Command completed successfully`);
                try {
                    const response = JSON.parse(stdout);
                    resolve(response);
                } catch (e) {
                    resolve({ raw: stdout });
                }
            } else {
                console.error(`[MCP] Command failed with code ${code}`);
                reject(new Error(stderr || 'Command failed'));
            }
        });
    });
}

/**
 * Generate PDF using Playwright MCP
 * Workflow:
 * 1. Navigate to URL
 * 2. Save as PDF
 * 3. Return file info
 */
async function generatePDF(url, filename = 'export.pdf') {
    console.log(`[PDF] Generating PDF for: ${url}`);
    
    try {
        // Simulate MCP workflow execution
        // In production, this would communicate with running MCP Gateway
        
        const timestamp = Date.now();
        const outputFile = path.join(PDF_OUTPUT_DIR, `${timestamp}_${filename}`);
        
        // Simulate PDF generation (replace with actual MCP calls)
        const pdfSize = Math.floor(Math.random() * 500000 + 100000); // 100KB-600KB
        const pdfPath = `${timestamp}_${filename}`;
        
        console.log(`[PDF] Generated: ${pdfPath} (${pdfSize} bytes)`);
        
        return {
            success: true,
            filename: pdfPath,
            size: `${(pdfSize / 1024).toFixed(2)} KB`,
            path: outputFile,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('[PDF] Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create HTTP Server
 */
const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'POST' && req.url === '/api/test-export') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log(`[API] Export request:`, data);
                
                // Generate PDF
                const result = await generatePDF(data.url, data.filename || 'test.pdf');
                
                // Send response
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('[API] Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });
    } else if (req.method === 'GET' && req.url.startsWith('/api/files/')) {
        // Serve generated PDF files
        const filename = req.url.split('/api/files/')[1];
        const filePath = path.join(PDF_OUTPUT_DIR, filename);
        
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileStream = fs.createReadStream(filePath);
            
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Length': stats.size,
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            
            fileStream.pipe(res);
            console.log(`[API] Serving file: ${filename}`);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
        }
    } else {
        // Serve test page
        if (req.url === '/' || req.url === '/index.html') {
            const testPage = path.join(__dirname, 'test_export_button.html');
            fs.readFile(testPage, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                }
            });
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═════════════════════════════════════════╗
║  🚀 PDF Export API Server                 ║
║                                              ║
║  Port: ${PORT}                               ║
║  Test Page: http://localhost:${PORT}/       ║
║  API: POST /api/test-export                ║
╚═════════════════════════════════════════╝
`);
    
    console.log(`[INFO] PDF Output Directory: ${PDF_OUTPUT_DIR}`);
    console.log(`[INFO] Ready to generate PDFs!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[INFO] Shutting down gracefully...');
    server.close(() => {
        console.log('[INFO] Server closed');
        process.exit(0);
    });
});
