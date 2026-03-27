import * as THREE        from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer,
         CSS2DObject }   from 'three/addons/renderers/CSS2DRenderer.js';

// ─────────────────────────────────────────────────────────────
//  STATUS CONFIG
// ─────────────────────────────────────────────────────────────
const SC = {
  ok:       { hex:0x27ae60, emissive:0x1a7a40, badge:'s-ok',   cls:'ok',   label:'OK'       },
  warning:  { hex:0xe67e22, emissive:0xa05510, badge:'s-warn',  cls:'warn', label:'WARNING'  },
  critical: { hex:0xe74c3c, emissive:0xb02020, badge:'s-crit',  cls:'crit', label:'CRITICAL' },
  down:     { hex:0xc0392b, emissive:0x801010, badge:'s-down',  cls:'down', label:'DOWN'     },
  unknown:  { hex:0x7f8c8d, emissive:0x4a5455, badge:'s-unkn',  cls:'unkn', label:'UNKNOWN'  },
};
const S  = (s) => SC[s] ?? SC.unknown;
const al = (s) => s === 'critical' || s === 'down';

// ─────────────────────────────────────────────────────────────
//  VIEW MODES
// ─────────────────────────────────────────────────────────────
const MODES = {
  mine: {
    floors: [
      { y:  45, label:'ÜBERTAGE',         sub:'Oberfläche',           accent:[19,211,142]  },
      { y:  15, label:'SOHLE 1',           sub:'−300 m',               accent:[0,180,220]   },
      { y: -15, label:'SOHLE 2',           sub:'−600 m',               accent:[60,110,210]  },
      { y: -45, label:'SOHLE 3',           sub:'−900 m',               accent:[110,55,190]  },
    ]
  },
  building: {
    floors: [
      { y: -45, label:'UNTERGESCHOSS',    sub:'Technik / Lager',      accent:[130,140,160] },
      { y: -15, label:'ERDGESCHOSS',      sub:'Empfang / Server-EG',  accent:[80,175,100]  },
      { y:  15, label:'1. OBERGESCHOSS',  sub:'Bürofläche',           accent:[70,140,220]  },
      { y:  45, label:'2. OBERGESCHOSS',  sub:'Rechenzentrum',        accent:[20,165,175]  },
    ]
  }
};

// ─────────────────────────────────────────────────────────────
//  MOCK DATA  (replace with real WS feed later)
// ─────────────────────────────────────────────────────────────
const MAP_DATA = {
  nodes: [
    { id:'core-sw-01',  label:'CORE-SW-01',      type:'switch', status:'ok',       x:  0, y: 45, z:  0 },
    { id:'dist-sw-01',  label:'DIST-SW-ALPHA',    type:'switch', status:'ok',       x:-28, y: 15, z: -8 },
    { id:'dist-sw-02',  label:'DIST-SW-BETA',     type:'switch', status:'warning',  x: 28, y: 15, z: -8 },
    { id:'dist-sw-03',  label:'DIST-SW-GAMMA',    type:'switch', status:'ok',       x:  0, y: 15, z: 28 },
    { id:'web-01',      label:'web-server-01',    type:'host',   status:'ok',       x:-35, y:-15, z:-20 },
    { id:'web-02',      label:'web-server-02',    type:'host',   status:'critical', x:-15, y:-15, z:-28 },
    { id:'db-primary',  label:'db-primary',       type:'host',   status:'ok',       x: 15, y:-15, z:-28 },
    { id:'db-replica',  label:'db-replica',       type:'host',   status:'warning',  x: 35, y:-15, z:-20 },
    { id:'mon-01',      label:'monitoring-01',    type:'host',   status:'ok',       x: -8, y:-45, z: 30 },
    { id:'fw-01',       label:'firewall-01',      type:'host',   status:'down',     x: 12, y:-45, z: 36 },
    { id:'backup-01',   label:'backup-srv-01',    type:'host',   status:'ok',       x:-30, y:-45, z:  5 },
    { id:'ldap-01',     label:'ldap-server',      type:'host',   status:'unknown',  x: 28, y:-45, z:  8 },
  ],
  links: [
    { source:'core-sw-01', target:'dist-sw-01', status:'ok'       },
    { source:'core-sw-01', target:'dist-sw-02', status:'warning'  },
    { source:'core-sw-01', target:'dist-sw-03', status:'ok'       },
    { source:'dist-sw-01', target:'web-01',     status:'ok'       },
    { source:'dist-sw-01', target:'web-02',     status:'critical' },
    { source:'dist-sw-02', target:'db-primary', status:'ok'       },
    { source:'dist-sw-02', target:'db-replica', status:'warning'  },
    { source:'dist-sw-03', target:'mon-01',     status:'ok'       },
    { source:'dist-sw-03', target:'fw-01',      status:'down'     },
    { source:'dist-sw-01', target:'backup-01',  status:'ok'       },
    { source:'dist-sw-02', target:'ldap-01',    status:'unknown'  },
  ]
};

