// S3 平焊法兰 —— before-after-slider-scrub 适配（demos/data/before-after-slider-scrub/BeforeAfterSliderScrub.tsx）。
// 保留：8%→6.5% 预备回拉 4f → 快甩 12f 冲到 76%（out）→ 回弹 12f 落 70% → 停顿 → 慢扫回 40%（快:慢 ≈ 1:3.3）；
// after 层 clip-path 跟随杆 x；手柄按速度横向拉伸（峰值 1.18）+ 方向性运动模糊；角标长在各自图层里被一起裁切。
// 适配：竖屏里对比区是一张 3:2 实拍卡（同一张照片②里同一钢台面、相近机位的毛坯堆 / 成品堆裁切，
// 两版同框位同版式）；before = 炉火暖调毛坯（真实毛坯照片，不是故意做丑），after = 冷钢调成品。
// 快甩落点（76% 过冲顶点）对齐第 24 拍；末段静止由 S3→S4 前景遮挡接管（偏差记入 spec）。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, GRADE } from '../theme';
import { COPY } from '../copy';
import { EASE, Grain, SpeedBlur, Vignette, mix, ramp, velocity } from '../lib/polish';
import { SHOTS, beatF } from '../timeline';

const L = (g: number) => g - SHOTS.s3_slip.from;
const FLING_END = L(beatF(24)); // 58
const PRE = FLING_END - 16; // 42
const T0 = FLING_END - 12; // 46
const BOUNCE = FLING_END + 12; // 70
const HOLD = BOUNCE + 14; // 84
const SCRUB = HOLD + 40; // 124

const posAt = (f: number) => {
  if (f < T0) return mix(8, 6.5, ramp(f, PRE, T0 - PRE, EASE.smooth));
  if (f < FLING_END) return mix(6.5, 76, ramp(f, T0, FLING_END - T0, EASE.out));
  if (f < BOUNCE) return mix(76, 70, ramp(f, FLING_END, BOUNCE - FLING_END, EASE.smooth));
  if (f < HOLD) return 70;
  return mix(70, 40, ramp(f, HOLD, SCRUB - HOLD, EASE.smooth));
};

const CARD = { x: 72, y: 800, w: 936, h: 624, r: 26 };

const Tag: React.FC<{ label: string; side: 'l' | 'r'; color: string }> = ({ label, side, color }) => (
  <div style={{
    position: 'absolute', top: 26, [side === 'l' ? 'left' : 'right']: 26, padding: '10px 24px', borderRadius: 14,
    background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: FONT.sans, fontWeight: 900,
    fontSize: 48, letterSpacing: 6, color, whiteSpace: 'nowrap',
  }}>{label}</div>
);

const Photo: React.FC<{ src: string; grade: string; tint: string; pos?: string }> = ({ src, grade, tint, pos = '50% 50%' }) => (
  <>
    <Img src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: grade }} />
    <div style={{ position: 'absolute', inset: 0, background: tint, mixBlendMode: 'color' }} />
  </>
);

export const S3Slip: React.FC<{ kicker?: string; title?: string; before?: string; after?: string }> = ({
  kicker = COPY.s3Kicker, title = COPY.s3Title, before = COPY.s3Before, after = COPY.s3After,
}) => {
  const f = useCurrentFrame();
  const p = posAt(f);
  const x = (p / 100) * CARD.w;
  const vx = velocity((fr) => (posAt(fr) / 100) * CARD.w, f);
  const speed = Math.abs(vx);
  const squish = 1 + Math.min(speed / 110, 1) * 0.18;
  const press = 1 - 0.06 * Math.sin(Math.PI * ramp(f, PRE, FLING_END - PRE, EASE.linear));

  const words = title.split(' ');
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 26% at 28% 58%, rgba(90,160,255,0.13), transparent 70%), radial-gradient(ellipse 60% 26% at 76% 58%, rgba(255,90,20,0.16), transparent 70%)' }} />

      {/* 标题：blur-slide */}
      <div style={{ position: 'absolute', left: 72, top: 400 }}>
        <div style={{ fontWeight: 700, fontSize: 46, letterSpacing: 14, color: C.mute, opacity: ramp(f, 24, 18, EASE.out) }}>{kicker}</div>
        <div style={{ display: 'flex', gap: '0.28em', fontWeight: 900, fontSize: 120, lineHeight: 1.12, color: C.ink, marginTop: 6 }}>
          {words.map((w, i) => {
            const q = ramp(f, 28 + i * 4, 22, EASE.out);
            const col = w === '→' ? C.ember : C.ink;
            return <span key={i} style={{ display: 'inline-block', color: col, opacity: q, transform: `translateY(${((1 - q) * 64).toFixed(2)}px)`, filter: q < 0.999 ? `blur(${((1 - q) * 18).toFixed(2)}px)` : undefined }}>{w}</span>;
          })}
        </div>
      </div>

      {/* 对比卡 */}
      <div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)' }}>
        {/* before：毛坯（暖） */}
        <Photo src="img/p2-blank.jpg" grade={GRADE.hot} tint={GRADE.tintHot} />
        <Tag label={before} side="r" color={C.ember} />
        {/* after：成品（冷），杆左侧揭出 */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(CARD.w - x).toFixed(2)}px 0 0)` }}>
          <Photo src="img/p2-finished.jpg" grade={GRADE.cold} tint={GRADE.tintCold} pos="50% 45%" />
          <Tag label={after} side="l" color={C.steel} />
        </div>
        <div style={{ position: 'absolute', left: x - 24, top: 0, width: 24, height: CARD.h, background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.28))' }} />
        <Grain opacity={0.08} blend="soft-light" />
      </div>

      {/* 分割杆 + 手柄（屏幕层，超出卡上下各 28px） */}
      <SpeedBlur vx={vx} amount={0.12} max={14}>
        <div style={{
          position: 'absolute', left: CARD.x + x - 2, top: CARD.y - 28, width: 4, height: CARD.h + 56, borderRadius: 2,
          background: C.ember, boxShadow: `0 0 0 1px rgba(0,0,0,0.25), 0 0 22px rgba(255,106,31,0.7)`,
        }} />
        <div style={{
          position: 'absolute', left: CARD.x + x - 44, top: CARD.y + CARD.h / 2 - 44, width: 88, height: 88, borderRadius: 44,
          background: 'linear-gradient(180deg, #ffffff, #f1efec)', border: `3px solid ${C.ember}`,
          boxShadow: `inset 0 1px 0 #fff, 0 ${(10 + Math.min(speed / 8, 18)).toFixed(1)}px ${(26 + Math.min(speed / 4, 30)).toFixed(1)}px rgba(0,0,0,0.55)`,
          transform: `scale(${(press * squish).toFixed(4)}, ${press.toFixed(4)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
        }}>
          <svg width={40} height={22} viewBox="0 0 36 20">
            <path d="M11 3 L4 10 L11 17" fill="none" stroke="#2a2522" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 3 L32 10 L25 17" fill="none" stroke="#2a2522" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </SpeedBlur>
      <Vignette strength={0.5} inner={0.44} color="#000000" />
    </AbsoluteFill>
  );
};
