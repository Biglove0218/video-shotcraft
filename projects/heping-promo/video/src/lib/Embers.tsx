// 炉火火星：确定性上飘的余烬（index 派生全部参数，禁 Math.random）。
import React from 'react';
import { useCurrentFrame } from 'remotion';

const h = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const Embers: React.FC<{
  count?: number;
  w?: number;
  h?: number;
  intensity?: number; // 0..1 整体亮度
  originY?: number; // 火星从这里（底部）升起
  seed?: number;
  frameOffset?: number;
}> = ({ count = 46, w = 1080, h: H = 1920, intensity = 1, originY = 1920, seed = 1, frameOffset = 0 }) => {
  const f = useCurrentFrame() + frameOffset;
  if (intensity <= 0.002) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}>
      {Array.from({ length: count }, (_, i) => {
        const k = i + seed * 1000;
        const life = 70 + h(k) * 90; // 帧
        const born = -h(k + 1) * life; // 错峰：开场即有火星在空中
        const age = ((f - born) % life + life) % life;
        const u = age / life;
        const x0 = w * (0.08 + 0.84 * h(k + 2));
        const rise = (0.55 + 0.9 * h(k + 3)) * H * 0.62;
        const y = originY - u * rise;
        const sway = Math.sin(f * (0.03 + 0.03 * h(k + 4)) + k) * (14 + 26 * h(k + 5)) * u;
        const x = x0 + sway + (h(k + 6) - 0.5) * 120 * u;
        const size = 2.6 + 4.4 * h(k + 7) * (1 - u * 0.6);
        const flick = 0.65 + 0.35 * Math.sin(f * 0.6 + k * 3.1);
        const a = Math.sin(Math.PI * Math.min(1, u * 1.15)) * flick * intensity * (0.45 + 0.55 * h(k + 8));
        const hot = h(k + 9) > 0.7;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y, width: size, height: size * (1.6 + 1.2 * (1 - u)), borderRadius: size,
              background: hot ? '#ffe2a8' : '#ff8a3a', opacity: a,
              boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,110,30,0.55)`,
              transform: `rotate(${(sway * 0.6).toFixed(1)}deg)`,
            }}
          />
        );
      })}
    </div>
  );
};
