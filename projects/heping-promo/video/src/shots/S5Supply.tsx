// S5 一站供应 —— 实拍④缓推 + blur-slide 标题（demos/typography/blur-slide/BlurSlide.tsx 参数：
// 三通道共用同一 p（EASE.out），主标 dy 64 / blur 18 / 每词 22f / 间隔 4f，第二行换气 6f；
// 副标 dy 26 / blur 9 / 20f，与主标重叠起跑）。镜头由 S4 竖向甩镜（急刹长尾）送入，这里只管落定后的阅读。
// 原分镜写的 spotlight-sweep 改为 blur-slide：全片光效（漏光 / 车削刀光 / 逐格描边）已到上限（light-play ≤2 次判例）。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, GRADE } from '../theme';
import { COPY } from '../copy';
import { EASE, Grain, Vignette, mix, ramp } from '../lib/polish';

const W0 = 30; // 标题起跑（甩镜长尾进入阅读区后）

export const S5Supply: React.FC<{ title?: string[]; sub?: string }> = ({ title = COPY.s5Title, sub = COPY.s5Sub }) => {
  const f = useCurrentFrame();
  const push = mix(1.0, 1.07, ramp(f, 0, 110, EASE.smooth));
  const word = (text: string, start: number, size: number, dy: number, blur: number, dur: number, color: string, weight = 900) => {
    const p = ramp(f, start, dur, EASE.out);
    return (
      <span style={{
        display: 'inline-block', fontSize: size, fontWeight: weight, color, opacity: p,
        transform: `translateY(${((1 - p) * dy).toFixed(2)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : undefined,
      }}>{text}</span>
    );
  };
  // 中文按语义切词：每行两段
  const split = (s: string) => [s.slice(0, 2), s.slice(2)];
  return (
    <AbsoluteFill style={{ background: C.bgCool, overflow: 'hidden', fontFamily: FONT.sans }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push.toFixed(5)})`, transformOrigin: '50% 60%' }}>
        <Img src={staticFile('img/p4.jpg')} style={{ position: 'absolute', left: -180, top: 0, width: 1440, height: 1920, objectFit: 'cover', filter: `${GRADE.cold} brightness(0.85)` }} />
        <div style={{ position: 'absolute', inset: 0, background: GRADE.tintCold, mixBlendMode: 'color' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,6,8,0.92) 0%, rgba(4,6,8,0.62) 26%, rgba(4,6,8,0.0) 46%, rgba(4,6,8,0) 78%, rgba(4,6,8,0.55) 100%)' }} />
      <div style={{ position: 'absolute', left: 72, top: 230, lineHeight: 1.14 }}>
        {title.map((line, li) => (
          <div key={li} style={{ display: 'flex', gap: '0.06em' }}>
            {split(line).map((w, wi) => word(w, W0 + li * (2 * 4 + 6) + wi * 4, 136, 64, 18, li === 1 && wi === 1 ? 30 : 22, li === 1 ? C.ember : C.ink))}
          </div>
        ))}
        <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: mix(0, 64, ramp(f, W0 + 20, 16, EASE.out)), height: 3, background: C.ember }} />
          {word(sub, W0 + 22, 56, 26, 9, 20, C.steelInk, 700)}
        </div>
      </div>
      <Vignette strength={0.45} inner={0.46} color="#000000" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
