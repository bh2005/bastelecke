# Blueprint & AI Prompt: 3D Network Topology Map (NagVis / Checkmk NVDCT)

## 📌 Context & Objective
The goal is to generate a fully interactive, browser-based 3D visualization of network topologies using **Three.js**. The visual theme is "Deep Mining", representing network hierarchies or geographic locations as different depth levels ("Sohlen") within a 3D shaft. 

The application must parse topology data (specifically Checkmk NVDCT JSON format) and automatically plot nodes and connections in 3D space, overlaid with an HTML/CSS UI for monitoring.

## 🛠 Technical Stack
* **Structure:** Single-file or clean split (HTML, CSS, Vanilla JavaScript). No build tools (Webpack/Vite) required for the base demo.
* **3D Engine:** Three.js (loaded via CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`).
* **Styling:** Custom CSS, absolute positioning for UI overlays, flexbox for layout. Dark mode base (`#000` background, `#13d38e` neon green accents).
* **Environment:** Must be fully executable in CodePen, StackBlitz, or GitHub Pages.

## 🏗 Core Architecture & Features

### 1. The 3D World (Three.js WebGL)
* **Scene & Camera:** PerspectiveCamera with a dynamic orbit animation (`Math.sin`/`Math.cos` tied to `Date.now()`).
* **Lighting:** Ambient light mixed with a PointLight (colored `#13d38e`) to give the scene a glowing, high-tech vibe.
* **Structure (The Shaft):** * A central transparent cylinder represents the vertical data shaft.
    * Horizontal transparent circles (`MeshBasicMaterial` with `opacity: 0.05`) represent the physical layers (e.g., Y-coordinates at 10, 0, -10).

### 2. Auto-Layout & Data Parsing (Checkmk NVDCT)
* **Input Data:** JSON object containing `objects` (nodes) and `connections` (links/edges).
* **Node Distribution:** Hosts are distributed procedurally (e.g., using a 3D spiral algorithm or golden ratio) across the predefined Y-levels. 
* **Mapping:** The logic must store the calculated `THREE.Vector3` positions by their corresponding NVDCT Node-ID to accurately draw connections later.
* **Visual Nodes:** Nodes are rendered as glowing cubes (`MeshStandardMaterial` with `emissive` properties).

### 3. Data Flow Simulation (The "Sparks")
* **Cables:** `THREE.Line` connects the nodes based on the NVDCT `connections` array.
* **Traffic:** Small spheres ("sparks") travel along these lines using `lerpVectors()`. 
* **Color Mapping:** The spark color dynamically adapts to the `line_config.color` provided by the NVDCT JSON (e.g., green for OK, red for Alert).

### 4. HTML/CSS UI Overlay (HUD)
The `canvas` is positioned absolutely at `z-index: 1`. The UI sits above it (`z-index: 10+`).
* **Header:** Branding and status tags.
* **Controls:** Slider to manipulate the global `flowSpeed` of the 3D sparks. Buttons to change camera coordinates (Zoom to Surface vs. Zoom to Depth).
* **Live Event Log:** A floating, semi-transparent div that dynamically prepends timestamped status messages.
* **Alarm Panel:** A blinking CSS-animated box that highlights critical NVDCT connections.

## 🤖 Prompting Instructions for LLMs
*If modifying or expanding this code via an AI assistant, append these rules:*
1.  **Maintain Scope:** Ensure variables are scoped properly (e.g., using a DOMContentLoaded event listener or an IIFE) to avoid redeclaration errors in sandbox environments.
2.  **Failsafe Loading:** Always include a `typeof THREE === 'undefined'` check with a visual error message in the HTML if the CDN fails to load.
3.  **Responsive Design:** Always include a `window.addEventListener('resize')` function to update the camera aspect ratio and renderer size.
4.  **No Placeholders:** Provide complete, runnable code blocks. Do not use `// ... rest of code`. Include mock NVDCT JSON data for immediate testing.