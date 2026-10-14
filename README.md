# Practical Assignment 4: Backend Technologies
## Topic: Create a Node.JS Application Which Serves a Static Website

### 📌 Project Overview
**Cosmic Explorer** is an interactive, deep-space planetary archive built to demonstrate static web serving and REST API integration using **Node.js**.

---

### 🚀 Key Features

1. **High-Performance Static Serving**:
   - Serves HTML, modern CSS, client JavaScript, and high-resolution planetary photography directly from the `public/` directory.
   - Built with both **Express.js static middleware** (`server.js`) and a **pure native Node.js core server** (`native-server.js`) using built-in `http`, `fs`, `path`, and `url` modules.

2. **Offline Local Planetary Assets**:
   - All high-definition photographs from NASA missions are downloaded and stored locally in [`public/images/`](file:///c:/Users/LOQ/OneDrive/Desktop/sem%205/FSD/assignment%204/public/images) so the application functions 100% offline with zero broken image links.

3. **Modern Visual Aesthetics**:
   - **Dynamic Particle Starfield**: Native HTML5 Canvas rendering twinkling multi-magnitude stars, shooting stars, and mouse parallax.
   - **Glassmorphism UI**: Multi-layered backdrop blurs, luminous borders, and customized atmospheric color auras for each planet.
   - **3D Card Hover Interaction**: Dynamic perspective card tilt on hover.

4. **Dynamic REST API & Telemetry**:
   - `GET /api/planets`: Returns full planetary dossiers (distances in AU, temperatures, gravity, orbital periods, atmospheric composition).
   - `GET /api/server-info`: Reports real-time Node.js runtime information, heap memory usage, platform, and server uptime.

5. **Interactive Laboratory Features**:
   - **Planetary Telemetry Dossier Modal**: Comprehensive physical parameters, atmospheric breakdown, and exploration missions.
   - **Interactive Weight Calculator**: Real-time gravitational weight calculation based on user input (e.g. Earth weight $\times$ planet gravity factor).
   - **Planet Comparison Tool**: Side-by-side analysis of any two celestial bodies.
   - **Orbital Scale View**: Proportional distance map from the Sun.
   - **Ambient Audio Synthesizer**: Native HTML5 Web Audio API synthesizing a soothing cosmic soundscape without external audio files.

---

### 🏗️ Architecture & Directory Structure

```
assignment 4/
├── data/
│   └── planets.json          # Curated planetary dataset
├── public/                   # Static directory served by Node.js
│   ├── css/
│   │   └── style.css         # Glassmorphism styling & animations
│   ├── images/               # High-resolution local NASA photography
│   │   ├── mercury.jpg
│   │   ├── venus.jpg
│   │   ├── earth.jpg
│   │   ├── mars.jpg
│   │   ├── jupiter.jpg
│   │   ├── saturn.jpg
│   │   ├── uranus.jpg
│   │   └── neptune.jpg
│   ├── js/
│   │   └── app.js            # Canvas starfield, audio synth & UI logic
│   └── index.html            # Core semantic markup
├── native-server.js          # Core Node.js (Zero-dependency http/fs server)
├── server.js                 # Express static & REST API server
└── package.json              # NPM package configurations & scripts
```

---

### 💻 How to Run the Application

#### Option A: Running with Express (Default — Port 3000)
```powershell
cd "c:\Users\LOQ\OneDrive\Desktop\sem 5\FSD\assignment 4"
npm start
# or: node server.js
```
Open **`http://localhost:3000`** in your browser.

#### Option B: Running with Pure Built-in Node.js (Port 3001)
If your instructor requests a demonstration using only Node's native built-in modules without external libraries:
```powershell
cd "c:\Users\LOQ\OneDrive\Desktop\sem 5\FSD\assignment 4"
npm run start:native
# or: node native-server.js
```
Open **`http://localhost:3001`** in your browser.

---

### 📝 Viva & Evaluation Q&A

**Q1: How does Node.js serve static files?**
> In Express, `express.static()` middleware takes a directory path and automatically handles request URL matching, reading files from disk, setting appropriate `Content-Type` headers based on file extensions, and streaming file buffers to the response. In native Node.js, this is achieved using `http.createServer()`, `fs.createReadStream()`, and a MIME type map dictionary.

**Q2: What is MIME type and why is it needed?**
> The `Content-Type` header (e.g., `text/html`, `text/css`, `image/jpeg`, `application/javascript`) tells the browser how to interpret and render the transmitted binary data. Without proper MIME types, browsers may refuse to apply CSS or execute scripts.
