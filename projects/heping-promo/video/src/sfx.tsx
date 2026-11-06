// SFX 钉帧表（中央注册表，sound-design §4.1/§4.5/§4.6）。
// from = 目标峰值帧 − (素材内峰值 − 裁入点) − 输出音轨偏移；trimBefore 裁掉素材头部（帧）。
// 素材：用户从 Freesound 下载上传的实录（文件名保留 Freesound ID 与作者，来源见 public/audio/sfx/FREESOUND-CREDITS.md），
// 用户未提供的动作保留程序化拟音（analysis/synth_sfx.py）。素材内峰值来自 analysis/fs_onsets.py 与 audio-manifest.json。
import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import manifest from '../public/audio/sfx/audio-manifest.json';
import { SEAMS, SHOTS, beatF } from './timeline';
import { T2 } from './shots/S2Flange';
import { FIRST as S6_FIRST } from './shots/S6Specs';

export const OUTPUT_AUDIO_OFFSET_F = (2048 / 48000) * 30; // 1.28f，实测见 timeline.ts / analysis/render-check.json

export const FS = {
  fire: '17556__incarnadine__elements_fire.wav',
  anvil: '260626__soundeffectspodcast_com__hammer-anvil-hit-1.mp3',
  shutter: '261098__magedu__camera_shutter_release_dslr.wav',
  whooshSoft: '364660__original_sound__whoosh-simpler.wav',
  impact: '377303__meijstroaudio__deep-cinematic-impact.wav',
  drill: '382962__mattruthsound__drillpress-chuck-spinning-metalic-metal-tool-workshop-2.wav',
  whooshFast: '530448__mellau__whoosh-short-5.wav',
  mill: '783833__chungus43a__milling-machine-cutting-metal.wav',
  lathe: '160545__keykrusher__lathe-atlas-6inch-idling.wav',
  taps: '855309__gammagool__metal-taps.wav',
  riser: '859482__beaconstudio__cinematic-riser-3-subtle.wav',
};
const SYNTH_PEAK: Record<string, number> = Object.fromEntries(manifest.files.map((m) => [m.file, m.rms_peak_time_s]));

export type Sfx = { id: string; from: number; src: string; volume: number; durationInFrames?: number; trimBefore?: number; fade?: number; note: string };

// cue：target = 画面语义峰值帧；peakS = 素材内峰值（秒）；trimS = 裁入点（秒，按帧取整）
const cue = (id: string, src: string, target: number, volume: number, note: string, o: { peakS?: number; trimS?: number; dur?: number; fade?: number } = {}): Sfx => {
  const trimF = Math.round((o.trimS ?? 0) * 30);
  const peakS = o.peakS ?? SYNTH_PEAK[src] ?? 0;
  const peakInWindowF = Math.max(0, peakS * 30 - trimF);
  const from = Math.max(0, Math.round(target - peakInWindowF - OUTPUT_AUDIO_OFFSET_F));
  return { id, src, volume, from, note, durationInFrames: o.dur, trimBefore: trimF || undefined, fade: o.fade };
};
const s2 = (l: number) => SHOTS.s2_flange.from + l;

// 钻孔：钻床素材里两段不同的切入（0.683s / 1.077s 起），交替 + 音量阶梯递减
const DRILL_CUTS = [{ trimS: 1.566, peakS: 1.61 }, { trimS: 2.1, peakS: 2.155 }];
const DRILLS: Sfx[] = T2.holes.map((h, i) => {
  const c = DRILL_CUTS[i % 2];
  return cue(`drill-${i + 1}`, FS.drill, s2(h), 1.1 - (0.4 * i) / 7, `第 ${i + 1} 孔钻穿`, { ...c, dur: 8, fade: 3 });
});
// 金属轻敲：素材每 0.5s 一下，取前三下给三格
const TAP_AT = [0.021, 0.501, 1.003];

