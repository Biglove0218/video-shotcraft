// Procedural weld-neck flange (对焊法兰) for styleframes.
// Query: ?mode=finished|blank|split&theme=fire|steel|duo&w=1080&h=1080&yaw=0.35&cut=0
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const q = new URLSearchParams(location.search);
const MODE = q.get('mode') || 'finished';
const THEME = q.get('theme') || 'duo';
const W = +q.get('w') || 1080;
const H = +q.get('h') || 1080;
const YAW = q.has('yaw') ? +q.get('yaw') : 0.35;
const CUT = q.has('cut') ? +q.get('cut') : 0.0;
const SHADOW = q.get('shadow') !== '0';

// ---------- deterministic noise ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function valueNoise(size, cells, seed) {
  const r = mulberry32(seed);
  const g = new Float32Array((cells + 1) * (cells + 1));
  for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const fx = (x / size) * cells, fy = (y / size) * cells;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const X0 = ix % cells, X1 = (ix + 1) % cells, Y0 = iy % cells, Y1 = (iy + 1) % cells;
    const a = g[Y0 * (cells + 1) + X0], b = g[Y0 * (cells + 1) + X1];
    const c = g[Y1 * (cells + 1) + X0], d = g[Y1 * (cells + 1) + X1];
    out[y * size + x] = (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
  }
  return out;
}
function fbm(size, seed) {
  const out = new Float32Array(size * size);
  let amp = 0.5, total = 0;
  for (let o = 0; o < 5; o++) {
    const n = valueNoise(size, 4 << o, seed + o * 101);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    total += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}
function canvasTex(size, fn, srgb = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  fn(img.data, size);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

// Turning marks: concentric rings centred on the face (planar UV of extrude caps)
const RING_TEX = (() => {
  const S = 2048; const r = mulberry32(7);
  const jitter = new Float32Array(4096).map(() => r());
  return canvasTex(S, (d, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = x / s - 0.5, dy = y / s - 0.5;
      const rad = Math.sqrt(dx * dx + dy * dy) * 2200;
      const k = Math.floor(rad);
      const fine = 0.5 + 0.5 * Math.sin(rad * 2.1);
      const v = 0.22 + 0.10 * fine + 0.10 * jitter[k % 4096];
      const i = (y * s + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v * 255; d[i + 3] = 255;
    }
  });
})();
RING_TEX.repeat.set(1 / 2.4, 1 / 2.4); RING_TEX.offset.set(0.5, 0.5);
// Lathe surfaces: stripes along v (= rings around the axis)
const STRIPE_TEX = (() => {
  const r = mulberry32(11);
  const rows = new Float32Array(1024).map(() => r());
  return canvasTex(1024, (d, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = 0.2 + 0.12 * rows[y] + 0.06 * Math.sin(y * 1.7);
      const i = (y * s + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v * 255; d[i + 3] = 255;
    }
  });
})();
STRIPE_TEX.wrapS = STRIPE_TEX.wrapT = THREE.RepeatWrapping;
STRIPE_TEX.repeat.set(1, 3);

const ROUGH_N = fbm(512, 3);
const ROUGH_BUMP = canvasTex(512, (d, s) => {
  for (let i = 0; i < s * s; i++) { const v = ROUGH_N[i] * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
});
const ROUGH_COLOR = canvasTex(512, (d, s) => {
  const n2 = fbm(512, 77);
  for (let i = 0; i < s * s; i++) {
    const rust = Math.min(1, Math.max(0, (n2[i] - 0.5) * 2.2));
    // dark forged scale ↔ red-brown rust (sampled from photo ②)
    const a = [70, 67, 65], b = [118, 76, 62];
    for (let c = 0; c < 3; c++) d[i * 4 + c] = a[c] + (b[c] - a[c]) * rust + (ROUGH_N[i] - 0.5) * 30;
    d[i * 4 + 3] = 255;
  }
}, true);
for (const t of [ROUGH_BUMP, ROUGH_COLOR]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); }

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = SHADOW;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const THEMES = {
  fire:  { env: 0.45, key: 0xffe0c0, keyI: 2.2, rimL: 0xff6a1f, rimLI: 6.0, rimR: 0xff9a3c, rimRI: 3.0 },
  steel: { env: 1.0,  key: 0xf2f6ff, keyI: 2.4, rimL: 0x8fb8ff, rimLI: 3.5, rimR: 0xdfe9ff, rimRI: 3.0 },
  duo:   { env: 0.6,  key: 0xfff4ea, keyI: 2.3, rimL: 0xff6a1f, rimLI: 5.5, rimR: 0x9cc2ff, rimRI: 4.0 },
};
const T = THEMES[THEME];
scene.environmentIntensity = T.env;

const key = new THREE.DirectionalLight(T.key, T.keyI);
key.position.set(2.5, 5, 3);
key.castShadow = SHADOW;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
key.shadow.camera.right = key.shadow.camera.top = 2.5;
key.shadow.radius = 8; key.shadow.bias = -0.0005;
scene.add(key);
const rimL = new THREE.PointLight(T.rimL, T.rimLI, 0, 1.4); rimL.position.set(-3.2, 1.2, -1.5); scene.add(rimL);
const rimR = new THREE.PointLight(T.rimR, T.rimRI, 0, 1.4); rimR.position.set(3.2, 1.6, -1.8); scene.add(rimR);

// ---------- materials ----------
const machinedCap = new THREE.MeshPhysicalMaterial({
  color: 0xd2d7dc, metalness: 1, roughness: 1, roughnessMap: RING_TEX,
  clearcoat: 0.15, clearcoatRoughness: 0.3, side: THREE.DoubleSide,
});
const machinedLathe = machinedCap.clone();
machinedLathe.roughnessMap = STRIPE_TEX;
const roughMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, map: ROUGH_COLOR, metalness: 0.55, roughness: 0.88,
  bumpMap: ROUGH_BUMP, bumpScale: 4, side: THREE.DoubleSide,
});

