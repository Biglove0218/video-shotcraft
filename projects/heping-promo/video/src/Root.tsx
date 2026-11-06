import React from 'react';
import { Composition } from 'remotion';
import { Main, MainProps } from './Main';
import { FPS, H, TOTAL, W } from './timeline';

export const Root: React.FC = () => (
  <Composition
    id="HepingPromo"
    component={Main}
    durationInFrames={TOTAL}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{ bgm: true } satisfies MainProps}
  />
);
