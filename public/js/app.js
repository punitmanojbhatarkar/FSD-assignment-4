/**
 * COSMIC EXPLORER — Modern Deep Space Client Application
 * Node.js Static File Serving & Dynamic REST Telemetry
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let allPlanets = [];
    let currentFilter = 'All';
    let searchQuery = '';
    let currentSort = 'distance-asc';
    let compareList = []; // Up to 2 planet IDs
    let currentModalPlanet = null;

    // --- DOM Elements ---
    const planetsGrid = document.getElementById('planets-grid');
    const orbitalView = document.getElementById('orbital-view');
    const orbitTrack = document.getElementById('orbit-track');
    const loader = document.getElementById('loader');
    const filterTabs = document.getElementById('filter-tabs');
    const searchInput = document.getElementById('planet-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const sortSelect = document.getElementById('planet-sort');
    const viewGridBtn = document.getElementById('view-grid-btn');
    const viewOrbitBtn = document.getElementById('view-orbit-btn');

    // Modals
    const planetModal = document.getElementById('planet-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const comparisonModal = document.getElementById('comparison-modal');
    const comparisonCloseBtn = document.getElementById('comparison-close-btn');
    const compareSelect1 = document.getElementById('compare-select-1');
    const compareSelect2 = document.getElementById('compare-select-2');
    const compareTableContainer = document.getElementById('compare-table-container');
    const compareModalOpenBtn = document.getElementById('compare-modal-open-btn');

    const serverModal = document.getElementById('server-modal');
    const serverCloseBtn = document.getElementById('server-close-btn');
    const serverTelemetryBtn = document.getElementById('server-telemetry-btn');
    const serverTelemetryContent = document.getElementById('server-telemetry-content');

    // Compare Dock
    const compareDock = document.getElementById('compare-dock');
    const dockChips = document.getElementById('dock-chips');
    const dockLaunchBtn = document.getElementById('dock-launch-btn');
    const dockClearBtn = document.getElementById('dock-clear-btn');

    // Sound toggle
    const audioToggleBtn = document.getElementById('audio-toggle-btn');

    // =========================================================================
    // 1. Dynamic Canvas Starfield & Shooting Stars
    // =========================================================================
    const canvas = document.getElementById('starfield-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let mouseX = 0, mouseY = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
    }

    function initStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 3200);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.6 + 0.3,
                baseAlpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: Math.random() > 0.85 ? '#38bdf8' : (Math.random() > 0.7 ? '#f59e0b' : '#ffffff')
            });
        }
    }

    function addShootingStar() {
        if (Math.random() < 0.015 && shootingStars.length < 2) {
            shootingStars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height * 0.5),
                len: Math.random() * 90 + 50,
                speed: Math.random() * 9 + 6,
                angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
                alpha: 1
            });
        }
    }

    function renderStarfield(time) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Stars
        for (const star of stars) {
            const alpha = star.baseAlpha + Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.25;
            ctx.fillStyle = star.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
            ctx.beginPath();
            // Subtle mouse parallax
            const px = star.x + (mouseX - canvas.width / 2) * 0.015 * star.radius;
            const py = star.y + (mouseY - canvas.height / 2) * 0.015 * star.radius;
            ctx.arc(px, py, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Shooting Stars
        addShootingStar();
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            ctx.strokeStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            const tailX = s.x - Math.cos(s.angle) * s.len;
            const tailY = s.y - Math.sin(s.angle) * s.len;
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            s.alpha -= 0.015;

            if (s.alpha <= 0 || s.x > canvas.width || s.y > canvas.height) {
                shootingStars.splice(i, 1);
            }
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(renderStarfield);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    resizeCanvas();
    requestAnimationFrame(renderStarfield);

    // =========================================================================
    // 2. Web Audio API — Ambient Space Drone & SFX
    // =========================================================================
    let audioCtx = null;
    let droneGain = null;
    let isAudioPlaying = false;

    function toggleAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (!isAudioPlaying) {
            startDrone();
            isAudioPlaying = true;
            audioToggleBtn.classList.add('highlight');
            audioToggleBtn.innerHTML = '<span class="icon">🔊</span><span class="audio-label">Ambient: ON</span>';
        } else {
            stopDrone();
            isAudioPlaying = false;
            audioToggleBtn.classList.remove('highlight');
            audioToggleBtn.innerHTML = '<span class="icon">🔈</span><span class="audio-label">Ambient: OFF</span>';
        }
    }

    function startDrone() {
        // Deep resonant cosmic chord (55Hz Root + 110Hz Harmonic)
        droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        droneGain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 3);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, audioCtx.currentTime);

        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, audioCtx.currentTime); // A1

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(82.4, audioCtx.currentTime); // E2

        const osc3 = audioCtx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(110, audioCtx.currentTime); // A2

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc3.start();

        droneGain._nodes = [osc1, osc2, osc3];
    }

    function stopDrone() {
        if (droneGain) {
            droneGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
            setTimeout(() => {
                if (droneGain && droneGain._nodes) {
                    droneGain._nodes.forEach(n => n.stop());
                }
            }, 1300);
        }
    }

    function playBeep(freq = 600, duration = 0.08) {
        if (!isAudioPlaying || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    audioToggleBtn.addEventListener('click', toggleAudio);

    // =========================================================================
    // 3. Data Fetching from Node.js Backend API
    // =========================================================================
    async function fetchPlanets() {
        try {
            loader.style.display = 'flex';
            planetsGrid.innerHTML = '';

            const response = await fetch('/api/planets');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to reach Node.js server.`);
            }

            allPlanets = await response.json();
            loader.style.display = 'none';

            // Populate comparison dropdowns
            populateComparisonSelects();

            // Render view
            applyFiltersAndRender();
            renderOrbitalScaleView();

        } catch (err) {
            console.error('Fetch error:', err);
            loader.innerHTML = `
                <div style="text-align: center; color: #ef4444; max-width: 500px;">
                    <h3>⚠️ Telemetry Connection Error</h3>
                    <p style="margin-top: 0.5rem; color: #94a3b8;">
                        Unable to connect to the Node.js static backend server. Please verify that <code>node server.js</code> is running on port 3000.
                    </p>
                </div>
            `;
        }
    }

    // =========================================================================
    // 4. Filtering, Sorting & Rendering
    // =========================================================================
    function applyFiltersAndRender() {
        let filtered = [...allPlanets];

        // Type Filter
        if (currentFilter !== 'All') {
            filtered = filtered.filter(p => p.type.toLowerCase().includes(currentFilter.toLowerCase()));
        }

        // Search Filter
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(q) ||
                p.type.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.keyFeature.toLowerCase().includes(q)
            );
        }

        // Sorting
        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'distance-asc': return a.distanceAU - b.distanceAU;
                case 'distance-desc': return b.distanceAU - a.distanceAU;
                case 'radius-desc': return b.radiusKm - a.radiusKm;
                case 'radius-asc': return a.radiusKm - b.radiusKm;
                case 'moons-desc': return b.moons - a.moons;
                default: return a.id - b.id;
            }
        });

        renderGrid(filtered);
    }

    function renderGrid(planets) {
        planetsGrid.innerHTML = '';

        if (planets.length === 0) {
            planetsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <p style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔭</p>
                    <p style="font-size: 1.2rem; color: var(--text-primary);">No celestial bodies match your query</p>
                    <p style="font-size: 0.9rem; margin-top: 0.25rem;">Try adjusting your search terms or filter selection.</p>
                </div>
            `;
            return;
        }

        planets.forEach((planet, index) => {
            const card = document.createElement('div');
            card.className = 'planet-card';
            card.style.setProperty('--planet-glow', planet.color);
            card.style.animation = `modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`;

            const isCompared = compareList.includes(planet.id);

            card.innerHTML = `
                <div class="card-top">
                    <span class="planet-type-badge">${planet.type}</span>
                    <span class="planet-distance-badge">${planet.distanceAU} AU</span>
                </div>

                <div class="planet-visual-wrapper">
                    <div class="planet-glow-ring"></div>
                    <img 
                        src="${planet.image}" 
                        alt="${planet.name}" 
                        class="planet-image" 
                        loading="lazy"
                        onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><rect width=%22100%%22 height=%22100%%22 fill=%22%23070913%22/><circle cx=%22200%22 cy=%22200%22 r=%22140%22 fill=%22${encodeURIComponent(planet.color)}%22 opacity=%220.8%22/></svg>';"
                    >
                </div>

                <div class="planet-title-row">
                    <h2 class="planet-name">${planet.name}</h2>
                    <span class="planet-id">#0${planet.id}</span>
                </div>

                <p class="planet-brief">${planet.description}</p>

                <div class="planet-stats-grid">
                    <div class="stat-item">
                        <span class="stat-item-label">Radius</span>
                        <span class="stat-item-val">${planet.radius}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-item-label">Orbit</span>
                        <span class="stat-item-val">${planet.orbitalPeriod}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-item-label">Gravity</span>
                        <span class="stat-item-val">${planet.gravity}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-item-label">Moons</span>
                        <span class="stat-item-val">${planet.moons}</span>
                    </div>
                </div>

                <div class="card-action-row">
                    <button class="card-btn primary inspect-btn" data-id="${planet.id}">
                        🔍 Explore Dossier
                    </button>
                    <button class="card-btn secondary compare-toggle-btn ${isCompared ? 'highlight' : ''}" data-id="${planet.id}">
                        ${isCompared ? '✓ Selected' : '⚖️ Compare'}
                    </button>
                </div>
            `;

            // Card 3D tilt interaction on hover
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const tiltX = (y / (rect.height / 2)) * -6;
                const tiltY = (x / (rect.width / 2)) * 6;
                card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            // Inspect click
            card.querySelector('.inspect-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                playBeep(750);
                openPlanetModal(planet);
            });

            // Compare toggle
            card.querySelector('.compare-toggle-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                playBeep(520);
                toggleCompare(planet.id);
            });

            // Clicking card background opens modal
            card.addEventListener('click', () => {
                playBeep(750);
                openPlanetModal(planet);
            });

            planetsGrid.appendChild(card);
        });
    }

    // =========================================================================
    // 5. Orbital Scale Timeline View
    // =========================================================================
    function renderOrbitalScaleView() {
        orbitTrack.innerHTML = `
            <div class="sun-node">
                <div class="sun-sphere"></div>
                <span class="orbit-node-name" style="color: #f59e0b;">Sol (Sun)</span>
                <span class="orbit-node-au">Center Star</span>
            </div>
        `;

        allPlanets.forEach((planet) => {
            const node = document.createElement('div');
            node.className = 'orbit-node';
            node.style.setProperty('--node-glow', planet.color);
            node.innerHTML = `
                <div class="orbit-planet-thumb">
                    <img src="${planet.image}" alt="${planet.name}">
                </div>
                <span class="orbit-node-name">${planet.name}</span>
                <span class="orbit-node-au">${planet.distanceAU} AU</span>
            `;

            node.addEventListener('click', () => {
                playBeep(750);
                openPlanetModal(planet);
            });

            orbitTrack.appendChild(node);
        });
    }

    // =========================================================================
    // 6. Interactive Planet Telemetry Modal
    // =========================================================================
    function openPlanetModal(planet) {
        currentModalPlanet = planet;
        modalBody.style.setProperty('--modal-planet-glow', planet.color);

        modalBody.innerHTML = `
            <div class="modal-split-grid">
                <!-- Left Visual Column -->
                <div class="modal-visual-col">
                    <div class="modal-img-showcase">
                        <img src="${planet.image}" alt="${planet.name}">
                    </div>
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">
                        Orbital Distance: <strong>${planet.distanceFromSun}</strong>
                    </span>
                    <p style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--accent-blue); font-weight: 500;">
                        ★ ${planet.keyFeature}
                    </p>
                </div>

                <!-- Right Telemetry Column -->
                <div class="modal-info-col">
                    <div class="modal-tag-row">
                        <span class="planet-type-badge">${planet.type}</span>
                        <span class="planet-distance-badge">Solar Index: ${planet.id} / 8</span>
                    </div>

                    <h1 class="modal-planet-title">${planet.name}</h1>
                    <p class="modal-planet-desc">${planet.description}</p>

                    <!-- Telemetry Metrics Grid -->
                    <h3 class="modal-section-title">📊 Planetary Physical Dossier</h3>
                    <div class="telemetry-spec-grid">
                        <div class="spec-cell">
                            <span class="spec-label">Mean Radius</span>
                            <span class="spec-value">${planet.radius}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label">Planetary Mass</span>
                            <span class="spec-value">${planet.mass}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label">Orbital Period (Year)</span>
                            <span class="spec-value">${planet.orbitalPeriod}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label">Day Length</span>
                            <span class="spec-value">${planet.dayLength}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label">Surface Gravity</span>
                            <span class="spec-value">${planet.gravity}</span>
                        </div>
                        <div class="spec-cell">
                            <span class="spec-label">Surface Temperature</span>
                            <span class="spec-value">${planet.surfaceTemp}</span>
                        </div>
                    </div>

                    <!-- Atmospheric Composition -->
                    <h3 class="modal-section-title">💨 Major Atmospheric Elements</h3>
                    <div class="atmosphere-list">
                        ${planet.atmosphere.map(gas => `<span class="gas-chip">${gas}</span>`).join('')}
                    </div>

                    <!-- Historic Exploration Missions -->
                    <h3 class="modal-section-title">🚀 Key Exploration Missions</h3>
                    <div class="atmosphere-list" style="margin-bottom: 0;">
                        ${planet.missions.map(m => `<span class="gas-chip" style="border-color: rgba(56, 189, 248, 0.3); color: #bae6fd;">🛰️ ${m}</span>`).join('')}
                    </div>

                    <!-- Interactive Weight Calculator -->
                    <div class="weight-calc-box">
                        <div class="weight-calc-title">⚖️ Interactive Gravitational Weight Calculator</div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">
                            Enter your Earth body weight below to calculate your effective weight under ${planet.name}'s surface gravity (${planet.gravityMultiplier}g):
                        </p>
                        <div class="weight-input-row">
                            <input type="number" id="weight-input" value="70" min="1" max="500">
                            <span style="font-size: 0.9rem; color: var(--text-secondary);">kg on Earth =</span>
                            <span class="calc-output-badge" id="weight-output">
                                ${(70 * planet.gravityMultiplier).toFixed(1)} kg on ${planet.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Wire live calculator input
        const weightInput = document.getElementById('weight-input');
        const weightOutput = document.getElementById('weight-output');
        weightInput.addEventListener('input', () => {
            const w = parseFloat(weightInput.value) || 0;
            const calc = (w * planet.gravityMultiplier).toFixed(1);
            weightOutput.textContent = `${calc} kg on ${planet.name}`;
        });

        planetModal.classList.remove('hidden');
    }

    function closeModal() {
        planetModal.classList.add('hidden');
        comparisonModal.classList.add('hidden');
        serverModal.classList.add('hidden');
    }

    modalCloseBtn.addEventListener('click', closeModal);
    comparisonCloseBtn.addEventListener('click', closeModal);
    serverCloseBtn.addEventListener('click', closeModal);

    [planetModal, comparisonModal, serverModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // =========================================================================
    // 7. Comparison Feature & Modal
    // =========================================================================
    function toggleCompare(planetId) {
        const idx = compareList.indexOf(planetId);
        if (idx >= 0) {
            compareList.splice(idx, 1);
        } else {
            if (compareList.length >= 2) {
                compareList.shift(); // Keep max 2
            }
            compareList.push(planetId);
        }

        updateCompareDock();
        applyFiltersAndRender();
    }

    function updateCompareDock() {
        if (compareList.length > 0) {
            compareDock.classList.remove('hidden');
            dockChips.innerHTML = compareList.map(id => {
                const p = allPlanets.find(item => item.id === id);
                return `<span class="dock-chip">${p ? p.name : id}</span>`;
            }).join('');
        } else {
            compareDock.classList.add('hidden');
        }
    }

    dockClearBtn.addEventListener('click', () => {
        compareList = [];
        updateCompareDock();
        applyFiltersAndRender();
    });

    dockLaunchBtn.addEventListener('click', () => {
        if (compareList.length === 1) {
            // Default second planet to Earth or Mars
            const other = allPlanets.find(p => p.id !== compareList[0]);
            if (other) compareList.push(other.id);
        }
        openComparisonModal(compareList[0], compareList[1]);
    });

    compareModalOpenBtn.addEventListener('click', () => {
        openComparisonModal(
            compareList[0] || (allPlanets[2] ? allPlanets[2].id : 3), // Earth
            compareList[1] || (allPlanets[3] ? allPlanets[3].id : 4)  // Mars
        );
    });

    function populateComparisonSelects() {
        const optionsHtml = allPlanets.map(p => `<option value="${p.id}">${p.name} (${p.type})</option>`).join('');
        compareSelect1.innerHTML = optionsHtml;
        compareSelect2.innerHTML = optionsHtml;

        compareSelect1.addEventListener('change', renderComparisonTable);
        compareSelect2.addEventListener('change', renderComparisonTable);
    }

    function openComparisonModal(id1, id2) {
        compareSelect1.value = id1;
        compareSelect2.value = id2;
        renderComparisonTable();
        comparisonModal.classList.remove('hidden');
    }

    function renderComparisonTable() {
        const id1 = parseInt(compareSelect1.value, 10);
        const id2 = parseInt(compareSelect2.value, 10);

        const p1 = allPlanets.find(p => p.id === id1) || allPlanets[0];
        const p2 = allPlanets.find(p => p.id === id2) || allPlanets[1];

        compareTableContainer.innerHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th style="color: ${p1.color}">${p1.name}</th>
                        <th>Property</th>
                        <th style="color: ${p2.color}">${p2.name}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><img src="${p1.image}" alt="${p1.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;"></td>
                        <td class="prop-name">Visual Aspect</td>
                        <td><img src="${p2.image}" alt="${p2.name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;"></td>
                    </tr>
                    <tr>
                        <td><strong>${p1.type}</strong></td>
                        <td class="prop-name">Classification</td>
                        <td><strong>${p2.type}</strong></td>
                    </tr>
                    <tr>
                        <td>${p1.distanceFromSun}</td>
                        <td class="prop-name">Distance from Sun</td>
                        <td>${p2.distanceFromSun}</td>
                    </tr>
                    <tr>
                        <td><strong>${p1.radius}</strong></td>
                        <td class="prop-name">Equatorial Radius</td>
                        <td><strong>${p2.radius}</strong></td>
                    </tr>
                    <tr>
                        <td>${p1.mass}</td>
                        <td class="prop-name">Planetary Mass</td>
                        <td>${p2.mass}</td>
                    </tr>
                    <tr>
                        <td>${p1.gravity}</td>
                        <td class="prop-name">Surface Gravity</td>
                        <td>${p2.gravity}</td>
                    </tr>
                    <tr>
                        <td><strong>${p1.moons}</strong></td>
                        <td class="prop-name">Confirmed Moons</td>
                        <td><strong>${p2.moons}</strong></td>
                    </tr>
                    <tr>
                        <td>${p1.orbitalPeriod}</td>
                        <td class="prop-name">Orbital Period (Year)</td>
                        <td>${p2.orbitalPeriod}</td>
                    </tr>
                    <tr>
                        <td>${p1.dayLength}</td>
                        <td class="prop-name">Rotational Day</td>
                        <td>${p2.dayLength}</td>
                    </tr>
                    <tr>
                        <td>${p1.surfaceTemp}</td>
                        <td class="prop-name">Surface Temp</td>
                        <td>${p2.surfaceTemp}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    // =========================================================================
    // 8. Server Telemetry Modal & Status Check
    // =========================================================================
    serverTelemetryBtn.addEventListener('click', async () => {
        serverModal.classList.remove('hidden');
        serverTelemetryContent.innerHTML = `<p style="grid-column: 1 / -1;">Querying Node.js backend...</p>`;

        try {
            const res = await fetch('/api/server-info');
            const data = await res.json();

            serverTelemetryContent.innerHTML = `
                <div class="telemetry-item">
                    <span class="spec-label">Backend Service</span>
                    <span class="spec-value" style="color: var(--accent-blue);">${data.service}</span>
                </div>
                <div class="telemetry-item">
                    <span class="spec-label">Node.js Runtime</span>
                    <span class="spec-value" style="color: var(--accent-emerald);">${data.nodeVersion}</span>
                </div>
                <div class="telemetry-item">
                    <span class="spec-label">Server Port</span>
                    <span class="spec-value">${data.port}</span>
                </div>
                <div class="telemetry-item">
                    <span class="spec-label">Operating Platform</span>
                    <span class="spec-value">${data.platform}</span>
                </div>
                <div class="telemetry-item">
                    <span class="spec-label">Static Root Directory</span>
                    <span class="spec-value">/${data.staticRoot}</span>
                </div>
                <div class="telemetry-item">
                    <span class="spec-label">Heap Memory Usage</span>
                    <span class="spec-value">${data.memoryUsageMB} MB</span>
                </div>
                <div class="telemetry-item" style="grid-column: 1 / -1;">
                    <span class="spec-label">Server Uptime</span>
                    <span class="spec-value">${data.uptimeSeconds} seconds online</span>
                </div>
            `;
        } catch (err) {
            serverTelemetryContent.innerHTML = `
                <p style="grid-column: 1 / -1; color: #ef4444;">
                    Server is serving static files, but failed to fetch JSON telemetry: ${err.message}
                </p>
            `;
        }
    });

    // =========================================================================
    // 9. Controls Event Listeners
    // =========================================================================
    // Filter Tabs
    filterTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
            filterTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.type;
            playBeep(450);
            applyFiltersAndRender();
        }
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.length > 0) {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
        applyFiltersAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.focus();
        applyFiltersAndRender();
    });

    // Sort Dropdown
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndRender();
    });

    // View Toggle
    viewGridBtn.addEventListener('click', () => {
        viewGridBtn.classList.add('active');
        viewOrbitBtn.classList.remove('active');
        planetsGrid.classList.remove('hidden');
        orbitalView.classList.add('hidden');
    });

    viewOrbitBtn.addEventListener('click', () => {
        viewOrbitBtn.classList.add('active');
        viewGridBtn.classList.remove('active');
        planetsGrid.classList.add('hidden');
        orbitalView.classList.remove('hidden');
    });

    // =========================================================================
    // 10. Initial Boot
    // =========================================================================
    fetchPlanets();
});
