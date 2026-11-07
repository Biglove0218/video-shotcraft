// 片段：镜头 + 接缝转场的组合单元（Main 与 workbench 清单共用，保证拆解导入与原片同源）。
// 每个片段用本地帧（所在 <Sequence> 的 from 即片段起点），内部换算成全局帧再查 SHOTS / SEAMS。
import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { EASE, Grain, SpeedBlur, bezier, mix, ramp, velocity } from './lib/polish';
import { S1Brand } from './shots/S1Brand';
import { S2Flange, boreEllipse, portalT } from './shots/S2Flange';
import { S3Slip } from './shots/S3Slip';
import { S4Forge } from './shots/S4Forge';
import { S5Supply } from './shots/S5Supply';
import { S6Specs } from './shots/S6Specs';
import { S7Outro } from './shots/S7Outro';
import { H, SEAMS, SHOTS, W } from './timeline';
import { COPY } from './copy';



// 相对片段起点挂载一个镜头
const Seq: React.FC<{ shot: { from: number; to: number }; base: number; children: React.ReactNode }> = ({ shot, base, children }) => (
  <Sequence from={shot.from - base} durationInFrames={shot.to - shot.from} layout="none">{children}</Sequence>
);

// ── S1→S2 琥珀漏光（transition-hidden-cut · light-leak-burn，LightLeakBurn.tsx 参数） ──
const PEAK = SEAMS.leakPeak;
const LEAK_IN = PEAK - 28;
const LEAK_OUT = PEAK + 43;
const leakIntensity = (f: number) => (f <= PEAK ? ramp(f, LEAK_IN, PEAK - LEAK_IN, (t) => t * t) : 1 - ramp(f, PEAK, LEAK_OUT - PEAK, EASE.out));
const LeakOverlay: React.FC = () => {
  const f = useCurrentFrame(); // SegOpen 从 0 起，本地帧 = 全局帧
  const intensity = leakIntensity(f);
  if (intensity <= 0.003) return null;
  const sweep = ramp(f, LEAK_IN, LEAK_OUT - LEAK_IN, (t) => 1 - Math.pow(1 - t, 1.2));
  // 竖屏对角线：右上外 → 左下外
  const cx = mix(1400, -420, sweep), cy = mix(-520, 2440, sweep);
  const blobs = [
    { d: 3000, c: '194,49,26', a: 0.6, o: 360 },
    { d: 2300, c: '255,90,31', a: 0.8, o: 160 },
    { d: 1700, c: '255,179,71', a: 0.95, o: 0 },
  ];
  const core = Math.pow(intensity, 3);
  const cutFlash = f === PEAK || f === PEAK + 1 ? 0.25 : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: intensity, background: 'linear-gradient(210deg, rgba(255,179,71,0.9) 0%, rgba(255,90,31,0.55) 14%, rgba(194,49,26,0.2) 30%, rgba(0,0,0,0) 46%)' }} />
      {blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', left: cx - b.d / 2 + b.o * 0.5, top: cy - b.d / 2.7 - b.o * 0.85, width: b.d, height: b.d / 1.35, borderRadius: '50%',
          transform: 'rotate(-61deg)', mixBlendMode: 'screen', opacity: b.a * intensity,
          background: `radial-gradient(closest-side, rgba(${b.c},1) 0%, rgba(${b.c},0.65) 35%, rgba(${b.c},0) 100%)`,
        }} />
      ))}
      <div style={{ position: 'absolute', left: cx - 1100, top: cy - 700, width: 2200, height: 1400, borderRadius: '50%', transform: 'rotate(-61deg)', mixBlendMode: 'screen', opacity: core, background: 'radial-gradient(closest-side, #fff6e6 0%, rgba(255,236,200,0.9) 40%, rgba(255,200,130,0) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: '#ff9a4a', mixBlendMode: 'screen', opacity: 0.4 * intensity * intensity + cutFlash }} />
    </AbsoluteFill>
  );
};
const burnFilter = (f: number) => {
  const i = leakIntensity(f);
  return i > 0.01 ? `brightness(${(1 + i * 0.85).toFixed(3)}) contrast(${(1 - i * 0.5).toFixed(3)}) saturate(${(1 - i * 0.25).toFixed(3)})` : undefined;
};