// ─────────────────────────────────────────────────────────────
//  NV2Map3D
// ─────────────────────────────────────────────────────────────
class NV2Map3D {
  constructor(data) {
    this.data          = data;
    this.nodeObjects   = {};   // id → Group
    this.nodePositions = {};   // id → Vector3
    this.linkObjects   = [];   // { line, spark, srcY, tgtY }
    this.alertObjs     = [];
    this.autoOrbit     = true;
    this.flowSpeed     = 0.4;
    this.mode          = 'mine';
    this._activeNode   = null;
    this._floorObjs    = [];   // removed on mode rebuild
    this._floorPlates  = {};   // y → MeshBasicMaterial (for opacity control)
    this._bgMeshes     = {};   // y → THREE.Mesh (uploaded image)
    this._bgMats       = {};   // y → MeshBasicMaterial
    this._mode2D       = false;
    this._floor2DY     = null;

    this._initScene();
    this._initLabels();
    this._buildNodes();
    this._buildLinks();
    this._buildFloors();
    this._buildFloorNav();
    this._setupUI();
    this._animate();
    this._log('Scene ready · ' + data.nodes.length + ' nodes');
  }

  // ── Scene ──────────────────────────────────────────────────

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080a0e, 0.004);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(innerWidth, innerHeight);
    document.getElementById('canvas-wrap').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 700);
    this.camera.position.set(95, 55, 95);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(60, 100, 40);
    this.scene.add(sun);
    this._accentLight = new THREE.PointLight(0x3060aa, 1.8, 160);
    this._accentLight.position.set(0, 55, 0);
    this.scene.add(this._accentLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance   = 10;
    this.controls.maxDistance   = 500;

    // Any drag stops auto-orbit
    this.renderer.domElement.addEventListener('pointerdown', () => {
      if (this.autoOrbit) this._setAutoOrbit(false);
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
      this.labelRenderer.setSize(innerWidth, innerHeight);
    });
  }

  _initLabels() {
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(innerWidth, innerHeight);
    Object.assign(this.labelRenderer.domElement.style, {
      position:'absolute', top:'0', left:'0', pointerEvents:'none', zIndex:'2'
    });
    document.getElementById('canvas-wrap').appendChild(this.labelRenderer.domElement);
  }

  // ── Floor texture ──────────────────────────────────────────

  _genFloorTexture(fc, idx) {
    const sz = 512, cv = document.createElement('canvas');
    cv.width = cv.height = sz;
    const ctx = cv.getContext('2d');
    const [r,g,b] = fc.accent;
    const ac = (a) => `rgba(${r},${g},${b},${a})`;

    ctx.fillStyle = '#030608';
    ctx.fillRect(0, 0, sz, sz);

    // Dot grid
    ctx.fillStyle = ac(0.13);
    for (let i = 32; i < sz; i += 32)
      for (let j = 32; j < sz; j += 32)
        ctx.fillRect(i-1, j-1, 2, 2);

    // Outer frame
    ctx.strokeStyle = ac(0.45); ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, sz-36, sz-36);

    // Corner marks
    ctx.lineWidth = 1; ctx.strokeStyle = ac(0.7);
    [[18,18,1,1],[494,18,-1,1],[18,494,1,-1],[494,494,-1,-1]].forEach(([cx,cy,sx,sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx+sx*24, cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+sy*24); ctx.stroke();
    });

    // Room plans (vary per floor)
    const plans = [
      [[60,60,200,160],[295,60,155,155],[60,260,390,160]],
      [[60,60,390,110],[60,210,175,205],[270,210,180,205]],
      [[60,60,135,135],[235,60,215,135],[60,240,390,210]],
      [[145,145,222,222]],
    ];
    ctx.strokeStyle = ac(0.22); ctx.lineWidth = 1.5;
    plans[idx % plans.length].forEach(([x,y,w,h]) => ctx.strokeRect(x,y,w,h));

    // Level dots
    for (let i = 0; i <= idx; i++) {
      ctx.beginPath(); ctx.fillStyle = ac(0.65);
      ctx.arc(38+i*16, 487, 4, 0, Math.PI*2); ctx.fill();
    }

    // Watermark
    ctx.fillStyle = ac(0.055); ctx.font = 'bold 66px monospace'; ctx.textAlign = 'center';
    ctx.fillText(fc.label, sz/2, 295);
    ctx.fillStyle = ac(0.04); ctx.font = 'italic 20px monospace';
    ctx.fillText(fc.sub, sz/2, 330);

    // Header text
    ctx.fillStyle = ac(0.68); ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
    ctx.fillText(fc.label, 32, 43);
    ctx.fillStyle = ac(0.35); ctx.font = '11px monospace';
    ctx.fillText(fc.sub, 32, 60);

    return new THREE.CanvasTexture(cv);
  }

  // ── Build floors ───────────────────────────────────────────

  _buildFloors() {
    this._floorObjs.forEach(o => this.scene.remove(o));
    this._floorObjs = [];
    this._floorPlates = {};

    MODES[this.mode].floors.forEach((fc, idx) => {
      const tex = this._genFloorTexture(fc, idx);

      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.72, side: THREE.DoubleSide
      });
      this._floorPlates[fc.y] = mat;

      const plate = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), mat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = fc.y - 0.05;
      plate.userData.floorY = fc.y;
      this.scene.add(plate);
      this._floorObjs.push(plate);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(110, 110)),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(...fc.accent.map(v => v/255)),
          transparent: true, opacity: 0.25
        })
      );
      edges.rotation.x = -Math.PI / 2;
      edges.position.y = fc.y;
      edges.userData.floorY = fc.y;
      this.scene.add(edges);
      this._floorObjs.push(edges);

      // CSS2D label
      const div = document.createElement('div');
      div.className = 'node-label';
      div.style.cssText = `color:rgba(${fc.accent.join(',')},0.6);border-color:rgba(${fc.accent.join(',')},0.2);font-size:9px;letter-spacing:1.5px`;
      div.textContent = fc.label;
      const lbl = new CSS2DObject(div);
      lbl.position.set(-58, fc.y+0.5, 0);
      lbl.userData.floorY = fc.y;
      this.scene.add(lbl);
      this._floorObjs.push(lbl);
    });
  }

  // ── Floor nav panel ────────────────────────────────────────

  _buildFloorNav() {
    const panel = document.getElementById('floor-panel');
    panel.innerHTML = '';
    const sorted = [...MODES[this.mode].floors].sort((a,b) => b.y - a.y);

    sorted.forEach(fc => {
      const [r,g,b] = fc.accent;
      const row = document.createElement('div');
      row.className = 'floor-row';
      row.id = `floor-row-${fc.y}`;

      const btn = document.createElement('button');
      btn.className = 'floor-btn';
      btn.innerHTML = `${fc.label} <span class="fb-dot" style="background:rgba(${r},${g},${b},.7);box-shadow:0 0 5px rgba(${r},${g},${b},.5)"></span>`;
      btn.title = fc.sub;
      btn.onclick = () => this.flyToFloor(fc.y);

      const btn2d = document.createElement('button');
      btn2d.className = 'floor-2d-btn';
      btn2d.id = `btn2d-${fc.y}`;
      btn2d.textContent = '2D';
      btn2d.title = '2D-Ansicht dieser Ebene';
      btn2d.onclick = () => {
        if (this._mode2D && this._floor2DY === fc.y) this.exit2D();
        else this.enter2D(fc.y);
      };

      row.appendChild(btn);
      row.appendChild(btn2d);
      panel.appendChild(row);
    });
  }

  // ── 2D Mode ────────────────────────────────────────────────

  enter2D(floorY) {
    this._mode2D   = true;
    this._floor2DY = floorY;
    this._setAutoOrbit(false);

    const fc = MODES[this.mode].floors.find(f => f.y === floorY);
    const floorLabel = fc?.label ?? `Y=${floorY}`;

    // Camera: directly above, looking down
    this.controls.target.set(0, floorY, 0);
    this.camera.position.set(0, floorY + 85, 0.01);
    // Lock to top-down: allow only pan + zoom
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = 0.001;
    this.controls.enableRotate  = false;
    this.controls.update();

    this._applyFloorVisibility(floorY);

    if (this._floorPlates[floorY]) {
      this._floorPlates[floorY].opacity = parseFloat(document.getElementById('floor-opacity').value) / 100;
    }

    document.getElementById('view-badge').classList.add('active');
    document.getElementById('vb-floor-name').textContent = floorLabel;
    document.getElementById('panel-2d').classList.add('visible');
    document.getElementById('ctrl-hint').textContent = '🖱 Schieben: Rechte Taste / Mitteltaste · Rad: Zoom';
    document.getElementById('ctrl-hint').classList.remove('hidden');

    document.querySelectorAll('.floor-2d-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(`btn2d-${floorY}`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('is-2d'));
    const frow = document.getElementById(`floor-row-${floorY}`);
    if (frow) frow.querySelector('.floor-btn')?.classList.add('is-2d');

    this._log(`2D · ${floorLabel}`);
  }

  exit2D() {
    this._mode2D   = false;
    this._floor2DY = null;

    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.enableRotate  = true;

    this._showAll();
    Object.values(this._floorPlates).forEach(m => m.opacity = 0.72);

    document.getElementById('view-badge').classList.remove('active');
    document.getElementById('panel-2d').classList.remove('visible');
    document.getElementById('ctrl-hint').textContent = '🖱 Drehen · Rechte Taste: Schieben · Rad: Zoom';
    document.getElementById('ctrl-hint').classList.remove('hidden');
    setTimeout(() => document.getElementById('ctrl-hint').classList.add('hidden'), 3000);

    document.querySelectorAll('.floor-2d-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('is-2d'));

    this._log('← 3D');
  }

  _applyFloorVisibility(activeY) {
    this._floorObjs.forEach(obj => {
      obj.visible = obj.userData.floorY === activeY;
    });
    Object.values(this.nodeObjects).forEach(group => {
      group.visible = Math.abs(group.position.y - activeY) < 5;
    });
    this.linkObjects.forEach(({ line, spark, srcY, tgtY }) => {
      const show = Math.abs(srcY - activeY) < 5 && Math.abs(tgtY - activeY) < 5;
      line.visible  = show;
      spark.visible = show;
    });
    Object.entries(this._bgMeshes).forEach(([y, mesh]) => {
      mesh.visible = parseInt(y) === activeY;
    });
  }

  _showAll() {
    this._floorObjs.forEach(o => o.visible = true);
    Object.values(this.nodeObjects).forEach(g => g.visible = true);
    this.linkObjects.forEach(({ line, spark }) => {
      line.visible = true; spark.visible = true;
    });
    // Background images only visible in 2D mode
    Object.values(this._bgMeshes).forEach(m => m.visible = false);
  }

  // ── Background image per floor ─────────────────────────────

  _onBgFileSelected(file) {
    if (!file || !this._mode2D) return;
    const y = this._floor2DY;
    const url = URL.createObjectURL(file);

    if (this._bgMeshes[y]) { this.scene.remove(this._bgMeshes[y]); }

    new THREE.TextureLoader().load(url, (tex) => {
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true,
        opacity: parseFloat(document.getElementById('bg-opacity').value) / 100,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y - 0.08;
      this.scene.add(mesh);
      this._bgMeshes[y] = mesh;
      this._bgMats[y]   = mat;

      document.getElementById('bg-img-name').textContent = file.name;
      this._log(`Grundriss geladen: ${file.name}`);
    });
  }

  setBgOpacity(val) {
    if (this._floor2DY !== null && this._bgMats[this._floor2DY]) {
      this._bgMats[this._floor2DY].opacity = val;
    }
  }

  setFloorOpacity(val) {
    if (this._floor2DY !== null && this._floorPlates[this._floor2DY]) {
      this._floorPlates[this._floor2DY].opacity = val;
    }
  }

  // ── Nodes ──────────────────────────────────────────────────

  _buildNodes() {
    this.data.nodes.forEach(node => {
      const pos   = new THREE.Vector3(node.x, node.y, node.z);
      const group = this._createNodeMesh(node);
      group.position.copy(pos);
      this.scene.add(group);
      this.nodeObjects[node.id]   = group;
      this.nodePositions[node.id] = pos;
    });
  }

  _createNodeMesh(node) {
    const cfg = S(node.status), group = new THREE.Group();
    group.userData = { ...node };
    const geo = node.type === 'switch'
      ? new THREE.BoxGeometry(5, 0.9, 3)
      : new THREE.SphereGeometry(2.3, 18, 14);
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.hex, emissive: cfg.emissive,
      emissiveIntensity: al(node.status) ? 0.55 : 0.2,
      roughness: 0.45, metalness: 0.55,
    });
    group.add(new THREE.Mesh(geo, mat));
    if (al(node.status) || node.status === 'warning') {
      group.add(Object.assign(new THREE.PointLight(cfg.hex, 0.9, 22), {}));
    }
    if (al(node.status)) this.alertObjs.push(group.children[0]);

    const div = document.createElement('div');
    div.className = 'node-label';
    div.textContent = node.label;
    const lbl = new CSS2DObject(div);
    lbl.position.set(0, node.type === 'switch' ? 2.2 : 3.8, 0);
    group.add(lbl);
    return group;
  }

  // ── Links ──────────────────────────────────────────────────

  _buildLinks() {
    this.data.links.forEach(link => {
      const start = this.nodePositions[link.source];
      const end   = this.nodePositions[link.target];
      if (!start || !end) return;
      const cfg = S(link.status), isAl = al(link.status);
      const op  = isAl ? 0.75 : link.status === 'warning' ? 0.38 : 0.18;

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([start, end]),
        new THREE.LineBasicMaterial({ color: cfg.hex, transparent: true, opacity: op })
      );
      this.scene.add(line);
      if (isAl) this.alertObjs.push(line);

      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 8, 6),
        new THREE.MeshBasicMaterial({ color: cfg.hex })
      );
      this.scene.add(spark);

      const srcNode = this.data.nodes.find(n => n.id === link.source);
      const tgtNode = this.data.nodes.find(n => n.id === link.target);
      this.linkObjects.push({
        line, spark,
        start: start.clone(), end: end.clone(),
        prog: Math.random(),
        srcY: srcNode?.y ?? 0,
        tgtY: tgtNode?.y ?? 0
      });
    });
  }

  // ── Mode switch ────────────────────────────────────────────

  setMode(mode) {
    if (this.mode === mode) return;
    if (this._mode2D) this.exit2D();
    this.mode = mode;
    this._buildFloors();
    this._buildFloorNav();
    document.getElementById('btn-mine').classList.toggle('mode-active', mode === 'mine');
    document.getElementById('btn-building').classList.toggle('mode-active', mode === 'building');
    this._log(`Mode: ${mode === 'mine' ? '⛏ Schacht' : '🏢 Hochhaus'}`);
  }

  // ── Camera helpers ─────────────────────────────────────────

  flyToFloor(y) {
    if (this._mode2D) this.exit2D();
    this._setAutoOrbit(false);
    const t = Date.now() * 0.001;
    this.camera.position.set(Math.sin(t)*80, y+45, Math.cos(t)*80);
    this.controls.target.set(0, y, 0);
    this.controls.update();
    this._log(`Fly → Y=${y}`);
  }

  focusActive() {
    if (!this._activeNode) return;
    const pos = this.nodePositions[this._activeNode.id];
    if (!pos) return;
    this._setAutoOrbit(false);
    this.camera.position.set(pos.x+22, pos.y+16, pos.z+22);
    this.controls.target.copy(pos);
    this.controls.update();
  }

  resetCam() {
    if (this._mode2D) this.exit2D();
    this._setAutoOrbit(true);
    this.camera.position.set(95, 55, 95);
    this.controls.target.set(0, 0, 0);
  }

  zoom(dir) {
    this._setAutoOrbit(false);
    const v = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.addScaledVector(v, dir * -12);
    this.controls.update();
  }

  toggleOrbit() { this._setAutoOrbit(!this.autoOrbit); }

  _setAutoOrbit(on) {
    this.autoOrbit = on;
    document.getElementById('btn-orbit').classList.toggle('active', on);
  }

  // ── Live update / WS ───────────────────────────────────────

  updateNodeStatus(hosts) {
    hosts.forEach(h => {
      const group = this.nodeObjects[h.id];
      if (!group) return;
      const mesh = group.children[0];
      if (!mesh?.isMesh) return;
      const cfg = S(h.status);
      mesh.material.color.set(cfg.hex);
      mesh.material.emissive.set(cfg.emissive);
      mesh.material.emissiveIntensity = al(h.status) ? 0.55 : 0.2;
      group.userData.status = h.status;
      if (this._activeNode?.id === h.id) {
        this._activeNode.status = h.status;
        this.openInspector(this._activeNode);
      }
    });
    this._log(`Status update · ${hosts.length} host(s)`);
  }

  connectWS(url) {
    this._log(`Connecting → ${url}`);
    const ws = new WebSocket(url);
    ws.onopen    = () => this._log('WS connected');
    ws.onclose   = () => this._log('WS disconnected');
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'status_update' && msg.hosts) this.updateNodeStatus(msg.hosts);
      } catch {}
    };
    this.ws = ws;
  }

  // ── Inspector ──────────────────────────────────────────────

  openInspector(data) {
    this._activeNode = data;
    const cfg = S(data.status);
    const badge = document.getElementById('ins-badge');
    badge.className   = `s-badge ${cfg.badge}`;
    badge.textContent = cfg.label;
    document.getElementById('ins-name').textContent = data.label;
    document.getElementById('ins-id').textContent   = `id: ${data.id}`;
    document.getElementById('ins-body').innerHTML = `
      <div class="m-row"><span>Status</span>    <b class="${cfg.cls}">${cfg.label}</b></div>
      <div class="m-row"><span>Typ</span>        <b>${data.type}</b></div>
      <div class="m-row"><span>X / Y / Z</span> <b>${data.x} / ${data.y} / ${data.z}</b></div>
    `;
    document.getElementById('inspector').classList.add('open');
    this._log(`Selected: ${data.label} [${cfg.label}]`);
  }

  closeInspector() {
    document.getElementById('inspector').classList.remove('open');
    this._activeNode = null;
  }

  // ── UI wiring ──────────────────────────────────────────────

  _setupUI() {
    window.addEventListener('click', (e) => {
      if (e.target.closest('#inspector') || e.target.closest('.hud') ||
          e.target.closest('#floor-panel') || e.target.closest('#zoom-ctrl') ||
          e.target.closest('#panel-2d')) return;
      const mouse = new THREE.Vector2(
        (e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, this.camera);
      const hits = ray.intersectObjects(this.scene.children, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj.parent && !obj.userData.id) obj = obj.parent;
        if (obj.userData.id) this.openInspector(obj.userData);
      }
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeInspector();
        if (this._mode2D) this.exit2D();
      }
    });

    document.getElementById('flow-speed').oninput = (e) => {
      this.flowSpeed = e.target.value / 100;
    };

    const hint = document.getElementById('ctrl-hint');
    const hide = () => setTimeout(() => hint.classList.add('hidden'), 2500);
    this.renderer.domElement.addEventListener('pointerdown', hide, { once: true });
    this.renderer.domElement.addEventListener('wheel',       hide, { once: true });
  }

  _log(msg) {
    const c = document.getElementById('log-entries');
    const d = document.createElement('div');
    const t = new Date().toLocaleTimeString('de-DE', { hour12:false });
    d.innerHTML = `<span class="ts">[${t}]</span> ${msg}`;
    c.prepend(d);
    while (c.children.length > 10) c.removeChild(c.lastChild);
  }

  // ── Render loop ────────────────────────────────────────────

  _animate() {
    requestAnimationFrame(() => this._animate());
    const t = Date.now() * 0.001;

    if (this.autoOrbit) {
      this.camera.position.x = Math.sin(t * 0.10) * 100;
      this.camera.position.z = Math.cos(t * 0.10) * 100;
      this.camera.position.y = 55 + Math.sin(t * 0.05) * 20;
      this.camera.lookAt(0, 0, 0);
    } else {
      this.controls.update();
    }

    // Alert pulse
    const pulse = 0.3 + Math.abs(Math.sin(t * 3.2)) * 0.7;
    this.alertObjs.forEach(obj => {
      if (obj.isMesh) obj.material.emissiveIntensity = pulse;
      else if (obj.isLine) obj.material.opacity = 0.2 + Math.abs(Math.sin(t*4)) * 0.65;
    });

    // Sparks (only visible ones)
    const step = 0.006 * (this.flowSpeed * 6 + 0.15);
    this.linkObjects.forEach(s => {
      if (!s.spark.visible) return;
      s.prog += step;
      if (s.prog > 1) s.prog = 0;
      s.spark.position.lerpVectors(s.start, s.end, s.prog);
    });

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}

// ── Boot ─────────────────────────────────────────────────────
window.app = new NV2Map3D(MAP_DATA);

// WS:  app.connectWS('ws://localhost:8008/ws/map/my-map');
