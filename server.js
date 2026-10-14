const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Serve all static files from the 'public' directory
// (HTML, CSS, JS, Images, Icons)
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d', // Static file caching
    extensions: ['html', 'htm']
}));

// Helper to load planets dataset
function getPlanetsData() {
    const raw = fs.readFileSync(path.join(__dirname, 'data', 'planets.json'), 'utf8');
    return JSON.parse(raw);
}

// REST API: Get all planets
app.get('/api/planets', (req, res) => {
    try {
        const planets = getPlanetsData();
        
        // Optional filtering by type
        const { type, search } = req.query;
        let result = planets;
        
        if (type && type !== 'All') {
            result = result.filter(p => p.type.toLowerCase().includes(type.toLowerCase()));
        }
        
        if (search) {
            const query = search.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.type.toLowerCase().includes(query)
            );
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching planets:', err);
        res.status(500).json({ error: 'Failed to retrieve planet data' });
    }
});

// REST API: Get single planet by ID
app.get('/api/planets/:id', (req, res) => {
    try {
        const planets = getPlanetsData();
        const planet = planets.find(p => p.id === parseInt(req.params.id, 10));
        if (!planet) {
            return res.status(404).json({ error: 'Planet not found' });
        }
        res.json(planet);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// REST API: System / Server telemetry (Demonstrates Node.js runtime)
app.get('/api/server-info', (req, res) => {
    res.json({
        service: 'Node.js Static & API Server',
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        staticRoot: 'public',
        port: PORT,
        status: 'OPERATIONAL'
    });
});

// Fallback to index.html for SPA-style routing if needed
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the HTTP server
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Solar System Static Server is active!`);
    console.log(`🌐 Local URL:  http://localhost:${PORT}`);
    console.log(`📦 Serving:    ${path.join(__dirname, 'public')}`);
    console.log(`📡 API:        http://localhost:${PORT}/api/planets`);
    console.log(`===============================================`);
});