// ── S2→S3 穿过法兰中孔（shot-transitions · mask-wipe，PortalWipeV2.tsx 参数：40f bezier(0.7,0,0.3,1)，窗内 0.42→1 同一 t） ──
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame();
  const g = SEAMS.portalStart + f; // 本 Sequence 从 portalStart 起
  const t = portalT(g - SHOTS.s2_flange.from);
  if (t >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const b = boreEllipse(g);
  const full = Math.hypot(W / 2, H / 2) * 1.12;
  const cx = mix(b.cx, W / 2, t), cy = mix(b.cy, H / 2, t);
  const rx = mix(b.rx * 0.96, full, t), ry = mix(b.ry * 0.96, full, t);
  const s = mix(0.42, 1, t);
  // 柔边窗：羽化宽度随窗变大而变宽（约 6%→14%），没有一刀切的硬边
  const feather = mix(6, 14, t);
  const win = (inside: string, outside: string) =>
    `radial-gradient(ellipse ${rx.toFixed(1)}px ${ry.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${inside} ${(100 - feather).toFixed(1)}%, ${outside} 100%)`;
  const oldDim = 0.55 * ramp(f, 0, 30, EASE.smooth); // 窗外旧景随穿越渐暗
  const innerBlur = 7 * (1 - ramp(f, 4, 30, EASE.out)); // 窗内新景由虚到实
  const innerLift = 1 + 0.25 * Math.sin(Math.PI * t); // 穿越中段一点亮度，像穿过光口
  return (
    <>
    <AbsoluteFill style={{ background: `rgba(4,6,10,${oldDim.toFixed(3)})`, WebkitMaskImage: win('transparent', '#000'), maskImage: win('transparent', '#000') }} />
    <AbsoluteFill style={{ WebkitMaskImage: win('#000', 'transparent'), maskImage: win('#000', 'transparent') }}>
      {/* 窗内底色铺满：缩小中的新景外沿不能露出成矩形 */}
      <AbsoluteFill style={{ background: '#0a0b0c' }} />
      <AbsoluteFill style={{
        transform: `translate(${(cx - W / 2).toFixed(2)}px, ${(cy - H / 2).toFixed(2)}px) scale(${s.toFixed(4)})`, transformOrigin: '50% 50%',
        filter: `${innerBlur > 0.1 ? `blur(${innerBlur.toFixed(2)}px) ` : ''}brightness(${innerLift.toFixed(3)})`,
      }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
    </>
  );
};

// ── S3→S4 前景遮挡隐形切（transition-hidden-cut · invisible-cut，InvisibleCut.tsx 参数按 1080 宽缩放） ──
const OCC = { soft: 210, core: 1500, dur: 14 };
const OCC_W = OCC.soft * 2 + OCC.core;
const occEase = bezier(0.3, 0, 0.7, 1);
export const occLeft = (g: number) => mix(W, -OCC_W, occEase(Math.min(1, Math.max(0, (g - SEAMS.occluderStart) / OCC.dur))));
export const Occluder: React.FC = () => {
  const f = useCurrentFrame();
  const g = SEAMS.occluderStart + f;
  if (g > SEAMS.occluderStart + OCC.dur) return null;
  const x = occLeft(g);
  const v = velocity(occLeft, g);
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* 近物遮光：前方软投影 */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: x - 360, width: 360, background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.38) 60%, rgba(0,0,0,0.5))' }} />
      <SpeedBlur vx={v} amount={0.05} max={30}>
        <div style={{
          position: 'absolute', top: -40, bottom: -40, left: x, width: OCC_W,
          background: `linear-gradient(90deg, rgba(20,13,9,0) 0px, rgba(20,13,9,0.92) ${OCC.soft * 0.7}px, #140d09 ${OCC.soft}px, #1d140e ${OCC.soft + OCC.core * 0.5}px, #140d09 ${OCC.soft + OCC.core}px, rgba(20,13,9,0.92) ${OCC.soft + OCC.core + OCC.soft * 0.3}px, rgba(20,13,9,0) ${OCC_W}px)`,
        }}>
          {/* 前缘一道赤陶轮廓光（钢柱受炉火侧光） */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: OCC.soft * 0.55, width: 70, background: 'linear-gradient(90deg, rgba(255,106,31,0), rgba(255,120,50,0.35), rgba(255,106,31,0))', filter: 'blur(10px)' }} />
        </div>
      </SpeedBlur>
    </AbsoluteFill>
  );
};

// ── S4→S5 竖向甩镜（shot-transitions · whip-pan 急刹款，WhipBrakeReal.tsx 速度曲线积分表） ──
const STEP = 0.05;
const WHIP_TABLE = (() => {
  const n = Math.round(60 / STEP);
  const vel = (u: number) => { const r = Math.min(1, u / 3); return Math.exp((-6 * u) / 60) * r * r * (3 - 2 * r); };
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + ((vel((i - 1) * STEP) + vel(i * STEP)) / 2) * STEP;
  for (let i = 0; i <= n; i++) out[i] /= out[n];
  return out;
})();
const whipP = (u: number) => {
  if (u <= 0) return 0;
  if (u >= 60) return 1;
  const x = u / STEP, i = Math.floor(x);
  return WHIP_TABLE[i] + (WHIP_TABLE[i + 1] - WHIP_TABLE[i]) * (x - i);
};
const WHIP_D = 3800; // 跨度按峰值 ≥300px/f 配
const whipY = (g: number) => WHIP_D * whipP(g - SEAMS.whipStart);


type P<T> = T extends React.FC<infer Q> ? Q : never;

