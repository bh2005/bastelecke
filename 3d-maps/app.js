import * as THREE        from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer,
         CSS2DObject }   from 'three/addons/renderers/CSS2DRenderer.js';

// ─────────────────────────────────────────────────────────────
//  STATUS CONFIG
// ─────────────────────────────────────────────────────────────
const SC = {
  ok:       { hex:0x27ae60, emissive:0x1a7a40, badge:'s-ok',   cls:'ok',   label:'OK',       sev:0 },
  warning:  { hex:0xe67e22, emissive:0xa05510, badge:'s-warn',  cls:'warn', label:'WARNING',  sev:1 },
  unknown:  { hex:0x7f8c8d, emissive:0x4a5455, badge:'s-unkn',  cls:'unkn', label:'UNKNOWN',  sev:2 },
  critical: { hex:0xe74c3c, emissive:0xb02020, badge:'s-crit',  cls:'crit', label:'CRITICAL', sev:3 },
  down:     { hex:0xc0392b, emissive:0x801010, badge:'s-down',  cls:'down', label:'DOWN',     sev:4 },
};
const S  = (s) => SC[s] ?? SC.unknown;
const al = (s) => s === 'critical' || s === 'down';

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const MINE_ACCENTS = [
  [19,211,142], [0,180,220],  [60,110,210],  [110,55,190],
  [150,30,150], [180,20,100], [200,50,50],   [220,100,20],
];
const BUILD_ACCENTS = [
  [130,140,160], [80,175,100],  [70,140,220],  [20,165,175],
  [180,120,60],  [160,90,180],  [200,160,40],  [90,190,140],
];

const SCENE_MAX  = 180;   // largest floor → this many scene units wide
const FLOOR_STEP = 35;    // vertical gap between floors (scene units)
const BBOX_PAD   = 300;   // metres of padding around node cluster per floor

// ─────────────────────────────────────────────────────────────
//  CSS2D CLEANUP
//  CSS2DRenderer nutzt eine WeakMap als Cache. Wird ein Objekt aus der
//  Szene entfernt und hat keine anderen JS-Referenzen mehr, kann der GC
//  den Eintrag löschen bevor der Renderer aufräumt → DOM-Element bleibt
//  sichtbar ("hängende Labels"). Explizites Entfernen aus dem DOM ist
//  die sichere Lösung.
// ─────────────────────────────────────────────────────────────
function disposeCSS2D(object) {
  object.traverse(child => {
    if (child.isCSS2DObject && child.element?.parentNode) {
      child.element.parentNode.removeChild(child.element);
    }
  });
}

// ─────────────────────────────────────────────────────────────
//  GEO HELPERS
// ─────────────────────────────────────────────────────────────
const EARTH_R = 6_371_000;

/** Convert lat/lon to metres offset from a reference point.
 *  Returns { xM (east+), zM (north = -z in Three.js) }
 */
function latLonToM(lat, lon, refLat, refLon) {
  const xM =  Math.cos(refLat * Math.PI / 180) * (lon - refLon) * Math.PI / 180 * EARTH_R;
  const zM = -(lat - refLat) * Math.PI / 180 * EARTH_R;
  return { xM, zM };
}

