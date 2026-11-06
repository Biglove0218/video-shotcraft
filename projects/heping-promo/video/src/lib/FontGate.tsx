// 字体闸门：渲染任一帧前，按全片实际用字加载全部字重（fontsource 按 unicode-range 分片，
// 只有 document.fonts.load 带上真实文本才会把对应分片拉下来）。
import React, { useState } from 'react';
import { continueRender, delayRender } from 'remotion';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import '@fontsource/noto-serif-sc/900.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import { ALL_TEXT } from '../copy';

const FACES = [
  '500 40px "Noto Sans SC"', '700 40px "Noto Sans SC"', '900 40px "Noto Sans SC"',
  '900 40px "Noto Serif SC"', '600 40px "Barlow Condensed"', '700 40px "Barlow Condensed"',
];

export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  React.useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f, ALL_TEXT)))
      .then(() => document.fonts.ready)
      .then(() => { setReady(true); continueRender(handle); })
      .catch((e) => { console.error(e); setReady(true); continueRender(handle); });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
