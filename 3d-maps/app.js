/**
 * NVDCT DATA STRUCTURE
 * floor: Index der Ebene
 * x / z: Position auf dem Grundriss
 */
const nvdctData = {
    nodes: [
        { id: "core_01", type: "switch", floor: 0, x: 0, z: 0, label: "CENTRAL_SERVER_HUB", status: "ok" },
        { id: "dist_01", type: "switch", floor: 1, x: -25, z: 10, label: "DIST_LEVEL_1_A", status: "ok" },
        { id: "dist_02", type: "switch", floor: 1, x: 25, z: -15, label: "DIST_LEVEL_1_B", status: "ok" },
        { id: "ap_01", type: "ap", floor: 2, x: -35, z: -30, label: "AP_NORTH_01", status: "ok" },
        { id: "ap_02", type: "ap", floor: 2, x: 35, z: 20, label: "AP_SOUTH_CORRIDOR", status: "alert" }
    ],
    links: [
        { source: "core_01", target: "dist_01", status: "ok" },
        { source: "core_01", target: "dist_02", status: "ok" },
        { source: "dist_01", target: "ap_01", status: "ok" },
        { source: "dist_02", target: "ap_02", status: "alert" }
    ]
};

class Network3D {
    constructor() {
        this.mode = 'mine'; // 'mine' oder 'building'
        this.is2D = false;
        this.floorHeight = 35;
        this.nodePositions = {};
        this.sparks = [];
        this.alertLinks = [];
        this.targetCamPos = null;
        this.oldCamPos = null;

        this.initEngine();
        this.setupUI();
        this.buildScene();
        this.animate();
    }

