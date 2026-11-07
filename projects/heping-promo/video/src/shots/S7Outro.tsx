// S7 收场 —— outro-group-photo-launch 适配（demos/outro/outro-group-photo-launch/OutroGroupPhotoLaunch.tsx）+ DigitRoll。
// 保留：元素 cue 每 3f 一个、各飞 12f、FLY_EASE bezier(0.34,1.4,0.44,1) 真过冲；飞行中 rot×2→落定、scale×1.12→1、
// 按速度方向性运动模糊（0.3×，封顶 22）；落地 cue+9→16f 接触影收紧 + 1.5% 轻压；字标登场时全员退后排（−12% / −8% 饱和）；
// crane perspective rotateX 4°→0 + scale 1.06→1（40f）后零速起步缓推；开场光带、字标背后舞台光、暖尘上飘；字标 hold ≥1s。
// 适配：合影成员 = 前面每个镜头的代表元素（3D 对焊法兰 / 平焊成品 / 平焊毛坯 / 毛坯锻件 / 车间）；字标 = "和平"印章 + 厂名；
// 合影 hold 后转为联系卡（字标降格上移，联系方式 blur-slide + 电话数字滚动），收尾不淡出、停住方便截图（原卡淡出改为 hold）。
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { C, FONT, GRADE } from '../theme';
import { COPY } from '../copy';
import { Embers } from '../lib/Embers';
import { DigitRoll } from '../lib/DigitRoll';
import { EASE, Grain, SpeedBlur, Vignette, mix, ramp, velocity } from '../lib/polish';
import { SEAMS, SHOTS, beatF } from '../timeline';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const FLY_EASE = Easing.bezier(0.34, 1.4, 0.44, 1);
const CRANE_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const L = (g: number) => g - SHOTS.s7_outro.from;
const STAMP = L(SEAMS.outroStamp); // 29
const SWAP = L(SEAMS.outroSwap); // 87：合影 → 联系卡

type El = { key: string; src?: string; text?: string; w: number; h: number; cx: number; cy: number; rot: number; dx: number; dy: number; cue: number; grade?: string; tint?: string; bare?: boolean; pos?: string };
const ELS: El[] = [
  { key: 'fin', src: 'img/cut/cut-10.png', w: 400, h: 317, cx: 250, cy: 520, rot: -5, dx: -520, dy: -60, cue: 4, bare: true },
  { key: 'flange', src: 'img/cut/cut-11.png', w: 520, h: 468, cx: 740, cy: 470, rot: 3, dx: 460, dy: -220, cue: 7, bare: true },
  { key: 'blank', src: 'img/cut/cut-8.png', w: 380, h: 257, cx: 810, cy: 1220, rot: -3, dx: 480, dy: 120, cue: 10, bare: true },
  { key: 'forge', src: 'img/p1.jpg', w: 340, h: 300, cx: 270, cy: 1230, rot: 4, dx: -460, dy: 200, cue: 13, grade: GRADE.hot, tint: GRADE.tintHot, pos: '62% 58%' },
  { key: 'shop', src: 'img/p4.jpg', w: 440, h: 270, cx: 540, cy: 1450, rot: 2, dx: 0, dy: 420, cue: 16, grade: GRADE.cold, tint: GRADE.tintCold, pos: '50% 62%' },
  { key: 'spec', text: '国标 GB', w: 260, h: 124, cx: 540, cy: 1190, rot: 2, dx: 0, dy: 380, cue: 19 },
];

