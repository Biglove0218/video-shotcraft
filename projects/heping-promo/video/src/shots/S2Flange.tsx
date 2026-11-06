// S2 3D 对焊法兰（全片主角，新写镜头；风险与范围见 DESIGN-SPEC）。
// 工序：图纸线描（来图）→ 烧红毛坯自下而上成形（锻造毛坯）→ 车床旋转、刀线自颈部下扫，
// 热→冷变银亮车削面 → 8 孔加速钻出、每孔火星（精车成品）→ 环绕停稳 → 末 40f 推向中孔（穿窗交给 Main）。
// 标题入场用 blur-slide 三通道同 p（y/blur/opacity）；全片唯一的扫光由真实 3D 高光随环绕运动产生，不叠 2D sheen。
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { BORE_TOP, FlangeState, G, TARGET, cameraFrom, createFlangeScene, holeAngle } from '../three/flange';
import { C, FONT } from '../theme';
import { COPY } from '../copy';
import { EASE, Grain, Vignette, bezier, mix, ramp } from '../lib/polish';
import { SHOTS, beatF } from '../timeline';

export const CANVAS = { top: 470, w: 1080, h: 1200 };
const S2_FROM = SHOTS.s2_flange.from;
const L = (g: number) => g - S2_FROM; // 全局帧 → 本镜头帧

// 本镜头时间表（本地帧）
export const T2 = {
  fill: L(beatF(8)), // 29：毛坯成形（第 8 拍）
  lathe: L(beatF(10)), // 58：车削起刀（第 10 拍）
  latheEnd: L(beatF(14)), // 116：车削收刀（第 14 拍）
  holes: [120, 129, 137, 144, 150, 155, 159, 163], // 钻孔：间隔 9→4f 加速
  portal: L(beatF(20)), // 203：穿窗开始
};
const PORTAL_EASE = bezier(0.7, 0, 0.3, 1);

const spinVel = (l: number) => {
  const up = ramp(l, 46, 12, EASE.swift);
  const down = 1 - ramp(l, T2.latheEnd + 2, 20, EASE.out);
  return 0.55 * up * down + 0.012; // rad/f；收刀后仅剩极缓自转
};
const spinAt = (l: number) => {
  let s = 0;
  for (let i = 0; i < Math.floor(l); i++) s += spinVel(i);
  return s + spinVel(Math.floor(l)) * (l - Math.floor(l));
};

export const portalT = (l: number) => ramp(l, T2.portal, 40, PORTAL_EASE);

export const stateAt = (l: number): FlangeState => {
  const fillP = ramp(l, T2.fill, 22, EASE.out);
  const heatUp = ramp(l, T2.fill, 14, EASE.out);
  // 出炉炽热 → 车削前冷却成暗色毛坯（只剩裂隙余红）→ 车削开始后余温散尽
  const heatCool = ramp(l, T2.fill + 12, T2.lathe - T2.fill - 8, EASE.smooth);
  const heat = heatUp * mix(1.0, 0.16, heatCool) * (1 - ramp(l, T2.lathe + 4, 24, EASE.out));
  const cutP = ramp(l, T2.lathe, T2.latheEnd - T2.lathe, EASE.swift);
  const tool = ramp(l, T2.lathe - 4, 6, EASE.out) * (1 - ramp(l, T2.latheEnd, 8, EASE.out));
  const drilled = T2.holes.filter((h) => l >= h).length;
  const orbit = ramp(l, 0, T2.portal, EASE.smooth);
  const pt = portalT(l);
  const target = new THREE.Vector3().lerpVectors(TARGET, new THREE.Vector3(0, 0.95, 0), pt);
  return {
    fillY: fillP <= 0 ? -0.2 : mix(-0.1, 1.2, fillP),
    heat,
    cutY: l < T2.lathe ? 2.0 : mix(1.1, -0.08, cutP),
    tool,
    spin: spinAt(l),
    drilled,
    drillT: T2.holes,
    chips: { t: tool, frame: l },
    frame: l,
    camera: {
      az: mix(-0.5, 0.28, orbit), el: mix(0.56, 1.02, pt) + 0.04 * orbit,
      dist: mix(6.7, 6.1, orbit) * mix(1, 0.6, pt), fov: 28, target,
    },
    shadow: true,
  };
};

