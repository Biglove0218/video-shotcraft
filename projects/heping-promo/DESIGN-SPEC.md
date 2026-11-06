# 瑞安市和平机械配件厂 · 竖屏宣传片 设计 spec（共同创作，进行中）

## 已确认（产品简报 / 需求决策）

| 项目 | 内容 |
|---|---|
| 产品 | 锻件阀门配件、锻件法兰：毛坯锻件、毛坯/成品平焊法兰、毛坯/成品对焊法兰 |
| 主线 | 毛坯 → 成品 的转换过程 |
| 用途 / 画幅 | 视频号 + 微信直接分享客户；1080×1920 竖屏，25–30s，中文字幕 |
| 卖点文案 | 毛坯成品 一站供应 ｜ 自由锻 · 非标定制 · 来图加工 ｜ 国标 GB ｜ 碳钢 · 不锈钢 材质齐全 ｜ 20 年老厂 ｜ 可开票 ｜ 全国发货 |
| 材质 | 碳钢 20#、16Mn；不锈钢 304、316 |
| 标准 | 国标 GB |
| Logo | 厂名文字标（"和平"印章式标 + 全称） |
| 联系方式 | 联系人 陈和平 ｜ 电话 133 5336 3168 ｜ 浙江省温州市瑞安市潘岱街道寺前村老坑底 1 号 |
| 素材 | 用户实拍 photos/1–4.jpg；对焊法兰用程序化 3D 建模（photos/5.jpg 仅 164×144，不使用） |
| 音乐 | 推荐内置 bgm-tech-house.mp3（~124 BPM），锻锤/金属拟音卡拍（待分镜阶段定） |
| 数据口径 | 仅使用用户提供的公开商业信息；3D 法兰不标具体尺寸数值 |

## 视觉方向（已确认：C「由火入钢」，版式无修改）

styleframe：`styleframe/out/方向A.jpg`、`方向B.jpg`、`方向C.jpg`（汇总 `styleframes-ABC.jpg`）

- A「炉火锻造」暖黑 #0b0806 + 炉火橙 #ff6a1f，Noto Serif SC 900 标题
- B「精工冷钢」石墨蓝 #0b1014 + 钢银，工程框线，强调色 #5cb8ff
- C「由火入钢」（Agent 推荐）毛坯段暖调 → 成品段冷钢，橙色 #ff6a1f 为贯穿品牌色，Noto Sans SC 900 + Barlow Condensed 数字

## 功能到镜头映射 + 分镜（用户已确认：“可以”）

时长约 31s（930f@30fps），1080×1920；BGM bgm-tech-house.mp3（~124 BPM，分镜确认后做节奏分析，镜头边界吸附拍点）。
视频号安全区：关键文字保持在 y 160–1600、x 72–1008 内（底部约 300px 留给平台文案/按钮）。

| # | 时间 | 内容 | 镜头卡 · 变体 | 主动作 | 素材 | 字幕 | SFX |
|---|---|---|---|---|---|---|---|
| 1 | 0:00–0:04 | 品牌开场 | brand-ink-open（准星改为炉火光点） | 暗场炉火光晕升起、火星上飘 → "和平"印章随锻锤压印 → 厂名逐字压印 → 副标 → hold ≥1s | 手作（无照片） | 瑞安市 和平机械配件厂 / 锻件源头工厂 · 20 年老厂 | 炉火底噪、锻锤重击、BGM 起 |
| ↘ | 转场 | | transition-hidden-cut · light-leak-burn | 琥珀漏光藏切 | | | whoosh |
| 2 | 0:04–0:11 | 对焊法兰（主角立传） | wireframe-draw-on（轮廓）+ **新写 3D 车削/钻孔** + light-play-moves · sheen-sweep | 蓝图线描轮廓（来图）→ 烧红毛坯 → 车床旋转、刀光自颈部下扫，热→冷变银亮车削面 → 8 孔依次钻出（加速、每孔火星）→ 环绕停稳、单次高光 | 3D（flange.js） | 对焊法兰 / 来图 → 锻造毛坯 → 精车成品 | 车削声、钻孔 ×8（双样本交替+音量递减）、高光 shimmer |
| ↘ | 转场 | | shot-transitions · mask-wipe | 镜头推进穿过法兰中孔 | | | whoosh |
| 3 | 0:11–0:15 | 平焊法兰 | before-after-slider-scrub | 毛坯照满屏（暖），橙色分割杆先快甩后慢扫，杆过处显出成品照（冷） | photos/2.jpg 两个裁切 | 平焊法兰 / 毛坯 → 成品 | 甩杆 whoosh、金属滑过 |
| ↘ | 转场 | | shot-transitions · whip-pan | 甩镜 | | | whoosh |
| 4 | 0:15–0:18.5 | 毛坯锻件 | beat-cut-moves · paparazzi-flash | 三次白闪卡拍：全景 → 中景 → 单件特写，停在特写（全片整画面冲击名额 1/3） | photos/1.jpg | 毛坯锻件 / 自由锻 · 非标定制 | 三声重音卡拍 |
| 5 | 0:18.5–0:21.5 | 一站供应 | light-play-moves · spotlight-sweep | 车间大法兰缓推，聚光扫过揭示标题 | photos/4.jpg | 毛坯成品 一站供应 / 来图加工 | 车间环境声、riser 起 |
| 6 | 0:21.5–0:25 | 规格 | wall-reveal-moves · bento-light-up | photo ③ 同心圆纹理缓慢旋转作底，三行规格逐格点亮 | photos/3.jpg | 国标 GB / 碳钢 20# · 16Mn / 不锈钢 304 · 316 | 逐行轻金属敲击（递减） |
| 7 | 0:25–0:31 | 收场 | outro-group-photo-launch + DigitRoll | 3D 法兰、平焊、锻件三卡四面飞来围住"和平"字标合影（整画面冲击 2/3）→ 收成联系卡，电话数字滚动 → hold ≥2s | 前述素材 | 可开票 · 全国发货 / 联系人 陈和平 / 133 5336 3168 / 地址 | riser → 落地重击 + 余韵 |