// 片段 1：S1 品牌开场 + 琥珀漏光 + S2 3D 对焊法兰（0 → S2 结束）
export const SEG_OPEN = { from: 0, to: SHOTS.s2_flange.to };
export const SegOpen: React.FC<{ s1?: P<typeof S1Brand>; s2?: P<typeof S2Flange> }> = ({ s1, s2 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: burnFilter(f) }}>
        <Seq shot={SHOTS.s1_brand} base={0}><S1Brand {...s1} /></Seq>
        <Seq shot={SHOTS.s2_flange} base={0}><S2Flange {...s2} /></Seq>
      </AbsoluteFill>
      <LeakOverlay />
    </AbsoluteFill>
  );
};

// 片段 2：S3 平焊法兰，从法兰中孔的窗里长出来
export const SEG_SLIP = { from: SHOTS.s3_slip.from, to: SHOTS.s3_slip.to };
export const SegSlip: React.FC<P<typeof S3Slip>> = (props) => {
  const g = useCurrentFrame() + SEG_SLIP.from;
  const drag = -28 * ramp(g, SEAMS.occluderStart, SEAMS.occluderCut - SEAMS.occluderStart, EASE.exit);
  return <AbsoluteFill style={{ transform: `translateX(${drag.toFixed(2)}px)` }}><Portal><S3Slip {...props} /></Portal></AbsoluteFill>;
};

// 片段 3：S4 毛坯锻件三连闪 → 竖向甩镜 → S5 一站供应
export const SEG_FORGE = { from: SHOTS.s4_forge.from, to: SHOTS.s5_supply.to };
export const SegForge: React.FC<{ s4?: P<typeof S4Forge>; s5?: P<typeof S5Supply> }> = ({ s4, s5 }) => {
  const g = useCurrentFrame() + SEG_FORGE.from;
  const base = SEG_FORGE.from;
  const inWhip = g >= SEAMS.whipStart && g < SEAMS.whipStart + 60;
  const wy = whipY(g);
  const wv = velocity(whipY, g);
  const s5Fade = 1 - ramp(g, SEAMS.dipStart, 10, EASE.out);
  return (
    <SpeedBlur vx={0} vy={inWhip ? -wv : 0} amount={0.085} max={64}>
      <AbsoluteFill style={{ transform: `translate(${(28 * (1 - ramp(g, SEAMS.occluderCut, 14, EASE.out))).toFixed(2)}px, ${(-wy).toFixed(2)}px)` }}>
        {g < SHOTS.s4_forge.to && (
          <AbsoluteFill><Seq shot={SHOTS.s4_forge} base={base}><S4Forge {...s4} /></Seq></AbsoluteFill>
        )}
        {inWhip && (
          <AbsoluteFill style={{ top: H, bottom: 'auto', height: WHIP_D - H }}>
            {['img/p3.jpg', 'img/p1.jpg'].map((src, i) => (
              <Img key={src} src={staticFile(src)} style={{
                position: 'absolute', left: 0, top: i * ((WHIP_D - H) / 2), width: W, height: (WHIP_D - H) / 2, objectFit: 'cover',
                filter: i === 0 ? 'grayscale(0.6) brightness(0.45) contrast(1.1)' : 'sepia(0.3) brightness(0.4) contrast(1.15)',
              }} />
            ))}
            <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0b0806 0%, rgba(11,8,6,0.45) 14%, rgba(11,12,14,0.45) 50%, rgba(8,10,12,0.6) 70%, #04060a 92%)' }} />
          </AbsoluteFill>
        )}
        {g >= SHOTS.s5_supply.from && (
          <AbsoluteFill style={{ top: WHIP_D, bottom: 'auto', height: H, opacity: s5Fade }}>
            <Seq shot={SHOTS.s5_supply} base={base}><S5Supply {...s5} /></Seq>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </SpeedBlur>
  );
};

// 片段 4：S6 规格逐格点亮（进入时压暗交棒，S7 起在下方糊成景深）
export const SEG_SPECS = { from: SHOTS.s6_specs.from, to: SHOTS.s6_specs.to };
export const SegSpecs: React.FC<P<typeof S6Specs>> = (props) => {
  const g = useCurrentFrame() + SEG_SPECS.from;
  const s6In = ramp(g, SHOTS.s6_specs.from, 8, EASE.out);
  const s6Blur = interpolate(g, [SHOTS.s7_outro.from, SHOTS.s7_outro.from + 24], [0, 14], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: bezier(0.4, 0, 0.4, 1) });
  return (
    <AbsoluteFill style={{ opacity: s6In, filter: s6Blur > 0.05 ? `blur(${s6Blur.toFixed(2)}px)` : undefined }}>
      <S6Specs {...props} />
    </AbsoluteFill>
  );
};

// 片段 5：S7 合影 + 联系卡
export const SEG_OUTRO = { from: SHOTS.s7_outro.from, to: SHOTS.s7_outro.to };
export const SegOutro: React.FC<P<typeof S7Outro>> = (props) => <S7Outro {...props} />;

export const SEG_OCCLUDER = { from: SEAMS.occluderStart, to: SEAMS.occluderStart + OCC.dur + 2 };
export { COPY };
