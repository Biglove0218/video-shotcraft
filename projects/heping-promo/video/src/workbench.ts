// 动效工作台接入清单（references/workbench.md §2–3）。
// 时间表与 Main 同源：片段区间 SEG_* / SFX / BGM 全部 import，不手抄第二份。
// 节奏命门（缓动、时值、相机路径、拍点）保持常量；属性面板只开放文案类语境参数。
import React from 'react';
import { FontGate } from './lib/FontGate';
import { COPY } from './copy';
import { SFX } from './sfx';
import { BGM_FROM, FPS, H, TOTAL, W } from './timeline';
import { Main, bgmVolume } from './Main';
import {
  Occluder, SEG_FORGE, SEG_OCCLUDER, SEG_OPEN, SEG_OUTRO, SEG_SLIP, SEG_SPECS,
  SegForge, SegOpen, SegOutro, SegSlip, SegSpecs,
} from './segments';

const h = React.createElement;
const withFonts = (el: React.ReactElement) => h(FontGate, null, el);

const OPEN_DEFAULTS = {
  city: COPY.city, name1: COPY.nameLines[0], name2: COPY.nameLines[1], seal: COPY.seal,
  sub1: COPY.s1Sub[0], years: COPY.s1Sub[1], sub3: COPY.s1Sub[2], s2TitleA: COPY.s2TitleA, s2TitleB: COPY.s2TitleB,
};
const OpenUnit: React.FC<Partial<typeof OPEN_DEFAULTS>> = (p) => {
  const v = { ...OPEN_DEFAULTS, ...p };
  return withFonts(h(SegOpen, { s1: { city: v.city, nameLines: [v.name1, v.name2], seal: v.seal, sub: [v.sub1, v.years, v.sub3] }, s2: { titleA: v.s2TitleA, titleB: v.s2TitleB } }));
};

const SLIP_DEFAULTS = { kicker: COPY.s3Kicker, title: COPY.s3Title, before: COPY.s3Before, after: COPY.s3After };
const SlipUnit: React.FC<Partial<typeof SLIP_DEFAULTS>> = (p) => withFonts(h(SegSlip, { ...SLIP_DEFAULTS, ...p }));

const FORGE_DEFAULTS = { s4Kicker: COPY.s4Kicker, s4a: COPY.s4Title[0], s4b: COPY.s4Title[1], s5a: COPY.s5Title[0], s5b: COPY.s5Title[1], s5Sub: COPY.s5Sub };
const ForgeUnit: React.FC<Partial<typeof FORGE_DEFAULTS>> = (p) => {
  const v = { ...FORGE_DEFAULTS, ...p };
  return withFonts(h(SegForge, { s4: { kicker: v.s4Kicker, title: [v.s4a, v.s4b] }, s5: { title: [v.s5a, v.s5b], sub: v.s5Sub } }));
};

const SPECS_DEFAULTS = {
  kicker: COPY.s6Kicker,
  k1: COPY.specs[0].k, v1: COPY.specs[0].v, k2: COPY.specs[1].k, v2: COPY.specs[1].v, k3: COPY.specs[2].k, v3: COPY.specs[2].v,
};
const SpecsUnit: React.FC<Partial<typeof SPECS_DEFAULTS>> = (p) => {
  const v = { ...SPECS_DEFAULTS, ...p };
  return withFonts(h(SegSpecs, { kicker: v.kicker, specs: [{ k: v.k1, v: v.v1 }, { k: v.k2, v: v.v2 }, { k: v.k3, v: v.v3 }] }));
};

const OUTRO_DEFAULTS = {
  seal: COPY.seal, city: COPY.city, name: COPY.name, tag1: COPY.s7Tags[0], tag2: COPY.s7Tags[1],
  contactLabel: COPY.contactLabel, contact: COPY.contact, phone: COPY.phone, addr1: COPY.addr[0], addr2: COPY.addr[1],
};
const OutroUnit: React.FC<Partial<typeof OUTRO_DEFAULTS>> = (p) => {
  const v = { ...OUTRO_DEFAULTS, ...p };
  return withFonts(h(SegOutro, { seal: v.seal, city: v.city, name: v.name, tags: [v.tag1, v.tag2], contactLabel: v.contactLabel, contact: v.contact, phone: v.phone, addr: [v.addr1, v.addr2] }));
};

