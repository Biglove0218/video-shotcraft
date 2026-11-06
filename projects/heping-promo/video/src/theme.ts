// 视觉 tokens：方向 C「由火入钢」（styleframe/out/方向C.jpg）
export const C = {
  bg: '#0a0b0c',
  bgWarm: '#0b0806',
  bgCool: '#0b1014',
  ink: '#f3f1ee',
  mute: '#a9a49e',
  ember: '#ff6a1f', // 品牌橙：贯穿全片
  emberHot: '#ffb04a',
  emberDeep: '#c2311a',
  steel: '#9cc2ff', // 冷钢强调
  steelInk: '#e8edf1',
  rule: 'rgba(255,255,255,0.22)',
};

export const FONT = {
  sans: '"Noto Sans SC", sans-serif',
  serif: '"Noto Serif SC", serif',
  num: '"Barlow Condensed", "Noto Sans SC", sans-serif',
};

// 照片调色：毛坯 = 炉火暖调；成品 = 冷钢
export const GRADE = {
  hot: 'contrast(1.25) brightness(0.62) saturate(0.8) sepia(0.3)',
  cold: 'grayscale(0.65) contrast(1.15) brightness(0.82)',
  tintHot: 'rgba(255,96,24,0.28)',
  tintCold: 'rgba(60,110,170,0.18)',
};

// 动效性格 tokens（B2B 专业信赖为底，落地类动作允许 y1>1 的真过冲）
export const MOTION = {
  enter: 21, // 主入场时长 f
};