const fmtM = (m) => {
  if (m == null) return '?';
  if (m >= 1_000_000) return `${(m/1_000_000).toFixed(1)} Mm`;
  if (m >=     1_000) return `${(m/1_000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
};

// ─────────────────────────────────────────────────────────────
//  GEO LAYOUT COMPUTER
//
//  Given nodes with { lat, lon, floor } and floors with { label, y },
//  computes:
//    • widthM / lengthM per floor  (BBox of nodes on that floor + padding)
//    • scene x/y/z per node        (projected + normalised to SCENE_MAX)
// ─────────────────────────────────────────────────────────────
function computeGeoLayout(nodes, floors, cfg) {
  const refLat = cfg.lat, refLon = cfg.lon;

  // 1. Convert every node to metres from model reference point
  const nm = {};   // id → { xM, zM }
  nodes.forEach(n => { nm[n.id] = latLonToM(n.lat, n.lon, refLat, refLon); });

  // 2. Re-centre: subtract cluster centroid so the node cloud sits at
  //    scene origin (0,0) regardless of where the reference point is.
  //    Without this, models whose reference ≠ data centre show all nodes
  //    offset from the floor planes.
  const ids = Object.keys(nm);
  if (ids.length > 0) {
    const meanX = ids.reduce((s, id) => s + nm[id].xM, 0) / ids.length;
    const meanZ = ids.reduce((s, id) => s + nm[id].zM, 0) / ids.length;
    ids.forEach(id => { nm[id].xM -= meanX; nm[id].zM -= meanZ; });
  }

  // 3. BBox per floor (centred around origin)
  const updatedFloors = floors.map(fc => {
    const fn = nodes.filter(n => n.floor === fc.label);
    if (fn.length === 0) return { ...fc, widthM: BBOX_PAD * 2, lengthM: BBOX_PAD * 2 };

    const xs = fn.map(n => nm[n.id].xM);
    const zs = fn.map(n => nm[n.id].zM);
    return {
      ...fc,
      widthM:  Math.max(...xs) - Math.min(...xs) + BBOX_PAD * 2,
      lengthM: Math.max(...zs) - Math.min(...zs) + BBOX_PAD * 2,
    };
  });

  // 4. Global scale: largest floor dimension → SCENE_MAX
  const maxDimM = Math.max(...updatedFloors.map(f => Math.max(f.widthM, f.lengthM)));
  const scale   = SCENE_MAX / maxDimM;

  // 5. Node scene positions (centred)
  const nodePos = {};
  nodes.forEach(n => {
    const floor = updatedFloors.find(f => f.label === n.floor);
    nodePos[n.id] = {
      x: nm[n.id].xM * scale,
      y: floor?.y ?? 0,
      z: nm[n.id].zM * scale,
    };
  });

  return { floors: updatedFloors, nodePos, scale };
}

// ─────────────────────────────────────────────────────────────
//  MODEL PRESETS
// ─────────────────────────────────────────────────────────────
const MODEL_PRESETS = [
  {
    id:'building1', name:'Building 1', type:'building',
    floorCount:4, width:110, length:110, floorHeight:3,
    lat:51.5062, lon:9.3327,
  },
  {
    id:'building2', name:'Building 2', type:'building',
    floorCount:6, width:80, length:60, floorHeight:4,
    lat:51.5062, lon:9.3327,
  },
  {
    id:'grube1', name:'Grube 1', type:'mine',
    floorHeight:300, lat:51.5062, lon:9.3327,
    // widthM/lengthM are computed dynamically from node BBoxes
    floors: [
      { label:'ÜBERTAGE', sub:'Schachtanlage'  },
      { label:'SOHLE 1',  sub:'−300 m'         },
      { label:'SOHLE 2',  sub:'−600 m'         },
      { label:'SOHLE 3',  sub:'−900 m'         },
    ],
  },
  {
    id:'grube2', name:'Grube 2', type:'mine',
    floorHeight:300, lat:51.5400, lon:9.3100,
    floors: [
      { label:'ÜBERTAGE', sub:'Schachtanlage'  },
      { label:'SOHLE 1',  sub:'−300 m'         },
      { label:'SOHLE 2',  sub:'−600 m'         },
      { label:'SOHLE 3',  sub:'−900 m'         },
      { label:'SOHLE 4',  sub:'−1.200 m'       },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  FLOOR BUILDER  →  { y, label, sub, accent }  per floor
//  widthM / lengthM added later by computeGeoLayout (or static)
// ─────────────────────────────────────────────────────────────
function buildFloors(cfg) {
  const n    = cfg.floors?.length ?? cfg.floorCount;
  const half = (n - 1) * FLOOR_STEP / 2;

  if (cfg.floors) {
    return cfg.floors.map((f, i) => ({
      ...f,
      y:      cfg.type === 'mine' ? half - i * FLOOR_STEP : -half + i * FLOOR_STEP,
      accent: f.accent ?? (cfg.type === 'mine'
                ? MINE_ACCENTS[i % MINE_ACCENTS.length]
                : BUILD_ACCENTS[i % BUILD_ACCENTS.length]),
      widthM:  f.widthM  ?? null,   // filled by computeGeoLayout
      lengthM: f.lengthM ?? null,
    }));
  }

  const wM = cfg.width, lM = cfg.length;
  if (cfg.type === 'mine') {
    return Array.from({ length: n }, (_, i) => ({
      y:       half - i * FLOOR_STEP,
      label:   i === 0 ? 'ÜBERTAGE' : `SOHLE ${i}`,
      sub:     i === 0 ? 'Oberfläche' : `−${i * cfg.floorHeight} m`,
      accent:  MINE_ACCENTS[i % MINE_ACCENTS.length],
      widthM: wM, lengthM: lM,
    }));
  } else {
    return Array.from({ length: n }, (_, i) => ({
      y:       -half + i * FLOOR_STEP,
      label:   i === 0 ? 'EG' : `${i}. OG`,
      sub:     i === 0 ? 'Erdgeschoss' : `+${i * cfg.floorHeight} m`,
      accent:  BUILD_ACCENTS[i % BUILD_ACCENTS.length],
      widthM: wM, lengthM: lM,
    }));
  }
}

// ─────────────────────────────────────────────────────────────
//  MODEL MANAGER
// ─────────────────────────────────────────────────────────────
const LS_KEY = 'nv2_3d_models_v1';
const ModelManager = {
  _user()          { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; } },
  _save(arr)       { localStorage.setItem(LS_KEY, JSON.stringify(arr)); },
  getAll()         { return [...MODEL_PRESETS, ...this._user()]; },
  getById(id)      { return this.getAll().find(m => m.id === id); },
  isPreset(id)     { return MODEL_PRESETS.some(m => m.id === id); },
  add(cfg)         { const a = this._user(); a.push(cfg); this._save(a); },
  remove(id)       { if (!this.isPreset(id)) this._save(this._user().filter(m => m.id !== id)); },
  getInitial()     {
    const hash = location.hash.replace('#', '');
    return this.getById(hash) ?? MODEL_PRESETS[0];
  },
};

// ─────────────────────────────────────────────────────────────
//  MOCK DATA
//  Nodes carry BOTH static x/y/z (for building models) and
//  lat/lon/floor (for geo-projected mine models).
//  Grube 1 reference: 51.5062°N, 9.3327°E
// ─────────────────────────────────────────────────────────────
const MAP_DATA = {
  nodes: [
    // ── ÜBERTAGE  (~500 m cluster) ─────────────────────────
    { id:'core-sw-01',  label:'CORE-SW-01',     type:'switch', status:'ok',
      x:  0, y: 52, z:  0,
      lat:51.5062, lon:9.3327, floor:'ÜBERTAGE' },

    // ── SOHLE 1  (~12 × 7 km) ─────────────────────────────
    { id:'dist-sw-01',  label:'DIST-SW-ALPHA',  type:'switch', status:'ok',
      x:-28, y: 17, z: -8,
      lat:51.4750, lon:9.2900, floor:'SOHLE 1' },
    { id:'dist-sw-02',  label:'DIST-SW-BETA',   type:'switch', status:'warning',
      x: 28, y: 17, z: -8,
      lat:51.5350, lon:9.3800, floor:'SOHLE 1' },
    { id:'dist-sw-03',  label:'DIST-SW-GAMMA',  type:'switch', status:'ok',
      x:  0, y: 17, z: 28,
      lat:51.4900, lon:9.3900, floor:'SOHLE 1' },

    // ── SOHLE 2  (~28 × 15 km) ────────────────────────────
    { id:'web-01',      label:'web-server-01',  type:'host',   status:'ok',
      x:-35, y:-18, z:-20,
      lat:51.4400, lon:9.1500, floor:'SOHLE 2' },
    { id:'web-02',      label:'web-server-02',  type:'host',   status:'critical',
      x:-15, y:-18, z:-28,
      lat:51.4300, lon:9.1800, floor:'SOHLE 2' },
    { id:'db-primary',  label:'db-primary',     type:'host',   status:'ok',
      x: 15, y:-18, z:-28,
      lat:51.5650, lon:9.4700, floor:'SOHLE 2' },
    { id:'db-replica',  label:'db-replica',     type:'host',   status:'warning',
      x: 35, y:-18, z:-20,
      lat:51.5700, lon:9.4900, floor:'SOHLE 2' },

    // ── SOHLE 3  (~22 × 12 km) ────────────────────────────
    { id:'mon-01',      label:'monitoring-01',  type:'host',   status:'ok',
      x: -8, y:-52, z: 30,
      lat:51.4550, lon:9.2100, floor:'SOHLE 3' },
    { id:'fw-01',       label:'firewall-01',    type:'host',   status:'down',
      x: 12, y:-52, z: 36,
      lat:51.4450, lon:9.2300, floor:'SOHLE 3' },
    { id:'backup-01',   label:'backup-srv-01',  type:'host',   status:'ok',
      x:-30, y:-52, z:  5,
      lat:51.5500, lon:9.4450, floor:'SOHLE 3' },
    { id:'ldap-01',     label:'ldap-server',    type:'host',   status:'unknown',
      x: 28, y:-52, z:  8,
      lat:51.5400, lon:9.4200, floor:'SOHLE 3' },
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
  constructor(data, initialModel) {
    this.data          = data;
    this.nodeObjects   = {};
    this.nodePositions = {};   // id → THREE.Vector3 (scene units)
    this.linkObjects   = [];
    this.alertObjs     = [];
    this.autoOrbit     = true;
    this.flowSpeed     = 0.4;
    this._activeNode   = null;
    this._floorObjs    = [];
    this._floorPlates  = {};
    this._floorSceneWL = {};   // y → { W, L }
    this._bgMeshes     = {};
    this._bgMats       = {};
    this._mode2D       = false;
    this._floor2DY     = null;

    this._model        = initialModel;
    this._activeFloors = buildFloors(initialModel);
    this._applyGeoLayout(data.nodes);   // enriches _activeFloors + fills nodePositions

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

  // ── Geo layout ────────────────────────────────────────────
  // Uses lat/lon if nodes have them AND the model has a reference centre.
  // Falls back to static x/y/z otherwise.

  _applyGeoLayout(nodes) {
    const cfg = this._model;
    // Geo-Projektion nur für Modelle mit explizitem floors[]-Array
    // UND wenn mindestens ein Node ein passendes Floor-Label hat
    const hasGeo = cfg.lat && cfg.lon && Array.isArray(cfg.floors) &&
      nodes.some(n => n.lat != null && cfg.floors.some(f => f.label === n.floor));

    if (hasGeo) {
      const { floors, nodePos } = computeGeoLayout(nodes, this._activeFloors, cfg);
      this._activeFloors = floors;
      nodes.forEach(n => {
        const p = nodePos[n.id] ?? { x: 0, y: 0, z: 0 };
        this.nodePositions[n.id] = new THREE.Vector3(p.x, p.y, p.z);
      });
    } else {
      nodes.forEach(n => {
        this.nodePositions[n.id] = new THREE.Vector3(n.x ?? 0, n.y ?? 0, n.z ?? 0);
      });
    }
  }

  // ── Load / switch model ────────────────────────────────────

  loadModel(cfg) {
    if (this._mode2D) this.exit2D();
    this._model        = cfg;
    this._activeFloors = buildFloors(cfg);
    this.nodePositions = {};
    this._applyGeoLayout(this.data.nodes);

    // Rebuild node/link scene objects with new positions
    Object.values(this.nodeObjects).forEach(g => { disposeCSS2D(g); this.scene.remove(g); });
    this.linkObjects.forEach(({ line, spark }) => {
      this.scene.remove(line); this.scene.remove(spark);
    });
    this.nodeObjects = {};
    this.linkObjects = [];
    this.alertObjs   = [];
    this._buildNodes();
    this._buildLinks();
    this._buildFloors();
    this._buildFloorNav();

    const nameEl = document.getElementById('btn-model-name');
    if (nameEl) nameEl.textContent = cfg.name;

    history.replaceState(null, '', '#' + cfg.id);
    this._log(`Model: ${cfg.name}`);
  }

  // ── Scene ──────────────────────────────────────────────────

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x080a0e, 0.003);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(innerWidth, innerHeight);
    document.getElementById('canvas-wrap').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 1500);
    this.camera.position.set(130, 80, 130);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.28));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(60, 100, 40);
    this.scene.add(sun);
    this._accentLight = new THREE.PointLight(0x3060aa, 1.8, 280);
    this._accentLight.position.set(0, 55, 0);
    this.scene.add(this._accentLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance   = 5;
    this.controls.maxDistance   = 900;

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

  _genFloorTexture(fc, idx, total) {
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

    // Outer frame + corners
    ctx.strokeStyle = ac(0.45); ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, sz-36, sz-36);
    ctx.lineWidth = 1; ctx.strokeStyle = ac(0.7);
    [[18,18,1,1],[494,18,-1,1],[18,494,1,-1],[494,494,-1,-1]].forEach(([cx,cy,sx,sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx+sx*24, cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+sy*24); ctx.stroke();
    });

    // Room plan outlines
    const plans = [
      [[60,60,200,160],[295,60,155,155],[60,260,390,160]],
      [[60,60,390,110],[60,210,175,205],[270,210,180,205]],
      [[60,60,135,135],[235,60,215,135],[60,240,390,210]],
      [[145,145,222,222]],
    ];
    ctx.strokeStyle = ac(0.22); ctx.lineWidth = 1.5;
    plans[idx % plans.length].forEach(([x,y,w,h]) => ctx.strokeRect(x,y,w,h));

    // Level dots
    for (let i = 0; i < total; i++) {
      ctx.beginPath(); ctx.fillStyle = i === idx ? ac(0.85) : ac(0.18);
      ctx.arc(38 + i*16, 487, i === idx ? 5 : 3, 0, Math.PI*2); ctx.fill();
    }

    // Watermarks
    ctx.fillStyle = ac(0.055); ctx.font = 'bold 66px monospace'; ctx.textAlign = 'center';
    ctx.fillText(fc.label, sz/2, 285);
    if (fc.widthM && fc.lengthM) {
      ctx.fillStyle = ac(0.05); ctx.font = 'italic 17px monospace';
      ctx.fillText(`${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}`, sz/2, 318);
    }

    // Header text
    ctx.fillStyle = ac(0.70); ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
    ctx.fillText(fc.label, 32, 43);
    ctx.fillStyle = ac(0.40); ctx.font = '11px monospace';
    ctx.fillText(fc.sub, 32, 60);
    if (fc.widthM && fc.lengthM) {
      ctx.fillStyle = ac(0.25); ctx.font = '10px monospace';
      ctx.fillText(`${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}`, 32, 76);
    }

    return new THREE.CanvasTexture(cv);
  }

  // ── Build floors ───────────────────────────────────────────

  _buildFloors() {
    this._floorObjs.forEach(o => { disposeCSS2D(o); this.scene.remove(o); });
    this._floorObjs    = [];
    this._floorPlates  = {};
    this._floorSceneWL = {};

    // Normalise: largest floor → SCENE_MAX units
    const allW   = this._activeFloors.map(f => f.widthM  ?? 110);
    const allL   = this._activeFloors.map(f => f.lengthM ?? 110);
    const maxDim = Math.max(...allW, ...allL);
    const scale  = SCENE_MAX / maxDim;
    const total  = this._activeFloors.length;

    this._activeFloors.forEach((fc, idx) => {
      const W = (fc.widthM  ?? 110) * scale;
      const L = (fc.lengthM ?? 110) * scale;
      this._floorSceneWL[fc.y] = { W, L };

      const tex = this._genFloorTexture(fc, idx, total);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.72, side: THREE.DoubleSide
      });
      this._floorPlates[fc.y] = mat;

      const plate = new THREE.Mesh(new THREE.PlaneGeometry(W, L), mat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.y = fc.y - 0.05;
      plate.userData.floorY = fc.y;
      this.scene.add(plate);
      this._floorObjs.push(plate);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, L)),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(...fc.accent.map(v=>v/255)),
          transparent: true, opacity: 0.3
        })
      );
      edges.rotation.x = -Math.PI / 2;
      edges.position.y = fc.y;
      edges.userData.floorY = fc.y;
      this.scene.add(edges);
      this._floorObjs.push(edges);

      // CSS2D label
      const div = document.createElement('div');
      div.className = 'node-label floor-label';
      const [r,g,b_] = fc.accent;
      div.style.cssText = `color:rgba(${r},${g},${b_},.7);border-color:rgba(${r},${g},${b_},.2)`;
      div.innerHTML = `<b>${fc.label}</b>` +
        (fc.widthM ? `<br><span style="opacity:.5;font-size:8px">${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}</span>` : '');

      const lbl = new CSS2DObject(div);
      lbl.position.set(-(W/2 + 6), fc.y + 0.5, 0);
      lbl.userData.floorY = fc.y;
      this.scene.add(lbl);
      this._floorObjs.push(lbl);
    });
  }

  // ── Floor nav panel ────────────────────────────────────────

  _buildFloorNav() {
    const panel = document.getElementById('floor-panel');
    panel.innerHTML = '';
    [...this._activeFloors].sort((a,b) => b.y - a.y).forEach(fc => {
      const [r,g,b_] = fc.accent;
      const row = document.createElement('div');
      row.className = 'floor-row'; row.id = `floor-row-${fc.y}`;

      const btn = document.createElement('button');
      btn.className = 'floor-btn';
      btn.title = fc.sub + (fc.widthM ? ` · ${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}` : '');
      btn.innerHTML =
        `<span class="fb-label">${fc.label}</span>` +
        (fc.widthM ? `<span class="fb-dim">${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}</span>` : '') +
        `<span class="fb-dot" style="background:rgba(${r},${g},${b_},.7);box-shadow:0 0 5px rgba(${r},${g},${b_},.5)"></span>`;
      btn.onclick = () => this.flyToFloor(fc.y);

      const btn2d = document.createElement('button');
      btn2d.className = 'floor-2d-btn'; btn2d.id = `btn2d-${fc.y}`;
      btn2d.textContent = '2D';
      btn2d.onclick = () => {
        if (this._mode2D && this._floor2DY === fc.y) this.exit2D();
        else this.enter2D(fc.y);
      };

      row.appendChild(btn); row.appendChild(btn2d);
      panel.appendChild(row);
    });
  }

  // ── 2D Mode ────────────────────────────────────────────────

  enter2D(floorY) {
    this._mode2D = true; this._floor2DY = floorY;
    this._setAutoOrbit(false);

    const fc = this._activeFloors.find(f => f.y === floorY);
    const { W = 110 } = this._floorSceneWL[floorY] ?? {};

    this.controls.target.set(0, floorY, 0);
    this.camera.position.set(0, floorY + W * 0.85, 0.01);
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = 0.001;
    this.controls.enableRotate  = false;
    this.controls.update();

    this._applyFloorVisibility(floorY);
    if (this._floorPlates[floorY])
      this._floorPlates[floorY].opacity = parseFloat(document.getElementById('floor-opacity').value) / 100;

    document.getElementById('view-badge').classList.add('active');
    document.getElementById('vb-floor-name').textContent = fc?.label ?? floorY;
    document.getElementById('panel-2d').classList.add('visible');
    document.getElementById('ctrl-hint').textContent = '🖱 Schieben: Rechte Taste / Mitteltaste · Rad: Zoom';
    document.getElementById('ctrl-hint').classList.remove('hidden');

    document.querySelectorAll('.floor-2d-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn2d-${floorY}`)?.classList.add('active');
    document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('is-2d'));
    document.getElementById(`floor-row-${floorY}`)?.querySelector('.floor-btn')?.classList.add('is-2d');

    this._log(`2D · ${fc?.label}` + (fc?.widthM ? ` · ${fmtM(fc.widthM)} × ${fmtM(fc.lengthM)}` : ''));
  }

  exit2D() {
    this._mode2D = false; this._floor2DY = null;
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
    this._floorObjs.forEach(o => { o.visible = o.userData.floorY === activeY; });
    Object.values(this.nodeObjects).forEach(g => { g.visible = Math.abs(g.position.y - activeY) < 8; });
    this.linkObjects.forEach(({ line, spark, srcY, tgtY }) => {
      const show = Math.abs(srcY - activeY) < 8 && Math.abs(tgtY - activeY) < 8;
      line.visible = show; spark.visible = show;
    });
    Object.entries(this._bgMeshes).forEach(([y, mesh]) => {
      mesh.visible = parseFloat(y) === activeY;
    });
  }

  _showAll() {
    this._floorObjs.forEach(o => o.visible = true);
    Object.values(this.nodeObjects).forEach(g => g.visible = true);
    this.linkObjects.forEach(({ line, spark }) => { line.visible = true; spark.visible = true; });
    Object.values(this._bgMeshes).forEach(m => m.visible = false);
  }

  // ── Background image ───────────────────────────────────────

  _onBgFileSelected(file) {
    if (!file || !this._mode2D) return;
    const y = this._floor2DY;
    const { W = 110, L = 110 } = this._floorSceneWL[y] ?? {};
    if (this._bgMeshes[y]) this.scene.remove(this._bgMeshes[y]);
    new THREE.TextureLoader().load(URL.createObjectURL(file), tex => {
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true,
        opacity: parseFloat(document.getElementById('bg-opacity').value) / 100,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, L), mat);
      mesh.rotation.x = -Math.PI / 2; mesh.position.y = y - 0.08;
      this.scene.add(mesh);
      this._bgMeshes[y] = mesh; this._bgMats[y] = mat;
      document.getElementById('bg-img-name').textContent = file.name;
      this._log(`Grundriss geladen: ${file.name}`);
    });
  }

  setBgOpacity(val)    { if (this._floor2DY !== null && this._bgMats[this._floor2DY])    this._bgMats[this._floor2DY].opacity = val; }
  setFloorOpacity(val) { if (this._floor2DY !== null && this._floorPlates[this._floor2DY]) this._floorPlates[this._floor2DY].opacity = val; }

  // ── Nodes ──────────────────────────────────────────────────

  _buildNodes() {
    this.data.nodes.forEach(node => {
      const pos   = this.nodePositions[node.id] ?? new THREE.Vector3(0, 0, 0);
      const group = this._createNodeMesh(node);
      group.position.copy(pos);
      this.scene.add(group);
      this.nodeObjects[node.id] = group;
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
    if (al(node.status) || node.status === 'warning')
      group.add(Object.assign(new THREE.PointLight(cfg.hex, 0.9, 22), {}));
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
        new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]),
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
        srcY: srcNode ? (this.nodePositions[srcNode.id]?.y ?? 0) : 0,
        tgtY: tgtNode ? (this.nodePositions[tgtNode.id]?.y ?? 0) : 0,
      });
    });
  }

  // ── Camera helpers ─────────────────────────────────────────

  flyToFloor(y) {
    if (this._mode2D) this.exit2D();
    this._setAutoOrbit(false);
    const t = Date.now() * 0.001;
    this.camera.position.set(Math.sin(t)*130, y+65, Math.cos(t)*130);
    this.controls.target.set(0, y, 0);
    this.controls.update();
  }

  /** Fly to a specific node and open its inspector.
   *
   *  Orbit-Target wird auf den Ebenenmittelpunkt (0, floorY, 0) gesetzt,
   *  nicht auf den Node selbst. Beim Herauszoomen bleibt die Szene
   *  damit korrekt zentriert und alle anderen Hosts bleiben am richtigen Platz.
   */
  focusNode(id) {
    if (this._mode2D) this.exit2D();
    this._setAutoOrbit(false);
    const pos = this.nodePositions[id];
    if (!pos) return;

    // Nächste Ebene zum Node finden → wird Orbit-Zentrum
    const floorY = this._activeFloors.length
      ? this._activeFloors.reduce((best, f) =>
          Math.abs(f.y - pos.y) < Math.abs(best - pos.y) ? f.y : best,
          this._activeFloors[0].y)
      : pos.y;

    this.controls.target.set(0, floorY, 0);

    // Kamera: über dem Node, auf der Linie Ebenenmitte → Node
    const horiz = new THREE.Vector3(pos.x, 0, pos.z);
    const hDist = horiz.length();
    const dir   = hDist > 0.5
      ? horiz.clone().normalize()
      : new THREE.Vector3(1, 0, 0);
    const camR  = Math.max(hDist + 30, 45);

    this.camera.position.set(dir.x * camR, floorY + 30, dir.z * camR);
    this.controls.update();

    const node = this.data.nodes.find(n => n.id === id);
    if (node) this.openInspector({ ...node });
  }

  focusActive() {
    if (!this._activeNode) return;
    this.focusNode(this._activeNode.id);
  }

  resetCam() {
    if (this._mode2D) this.exit2D();
    this._setAutoOrbit(true);
    this.camera.position.set(130, 80, 130);
    this.controls.target.set(0, 0, 0);
  }

  zoom(dir) {
    this._setAutoOrbit(false);
    const v = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.addScaledVector(v, dir * -18);
    this.controls.update();
  }

  toggleOrbit() { this._setAutoOrbit(!this.autoOrbit); }
  _setAutoOrbit(on) {
    this.autoOrbit = on;
    document.getElementById('btn-orbit').classList.toggle('active', on);
  }

  // ── WS ─────────────────────────────────────────────────────

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
      if (this._activeNode?.id === h.id) { this._activeNode.status = h.status; this.openInspector(this._activeNode); }
    });
    window.problemList?.update(this.data.nodes.map(n => ({ ...n, status: this.nodeObjects[n.id]?.userData?.status ?? n.status })));
    this._log(`Status update · ${hosts.length} host(s)`);
  }

  connectWS(url) {
    this._log(`Connecting → ${url}`);
    const ws = new WebSocket(url);
    ws.onopen    = () => this._log('WS connected');
    ws.onclose   = () => this._log('WS disconnected');
    ws.onmessage = (e) => {
      try { const m = JSON.parse(e.data); if (m.type === 'status_update' && m.hosts) this.updateNodeStatus(m.hosts); } catch {}
    };
    this.ws = ws;
  }

  // ── Inspector ──────────────────────────────────────────────

  openInspector(data) {
    this._activeNode = data;
    const cfg = S(data.status);
    const badge = document.getElementById('ins-badge');
    badge.className = `s-badge ${cfg.badge}`; badge.textContent = cfg.label;
    document.getElementById('ins-name').textContent = data.label;
    document.getElementById('ins-id').textContent   = `id: ${data.id}`;
    const pos = this.nodePositions[data.id];
    const geoLine = data.lat
      ? `<div class="m-row"><span>Koordinaten</span><b>${data.lat?.toFixed(4)}°N, ${data.lon?.toFixed(4)}°E</b></div>`
      : '';
    document.getElementById('ins-body').innerHTML = `
      <div class="m-row"><span>Status</span><b class="${cfg.cls}">${cfg.label}</b></div>
      <div class="m-row"><span>Typ</span><b>${data.type}</b></div>
      <div class="m-row"><span>Ebene</span><b>${data.floor ?? '–'}</b></div>
      ${geoLine}
      ${pos ? `<div class="m-row"><span>Scene X/Y/Z</span><b>${pos.x.toFixed(1)} / ${pos.y.toFixed(1)} / ${pos.z.toFixed(1)}</b></div>` : ''}
    `;
    document.getElementById('inspector').classList.add('open');
    this._log(`Selected: ${data.label} [${cfg.label}]`);
  }

  closeInspector() {
    document.getElementById('inspector').classList.remove('open');
    this._activeNode = null;
  }

  // ── UI ─────────────────────────────────────────────────────

  _setupUI() {
    window.addEventListener('click', (e) => {
      if (e.target.closest('#inspector') || e.target.closest('.hud') ||
          e.target.closest('#floor-panel') || e.target.closest('#zoom-ctrl') ||
          e.target.closest('#panel-2d') || e.target.closest('#model-dialog') ||
          e.target.closest('#problem-panel')) return;
      const mouse = new THREE.Vector2((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
      const ray   = new THREE.Raycaster();
      ray.setFromCamera(mouse, this.camera);
      const hits = ray.intersectObjects(this.scene.children, true);
      if (hits.length) {
        let obj = hits[0].object;
        while (obj.parent && !obj.userData.id) obj = obj.parent;
        if (obj.userData.id) this.openInspector(obj.userData);
      }
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.closeInspector(); if (this._mode2D) this.exit2D(); }
    });

    document.getElementById('flow-speed').oninput = (e) => { this.flowSpeed = e.target.value / 100; };

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
      this.camera.position.x = Math.sin(t * 0.10) * 140;
      this.camera.position.z = Math.cos(t * 0.10) * 140;
      this.camera.position.y = 70 + Math.sin(t * 0.05) * 25;
      this.camera.lookAt(0, 0, 0);
    } else {
      this.controls.update();
    }

    const pulse = 0.3 + Math.abs(Math.sin(t * 3.2)) * 0.7;
    this.alertObjs.forEach(obj => {
      if (obj.isMesh) obj.material.emissiveIntensity = pulse;
      else if (obj.isLine) obj.material.opacity = 0.2 + Math.abs(Math.sin(t*4)) * 0.65;
    });

    const step = 0.006 * (this.flowSpeed * 6 + 0.15);
    this.linkObjects.forEach(s => {
      if (!s.spark.visible) return;
      s.prog += step; if (s.prog > 1) s.prog = 0;
      s.spark.position.lerpVectors(s.start, s.end, s.prog);
    });

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}

