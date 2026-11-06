// S4 毛坯锻件 —— beat-cut-moves · paparazzi-flash 适配（demos/rhythm/beat-cut-moves/PaparazziFlash.tsx）。
// 保留：闪前 ≥30f 活素材缓推；三闪间隔 22f→18f（第 32 拍爆点 / 33.5 拍 / 34.75 拍）；白闪 0.95→0 走 4f +
// 闪帧 ±2px 哈希抖动；切入 1.03→1 回落 6f + −16px 沉降；过曝 7f 回落；定格 = 照片（微去饱和 + 提对比）；
// 下一闪前 8f 对焊框从 1.3 倍收到下一张裁切、闪前 3f 转强调色锁定；第三闪后 hold 70f，只有 1→1.015 极缓推近。
// 适配：素材是照片①（1080×1920 实拍）；三裁切 1.0 / 1.5 / 2.1（原卡 2.8 会把实拍放糊，降档记入 spec）；
// 取景器 HUD 只留四角取景框与对焦框（去掉英文相机读数）；hold 段在顶部压暗区出现镜头字幕。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, GRADE } from '../theme';
import { COPY } from '../copy';
import { EASE, Grain, Vignette, mix, ramp } from '../lib/polish';
import { SEAMS, SHOTS } from '../timeline';

const L = (g: number) => g - SHOTS.s4_forge.from;
const FLASHES = SEAMS.flashes.map(L); // 36 / 58 / 76
const F1 = FLASHES[0];
const SETTLE = 6, DECAY = 4, BLOOM = 7, AF = 8;

const hash = (i: number) => { const s = Math.sin(i * 127.3 + 11.7) * 43758.5453; return s - Math.floor(s); };

type View = { scale: number; cx: number; cy: number };
const VIEW_WIDE: View = { scale: 1.0, cx: 540, cy: 960 };
const VIEW_MID: View = { scale: 1.5, cx: 640, cy: 1040 };
const VIEW_CLOSE: View = { scale: 2.1, cx: 735, cy: 1170 };
const STILLS = [VIEW_WIDE, VIEW_MID, VIEW_CLOSE];
const BIN = { x: 40, y: 380, w: 1010, h: 1260 };

const project = (r: { x: number; y: number; w: number; h: number }, v: View) => ({
  x: (r.x - v.cx) * v.scale + 540, y: (r.y - v.cy) * v.scale + 960, w: r.w * v.scale, h: r.h * v.scale,
});
const viewRect = (v: View) => ({ x: v.cx - 540 / v.scale, y: v.cy - 960 / v.scale, w: 1080 / v.scale, h: 1920 / v.scale });

const Brackets: React.FC<{ x: number; y: number; w: number; h: number; color: string; arm?: number; width?: number; opacity?: number }> = ({ x, y, w, h, color, arm = 46, width = 3, opacity = 1 }) => {
  const a = Math.min(arm, w / 3, h / 3);
  const d = `M${x} ${y + a}V${y}H${x + a} M${x + w - a} ${y}H${x + w}V${y + a} M${x + w} ${y + h - a}V${y + h}H${x + w - a} M${x + a} ${y + h}H${x}V${y + h - a}`;
  return <path d={d} stroke={color} strokeWidth={width} fill="none" opacity={opacity} strokeLinecap="square" />;
};

const Photo: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <Img src={staticFile('img/p1.jpg')} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, filter: GRADE.hot }} />
    <div style={{ position: 'absolute', inset: 0, background: GRADE.tintHot, mixBlendMode: 'color' }} />
  </div>
);
const Still: React.FC<{ view: View }> = ({ view }) => (
  <div style={{ position: 'absolute', left: 540 / view.scale - view.cx, top: 960 / view.scale - view.cy, width: 1080, height: 1920, zoom: view.scale }}>
    <Photo />
  </div>
);