const text = (key: string, label: string, def: string) => ({ type: 'text', key, label, default: def });
const schemaOf = (d: Record<string, string>, labels: Record<string, string>) => Object.entries(d).map(([k, v]) => text(k, labels[k] ?? k, v));

export const WORKBENCH = {
  name: '瑞安市和平机械配件厂 · 竖屏宣传片',
  fps: FPS, width: W, height: H,
  total: TOTAL,
  background: '#000000',
  shots: [
    { id: 'open', label: 'S1 品牌开场 + S2 辗环锻造 / 对焊法兰', from: SEG_OPEN.from, duration: SEG_OPEN.to - SEG_OPEN.from, component: OpenUnit, props: {},
      schema: schemaOf(OPEN_DEFAULTS, { city: '城市', name1: '厂名第一行', name2: '厂名第二行', seal: '印章字', sub1: '副标前段', years: '年数', sub3: '副标后段', s2TitleA: 'S2 标题①（辗环）', s2TitleB: 'S2 标题②（对焊）' }) },
    { id: 'slip', label: 'S3 平焊法兰 毛坯→成品', from: SEG_SLIP.from, duration: SEG_SLIP.to - SEG_SLIP.from, component: SlipUnit, props: {},
      schema: schemaOf(SLIP_DEFAULTS, { kicker: '眉标', title: '标题', before: '左角标(毛坯)', after: '右角标(成品)' }) },
    { id: 'forge', label: 'S4 毛坯锻件三连闪 + S5 一站供应', from: SEG_FORGE.from, duration: SEG_FORGE.to - SEG_FORGE.from, component: ForgeUnit, props: {},
      schema: schemaOf(FORGE_DEFAULTS, { s4Kicker: 'S4 眉标', s4a: 'S4 标题①', s4b: 'S4 标题②', s5a: 'S5 第一行', s5b: 'S5 第二行', s5Sub: 'S5 副标' }) },
    { id: 'specs', label: 'S6 规格逐格点亮', from: SEG_SPECS.from, duration: SEG_SPECS.to - SEG_SPECS.from, component: SpecsUnit, props: {},
      schema: schemaOf(SPECS_DEFAULTS, { kicker: '标题', k1: '格①名', v1: '格①值', k2: '格②名', v2: '格②值', k3: '格③名', v3: '格③值' }) },
    { id: 'outro', label: 'S7 合影 + 联系卡', from: SEG_OUTRO.from, duration: SEG_OUTRO.to - SEG_OUTRO.from, component: OutroUnit, props: {},
      schema: schemaOf(OUTRO_DEFAULTS, { seal: '印章字', city: '城市', name: '厂名', tag1: '标签①', tag2: '标签②', contactLabel: '联系人标签', contact: '联系人', phone: '电话', addr1: '地址第一行', addr2: '地址第二行' }) },
  ],
  transitions: [
    { id: 'occluder', label: 'S3→S4 前景遮挡转场', from: SEG_OCCLUDER.from, duration: SEG_OCCLUDER.to - SEG_OCCLUDER.from, component: Occluder },
  ],
  captions: [],
  overlays: [],
  sfx: SFX.map((s) => ({ from: s.from, duration: s.durationInFrames ?? 90, src: `audio/sfx/${s.src}`, volume: s.volume, label: s.note })),
  bgm: [{ from: BGM_FROM, duration: TOTAL - BGM_FROM, src: 'audio/bgm/bgm-tech-house.mp3', volume: bgmVolume(BGM_FROM + 200) }],
  order: ['transitions', 'captions', 'overlays'],
  original: Main,
};
