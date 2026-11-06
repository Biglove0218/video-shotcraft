// S6 规格 —— wall-reveal-moves · bento-light-up 适配（demos/ui-entrance/wall-reveal-moves/BentoLightUp.tsx）。
// 保留：hold 20f（这里 10f，镜头短）→ 每格间隔 12f 激活；彗星描边 8f（22% 周长亮头 + 辉光，Out cubic），
// 描边过半 +6f 内容 back-out(0.3,1.4,0.5,1) 弹出 8f 提亮上浮（暗态 0.18 / translateY 20）；描完 +12f 退火到 0.4 细边；
// 全亮后 scale 1→1.04 缓推 25f（bezier 0.33,0,0.2,1）→ 静止。原位显形不位移。
// 适配：竖屏 bento = 上一宽格 + 下两窄格；底景为照片③同心圆车削纹理极缓旋转；彗星色换品牌橙。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, GRADE } from '../theme';
import { COPY } from '../copy';
import { Grain, Vignette } from '../lib/polish';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const FIRST = 12; // 原卡 hold 20f，镜头时长受拍点约束压到 12f
const GAP = 12;
const CELLS = [
  { x: 72, y: 760, w: 936, h: 300 },
  { x: 72, y: 1100, w: 448, h: 340 },
  { x: 560, y: 1100, w: 448, h: 340 },
];
const COMET = C.ember;
const COMET_CORE = '#ffd9b8';

const Cell: React.FC<{ i: number; f: number; k: string; v: string }> = ({ i, f, k, v }) => {
  const start = FIRST + i * GAP;
  const { x, y, w, h } = CELLS[i];
  const draw = interpolate(f, [start, start + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const strokeFade = interpolate(f, [start + 12, start + 26], [1, 0.4], { ...clamp, easing: Easing.out(Easing.quad) });
  const ring = interpolate(f, [start + 2, start + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const lit = interpolate(f, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const rise = interpolate(f, [start + 6, start + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 1.4, 0.5, 1) });
  const jitter = Math.abs((Math.sin(i * 127.3) * 43758.5453) % 1);
  const pulse = lit * (1 - lit) * 4;
  const head = 100 * draw;
  const TAIL = 22;
  const ty = 20 * (1 - rise);
  const wide = i === 0;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.18 + 0.82 * lit, transform: `translateY(${ty.toFixed(2)}px)`, borderRadius: 16, overflow: 'hidden',
        background: 'linear-gradient(170deg, rgba(34,38,44,0.94) 0%, rgba(18,20,24,0.94) 60%, rgba(14,15,18,0.95) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 30px 70px rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(90% 70% at 50% 0%, rgba(255,106,31,${(0.18 * pulse * (0.8 + jitter * 0.4)).toFixed(3)}), rgba(255,106,31,0) 70%)` }} />
        <div style={{ position: 'absolute', left: 40, top: 36, fontFamily: FONT.sans, fontWeight: 700, fontSize: 44, letterSpacing: 6, color: C.mute }}>{k}</div>
        <div style={{
          position: 'absolute', left: 40, bottom: wide ? 40 : 44, fontFamily: FONT.sans, fontWeight: 900, fontSize: wide ? 120 : 76, lineHeight: 1, color: C.ink, whiteSpace: 'nowrap',
        }}>
          {v.split(/([0-9A-Za-z#·]+)/).map((seg, j) => (/[0-9A-Za-z#]/.test(seg)
            ? <span key={j} style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: wide ? 136 : 88, color: wide ? C.ember : C.steelInk }}>{seg}</span>
            : <span key={j}>{seg}</span>))}
        </div>
      </div>
      {draw > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', left: 0, top: ty, overflow: 'visible' }}>
          <defs><filter id={`sg-${i}`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={4 + jitter * 2} /></filter></defs>
          <rect x={0.75} y={0.75} width={w - 1.5} height={h - 1.5} rx={16} fill="none" stroke={COMET} strokeWidth={1.5} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)} opacity={ring * strokeFade} />
          {[0, 1].map((kk) => (
            <rect key={kk} x={1.5} y={1.5} width={w - 3} height={h - 3} rx={16} fill="none" stroke={kk ? COMET_CORE : COMET} strokeWidth={kk ? 2.5 : 6} strokeLinecap="round"
              pathLength={100} strokeDasharray={`${TAIL} ${100 - TAIL}`} strokeDashoffset={TAIL - head}
              opacity={(1 - interpolate(f, [start + 8, start + 16], [0, 1], clamp)) * (kk ? 1 : 0.8)} filter={kk ? undefined : `url(#sg-${i})`} />
          ))}
        </svg>
      )}
    </div>
  );
};

export const S6Specs: React.FC<{ kicker?: string; specs?: { k: string; v: string }[] }> = ({ kicker = COPY.s6Kicker, specs = COPY.specs }) => {
  const f = useCurrentFrame();
  const allLit = FIRST + (CELLS.length - 1) * GAP + 14;
  const push = interpolate(f, [allLit, allLit + 25], [1, 1.04], { ...clamp, easing: Easing.bezier(0.33, 0, 0.2, 1) });
  const titleLit = interpolate(f, [FIRST - 6, FIRST + 14], [0.25, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const rot = f * 0.12; // 车削纹理极缓旋转（度/帧）
  return (
    <AbsoluteFill style={{ background: C.bgCool, overflow: 'hidden', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', left: 540 - 1050, top: 1000 - 1050, width: 2100, height: 2100, transform: `rotate(${rot.toFixed(3)}deg)`, opacity: 0.55 }}>
        <Img src={staticFile('img/p3.jpg')} style={{ position: 'absolute', left: 250, top: 250, width: 1600, height: 1600, objectFit: 'cover', objectPosition: '45% 55%', filter: `${GRADE.cold} brightness(0.55) blur(1.5px)`, borderRadius: '50%' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 55%, rgba(11,16,20,0.35), rgba(11,16,20,0.92) 75%)' }} />
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: '540px 1000px' }}>
        <div style={{ position: 'absolute', left: 72, top: 560, opacity: titleLit }}>
          <div style={{ fontWeight: 900, fontSize: 92, lineHeight: 1.1, color: C.ink }}>{kicker}</div>
          <div style={{ width: 360, height: 3, marginTop: 26, background: `linear-gradient(90deg, ${C.ember}, transparent)` }} />
        </div>
        {specs.map((s, i) => <Cell key={s.k} i={i} f={f} k={s.k} v={s.v} />)}
      </div>
      <Vignette strength={0.5} inner={0.4} color="#000000" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