export const S4Forge: React.FC<{ kicker?: string; title?: string[] }> = ({ kicker = COPY.s4Kicker, title = COPY.s4Title }) => {
  const f = useCurrentFrame();
  let seg = -1;
  for (let i = 0; i < FLASHES.length; i++) if (f >= FLASHES[i]) seg = i;

  let settleScale = 1, settleY = 0, bloom = 0;
  if (seg >= 0) {
    const t = 1 - ramp(f, FLASHES[seg], SETTLE, EASE.out);
    settleScale = 1 + 0.03 * t; settleY = -16 * t;
    bloom = 1 - ramp(f, FLASHES[seg], BLOOM, EASE.out);
  }
  let flash = 0;
  for (const ff of FLASHES) if (f >= ff && f <= ff + DECAY) flash = Math.max(flash, 0.95 * (1 - ramp(f, ff, DECAY, EASE.out)));
  const inFlash = FLASHES.some((ff) => f >= ff && f < ff + DECAY);
  const jx = inFlash ? 2 * (hash(f * 7 + 1) * 2 - 1) : 0;
  const jy = inFlash ? 2 * (hash(f * 13 + 5) * 2 - 1) : 0;

  const liveScale = mix(1.04, 1.1, ramp(f, 0, F1, EASE.smooth));
  const holdPush = seg === 2 ? mix(1, 1.015, ramp(f, FLASHES[2] + SETTLE, 64, EASE.smooth)) : 1;

  const curView: View = seg === -1 ? { scale: liveScale, cx: 540, cy: 960 } : STILLS[seg];
  const nextIdx = seg + 1;
  let af: React.ReactNode = null;
  if (nextIdx < FLASHES.length) {
    const fNext = FLASHES[nextIdx];
    const start = nextIdx === 0 ? F1 - 9 : fNext - AF;
    if (f >= start && f < fNext) {
      const target = nextIdx === 0 ? BIN : viewRect(STILLS[nextIdx]);
      const r = project(target, curView);
      const k = mix(1.3, 1, ramp(f, start, 6, EASE.snappy));
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const locked = f >= fNext - 3;
      af = <Brackets x={cx - (r.w * k) / 2} y={cy - (r.h * k) / 2} w={r.w * k} h={r.h * k} color={locked ? C.ember : '#ffffff'} width={locked ? 5 : 3} opacity={locked ? 1 : 0.85} arm={70} />;
    }
  }

  const capT0 = FLASHES[2] + 14;
  return (
    <AbsoluteFill style={{ background: '#0b0806', overflow: 'hidden', fontFamily: FONT.sans }}>
      <div style={{
        position: 'absolute', inset: 0, transformOrigin: '540px 960px',
        transform: `translate(${jx.toFixed(2)}px, ${(jy + settleY).toFixed(2)}px) scale(${(settleScale * holdPush * 1.012).toFixed(5)})`,
        filter: seg >= 0 ? `brightness(${(1 + 0.22 * bloom).toFixed(3)}) contrast(${(1.06 - 0.14 * bloom).toFixed(3)}) saturate(${(0.82 - 0.2 * bloom).toFixed(3)})` : undefined,
      }}>
        {seg === -1 ? (
          <div style={{ position: 'absolute', inset: 0, transformOrigin: '540px 960px', transform: `scale(${liveScale.toFixed(5)})` }}><Photo /></div>
        ) : (
          <Still view={STILLS[seg]} />
        )}
      </div>
      <Vignette strength={[0.5, 0.5, 0.56, 0.62][seg + 1]} inner={0.42} color="#000000" />
      {/* 顶部压暗：托住 hold 段字幕 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 24%, rgba(0,0,0,0) 40%)', opacity: 0.35 + 0.65 * ramp(f, capT0 - 6, 14, EASE.out) }} />
      <Grain opacity={0.1} blend="soft-light" />

      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Brackets x={60} y={110} w={960} h={1700} color="#ffffff" opacity={0.5} arm={80} width={3} />
        {af}
      </svg>

      {/* hold 段字幕（blur-slide） */}
      <div style={{ position: 'absolute', left: 72, top: 230 }}>
        <div style={{ fontWeight: 700, fontSize: 46, letterSpacing: 14, color: C.emberHot, opacity: ramp(f, capT0, 16, EASE.out) }}>{kicker}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, fontWeight: 900, fontSize: 112, lineHeight: 1.12, color: C.ink, marginTop: 8 }}>
          {title.map((w, i) => {
            const q = ramp(f, capT0 + 4 + i * 6, 22, EASE.out);
            return (
              <React.Fragment key={w}>
                {i > 0 && <span style={{ color: C.ember, opacity: q, fontSize: 80 }}>·</span>}
                <span style={{ display: 'inline-block', opacity: q, transform: `translateY(${((1 - q) * 64).toFixed(2)}px)`, filter: q < 0.999 ? `blur(${((1 - q) * 18).toFixed(2)}px)` : undefined }}>{w}</span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {flash > 0.004 && (
        <AbsoluteFill style={{ opacity: flash, background: 'radial-gradient(ellipse 90% 80% at 50% 48%, #ffffff 0%, #ffffff 45%, rgba(250,250,255,0.86) 100%)' }} />
      )}
    </AbsoluteFill>
  );
};
