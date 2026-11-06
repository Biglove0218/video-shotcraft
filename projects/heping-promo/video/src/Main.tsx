// 全片时间线：片段（镜头 + 接缝转场）+ 音频。帧号全部来自 timeline.ts。
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { FontGate } from './lib/FontGate';
import { Grain } from './lib/polish';
import { SfxTrack } from './sfx';
import { Occluder, SEG_FORGE, SEG_OCCLUDER, SEG_OPEN, SEG_OUTRO, SEG_SLIP, SEG_SPECS, SegForge, SegOpen, SegOutro, SegSlip, SegSpecs } from './segments';
import { BGM_FROM, SEAMS, SHOTS, TOTAL } from './timeline';
import { FIRST as S6_FIRST } from './shots/S6Specs';

export type MainProps = { bgm: boolean; audioOnly?: boolean };

const At: React.FC<{ seg: { from: number; to: number }; children: React.ReactNode }> = ({ seg, children }) => (
  <Sequence from={seg.from} durationInFrames={seg.to - seg.from}>{children}</Sequence>
);

export const BGM_VOLUME = 0.55;
// 闪避窗口：[起, 止, 压到的倍数]，进出各 5f 线性过渡
const DUCKS: [number, number, number][] = [
  [SEAMS.flashes[0] - 3, SEAMS.flashes[2] + 10, 0.6],
  [SHOTS.s6_specs.from + S6_FIRST, SHOTS.s6_specs.from + S6_FIRST + 40, 0.7],
];
const duck = (g: number) => DUCKS.reduce((v, [a, b, k]) => {
  const w = Math.min(1, Math.max(0, Math.min((g - (a - 5)) / 5, ((b + 5) - g) / 5)));
  return v * (1 - (1 - k) * w);
}, 1);
export const bgmVolume = (g: number) => {
  const fadeIn = interpolate(g, [BGM_FROM, BGM_FROM + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(g, [TOTAL - 60, TOTAL - 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return BGM_VOLUME * fadeIn * fadeOut * duck(g);
};

export const Visuals: React.FC = () => (
  <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <At seg={SEG_OPEN}><SegOpen /></At>
    <At seg={SEG_SLIP}><SegSlip /></At>
    <At seg={SEG_FORGE}><SegForge /></At>
    <At seg={SEG_SPECS}><SegSpecs /></At>
    <At seg={SEG_OUTRO}><SegOutro /></At>
    <At seg={SEG_OCCLUDER}><Occluder /></At>
    <Grain opacity={0.02} />
  </AbsoluteFill>
);

// audioOnly：只出音轨（同一时间线的 BGM + SFX 表），用于音频返工时与已渲画面合流，避免重跑 3D 画面
export const Main: React.FC<MainProps> = ({ bgm, audioOnly }) => (
  <FontGate>
    {!audioOnly && <Visuals />}
    {bgm && (
      <Sequence from={BGM_FROM}>
        <Audio src={staticFile('audio/bgm/bgm-tech-house.mp3')} volume={(fr) => bgmVolume(fr + BGM_FROM)} />
      </Sequence>
    )}
    <SfxTrack />
  </FontGate>
);