新写范围与风险：镜头 2 的 3D 车削扫描、钻孔与材质热→冷过渡没有现成 demo，基于 flange.js 在 @remotion/three 中实现；
风险是 SwiftShader 软件渲染较慢（逐帧 3D），以静帧逐段验收控制。

交付：带 BGM 版 + 无 BGM 版（保留 SFX）。

## 制作放行版：帧级时间轴（video/src/timeline.ts 为唯一事实源）

BGM：bgm-tech-house.mp3，librosa 网格拟合 124.0 BPM，源 t0 = 0.2633s；成片从第 28 帧起播，第 0 拍 = 第 36 帧（印章落下）。
`beatF(n) = round((28/30 + 0.2633 + n·0.48384)·30)`。全片 1000f = 33.3s（比分镜预估 31s 多 2.3s：收尾联系卡加长停留便于截图）。

| 镜头 | 帧区间 | 拍点锚 | 镜头卡 · 变体（准确 demo） | 验收帧 |
|---|---|---|---|---|
| S1 品牌开场 | 0–123 | 印章 b0=36；漏光峰值 b6=123 | brand-ink-open（demos/typography/brand-ink-open/BrandInkOpen.tsx） | 30, 100 |
| S1→S2 | 95–166 | 峰值藏切 123 | transition-hidden-cut · light-leak-burn（LightLeakBurn.tsx） | 123 |
| S2 3D 对焊法兰 | 123–366 | 成形 b8=152；车削 b10–b14=181–239；钻孔 243–286；穿窗 b20=326 | 新写 3D（video/src/three/flange.ts） + 标题 blur-slide | 163, 208, 273, 310 |
| S2→S3 | 326–366 | 窗 40f | shot-transitions · mask-wipe（PortalWipeV2.tsx） | 335, 350 |
| S3 平焊法兰 | 326–464 | 快甩过冲顶点 b24=384 | before-after-slider-scrub（BeforeAfterSliderScrub.tsx） | 386, 430 |
| S3→S4 | 457–471 | 实心核盖满 464 | transition-hidden-cut · invisible-cut（InvisibleCut.tsx） | 464 |
| S4 毛坯锻件 | 464–622 | 三闪 b32=500 / b33.5=522 / b34.75=540 | beat-cut-moves · paparazzi-flash（PaparazziFlash.tsx） | 485, 506, 600 |
| S4→S5 | 610–670 | — | shot-transitions · whip-pan（WhipBrakeReal.tsx，竖向） | 628 |
| S5 一站供应 | 610–712 | — | blur-slide（demos/typography/blur-slide/BlurSlide.tsx） | 690 |
| S6 规格 | 704–815 | — | wall-reveal-moves · bento-light-up（BentoLightUp.tsx） | 745 |
| S7 收场 | 791–1000 | 字标压印 b54=820；转联系卡 b58=878 | outro-group-photo-launch（OutroGroupPhotoLaunch.tsx）+ DigitRoll | 805, 858, 960 |

全画面级冲击（≤3 处、间隔 ≥16 拍）：① S4 三连闪（b32，一次手法计一个名额）② S7 字标压印（b54）。

### 制作中相对分镜的偏差（逐条记录理由）

1. **S2 未挂 wireframe-draw-on / sheen-sweep 卡名**：图纸线描与高光由 3D 场景自身实现（SVG 投影线稿 + 真实 3D 高光随环绕运动），
   避免与 S6 bento-light-up 构成“整墙光效 ×2”（wall-reveal 已知坑：A/B 同片只选一）及 2D 扫光叠加。
2. **S3→S4 由甩镜改为前景遮挡隐形切；S4→S5 改用甩镜**：S3→S4 若用甩镜，长尾会吃掉 S4 闪前 30f 活素材，无法让首闪落在第 32 拍爆点。
3. **S3 两版不是同一物体**：毛坯与成品取自照片②同一钢台面、相近机位的两堆法兰（用户无同物前后照）；同卡框、同版式。末段静止约 14f，由遮挡转场接管。
4. **S4 裁切倍率 1.0 / 1.5 / 2.1**（卡片 2.8）：实拍 1080 宽放到 2.8 倍会糊；HUD 去掉英文相机读数，只留取景框与对焦框。
5. **S5 由 spotlight-sweep 改为 blur-slide**：全片光效（漏光、车削刀光、逐格描边）已到 light-play 卡“≤2 次”上限。
6. **S7 收尾不淡出**：原卡末尾熄灯，这里改为联系卡停留 ≥2s 便于截图。
7. **SFX 为程序化拟音**：Freesound 站点对本云端环境返回 HTTP 403（网络已放行，属站点侧拦截），未下载实录；
   拟音脚本 video/analysis/synth_sfx.py（固定种子），清单 video/public/audio/sfx/audio-manifest.json。音色未经人耳试听，仅有测量。

## 重新生成 styleframe

```bash
cd styleframe && npm install && python3 -m http.server 4321 &
node shoot.cjs 'flange.html?mode=split&theme=duo&cut=-0.02&w=1080&h=1080' img/fl-C.png 1080 1080 1
node shoot.cjs 'styleframe.html?dir=C' out/sf-C.png 4320 1920 1
```
