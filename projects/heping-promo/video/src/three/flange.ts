// 程序化对焊法兰（毛坯 / 车削中 / 成品）—— 由 styleframe/flange.js 演进而来。
// 纯确定性：所有纹理、火星参数由固定种子派生；场景状态完全由 FlangeState 驱动（逐帧可复现）。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ───────────── 几何常量（单位 ≈ 100mm，按常见对焊法兰比例，不对应具体规格） ─────────────
export const G = {
  R: 1.1, bore: 0.44, thick: 0.22, holes: 8, holeR: 0.088, holeRc: 0.9,
  rf: 0.72, rfH: 0.035, hubBase: 0.7, neck: 0.52, hubTop: 0.8, neckTop: 1.0, bevelTop: 1.035,
};
export const BORE_TOP = new THREE.Vector3(0, G.bevelTop, 0);
export const TARGET = new THREE.Vector3(0, 0.42, 0);

// ───────────── deterministic noise ─────────────
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function valueNoise(size: number, cells: number, seed: number) {
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
    const top = a + (b - a) * sx, bot = c + (d - c) * sx;
    out[y * size + x] = top + (bot - top) * sy;
  }
  return out;
}
function fbm(size: number, seed: number) {
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
function canvasTex(size: number, fn: (d: Uint8ClampedArray, s: number) => void, srgb = false) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  fn(img.data, size);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeTextures() {
  const ringR = mulberry32(7);
  const jitter = new Float32Array(4096).map(() => ringR());
  const ring = canvasTex(2048, (d, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = x / s - 0.5, dy = y / s - 0.5;
      const rad = Math.sqrt(dx * dx + dy * dy) * 2200;
      const k = Math.floor(rad);
      const v = 0.22 + 0.1 * (0.5 + 0.5 * Math.sin(rad * 2.1)) + 0.1 * jitter[k % 4096];
      const i = (y * s + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v * 255; d[i + 3] = 255;
    }
  });
  ring.repeat.set(1 / 2.4, 1 / 2.4); ring.offset.set(0.5, 0.5);
  const stripeR = mulberry32(11);
  const rows = new Float32Array(1024).map(() => stripeR());
  const stripe = canvasTex(1024, (d, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = 0.2 + 0.12 * rows[y] + 0.06 * Math.sin(y * 1.7);
      const i = (y * s + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v * 255; d[i + 3] = 255;
    }
  });
  stripe.wrapS = stripe.wrapT = THREE.RepeatWrapping; stripe.repeat.set(1, 3);
  const n1 = fbm(512, 3), n2 = fbm(512, 77);
  const bump = canvasTex(512, (d, s) => {
    for (let i = 0; i < s * s; i++) { const v = n1[i] * 255; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  });
  const color = canvasTex(512, (d, s) => {
    for (let i = 0; i < s * s; i++) {
      const rust = Math.min(1, Math.max(0, (n2[i] - 0.5) * 2.2));
      const a = [70, 67, 65], b = [118, 76, 62];
      for (let c = 0; c < 3; c++) d[i * 4 + c] = a[c] + (b[c] - a[c]) * rust + (n1[i] - 0.5) * 30;
      d[i * 4 + 3] = 255;
    }
  }, true);
  const spark = canvasTex(64, (d, s) => {
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = (x + 0.5) / s - 0.5, dy = (y + 0.5) / s - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy) * 2;
      const v = Math.max(0, 1 - r);
      const i = (y * s + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.pow(v, 1.6) * 255;
    }
  });
  return { ring, stripe, bump, color, spark };
}

// ───────────── geometry ─────────────
function discGeom(R: number, r: number, thick: number, holes: number, holeR: number, holeRc: number, bevel: number) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const b = new THREE.Path(); b.absarc(0, 0, r, 0, Math.PI * 2, true); s.holes.push(b);
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2 + Math.PI / holes;
    const h = new THREE.Path(); h.absarc(Math.cos(a) * holeRc, Math.sin(a) * holeRc, holeR, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: thick - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 160,
  });
  g.translate(0, 0, bevel);
  g.rotateX(-Math.PI / 2);
  return g;
}
const latheGeom = (pts: [number, number][], seg = 192) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
function hubProfile(base: number, neck: number, y0: number, y1: number, yTop: number, n = 24): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = 1 - Math.pow(1 - t, 2.2);
    pts.push([base + (neck - base) * e, y0 + (y1 - y0) * t]);
  }
  pts.push([neck, yTop]);
  return pts;
}
// 螺栓孔方位（局部坐标，绕 y 旋转之前）
export const holeAngle = (i: number) => (i / G.holes) * Math.PI * 2 + Math.PI / G.holes;
// 毛坯外轮廓半径（随高度），用于车削刀尖位置
export const blankRadiusAt = (y: number) => {
  if (y < 0.3) return 1.16;
  if (y > 1.06) return 0.36;
  const t = Math.min(1, Math.max(0, (y - 0.28) / (0.82 - 0.28)));
  const e = 1 - Math.pow(1 - t, 2.2);
  return y > 0.86 ? 0.58 : 0.78 + (0.58 - 0.78) * e;
};

