// 时间线唯一事实源。BGM 网格来自 analysis/beat_data.json（librosa 网格拟合，124.0 BPM）。
// 源分析值（SOURCE_*）永不改；BGM 在成片里从 BGM_FROM 帧起播，第 0 拍对齐印章落下。
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const SOURCE_BEAT0 = 0.2633461514908024; // 源曲第 0 拍（秒）
export const BEAT_INT = 0.48384479657443435; // 拍长（秒）
export const BGM_FROM = 28; // BGM 在成片中的起播帧
export const OUTPUT_AUDIO_OFFSET_SEC = 0; // 渲后回测实测后填写（sound-design §4.6）

export const beatT = (n: number) => BGM_FROM / FPS + SOURCE_BEAT0 + OUTPUT_AUDIO_OFFSET_SEC + n * BEAT_INT;
export const beatF = (n: number) => Math.round(beatT(n) * FPS);

// 镜头区间（from 含，to 不含）。转场重叠窗口在 SEAMS 里单独声明。
export const SHOTS = {
  s1_brand: { from: 0, to: beatF(6) }, //   0–123  品牌开场（漏光峰值藏切）
  s2_flange: { from: beatF(6), to: beatF(20) + 40 }, // 123–366 3D 对焊法兰（末 40f 为穿窗）
  s3_slip: { from: beatF(20), to: 464 }, // 326–464 平焊法兰 前后拉杆
  s4_forge: { from: 464, to: 622 }, //   464–622 毛坯锻件 三连闪（首闪 = 第 32 拍爆点）
  s5_supply: { from: 610, to: 712 }, //   610–712 一站供应（甩镜入）
  s6_specs: { from: 704, to: beatF(52) + 24 }, // 704–815 规格逐格点亮
  s7_outro: { from: beatF(52), to: 1000 }, // 791–1000 合影 + 联系卡（末段 hold 方便截图）
} as const;

export const TOTAL = 1000;

// 接缝（全局帧）
export const SEAMS = {
  leakPeak: beatF(6), // S1→S2 琥珀漏光峰值帧 = 硬切
  portalStart: beatF(20), // S2→S3 穿过法兰中孔：窗放大 40f
  portalEnd: beatF(20) + 40,
  occluderStart: 457, // S3→S4 前景遮挡隐形切：遮挡物扫过 14f，实心核在 464 帧盖满全屏
  occluderCut: 464,
  flashes: [beatF(32), beatF(33.5), beatF(34.75)], // 三连闪：500 / 522 / 540
  whipStart: 610, // S4→S5 竖向甩镜
  dipStart: 698, // S5→S6 压暗交棒
  outroStamp: beatF(54), // 字标压印
} as const;

export const localF = (shot: { from: number }, globalFrame: number) => globalFrame - shot.from;