// 投影工具：世界点 → 成片像素坐标
const projector = (st: FlangeState) => {
  const cam = cameraFrom(st.camera, CANVAS.w / CANVAS.h);
  const v = new THREE.Vector3();
  return (x: number, y: number, z: number) => {
    v.set(x, y, z).project(cam);
    return [(v.x * 0.5 + 0.5) * CANVAS.w, CANVAS.top + (-v.y * 0.5 + 0.5) * CANVAS.h] as const;
  };
};

// 穿窗几何（Main 用）：中孔顶口在成片中的椭圆
export const boreEllipse = (globalFrame: number) => {
  const st = stateAt(L(globalFrame));
  const P = projector(st);
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const [x, y] = P(Math.cos(a) * G.bore, BORE_TOP.y, Math.sin(a) * G.bore);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: (maxX - minX) / 2, ry: (maxY - minY) / 2 };
};

// 图纸线稿（来图）：投影后的轮廓圆 + 两侧剖面线 + 中心轴
const Blueprint: React.FC<{ l: number; st: FlangeState }> = ({ l, st }) => {
  const P = projector(st);
  const circle = (r: number, y: number, cx = 0, cz = 0, n = 96) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const [x, yy] = P(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)}`;
    }
    return d;
  };
  const prof: [number, number][] = [[G.R, 0], [G.R, G.thick], [G.hubBase, G.thick]];
  for (let i = 1; i <= 16; i++) { const t = i / 16; const e = 1 - Math.pow(1 - t, 2.2); prof.push([G.hubBase + (G.neck - G.hubBase) * e, G.thick + (G.hubTop - G.thick) * t]); }
  prof.push([G.neck, G.neckTop], [0.485, G.bevelTop], [G.bore, G.bevelTop], [G.bore, -G.rfH], [G.rf, -G.rfH], [G.rf, 0], [G.R, 0]);
  const section = (az: number) => prof.map(([r, y], i) => {
    const [x, yy] = P(Math.sin(az) * r, y, Math.cos(az) * r);
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${yy.toFixed(1)}`;
  }).join('');
  const groups: { d: string; start: number; w: number }[] = [
    { d: circle(G.R, 0), start: 0, w: 2.4 },
    { d: circle(G.R, G.thick), start: 3, w: 2.4 },
    { d: circle(G.rf, -G.rfH), start: 6, w: 1.6 },
    { d: circle(G.hubBase, G.thick), start: 8, w: 2 },
    { d: circle(G.neck, G.neckTop), start: 10, w: 2 },
    { d: circle(G.bore, G.bevelTop), start: 12, w: 2 },
    { d: section(st.camera.az + Math.PI / 2), start: 14, w: 2.2 },
    { d: section(st.camera.az - Math.PI / 2), start: 16, w: 2.2 },
    ...Array.from({ length: G.holes }, (_, i) => {
      const a = holeAngle(i) + st.spin;
      return { d: circle(G.holeR, G.thick, Math.cos(a) * G.holeRc, -Math.sin(a) * G.holeRc, 32), start: 18 + i * 1.5, w: 1.6 };
    }),
  ];
  const [ax0, ay0] = P(0, -0.35, 0), [ax1, ay1] = P(0, 1.45, 0);
  const fade = 1 - ramp(l, T2.fill, 12, EASE.out);
  if (fade <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: fade, filter: 'drop-shadow(0 0 6px rgba(120,170,255,0.6))' }}>
      <line x1={ax0} y1={ay0} x2={ax1} y2={ay1} stroke={C.steel} strokeWidth={1.4} strokeDasharray="14 8 3 8" opacity={ramp(l, 2, 12, EASE.out) * 0.7} />
      {groups.map((g, i) => (
        <path key={i} d={g.d} fill="none" stroke={C.steel} strokeWidth={g.w} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(l, g.start, 22, EASE.swift)} />
      ))}
    </svg>
  );
};