// ───────────── state ─────────────
export type FlangeState = {
  fillY: number; // 毛坯自下而上成形的上沿（-0.1 = 未出现，1.2 = 完整）
  heat: number; // 毛坯整体炽热度 0..1
  cutY: number; // 车削刀线：其上为成品、其下为毛坯（1.2 = 尚未车削，-0.1 = 车完）
  tool: number; // 刀线辉光强度 0..1
  spin: number; // 车床主轴角（rad）
  drilled: number; // 已钻孔数（0..8，可带小数：小数部分 = 当前孔钻进中）
  drillT: number[]; // 每个孔的钻穿帧（相对 frame），用于火星
  chips: { t: number; frame: number }; // 车削铁屑：当前帧
  frame: number;
  camera: { az: number; el: number; dist: number; fov: number; target: THREE.Vector3 };
  shadow: boolean;
};

export function cameraFrom(c: FlangeState['camera'], aspect: number) {
  const cam = new THREE.PerspectiveCamera(c.fov, aspect, 0.1, 100);
  const p = new THREE.Vector3(
    c.target.x + c.dist * Math.cos(c.el) * Math.sin(c.az),
    c.target.y + c.dist * Math.sin(c.el),
    c.target.z + c.dist * Math.cos(c.el) * Math.cos(c.az),
  );
  cam.position.copy(p);
  cam.lookAt(c.target);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}