    initEngine() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.camera.position.set(110, 90, 110);

        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        const sun = new THREE.DirectionalLight(0x13d38e, 0.8);
        sun.position.set(50, 100, 50);
        this.scene.add(ambient, sun);
    }

    /**
     * Erzeugt einen prozeduralen Raumplan als Textur
     */
    generateFloorTexture(index) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 15, 5, 0.9)';
        ctx.fillRect(0, 0, 512, 512);

        // Raster
        ctx.strokeStyle = 'rgba(19, 211, 142, 0.15)';
        for(let i=0; i<512; i+=32) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
        }

        // Wände
        ctx.strokeStyle = '#13d38e'; ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, 432, 432);
        ctx.beginPath();
        if(index % 2 === 0) {
            ctx.moveTo(40, 256); ctx.lineTo(472, 256);
            ctx.moveTo(256, 40); ctx.lineTo(256, 180);
        } else {
            ctx.rect(100, 100, 120, 120);
            ctx.rect(292, 292, 120, 120);
        }
        ctx.stroke();

        ctx.fillStyle = '#13d38e';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`L_DATA_PLAN: 0x0${index}`, 60, 30);

        return new THREE.CanvasTexture(canvas);
    }

    createFloorPlate(y, index) {
        const group = new THREE.Group();
        group.name = `floor_${index}`;

        const floorMat = new THREE.MeshPhongMaterial({ 
            map: this.generateFloorTexture(index),
            transparent: true, opacity: 0.85, side: THREE.DoubleSide 
        });

        const plate = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), floorMat);
        plate.rotation.x = -Math.PI / 2;
        
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.PlaneGeometry(130, 130)),
            new THREE.LineBasicMaterial({ color: 0x13d38e })
        );
        edges.rotation.x = -Math.PI / 2;

        group.add(plate, edges);
        group.position.y = y;
        this.scene.add(group);
    }

    createNodeMesh(node) {
        const group = new THREE.Group();
        const isSW = node.type === 'switch';
        const geo = isSW ? new THREE.BoxGeometry(6, 1.2, 4) : new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16);
        const mat = new THREE.MeshStandardMaterial({ 
            color: node.status === 'alert' ? 0x660000 : 0x222222,
            emissive: node.status === 'alert' ? 0xff0000 : 0x13d38e,
            emissiveIntensity: 0.4
        });
        group.add(new THREE.Mesh(geo, mat));
        group.userData = node;
        return group;
    }

    buildScene() {
        this.scene.children = this.scene.children.filter(c => c.type.includes('Light'));
        this.nodePositions = {}; this.sparks = []; this.alertLinks = [];

        const yDir = this.mode === 'mine' ? -1 : 1;

        nvdctData.nodes.forEach((node) => {
            const floorY = node.floor * this.floorHeight * yDir;
            if (!this.scene.getObjectByName(`floor_${node.floor}`)) {
                this.createFloorPlate(floorY, node.floor);
            }
            const pos = new THREE.Vector3(node.x, floorY, node.z);
            const mesh = this.createNodeMesh(node);
            mesh.position.copy(pos);
            this.scene.add(mesh);
            this.nodePositions[node.id] = pos;
        });

        nvdctData.links.forEach(link => {
            const start = this.nodePositions[link.source], end = this.nodePositions[link.target];
            if(!start || !end) return;

            const isAlert = link.status === 'alert';
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([start, end]),
                new THREE.LineBasicMaterial({ color: isAlert ? 0xff3200 : 0x13d38e, transparent: true, opacity: 0.4 })
            );
            this.scene.add(line);
            if(isAlert) this.alertLinks.push(line);

            const spark = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color: isAlert ? 0xff3200 : 0x00ffff }));
            this.scene.add(spark);
            this.sparks.push({ mesh: spark, start, end, prog: Math.random() });
        });
    }

    setupUI() {
        document.getElementById('view-mode').onchange = (e) => {
            this.mode = e.target.value;
            this.buildScene();
        };

        // ESC Key zum Schließen
        window.addEventListener('keydown', (e) => {
            if (e.key === "Escape") this.closeInspector();
        });

        window.onclick = (e) => {
            const mouse = new THREE.Vector2((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1);
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, this.camera);
            const hits = ray.intersectObjects(this.scene.children, true);
            if(hits.length > 0) {
                let o = hits[0].object;
                while(o.parent && !o.userData.id) o = o.parent;
                if(o.userData.id) this.openInspector(o.userData);
            }
        };

        document.getElementById('close-inspector').onclick = () => this.closeInspector();
    }

    toggle2D(targetFloor) {
        if (!this.is2D) {
            // 1. Kamera-Backup und Ziel setzen
            this.oldCamPos = this.camera.position.clone();
            const floorY = targetFloor * this.floorHeight * (this.mode === 'mine' ? -1 : 1);
            
            this.targetCamPos = new THREE.Vector3(0, floorY + 90, 0.1);
            this.controls.target.set(0, floorY, 0);
            this.controls.enableRotate = false;
            this.is2D = true;

            // 2. FILTER: Nur die aktuelle Etage und deren Nodes anzeigen
            this.scene.children.forEach(obj => {
                // Prüfe Nodes, Links und Floor-Plates
                if (obj.userData && obj.userData.floor !== undefined) {
                    obj.visible = (obj.userData.floor === targetFloor);
                }
                // Floor-Plates heißen bei uns "floor_X"
                if (obj.name && obj.name.startsWith('floor_')) {
                    obj.visible = (obj.name === `floor_${targetFloor}`);
                }
                // Links und Sparks (optional: ganz ausblenden in 2D für mehr Klarheit)
                if (obj.type === 'Line' || (obj.geometry && obj.geometry.type === 'SphereGeometry')) {
                    obj.visible = false; 
                }
            });

            this.logMsg(`2D-Focus: Level ${targetFloor} (Others Hidden)`);
        } else {
            // ZURÜCK ZU 3D: Alles wieder einblenden
            this.targetCamPos = this.oldCamPos || new THREE.Vector3(110, 90, 110);
            this.controls.enableRotate = true;
            this.is2D = false;

            this.scene.children.forEach(obj => {
                obj.visible = true;
            });

            this.logMsg("3D-Global: All Layers Visible");
        }
        this.openInspector(this.activeNode); 
    }

    openInspector(data) {
        this.activeNode = data;
        const ins = document.getElementById('inspector');
        document.getElementById('ins-label').innerText = data.label;
        document.getElementById('ins-id').innerText = `NODE_ID: ${data.id}`;
        
        // Chart Generierung (CSS Bars)
        let chartHTML = '<div style="display:flex; align-items:flex-end; height:40px; gap:2px; margin-top:10px; border-bottom:1px solid #333;">';
        for(let i=0; i<24; i++) {
            const val = Math.random() * 100;
            const color = val > 80 ? 'var(--alert)' : 'var(--neon)';
            chartHTML += `<div style="flex:1; background:${color}; height:${val}%; opacity:0.6;"></div>`;
        }
        chartHTML += '</div><div style="display:flex; justify-content:space-between; font-size:9px; color:#555;"><span>24h ago</span><span>Now</span></div>';

        document.getElementById('ins-content').innerHTML = `
            <div class="metric-row"><span>STATUS</span><b style="color:${data.status==='alert'?'var(--alert)':'lime'}">${data.status.toUpperCase()}</b></div>
            <div class="metric-row"><span>LATENCY (AVG)</span><b>${Math.floor(Math.random()*15 + 5)}ms</b></div>
            <div style="margin-top:20px; font-size:11px; color:#888;">LATENCY_HISTORY_24H:</div>
            ${chartHTML}
            <button id="floorplan-btn" style="width:100%; margin-top:25px; padding:10px; background:#111; color:var(--neon); border:1px solid var(--neon); cursor:pointer;">
                ${this.is2D ? 'RETURN_TO_3D' : 'OPEN_ROOMPLAN_2D'}
            </button>
        `;
        
        document.getElementById('floorplan-btn').onclick = () => this.toggle2D(this.nodePositions[data.id].y);
        ins.classList.add('open');
    }

    closeInspector() {
        if(this.is2D) this.toggle2D();
        document.getElementById('inspector').classList.remove('open');
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const time = Date.now() * 0.001;

        if(this.targetCamPos) {
            this.camera.position.lerp(this.targetCamPos, 0.06);
            if(this.camera.position.distanceTo(this.targetCamPos) < 0.1) this.targetCamPos = null;
        }

        this.alertLinks.forEach(l => l.material.opacity = 0.2 + Math.abs(Math.sin(time*5))*0.8);
        this.sparks.forEach(s => {
            s.prog += 0.006;
            if(s.prog > 1) s.prog = 0;
            s.mesh.position.lerpVectors(s.start, s.end, s.prog);
        });

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

const app = new Network3D();