const roughCap = roughMat.clone();
roughCap.map = ROUGH_COLOR.clone(); roughCap.map.repeat.set(0.45, 0.45);
roughCap.bumpMap = ROUGH_BUMP.clone(); roughCap.bumpMap.repeat.set(0.45, 0.45);
const roughLathe = roughMat.clone();
roughLathe.map = ROUGH_COLOR.clone(); roughLathe.map.repeat.set(2, 0.5);
roughLathe.bumpMap = ROUGH_BUMP.clone(); roughLathe.bumpMap.repeat.set(2, 0.5);
for (const m of [roughCap, roughLathe]) for (const t of [m.map, m.bumpMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }

// heat glow on the rough side near the cut (split mode)
function addHeat(mat, plane) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCut = { value: plane };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform vec4 uCut;')
      .replace('#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float dcut = abs(dot(uCut.xyz, vWP) + uCut.w);
         float heat = exp(-dcut * 14.0);
         totalEmissiveRadiance += vec3(1.0, 0.28, 0.04) * heat * 1.6 + vec3(1.0,0.62,0.25) * exp(-dcut*60.0) * 2.2 + vec3(1.0,0.92,0.8) * exp(-dcut*260.0) * 3.0;`);
  };
}

// ---------- geometry ----------
const group = new THREE.Group();
scene.add(group);

function discGeom(R, r, thick, holes, holeR, holeRc, bevel) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const bore = new THREE.Path(); bore.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(bore);
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2 + Math.PI / holes;
    const h = new THREE.Path(); h.absarc(Math.cos(a) * holeRc, Math.sin(a) * holeRc, holeR, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: thick - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 160,
  });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2);
  return g;
}
function latheGeom(pts, seg = 192) {
  const g = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  return g;
}
function hubProfile(base, neck, y0, y1, yTop, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = 1 - Math.pow(1 - t, 2.2); // concave taper like a real weld-neck hub
    pts.push([base + (neck - base) * e, y0 + (y1 - y0) * t]);
  }
  pts.push([neck, yTop]);
  return pts;
}

function buildFinished(mats) {
  const parts = [];
  const [cap, lathe] = mats;
  parts.push(new THREE.Mesh(discGeom(1.1, 0.44, 0.22, 8, 0.088, 0.9, 0.012), cap));
  // raised face (密封面) under the disc
  const rf = discGeom(0.72, 0.44, 0.035, 0, 0, 0, 0.004); rf.translate(0, -0.035, 0);
  parts.push(new THREE.Mesh(rf, cap));
  // hub + neck
  parts.push(new THREE.Mesh(latheGeom(hubProfile(0.7, 0.52, 0.22, 0.8, 1.0)), lathe));
  // weld bevel + top land
  parts.push(new THREE.Mesh(latheGeom([[0.52, 1.0], [0.485, 1.035], [0.44, 1.035]]), lathe));
  // bore
  parts.push(new THREE.Mesh(latheGeom([[0.44, 1.035], [0.44, -0.035]]), lathe));
  return parts;
}
function buildBlank(mat) {
  const parts = [];
  // forged blank: oversized, no bolt holes, smaller punched bore, rounded edges
  parts.push(new THREE.Mesh(discGeom(1.16, 0.36, 0.3, 0, 0, 0, 0.05), mat[0]));
  const hub = hubProfile(0.78, 0.58, 0.28, 0.82, 1.02);
  hub.push([0.55, 1.06], [0.36, 1.06]);
  parts.push(new THREE.Mesh(latheGeom(hub), mat[1]));
  parts.push(new THREE.Mesh(latheGeom([[0.36, 1.06], [0.36, 0.0]]), mat[1]));
  return parts;
}

let parts = [];
if (MODE === 'finished') parts = buildFinished([machinedCap, machinedLathe]);
else if (MODE === 'blank') parts = buildBlank([roughCap, roughLathe]);
else {
  // split: same finished geometry; left of the cut (screen) = still rough & hot, right = machined
  const n = new THREE.Vector3(1, 0, 0.35).normalize();
  const plane = new THREE.Plane(n, -CUT);
  const planeInv = new THREE.Plane(n.clone().negate(), CUT);
  const capM = machinedCap.clone(); capM.clippingPlanes = [plane];
  const latM = machinedLathe.clone(); latM.clippingPlanes = [plane];
  const rC = roughCap.clone(); rC.clippingPlanes = [planeInv];
  const rL = roughLathe.clone(); rL.clippingPlanes = [planeInv];
  for (const m of [rC, rL]) addHeat(m, new THREE.Vector4(n.x, n.y, n.z, -CUT));
  parts = [...buildFinished([capM, latM]), ...buildFinished([rC, rL])];
}
for (const p of parts) { p.castShadow = SHADOW; p.receiveShadow = true; group.add(p); }
group.rotation.y = YAW;

if (SHADOW) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.55 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true;
  scene.add(ground);
}

const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
camera.position.set(0.2, 3.0, 4.6);
camera.lookAt(0, 0.4, 0);

renderer.render(scene, camera);
renderer.render(scene, camera);
window.__ready = true;
