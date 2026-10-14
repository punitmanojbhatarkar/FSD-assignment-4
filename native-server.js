/**
 * PURE NODE.JS STATIC WEB SERVER (Zero External Dependencies)
 * Created for FSD Assignment 4 to demonstrate low-level Node.js core modules:
 * - http: HTTP server creation and request/response streaming
 * - fs: Asynchronous filesystem I/O
 * - path: Path resolution and cross-platform directory mapping
 * - url: Query parameter and pathname parsing
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data', 'planets.json');

// MIME type dictionary for static file serving
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.htm': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Enable CORS for API requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // --- REST API ENDPOINT: /api/planets ---
    if (pathname === '/api/planets') {
        fs.readFile(DATA_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Failed to read dataset' }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(data);
        });
        return;
    }

    // --- REST API ENDPOINT: /api/server-info ---
    if (pathname === '/api/server-info') {
        const info = {
            service: 'Native Node.js HTTP Core Server',
            nodeVersion: process.version,
            platform: process.platform,
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            staticRoot: 'public',
            port: PORT,
            status: 'OPERATIONAL'
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        return res.end(JSON.stringify(info));
    }

    // --- STATIC FILE SERVING ---
    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    // Secure path traversal protection
    const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
    if (!safePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('403 Forbidden: Directory traversal prevented.');
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Serve 404
            res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
            return res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body style="font-family: sans-serif; background: #070913; color: #fff; text-align: center; padding: 4rem;">
                    <h1>404 — Resource Not Found</h1>
                    <p>The static file <code>${pathname}</code> was not found on this Node.js server.</p>
                    <a href="/" style="color: #38bdf8;">Return to Cosmic Explorer</a>
                </body>
                </html>
            `);
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'public, max-age=86400'
        });

        const readStream = fs.createReadStream(safePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`⚡ Pure Node.js (Zero-Dependency) HTTP Server Active!`);
    console.log(`🌐 Local URL:  http://localhost:${PORT}`);
    console.log(`📁 Directory:  ${PUBLIC_DIR}`);
    console.log(`📡 API:        http://localhost:${PORT}/api/planets`);
    console.log(`====================================================`);
});