export const S7Outro: React.FC<{ seal?: string; city?: string; name?: string; tags?: string[]; contactLabel?: string; contact?: string; phone?: string; addr?: string[] }> = ({
  seal = COPY.seal, city = COPY.city, name = COPY.name, tags = COPY.s7Tags, contactLabel = COPY.contactLabel, contact = COPY.contact, phone = COPY.phone, addr = COPY.addr,
}) => {
  const f = useCurrentFrame();
  const craneT = interpolate(f, [0, 40], [0, 1], { ...clamp, easing: CRANE_EASE });
  const pushT = ramp(f, 36, SWAP - 36, EASE.smooth);
  const camScale = 1.06 - 0.06 * craneT + 0.035 * pushT;
  const camTilt = 4 * (1 - craneT);
  const recede = interpolate(f, [STAMP + 4, STAMP + 12], [0, 1], clamp);
  const sweepX = interpolate(f, [2, 14], [-500, 1580], { ...clamp, easing: Easing.bezier(0.4, 0, 0.6, 1) });
  const sweepO = interpolate(f, [2, 5, 11, 14], [0, 0.12, 0.12, 0], clamp);
  const stageLight = interpolate(f, [STAMP + 4, STAMP + 12, STAMP + 20], [0, 0.55, 0.32], clamp);
  const rule = interpolate(f, [STAMP + 20, STAMP + 32], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExt = interpolate(f, [STAMP + 20, STAMP + 28], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const ruleExtFade = interpolate(f, [STAMP + 28, STAMP + 34], [1, 0], clamp);

  // 合影 → 联系卡
  const swap = ramp(f, SWAP, 20, EASE.smooth);
  const elsOut = ramp(f, SWAP - 2, 14, EASE.exit);
  const lockY = mix(860, 250, swap);
  const lockS = mix(1, 0.7, swap);
  const contact0 = SWAP + 12;
  const bs = (start: number, dur: number, dy: number, blur: number) => {
    const p = ramp(f, start, dur, EASE.out);
    return { opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(2)}px)`, filter: p < 0.999 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : undefined } as React.CSSProperties;
  };

  const letters = name.split('');
  return (
    <AbsoluteFill style={{ fontFamily: FONT.sans }}>
      {/* 暖暗底：S6 在下方被 Main 糊成景深，这里只压一层 scrim */}
      <AbsoluteFill style={{ background: `radial-gradient(1100px 1400px at 50% 46%, rgba(10,11,12,${(0.55 + 0.3 * swap).toFixed(3)}), rgba(10,11,12,0.88) 70%)`, opacity: ramp(f, 0, 18, EASE.out) }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 100%, rgba(255,100,30,0.22), rgba(255,100,30,0) 70%)', opacity: ramp(f, 10, 30, EASE.out) }} />
      <Embers intensity={0.55 * ramp(f, 6, 30, EASE.out)} originY={2000} count={36} seed={7} />

      {/* 合影层（crane） */}
      <AbsoluteFill style={{ transform: `perspective(1400px) rotateX(${camTilt.toFixed(3)}deg) scale(${camScale.toFixed(5)})`, transformOrigin: '50% 45%', opacity: 1 - elsOut }}>
        {ELS.map((el) => {
          if (f < el.cue) return null;
          const posAt = (fr: number) => {
            const tt = interpolate(fr, [el.cue, el.cue + 12], [0, 1], { ...clamp, easing: FLY_EASE });
            return [el.dx * (1 - tt), el.dy * (1 - tt)];
          };
          const t = interpolate(f, [el.cue, el.cue + 12], [0, 1], { ...clamp, easing: FLY_EASE });
          const op = interpolate(f, [el.cue, el.cue + 3], [0, 1], clamp);
          const [x, y] = posAt(f);
          const vx = velocity((fr) => posAt(fr)[0], f), vy = velocity((fr) => posAt(fr)[1], f);
          const rot = el.rot * (2 - t);
          const sc = (1.12 - 0.12 * t);
          const land = interpolate(f, [el.cue + 9, el.cue + 12, el.cue + 16], [0, 1, 0], clamp);
          const air = Math.max(0, 1 - t);
          const shadow = el.bare ? undefined : land > 0.01
            ? `0 ${10 - 5 * land}px ${24 - 12 * land}px rgba(0,0,0,${0.45 + 0.1 * land})`
            : `0 ${14 + 30 * air}px ${30 + 50 * air}px rgba(0,0,0,${0.45 + 0.1 * air})`;
          return (
            <SpeedBlur key={el.key} vx={vx} vy={vy} amount={0.3} max={22}>
              <div style={{
                position: 'absolute', left: el.cx - el.w / 2, top: el.cy - el.h / 2, width: el.w, height: el.h,
                transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${(sc * (1 - 0.015 * land)).toFixed(4)})`,
                borderRadius: el.bare ? 0 : 16, overflow: el.bare ? 'visible' : 'hidden', boxShadow: shadow,
                opacity: op * (1 - 0.12 * recede), filter: `saturate(${(1 - 0.08 * recede).toFixed(3)})${el.bare ? ' drop-shadow(0 30px 40px rgba(0,0,0,0.6))' : ''}`,
                border: el.bare ? undefined : '1px solid rgba(255,255,255,0.1)',
              }}>
                {el.src ? (
                  <Img src={staticFile(el.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: el.bare ? 'contain' : 'cover', objectPosition: el.pos ?? '50% 50%', filter: el.grade }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(34,38,44,0.96), rgba(16,18,22,0.96))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 50, color: C.ink }}>
                    {el.text?.split(' ')[0]}<span style={{ fontFamily: FONT.num, fontWeight: 700, fontSize: 58, color: C.ember, marginLeft: 10 }}>{el.text?.split(' ')[1]}</span>
                  </div>
                )}
                {el.tint && <div style={{ position: 'absolute', inset: 0, background: el.tint, mixBlendMode: 'color' }} />}
              </div>
            </SpeedBlur>
          );
        })}
      </AbsoluteFill>

      {sweepO > 0 && (
        <AbsoluteFill style={{ mixBlendMode: 'overlay' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: sweepX - 300, width: 600, background: 'linear-gradient(90deg, rgba(255,236,214,0), rgba(255,236,214,1) 50%, rgba(255,236,214,0))', opacity: sweepO }} />
        </AbsoluteFill>
      )}
      {stageLight > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(620px 300px at 540px ${lockY}px, rgba(255,214,170,0.55), rgba(255,180,120,0.18) 55%, rgba(255,180,120,0) 75%)`, opacity: stageLight * (1 - 0.6 * swap) }} />
      )}

      {/* 字标 lockup：印章先压，厂名逐字 letterpress */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: lockY - 120, display: 'flex', justifyContent: 'center', transform: `scale(${lockS.toFixed(4)})`, transformOrigin: '50% 120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          {(() => {
            const t = interpolate(f, [STAMP - 4, STAMP + 4], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
            return (
              <div style={{
                width: 150, height: 150, border: `8px solid ${C.ember}`, borderRadius: 14, display: 'grid', placeItems: 'center', writingMode: 'vertical-rl',
                fontFamily: FONT.serif, fontWeight: 900, fontSize: 54, lineHeight: 1.02, letterSpacing: 6, color: C.ember,
                opacity: t, transform: `translateY(${((1 - t) * 28).toFixed(2)}px) scale(${(1.35 - 0.35 * t).toFixed(4)})`, filter: t < 0.995 ? `blur(${((1 - t) * 8).toFixed(2)}px)` : undefined,
              }}>{seal}</div>
            );
          })()}
          <div>
            <div style={{ fontWeight: 700, fontSize: 48, letterSpacing: 14, color: C.mute, ...bs(STAMP, 12, 12, 6) }}>{city}</div>
            <div style={{ display: 'flex', fontWeight: 900, fontSize: 104, lineHeight: 1.12, color: C.ink, textShadow: '0 14px 36px rgba(0,0,0,0.5)' }}>
              {letters.map((ch, i) => {
                const d = Math.round(STAMP + 4 + i * 1.8);
                const t = interpolate(f, [d, d + 8], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.3, 1) });
                return <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${((1 - t) * 28).toFixed(2)}px) scale(${(1.35 - 0.35 * t).toFixed(4)})`, filter: t < 0.999 ? `blur(${((1 - t) * 8).toFixed(2)}px)` : undefined }}>{ch}</span>;
              })}
            </div>
          </div>
        </div>
      </div>
      {/* rule + 延长线（随 lockup 一起上移） */}
      <div style={{ position: 'absolute', left: 540 - 150, top: lockY + mix(130, 86, swap), width: 300, height: 6 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: C.ember, transform: `scaleX(${rule.toFixed(4)})` }} />
        {ruleExt > 0 && ruleExtFade > 0 && (
          <>
            <div style={{ position: 'absolute', top: 2.5, height: 1, right: '100%', width: 190 * ruleExt, background: C.ember, opacity: ruleExtFade }} />
            <div style={{ position: 'absolute', top: 2.5, height: 1, left: '100%', width: 190 * ruleExt, background: C.ember, opacity: ruleExtFade }} />
          </>
        )}
      </div>

      {/* 联系卡 */}
      {f >= contact0 - 1 && (
        <div style={{ position: 'absolute', left: 72, right: 72, top: 600 }}>
          <div style={{ display: 'flex', gap: 22, ...bs(contact0, 20, 26, 9) }}>
            {tags.map((t) => (
              <span key={t} style={{ padding: '14px 30px', borderRadius: 999, border: `2px solid ${C.rule}`, background: 'rgba(0,0,0,0.35)', fontWeight: 900, fontSize: 52, color: C.ink }}>{t}</span>
            ))}
          </div>
          <div style={{ marginTop: 120, fontWeight: 900, fontSize: 60, color: C.ink, ...bs(contact0 + 6, 20, 26, 9) }}>
            {contactLabel} <span style={{ color: C.ember }}>{contact}</span>
          </div>
          <div style={{ marginTop: 22, fontWeight: 700, ...bs(contact0 + 8, 14, 20, 6) }}>
            <DigitRoll value={phone} delay={contact0 + 6} stagger={1.5} fontSize={148} color={C.ink} fontFamily={FONT.num} />
          </div>
          <div style={{ marginTop: 40, fontWeight: 500, fontSize: 44, lineHeight: 1.5, color: C.mute, ...bs(contact0 + 18, 20, 26, 9) }}>
            {addr.map((a) => <div key={a}>{a}</div>)}
          </div>
        </div>
      )}
      <Vignette strength={0.45} inner={0.45} color="#000000" />
      <Grain opacity={0.07} blend="soft-light" />
    </AbsoluteFill>
  );
};
