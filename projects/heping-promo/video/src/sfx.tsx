// SFX 钉帧表（中央注册表，sound-design §4.1/§4.5/§4.6）。
// from = 目标峰值帧 − 音源峰值滞后（public/audio/sfx/audio-manifest.json 的 rms_peak_time_s）− 输出音轨偏移。
// 音源为程序化拟音（analysis/synth_sfx.py）：Freesound 站点对本云端环境返回 403，未能下载实录。
import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import manifest from '../public/audio/sfx/audio-manifest.json';
import { SEAMS, SHOTS, beatF } from './timeline';
import { T2 } from './shots/S2Flange';

export const OUTPUT_AUDIO_OFFSET_F = (2048 / 48000) * 30; // 1.28f，实测见 timeline.ts / analysis/render-check.json
const PEAK_F: Record<string, number> = Object.fromEntries(manifest.files.map((m) => [m.file, m.rms_peak_time_s * 30]));
const sfxFrom = (targetPeakF: number, src: string) => Math.max(0, Math.round(targetPeakF - (PEAK_F[src] ?? 0) - OUTPUT_AUDIO_OFFSET_F));

export type Sfx = { id: string; from: number; src: string; volume: number; durationInFrames?: number; note: string };
const s2 = (l: number) => SHOTS.s2_flange.from + l;

const DRILLS: Sfx[] = T2.holes.map((h, i) => {
  const src = i % 2 === 0 ? 'drill-a.wav' : 'drill-b.wav';
  return { id: `drill-${i + 1}`, from: sfxFrom(s2(h), src), src, volume: 0.4 - (0.15 * i) / 7, note: `第 ${i + 1} 孔钻穿（双样本交替 + 音量阶梯递减）` };
});

export const SFX: Sfx[] = [
  { id: 'fire', from: 0, src: 'fire-crackle.wav', volume: 0.32, durationInFrames: SEAMS.leakPeak + 20, note: '开场炉火底噪' },
  { id: 'stamp', from: sfxFrom(beatF(0), 'anvil-hit.wav'), src: 'anvil-hit.wav', volume: 0.7, note: '印章随锻锤压下（第 0 拍）' },
  { id: 'leak', from: sfxFrom(SEAMS.leakPeak, 'leak-swell.wav'), src: 'leak-swell.wav', volume: 0.42, note: '琥珀漏光峰值藏切' },
  { id: 'roar', from: sfxFrom(s2(T2.fill) + 2, 'furnace-roar.wav'), src: 'furnace-roar.wav', volume: 0.5, note: '烧红毛坯成形' },
  { id: 'lathe', from: s2(T2.lathe) - 3, src: 'lathe-cut.wav', volume: 0.38, durationInFrames: T2.latheEnd - T2.lathe + 12, note: '车削刀线下扫（窗口 = 车削段）' },
  ...DRILLS,
  { id: 'portal', from: sfxFrom(SEAMS.portalStart + 20, 'whoosh-soft.wav'), src: 'whoosh-soft.wav', volume: 0.45, note: '穿过法兰中孔' },
  { id: 'fling', from: sfxFrom(beatF(24) - 4, 'whoosh-fast.wav'), src: 'whoosh-fast.wav', volume: 0.38, note: '拉杆快甩' },
  { id: 'fling-tick', from: sfxFrom(beatF(24), 'tick.wav'), src: 'tick.wav', volume: 0.25, note: '拉杆过冲回弹' },
  { id: 'occluder', from: sfxFrom(SEAMS.occluderCut, 'whoosh-fast.wav'), src: 'whoosh-fast.wav', volume: 0.45, note: '前景遮挡掠过镜头' },
  ...SEAMS.flashes.map((g, i) => ({ id: `shutter-${i + 1}`, from: sfxFrom(g, 'shutter.wav'), src: 'shutter.wav', volume: 0.75, note: `第 ${i + 1} 闪快门` })),
  { id: 'whip', from: sfxFrom(SEAMS.whipStart + 4, 'whoosh-fast.wav'), src: 'whoosh-fast.wav', volume: 0.5, note: '竖向甩镜' },
  ...[0, 1, 2].map((i) => {
    const src = i === 1 ? 'metal-tap-b.wav' : 'metal-tap-a.wav';
    return { id: `cell-${i + 1}`, from: sfxFrom(SHOTS.s6_specs.from + 10 + i * 12 + 6, src), src, volume: 0.34 - 0.04 * i, note: `规格第 ${i + 1} 格点亮` };
  }),
  { id: 'riser', from: sfxFrom(SEAMS.outroStamp - 1, 'riser.wav'), src: 'riser.wav', volume: 0.4, note: '合影组装铺垫 → 字标' },
  { id: 'impact', from: sfxFrom(SEAMS.outroStamp, 'impact-deep.wav'), src: 'impact-deep.wav', volume: 0.75, note: '字标压印（第 54 拍）' },
  { id: 'shimmer', from: sfxFrom(SEAMS.outroStamp + 20, 'shimmer.wav'), src: 'shimmer.wav', volume: 0.18, note: '橙线长出余韵' },
  { id: 'contact', from: sfxFrom(beatF(58) + 8, 'whoosh-soft.wav'), src: 'whoosh-soft.wav', volume: 0.32, note: '合影 → 联系卡' },
];

export const SfxTrack: React.FC = () => (
  <>
    {SFX.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} layout="none">
        <Audio src={staticFile(`audio/sfx/${s.src}`)} volume={s.volume} />
      </Sequence>
    ))}
  </>
);
