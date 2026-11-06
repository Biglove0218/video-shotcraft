// S1 品牌开场 —— brand-ink-open 适配（demos/typography/brand-ink-open/BrandInkOpen.tsx）。
// 适配：墨线十字准星 → 炉火光点（同样先竖后横描出、画完淡出）；字标 = "和平"印章 + 厂名，
// 逐字 letterpress（delay=base+i·3、12f、scale 1.6→1、blur 6→0、字底强调色 glint）；
// 副标逐字出现（中文正文 2f/字，非 0.7f 装饰速度）；完整字标 hold ≥1s；暗场炉火光晕 + 火星。
// 印章落下 = BGM 第 0 拍（全局 beatF(0)）。退场交给 S1→S2 琥珀漏光（Main 中实现）。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { COPY } from '../copy';
import { Embers } from '../lib/Embers';
import { Grain, Vignette } from '../lib/polish';
import { beatF } from '../timeline';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const STAMP = beatF(0); // 36：印章压下
const NAME0 = STAMP + 6; // 厂名首字
const SUB0 = NAME0 + 20; // 副标起（与厂名尾字重叠起跑）

export const S1Brand: React.FC<{ city?: string; nameLines?: string[]; seal?: string; sub?: string[] }> = ({
  city = COPY.city, nameLines = COPY.nameLines, seal = COPY.seal, sub = COPY.s1Sub,
}) => {
  const f = useCurrentFrame();

  // 炉火光晕：从底部升起（0→36 蓄势），印章落下时一记暖光呼吸
  const glow = interpolate(f, [0, STAMP], [0.15, 0.85], { ...clamp, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const stampPulse = interpolate(f, [STAMP, STAMP + 3, STAMP + 22], [0, 1, 0], clamp);

  // 炉火光点准星：竖 6→15、横 14→24，30→40 淡出（brand-ink-open 准星时值整体后移 6f）
  const vDraw = interpolate(f, [6, 15], [100, 0], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const hDraw = interpolate(f, [14, 24], [100, 0], clamp);
  const crossFade = interpolate(f, [STAMP - 4, STAMP + 4], [1, 0], clamp);

  // 印章：从 2.2 倍压下（ease-in 落锤 7f）→ 落地 1.04→1 回弹
  const sealIn = interpolate(f, [STAMP - 7, STAMP], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sealSettle = interpolate(f, [STAMP, STAMP + 3, STAMP + 10], [1.06, 0.97, 1], clamp);
  const sealScale = f < STAMP ? 2.2 - 1.2 * sealIn : sealSettle;
  const sealOpacity = interpolate(f, [STAMP - 7, STAMP - 3], [0, 1], clamp);

  const subN = Math.floor(Math.max(0, f - SUB0) / 1.5);

  return (
    <AbsoluteFill style={{ background: C.bgWarm, overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* 炉火光晕（底部） */}
      <div style={{
        position: 'absolute', left: -200, right: -200, bottom: -200, height: 1500, opacity: glow,
        background: 'radial-gradient(ellipse 55% 50% at 50% 100%, rgba(255,110,30,0.75), rgba(255,80,20,0.24) 45%, rgba(255,80,20,0) 72%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: stampPulse * 0.5, mixBlendMode: 'screen',
        background: 'radial-gradient(ellipse 60% 30% at 30% 22%, rgba(255,140,60,0.5), rgba(255,140,60,0) 70%)',
      }} />
      <Embers intensity={0.45 + 0.75 * glow} originY={2000} count={60} />

      <div style={{ position: 'absolute', left: 72, top: 580 }}>
        {/* 炉火光点准星（印章位置） */}
        <svg width={112} height={112} viewBox="0 0 112 112" style={{ position: 'absolute', left: 0, top: 0, opacity: crossFade, overflow: 'visible' }}>
          <line x1={56} y1={-30} x2={56} y2={142} stroke={C.ember} strokeWidth={5} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={vDraw} />
          <line x1={-30} y1={56} x2={142} y2={56} stroke={C.ember} strokeWidth={5} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={hDraw} />
          <circle cx={56} cy={56} r={10} fill={C.emberHot} opacity={interpolate(f, [20, 26], [0, 1], clamp)} style={{ filter: 'blur(1px)' }} />
        </svg>

        {/* 印章 */}
        <div style={{
          width: 112, height: 112, border: `6px solid ${C.ember}`, borderRadius: 10, display: 'grid', placeItems: 'center',
          fontFamily: FONT.serif, fontWeight: 900, fontSize: 40, lineHeight: 1.02, color: C.ember, writingMode: 'vertical-rl', letterSpacing: 4,
          opacity: sealOpacity, transform: `scale(${sealScale.toFixed(4)})`, transformOrigin: 'center center',
          filter: f < STAMP ? `blur(${((1 - sealIn) * 6).toFixed(2)}px)` : undefined,
          boxShadow: stampPulse > 0.01 ? `0 0 ${30 * stampPulse}px rgba(255,106,31,${0.5 * stampPulse})` : undefined,
        }}>{seal}</div>

        {/* 城市眉标 */}
        <div style={{
          marginTop: 46, fontWeight: 700, fontSize: 46, letterSpacing: 14, color: C.mute,
          opacity: interpolate(f, [NAME0 - 2, NAME0 + 10], [0, 1], clamp),
        }}>{city}</div>

        {/* 厂名逐字 letterpress */}
        <div style={{ fontFamily: FONT.sans, fontWeight: 900, fontSize: 132, lineHeight: 1.08, color: C.ink, letterSpacing: 2 }}>
          {nameLines.map((line, li) => (
            <div key={li} style={{ display: 'flex' }}>
              {line.split('').map((ch, ci) => {
                const i = nameLines.slice(0, li).join('').length + ci;
                const d = NAME0 + i * 3;
                const t = interpolate(f, [d, d + 12], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.7, 0.25, 1) });
                const glint = interpolate(f, [d + 8, d + 12, d + 16], [0, 1, 0], clamp);
                return (
                  <span key={ci} style={{
                    position: 'relative', display: 'inline-block', opacity: t,
                    transform: `scale(${(1.6 - 0.6 * t).toFixed(4)})`, transformOrigin: 'center bottom',
                    filter: t < 0.999 ? `blur(${((1 - t) * 6).toFixed(2)}px)` : undefined,
                  }}>
                    {ch}
                    <span style={{
                      position: 'absolute', left: '50%', bottom: 2, transform: 'translateX(-50%)',
                      width: `${glint * 100}%`, height: 4, background: C.ember, opacity: glint, borderRadius: 2,
                    }} />
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* 橙色细线 + 副标逐字 */}
        <div style={{
          width: 420, height: 3, margin: '40px 0 34px', background: `linear-gradient(90deg, ${C.ember}, transparent)`,
          transform: `scaleX(${interpolate(f, [SUB0 - 10, SUB0 + 4], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) })})`, transformOrigin: 'left',
        }} />
        <div style={{ fontWeight: 700, fontSize: 56, lineHeight: 1.35, color: C.ink, height: 80, display: 'flex', alignItems: 'baseline', whiteSpace: 'pre' }}>
          {(() => {
            // 副标三段：前缀 · 数字（橙色 Barlow）· 后缀；按字符计数逐字出现
            const [a, num, b] = sub;
            const full = `${a} · ${num} ${b}`;
            const shown = full.slice(0, Math.min(full.length, subN));
            const aLen = a.length + 3;
            const nLen = num.length;
            return (
              <>
                <span>{shown.slice(0, aLen)}</span>
                <span style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: 70, color: C.ember }}>{shown.slice(aLen, aLen + nLen)}</span>
                <span>{shown.slice(aLen + nLen)}</span>
                <span style={{
                  display: 'inline-block', width: 6, height: 52, marginLeft: 8, background: C.ember, alignSelf: 'center',
                  opacity: f >= SUB0 && (subN < full.length || Math.floor((f - SUB0) / 4) % 2 === 0) && f < SUB0 + full.length * 1.5 + 20 ? 0.9 : 0,
                }} />
              </>
            );
          })()}
        </div>
      </div>
      <Vignette strength={0.55} inner={0.42} color="#050302" />
      <Grain opacity={0.09} blend="soft-light" />
    </AbsoluteFill>
  );
};
