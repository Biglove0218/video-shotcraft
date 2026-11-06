// 全片时间线：片段（镜头 + 接缝转场）+ 音频。帧号全部来自 timeline.ts。
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion';
import { FontGate } from './lib/FontGate';
import { Grain } from './lib/polish';
import { SfxTrack } from './sfx';
import { Occluder, SEG_FORGE, SEG_OCCLUDER, SEG_OPEN, SEG_OUTRO, SEG_SLIP, SEG_SPECS, SegForge, SegOpen, SegOutro, SegSlip, SegSpecs } from './segments';
import { BGM_FROM, TOTAL } from './timeline';

export type MainProps = { bgm: boolean };

const At: React.FC<{ seg: { from: number; to: number }; children: React.ReactNode }> = ({ seg, children }) => (
  <Sequence from={seg.from} durationInFrames={seg.to - seg.from}>{children}</Sequence>
);

export const BGM_VOLUME = 0.55;
export const bgmVolume = (g: number) => {
  const fadeIn = interpolate(g, [BGM_FROM, BGM_FROM + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(g, [TOTAL - 60, TOTAL - 4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return BGM_VOLUME * fadeIn * fadeOut;
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

export const Main: React.FC<MainProps> = ({ bgm }) => (
  <FontGate>
    <Visuals />
    {bgm && (
      <Sequence from={BGM_FROM}>
        <Audio src={staticFile('audio/bgm/bgm-tech-house.mp3')} volume={(fr) => bgmVolume(fr + BGM_FROM)} />
      </Sequence>
    )}
    <SfxTrack />
  </FontGate>
);