const Steps: React.FC<{ l: number; steps: string[] }> = ({ l, steps }) => {
  const at = [0, T2.fill, T2.lathe];
  const colors = [C.steel, C.ember, C.steelInk];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 34 }}>
      {steps.map((s, i) => {
        const on = ramp(l, at[i] + 2, 10, EASE.out);
        const done = i < 2 ? ramp(l, at[i + 1], 10, EASE.out) : 0;
        const lit = on * (1 - 0.55 * done);
        return (
          <React.Fragment key={s}>
            {i > 0 && <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 40, color: C.mute, opacity: 0.35 + 0.65 * on }}>→</span>}
            <span style={{
              padding: '12px 26px', borderRadius: 999, fontFamily: FONT.sans, fontWeight: 900, fontSize: 44, letterSpacing: 2,
              color: lit > 0.5 ? colors[i] : C.mute, border: `2px solid ${lit > 0.5 ? colors[i] : 'rgba(255,255,255,0.18)'}`,
              background: `rgba(0,0,0,${0.35 + 0.2 * lit})`, opacity: 0.4 + 0.6 * on,
              boxShadow: lit > 0.5 ? `0 0 ${24 * lit}px ${i === 1 ? 'rgba(255,106,31,0.35)' : 'rgba(156,194,255,0.25)'}` : undefined,
            }}>{s}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const S2Flange: React.FC<{ kicker?: string; steps?: string[] }> = ({ kicker = COPY.s2Kicker, steps = COPY.s2Steps }) => {
  const l = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createFlangeScene> | null>(null);
  const [init] = useState(() => delayRender('flange-init'));
  const st = stateAt(l);

  useLayoutEffect(() => {
    scene.current = createFlangeScene(ref.current!, CANVAS.w, CANVAS.h);
    return () => scene.current?.dispose();
  }, []);
  useLayoutEffect(() => {
    scene.current!.render(st);
    continueRender(init);
  });

  // 标题 blur-slide：两段词，dy 64 / blur 18 / 22f / 间隔 4f
  const words = [kicker.slice(0, 2), kicker.slice(2)];
  const warm = st.heat;
  const pt = portalT(l);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* 地面光：左暖（毛坯）右冷（成品）；炽热期暖光增强 */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 48% 22% at 34% 64%, rgba(255,90,20,${0.16 + 0.3 * warm}), transparent 70%), radial-gradient(ellipse 48% 22% at 68% 64%, rgba(90,160,255,0.14), transparent 70%)` }} />
      <canvas ref={ref} width={CANVAS.w} height={CANVAS.h} style={{
        position: 'absolute', left: 0, top: CANVAS.top, width: CANVAS.w, height: CANVAS.h,
        // 炽热期的辉光溢出（廉价 bloom）
        filter: warm > 0.02 ? `drop-shadow(0 0 ${(18 + 26 * warm).toFixed(1)}px rgba(255,90,20,${(0.75 * warm).toFixed(3)}))` : undefined,
      }} />
      <Blueprint l={l} st={st} />
      <div style={{ position: 'absolute', left: 72, right: 72, top: 200, opacity: 1 - ramp(l, T2.portal, 16, EASE.out) }}>
        <div style={{ display: 'flex', gap: '0.08em', fontWeight: 900, fontSize: 132, lineHeight: 1.1, color: C.ink }}>
          {words.map((w, i) => {
            const p = ramp(l, 10 + i * 4, 22, EASE.out);
            return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 64).toFixed(2)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * 18).toFixed(2)}px)` : undefined }}>{w}</span>;
          })}
        </div>
        <Steps l={l} steps={steps} />
      </div>
      <Vignette strength={0.5 + 0.2 * pt} inner={0.42} color="#000000" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
