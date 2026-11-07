// S2 锻造（v2，用户素材版）：辗环机实拍（红热环件转动）→ 去底环件由红到冷 → 对焊法兰：锻造毛坯 → 精车成品。
// 末 40f 由成品法兰中孔穿窗进入 S3（Main/segments 的 Portal 读取 boreEllipse）。
// 素材：photos/v2（用户提供）；去底：rembg isnet + 孔内白地软键（photos/v2/cut-*.png）。
// 标题入场 blur-slide（三通道同 p）；车削用环形扫掠揭示（车床绕轴切削的语义，区别于 S3 的直线拉杆）。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT } from '../theme';
import { COPY } from '../copy';
import { Embers } from '../lib/Embers';
import { EASE, Grain, Vignette, bezier, mix, ramp } from '../lib/polish';
import { SHOTS, beatF } from '../timeline';

const S2_FROM = SHOTS.s2_flange.from;
const L = (g: number) => g - S2_FROM;

// 本镜头时间表（本地帧）
export const T2 = {
  coolIn: L(beatF(12)), // 87：环件去底亮相（第 12 拍）
  coolStart: L(beatF(12)) + 10, // 冷却扫过
  coolEnd: L(beatF(16)) - 8,
  wnIn: L(beatF(16)), // 145：对焊毛坯（第 16 拍）
  turnStart: L(beatF(17)), // 160：车削环扫起（第 17 拍）
  turnEnd: L(beatF(18.5)), // 181
  portal: L(beatF(20)), // 203：穿窗开始
};
const PORTAL_EASE = bezier(0.7, 0, 0.3, 1);
export const portalT = (l: number) => ramp(l, T2.portal, 40, PORTAL_EASE);

// 对焊法兰摆位（成片坐标）。cut-11 裁切后 1150×1034；中孔顶口椭圆在裁切图中心 (549,276)、半轴 (160,150)
const WN = { cx: 540, cy: 1150, w: 820 };
const WN_IMG = { w: 1150, h: 1034, bore: { x: 549, y: 276, rx: 160, ry: 150 } };
const BLANK = { cx: 540, cy: 1222, w: 860 }; // cut-8 裁切后 1211×819；底边与成品法兰盘底对齐（毛坯带加工余量，略大）
const wnScale = WN.w / WN_IMG.w;
const wnBoreScreen = () => ({ x: WN.cx - WN.w / 2 + WN_IMG.bore.x * wnScale, y: WN.cy - (WN_IMG.h * wnScale) / 2 + WN_IMG.bore.y * wnScale });
// 穿窗期成品围绕中孔推近
const pushAt = (l: number) => mix(1, 1.9, portalT(l)) * mix(1, 1.04, ramp(l, T2.turnEnd, T2.portal - T2.turnEnd, EASE.smooth));

export const boreEllipse = (globalFrame: number) => {
  const l = L(globalFrame);
  const s = pushAt(l);
  const b = wnBoreScreen();
  return { cx: b.x, cy: b.y, rx: WN_IMG.bore.rx * wnScale * s, ry: WN_IMG.bore.ry * wnScale * s };
};