// ───────────── scene ─────────────
export function createFlangeScene(canvas: HTMLCanvasElement, W: number, H: number) {
  const tex = makeTextures();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const key = new THREE.DirectionalLight(0xfff4ea, 2.0);
  key.position.set(2.5, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -2.5;
  key.shadow.camera.right = key.shadow.camera.top = 2.5;
  key.shadow.radius = 6; key.shadow.bias = -0.0006;
  scene.add(key);
  const rimL = new THREE.PointLight(0xff6a1f, 5.5, 0, 1.4); rimL.position.set(-3.2, 1.2, -1.5); scene.add(rimL);
  const rimR = new THREE.PointLight(0x9cc2ff, 4.0, 0, 1.4); rimR.position.set(3.2, 1.6, -1.8); scene.add(rimR);
  const heatLight = new THREE.PointLight(0xff5a14, 0, 6, 1.6); heatLight.position.set(0, 0.6, 1.2); scene.add(heatLight);
  const drillLight = new THREE.PointLight(0xffc070, 0, 3, 2); scene.add(drillLight);

  // materials
  const uCut = { value: 2.0 }, uFill = { value: 2.0 }, uHeat = { value: 0 }, uTool = { value: 0 };
  const inject = (mat: THREE.Material, kind: 'finished' | 'blank') => {
    mat.customProgramCacheKey = () => `flange-${kind}`;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uCut = uCut; sh.uniforms.uFill = uFill; sh.uniforms.uHeat = uHeat; sh.uniforms.uTool = uTool;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed,1.0)).xyz;');
      const body = kind === 'blank'
        ? `float dc = abs(vWP.y - uCut); float df = abs(vWP.y - uFill);
           float nb = texture2D(bumpMap, vBumpMapUv * 3.3).r;
           // 注：漫反射在 emissive 之前已累计到 diffuseColor，这里只能通过降低反射项无法回溯，故在 map 片段处压暗（见下方 map 注入）
           float ridge = 1.0 - abs(nb * 2.0 - 1.0);
           float vein = smoothstep(0.90, 0.99, ridge); // 氧化皮龟裂缝里透出的炽光
           vec3 heatCol = mix(vec3(0.5,0.04,0.0), vec3(1.0,0.28,0.03), clamp(uHeat,0.0,1.0));
           totalEmissiveRadiance += heatCol * uHeat * (0.24 + 1.8 * vein);
           totalEmissiveRadiance += vec3(1.0,0.32,0.05) * exp(-dc*18.0) * 1.2 * uTool + vec3(1.0,0.7,0.35) * exp(-dc*80.0) * 1.8 * uTool;
           totalEmissiveRadiance += vec3(1.0,0.62,0.28) * exp(-df*40.0) * 1.6 * step(uFill, 1.15);`
        : `float dc = abs(vWP.y - uCut);
           totalEmissiveRadiance += vec3(1.0,0.93,0.82) * exp(-dc*90.0) * 3.2 * uTool + vec3(1.0,0.6,0.3) * exp(-dc*24.0) * 0.5 * uTool;`;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uCut; uniform float uFill; uniform float uHeat; uniform float uTool;')
        .replace('#include <map_fragment>', kind === 'blank' ? '#include <map_fragment>\ndiffuseColor.rgb *= (1.0 - 0.72 * clamp(uHeat, 0.0, 1.0));' : '#include <map_fragment>')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${body}`);
    };
  };
  const pFin = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2); // 保留 y > cut
  const pBlankCut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2); // 保留 y < cut
  const pBlankFill = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2); // 保留 y < fill
  const machinedCap = new THREE.MeshPhysicalMaterial({
    color: 0xd2d7dc, metalness: 1, roughness: 1, roughnessMap: tex.ring, clearcoat: 0.15, clearcoatRoughness: 0.3, side: THREE.DoubleSide,
    clippingPlanes: [pFin],
  });
  const machinedLathe = machinedCap.clone(); machinedLathe.roughnessMap = tex.stripe; machinedLathe.clippingPlanes = [pFin];
  inject(machinedCap, 'finished'); inject(machinedLathe, 'finished');
  const roughBase = { color: 0xffffff, metalness: 0.55, roughness: 0.88, bumpScale: 4, side: THREE.DoubleSide, clippingPlanes: [pBlankCut, pBlankFill] };
  const cMap = (rx: number, ry: number) => { const t = tex.color.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  const bMap = (rx: number, ry: number) => { const t = tex.bump.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  const roughCap = new THREE.MeshStandardMaterial({ ...roughBase, map: cMap(0.45, 0.45), bumpMap: bMap(0.45, 0.45) });
  const roughLathe = new THREE.MeshStandardMaterial({ ...roughBase, map: cMap(2, 0.5), bumpMap: bMap(2, 0.5) });
  inject(roughCap, 'blank'); inject(roughLathe, 'blank');

  // groups (spin together on the lathe axis)
  const spinner = new THREE.Group(); scene.add(spinner);
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true; spinner.add(mesh); return mesh;
  };
  // finished
  add(discGeom(G.R, G.bore, G.thick, G.holes, G.holeR, G.holeRc, 0.012), machinedCap);
  const rf = discGeom(G.rf, G.bore, G.rfH, 0, 0, 0, 0.004); rf.translate(0, -G.rfH, 0); add(rf, machinedCap);
  add(latheGeom(hubProfile(G.hubBase, G.neck, G.thick, G.hubTop, G.neckTop)), machinedLathe);
  add(latheGeom([[G.neck, G.neckTop], [0.485, G.bevelTop], [G.bore, G.bevelTop]]), machinedLathe);
  add(latheGeom([[G.bore, G.bevelTop], [G.bore, -G.rfH]]), machinedLathe);
  // 未钻的孔：塞柱（与孔壁重合，钻穿即隐藏）
  const plugs: THREE.Mesh[] = [];
  for (let i = 0; i < G.holes; i++) {
    const a = holeAngle(i);
    const g = new THREE.CylinderGeometry(G.holeR + 0.001, G.holeR + 0.001, G.thick - 0.002, 32);
    g.translate(Math.cos(a) * G.holeRc, G.thick / 2, -Math.sin(a) * G.holeRc);
    plugs.push(add(g, machinedCap));
  }
  // blank（锻造毛坯：加大余量、无螺栓孔、冲孔较小、圆角）
  add(discGeom(1.16, 0.36, 0.3, 0, 0, 0, 0.05), roughCap);
  const hub = hubProfile(0.78, 0.58, 0.28, 0.82, 1.02); hub.push([0.55, 1.06], [0.36, 1.06]);
  add(latheGeom(hub), roughLathe);
  add(latheGeom([[0.36, 1.06], [0.36, 0.0]]), roughLathe);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.55 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true; scene.add(ground);

  // sparks（车削铁屑 + 钻孔火星）——CPU 计算位置，逐帧确定
  const MAXP = 360;
  const sGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(MAXP * 3), sCol = new Float32Array(MAXP * 3);
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const sMat = new THREE.PointsMaterial({
    size: 0.085, map: tex.spark, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const sparks = new THREE.Points(sGeo, sMat); sparks.frustumCulled = false; scene.add(sparks);
  const hr = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  function updateSparks(st: FlangeState) {
    let n = 0;
    const push = (x: number, y: number, z: number, heat: number) => {
      if (n >= MAXP) return;
      sPos[n * 3] = x; sPos[n * 3 + 1] = y; sPos[n * 3 + 2] = z;
      // heat 1 = 白热，0 = 暗橙
      sCol[n * 3] = 1.0 * heat + 0.9 * (1 - heat);
      sCol[n * 3 + 1] = 0.85 * heat + 0.3 * (1 - heat);
      sCol[n * 3 + 2] = 0.6 * heat + 0.05 * (1 - heat);
      n++;
    };
    // 车削铁屑：刀尖在画面右侧轮廓（世界 x 正方向偏向相机）
    if (st.tool > 0.02) {
      for (let k = 0; k < 18; k++) {
        const e = st.frame - k; // 发射帧：每帧发一簇新屑，粒子随帧流动
        for (let j = 0; j < 9; j++) {
          const id = e * 31 + j;
          const age = k + hr(id) * 0.8;
          const life = 10 + hr(id + 1) * 8;
          if (age > life) continue;
          const yb = st.cutY + (hr(id + 2) - 0.5) * 0.02;
          const r = blankRadiusAt(yb) * 1.0;
          const ang = st.camera.az + 0.95; // 刀尖位于相机右前方
          const x0 = Math.sin(ang) * r, z0 = Math.cos(ang) * r;
          const tx = Math.cos(ang), tz = -Math.sin(ang); // 切向（主轴旋转方向）
          const sp = (0.05 + hr(id + 3) * 0.07) * st.tool;
          const out = 0.02 + hr(id + 4) * 0.03;
          const t = age;
          push(x0 + (tx * sp + Math.sin(ang) * out) * t, yb + 0.03 * t - 0.0035 * t * t, z0 + (tz * sp + Math.cos(ang) * out) * t, Math.max(0, 1 - t / life));
        }
      }
    }
    // 钻孔火星：每孔钻穿时一簇向上迸溅
    st.drillT.forEach((ft, i) => {
      const age = st.frame - ft;
      if (age < 0 || age > 22) return;
      const a = holeAngle(i) + st.spin;
      const hx = Math.cos(a) * G.holeRc, hz = -Math.sin(a) * G.holeRc;
      for (let j = 0; j < 30; j++) {
        const id = i * 97 + j;
        const th = hr(id) * Math.PI * 2;
        const v = 0.025 + hr(id + 5) * 0.035;
        const up = 0.05 + hr(id + 6) * 0.05;
        const t = age;
        push(hx + Math.cos(th) * v * t, G.thick + up * t - 0.004 * t * t, hz + Math.sin(th) * v * t, Math.max(0, 1 - t / 22));
      }
    });
    for (let i = n; i < MAXP; i++) { sPos[i * 3 + 1] = -100; }
    sGeo.attributes.position.needsUpdate = true;
    sGeo.attributes.color.needsUpdate = true;
    sGeo.setDrawRange(0, n);
  }

  function render(st: FlangeState) {
    uCut.value = st.cutY; uFill.value = st.fillY; uHeat.value = st.heat; uTool.value = st.tool;
    pFin.constant = -st.cutY;
    pBlankCut.constant = st.cutY;
    pBlankFill.constant = st.fillY;
    spinner.rotation.y = st.spin;
    plugs.forEach((p, i) => { p.visible = i >= Math.floor(st.drilled); });
    heatLight.intensity = 3.5 * st.heat + 2.5 * st.tool;
    // 钻孔瞬间点光
    let dl = 0, dIdx = -1;
    st.drillT.forEach((ft, i) => { const a = st.frame - ft; if (a >= 0 && a < 8) { const v = 1 - a / 8; if (v > dl) { dl = v; dIdx = i; } } });
    drillLight.intensity = 6 * dl;
    if (dIdx >= 0) { const a = holeAngle(dIdx) + st.spin; drillLight.position.set(Math.cos(a) * G.holeRc, 0.5, -Math.sin(a) * G.holeRc); }
    renderer.shadowMap.enabled = st.shadow;
    updateSparks(st);
    const cam = cameraFrom(st.camera, W / H);
    renderer.render(scene, cam);
  }

  return { render, dispose: () => renderer.dispose() };
}