export const SFX: Sfx[] = [
  cue('fire', FS.fire, 0, 2.2, '开场炉火底噪（素材录得轻，峰值 −17.5dB，给 2.2 倍增益）', { peakS: 0, dur: SEAMS.leakPeak + 20 }),
  cue('stamp', FS.anvil, beatF(0), 0.55, '印章随锻锤压下（第 0 拍）', { peakS: 0.03 }),
  cue('stamp-ring', 'anvil-hit.wav', beatF(0), 0.2, '锻锤余振（拟音，补足实录 0.68s 的短尾）'),
  cue('leak', FS.riser, SEAMS.leakPeak, 0.42, '琥珀漏光涌起 → 峰值藏切', { peakS: 2.29 }),
  cue('roar', 'furnace-roar.wav', s2(T2.fill) + 2, 0.45, '烧红毛坯成形（拟音）'),
  cue('lathe-hum', FS.lathe, s2(T2.lathe) - 6, 0.7, '车床主轴运转底噪（车削 + 钻孔段，末 12f 淡出）', { peakS: 0, trimS: 1.2, dur: T2.holes[7] - T2.lathe + 26, fade: 12 }),
  cue('mill', FS.mill, s2(T2.lathe) - 2, 3.0, '车削切削（窗口 = 车削段；素材峰值 −20.7dB，给 3 倍增益）', { peakS: 0, trimS: 0.3, dur: T2.latheEnd - T2.lathe + 12, fade: 8 }),
  ...DRILLS,
  cue('portal', FS.whooshSoft, SEAMS.portalStart + 20, 0.45, '穿过法兰中孔', { peakS: 0.12 }),
  cue('fling', FS.whooshFast, beatF(24) - 6, 0.42, '拉杆快甩', { peakS: 0.26 }),
  cue('fling-tick', FS.taps, beatF(24), 0.3, '拉杆过冲回弹', { peakS: TAP_AT[0], dur: 12 }),
  cue('occluder', FS.whooshSoft, SEAMS.occluderCut, 0.5, '前景遮挡掠过镜头', { peakS: 0.12 }),
  ...SEAMS.flashes.map((g, i) => cue(`shutter-${i + 1}`, FS.shutter, g, 1.8, `第 ${i + 1} 闪快门（只取第一声）`, { peakS: 0.31, trimS: 0.2, dur: 9, fade: 2 })),
  cue('whip', FS.whooshFast, SEAMS.whipStart + 3, 0.55, '竖向甩镜（速度峰值）', { peakS: 0.26 }),
  cue('shop-amb', FS.lathe, SHOTS.s5_supply.from + 20, 0.45, '一站供应：车间环境声（车床运转，首尾淡入淡出）', { peakS: 0, trimS: 12.0, dur: SHOTS.s5_supply.to - SHOTS.s5_supply.from - 14, fade: 14 }),
  ...[0, 1, 2].map((i) => cue(`cell-${i + 1}`, FS.taps, SHOTS.s6_specs.from + S6_FIRST + i * 12 + 6, 0.6 - 0.08 * i, `规格第 ${i + 1} 格点亮`, { peakS: TAP_AT[i], trimS: Math.round(TAP_AT[i] * 30) / 30, dur: 14 })),
  cue('riser', FS.riser, SEAMS.outroStamp - 1, 0.45, '合影组装铺垫 → 字标', { peakS: 2.29 }),
  cue('impact', FS.impact, SEAMS.outroStamp, 0.7, '字标压印（第 54 拍）', { peakS: 0.03 }),
  cue('shimmer', 'shimmer.wav', SEAMS.outroStamp + 20, 0.3, '橙线长出余韵（拟音）'),
  cue('contact', FS.whooshSoft, SEAMS.outroSwap + 8, 0.3, '合影 → 联系卡', { peakS: 0.12 }),
];

export const SfxTrack: React.FC = () => (
  <>
    {SFX.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} layout="none">
        <Audio src={staticFile(`audio/sfx/${s.src}`)} trimBefore={s.trimBefore}
          volume={s.fade && s.durationInFrames ? (fr) => s.volume * interpolate(fr, [0, Math.min(s.fade!, 6), s.durationInFrames! - s.fade!, s.durationInFrames!], [s.fade! > 6 ? 0 : 1, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : s.volume} />
      </Sequence>
    ))}
  </>
);