const Steps: React.FC<{ l: number; steps: string[] }> = ({ l, steps }) => {
  const at = [0, T2.coolStart, T2.turnStart - 2];
  const colors = [C.ember, C.steel, C.steelInk];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 34 }}>
      {steps.map((s, i) => {
        const on = ramp(l, at[i] + 2, 10, EASE.out);
        const done = i < 2 ? ramp(l, at[i + 1], 10, EASE.out) : 0;
        const lit = on * (1 - 0.55 * done);
        return (
          <React.Fragment key={s}>
            {i > 0 && <span style={{ fontWeight: 700, fontSize: 40, color: C.mute, opacity: 0.35 + 0.65 * on }}>→</span>}
            <span style={{
              padding: '12px 30px', borderRadius: 999, fontWeight: 900, fontSize: 46, letterSpacing: 2,
              color: lit > 0.5 ? colors[i] : C.mute, border: `2px solid ${lit > 0.5 ? colors[i] : 'rgba(255,255,255,0.18)'}`,
              background: `rgba(0,0,0,${0.35 + 0.2 * lit})`, opacity: 0.4 + 0.6 * on,
              boxShadow: lit > 0.5 ? `0 0 ${24 * lit}px ${i === 0 ? 'rgba(255,106,31,0.35)' : 'rgba(156,194,255,0.25)'}` : undefined,
            }}>{s}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const BlurWords: React.FC<{ words: string[]; start: number; size: number; color?: string }> = ({ words, start, size, color = C.ink }) => {
  const l = useCurrentFrame();
  return (
    <div style={{ display: 'flex', gap: '0.08em', fontWeight: 900, fontSize: size, lineHeight: 1.1, color }}>
      {words.map((w, i) => {
        const p = ramp(l, start + i * 4, 22, EASE.out);
        return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 64).toFixed(2)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * 18).toFixed(2)}px)` : undefined }}>{w}</span>;
      })}
    </div>
  );
};

export const S2Flange: React.FC<{ titleA?: string; titleB?: string; steps?: string[] }> = ({
  titleA = COPY.s2TitleA, titleB = COPY.s2TitleB, steps = COPY.s2Steps,
}) => {
  const l = useCurrentFrame();

  // ① 辗环实拍卡（0 → coolIn+10 交叉淡出）
  const vidOut = ramp(l, T2.coolIn - 2, 12, EASE.smooth);
  const vidPush = mix(1, 1.07, ramp(l, 0, T2.coolIn + 10, EASE.smooth));

  // ② 环件由红到冷
  const ringIn = ramp(l, T2.coolIn - 4, 14, EASE.out);
  const ringOut = ramp(l, T2.wnIn - 6, 10, EASE.exit);
  const cool = ramp(l, T2.coolStart, T2.coolEnd - T2.coolStart, EASE.smooth); // 0 红热 → 1 冷却
  const sweep = mix(5, 98, cool); // 冷却前沿（自上而下，容器 %；环件位于 15.7%–84.3%）
  const heat = 1 - cool;
  const turn = Math.sin((l - T2.coolIn) / 26) * 9; // 轻微转动（rotateY 度）
  const bob = Math.sin((l - T2.coolIn) / 19) * 8;

  // ③ 对焊：毛坯 → 精车成品
  const wnIn = ramp(l, T2.wnIn, 16, EASE.out);
  const turnP = ramp(l, T2.turnStart, T2.turnEnd - T2.turnStart, EASE.swift);
  const deg = turnP * 360;
  const push = pushAt(l);
  const bore = wnBoreScreen();
  const pt = portalT(l);

  const titleSwap = T2.wnIn - 4;
  const ringMask = `linear-gradient(180deg, transparent ${(sweep - 14).toFixed(1)}%, #000 ${(sweep + 14).toFixed(1)}%)`;
  const conic = (inside: boolean) => `conic-gradient(from -90deg at ${WN.cx}px ${WN.cy}px, ${inside ? '#000' : 'transparent'} 0deg, ${inside ? '#000' : 'transparent'} ${deg.toFixed(2)}deg, ${inside ? 'transparent' : '#000'} ${(deg + 0.01).toFixed(2)}deg)`;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden', fontFamily: FONT.sans }}>
      {/* 地面光：红热期偏暖，冷却后转冷 */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 26% at 50% 66%, rgba(255,90,20,${(0.1 + 0.32 * heat * ringIn * (1 - ringOut) + 0.2 * (1 - vidOut)).toFixed(3)}), transparent 70%), radial-gradient(ellipse 60% 24% at 50% 70%, rgba(90,160,255,${(0.14 * wnIn).toFixed(3)}), transparent 70%)` }} />

      {/* ① 辗环机实拍 */}
      {vidOut < 1 && (
        <div style={{ position: 'absolute', left: 72, top: 640, width: 936, height: 702, borderRadius: 22, overflow: 'hidden', opacity: 1 - vidOut, boxShadow: '0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${vidPush.toFixed(4)})` }}>
            <OffthreadVideo src={staticFile('video/ring-rolling.mp4')} muted trimBefore={15} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(1.1) brightness(0.95)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.55))' }} />
          <Grain opacity={0.1} blend="soft-light" />
        </div>
      )}

      {/* ② 去底环件：红热 → 冷却 */}
      {ringIn > 0 && ringOut < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: ringIn * (1 - ringOut), transform: `translateY(${((1 - ringIn) * 30 + bob).toFixed(2)}px)` }}>
          <Embers intensity={0.9 * heat} originY={1520} count={34} seed={3} />
          <div style={{ position: 'absolute', left: 540 - 450, top: 470, width: 900, height: 957, transform: `scale(1.14) scaleX(${Math.cos((turn * Math.PI) / 180 * 2.2).toFixed(4)}) rotateZ(${(turn * 0.15).toFixed(2)}deg)` }}>
            {/* 冷：底层 */}
            <Img src={staticFile('img/cut/full-7.png')} style={{ position: 'absolute', left: 150, top: 150, width: 600, height: 657, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))' }} />
            {/* 热：上层，冷却前沿自上而下收走 */}
            <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: ringMask, maskImage: ringMask }}>
              <Img src={staticFile('img/cut/full-6.png')} style={{
                position: 'absolute', left: 150, top: 150, width: 600, height: 657,
                filter: `brightness(${(1.15 + 0.35 * heat).toFixed(3)}) saturate(1.35) drop-shadow(0 0 ${(18 + 26 * heat).toFixed(1)}px rgba(255,80,10,${(0.85 * heat).toFixed(3)})) drop-shadow(0 0 70px rgba(255,60,0,${(0.45 * heat).toFixed(3)}))`,
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ③ 对焊法兰：毛坯 → 精车成品（环形扫掠） */}
      {wnIn > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: wnIn, transform: `translateY(${((1 - wnIn) * 40).toFixed(2)}px) scale(${push.toFixed(4)})`, transformOrigin: `${bore.x}px ${bore.y}px` }}>
          {turnP < 1 && (
            <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: conic(false), maskImage: conic(false) }}>
              <Img src={staticFile('img/cut/cut-8.png')} style={{ position: 'absolute', left: BLANK.cx - BLANK.w / 2, top: BLANK.cy - (BLANK.w * 819 / 1211) / 2, width: BLANK.w, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.65))' }} />
            </div>
          )}
          {turnP > 0 && (
            <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: turnP < 1 ? conic(true) : undefined, maskImage: turnP < 1 ? conic(true) : undefined }}>
              <Img src={staticFile('img/cut/cut-11.png')} style={{ position: 'absolute', left: WN.cx - WN.w / 2, top: WN.cy - (WN_IMG.h * wnScale) / 2, width: WN.w, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.6))' }} />
            </div>
          )}
          {/* 刀线：沿扫掠角的一道亮线 */}
          {turnP > 0 && turnP < 1 && (
            <div style={{
              position: 'absolute', left: WN.cx, top: WN.cy - 2, width: 470, height: 4, transformOrigin: '0 50%',
              transform: `rotate(${(deg - 90).toFixed(2)}deg) scaleY(0.75)`, borderRadius: 2,
              background: 'linear-gradient(90deg, rgba(255,240,220,0) 0%, rgba(255,240,220,0.95) 30%, rgba(255,200,140,0.9) 85%, rgba(255,160,80,0) 100%)',
              boxShadow: '0 0 18px rgba(255,170,90,0.9)', mixBlendMode: 'screen',
            }} />
          )}
        </div>
      )}

      {/* 标题 */}
      <div style={{ position: 'absolute', left: 72, right: 72, top: 200, opacity: 1 - ramp(l, T2.portal, 16, EASE.out) }}>
        <div style={{ position: 'relative', height: 146 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 1 - ramp(l, titleSwap, 8, EASE.out) }}><BlurWords words={[titleA.slice(0, 2), titleA.slice(2)]} start={10} size={132} /></div>
          {l >= titleSwap && <div style={{ position: 'absolute', inset: 0 }}><BlurWords words={[titleB.slice(0, 2), titleB.slice(2)]} start={titleSwap + 2} size={132} /></div>}
        </div>
        <Steps l={l} steps={steps} />
      </div>
      <Vignette strength={0.5 + 0.2 * pt} inner={0.42} color="#000000" />
      <Grain opacity={0.08} blend="soft-light" />
    </AbsoluteFill>
  );
};