// ─────────────────────────────────────────────────────────────
//  PROBLEM LIST
// ─────────────────────────────────────────────────────────────
class ProblemList {
  constructor(app) {
    this.app   = app;
    this._el   = document.getElementById('problem-panel');
    this._list = document.getElementById('prob-list');
    this._btn  = document.getElementById('btn-problems');
    document.getElementById('prob-close').onclick = () => this.close();
    this._el.addEventListener('click', e => { if (e.target === this._el) this.close(); });
  }

  toggle() { this._el.classList.toggle('open'); }
  close()  { this._el.classList.remove('open'); }

  update(nodes) {
    const problems = nodes
      .filter(n => n.status !== 'ok')
      .sort((a, b) => (SC[b.status]?.sev ?? 0) - (SC[a.status]?.sev ?? 0));

    const critCount = problems.filter(n => al(n.status)).length;

    // Update header button
    this._btn.textContent = critCount > 0 ? `⚠ ${critCount}` : `⚑ ${problems.length}`;
    this._btn.classList.toggle('has-crit', critCount > 0);
    this._btn.classList.toggle('has-warn', critCount === 0 && problems.length > 0);

    this._list.innerHTML = '';

    if (problems.length === 0) {
      this._list.innerHTML = '<div class="prob-empty">Alle Hosts OK ✓</div>';
      return;
    }

    problems.forEach(n => {
      const cfg = S(n.status);
      const row = document.createElement('div');
      row.className = 'prob-row';
      row.innerHTML = `
        <span class="s-badge ${cfg.badge}" style="flex-shrink:0">${cfg.label}</span>
        <div class="prob-info">
          <span class="prob-name">${n.label}</span>
          <span class="prob-floor">${n.floor ?? n.type}</span>
        </div>
        <span class="prob-arrow">›</span>
      `;
      row.onclick = () => { this.app.focusNode(n.id); this.close(); };
      this._list.appendChild(row);
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  MODEL DIALOG
// ─────────────────────────────────────────────────────────────
class ModelDialog {
  constructor(app) {
    this.app     = app;
    this._el     = document.getElementById('model-dialog');
    this._list   = document.getElementById('model-list');
    this._form   = document.getElementById('model-form');
    this._newSec = document.getElementById('model-new-section');
    this._setupEvents();
  }

  open()  { this._renderList(); this._newSec.style.display = 'none'; this._el.classList.add('open'); }
  close() { this._el.classList.remove('open'); }

  _metaLine(m) {
    if (m.floors) {
      const hasWL  = m.floors.some(f => f.widthM);
      if (hasWL) {
        const maxW = Math.max(...m.floors.filter(f=>f.widthM).map(f => f.widthM));
        const maxL = Math.max(...m.floors.filter(f=>f.lengthM).map(f => f.lengthM));
        return `${m.floors.length} Ebenen · max. ${fmtM(maxW)} × ${fmtM(maxL)}`;
      }
      return `${m.floors.length} Ebenen · Ausmaße aus Hosts`;
    }
    return `${m.floorCount} Etagen · ${m.width} × ${m.length} m · ${m.floorHeight} m/Etage`;
  }

  _renderList() {
    const models   = ModelManager.getAll();
    const activeId = this.app._model?.id;
    this._list.innerHTML = '';
    models.forEach(m => {
      const isActive  = m.id === activeId;
      const typeLabel = m.type === 'mine' ? '⛏ Grube' : '🏢 Hochhaus';
      const isGeo     = !!(m.floors && !m.floors[0]?.widthM);
      const row = document.createElement('div');
      row.className = 'model-row' + (isActive ? ' active' : '');
      row.innerHTML = `
        <div class="model-info">
          <div class="model-row-top">
            <span class="model-name">${m.name}</span>
            <span class="model-type-tag ${m.type}">${typeLabel}</span>
            ${isGeo ? `<span class="model-var-tag">⊕ Geo</span>` : ''}
          </div>
          <div class="model-meta">${this._metaLine(m)}</div>
        </div>
        <div class="model-actions">
          ${isActive
            ? `<span class="model-active-badge">✓ Aktiv</span>`
            : `<button class="btn btn-sm" data-select="${m.id}">Laden</button>`}
          ${!ModelManager.isPreset(m.id)
            ? `<button class="btn btn-sm btn-del" data-delete="${m.id}" title="Löschen">✕</button>`
            : ''}
        </div>`;
      this._list.appendChild(row);
    });
  }

  _setupEvents() {
    this._list.addEventListener('click', e => {
      const selId = e.target.closest('[data-select]')?.dataset.select;
      const delId = e.target.closest('[data-delete]')?.dataset.delete;
      if (selId) { const cfg = ModelManager.getById(selId); if (cfg) { this.app.loadModel(cfg); this.close(); } }
      if (delId && confirm('Modell löschen?')) { ModelManager.remove(delId); this._renderList(); }
    });

    document.getElementById('btn-new-model').onclick = () => {
      this._newSec.style.display = this._newSec.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('btn-cancel-new').onclick = () => { this._newSec.style.display = 'none'; };

    this._form.onsubmit = (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(this._form));
      ModelManager.add({
        id: 'model_' + Date.now(), name: d.name.trim(), type: d.type,
        floorCount: parseInt(d.floorCount)||4, width: parseFloat(d.width)||110,
        length: parseFloat(d.length)||110, floorHeight: parseFloat(d.floorHeight)||3,
        lat: parseFloat(d.lat)||0, lon: parseFloat(d.lon)||0,
      });
      this._form.reset(); this._newSec.style.display = 'none'; this._renderList();
    };

    this._el.addEventListener('click', e => { if (e.target === this._el) this.close(); });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._el.classList.contains('open')) {
        e.stopImmediatePropagation(); this.close();
      }
    }, true);
  }
}

// ─────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────
const initialModel     = ModelManager.getInitial();
window.app         = new NV2Map3D(MAP_DATA, initialModel);
window.modelDialog = new ModelDialog(window.app);
window.problemList = new ProblemList(window.app);

document.getElementById('btn-model-name').textContent = initialModel.name;
window.problemList.update(MAP_DATA.nodes);

// WS:  app.connectWS('ws://localhost:8008/ws/map/my-map');
