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

## 视觉方向（待用户选择）

styleframe：`styleframe/out/方向A.jpg`、`方向B.jpg`、`方向C.jpg`（汇总 `styleframes-ABC.jpg`）

- A「炉火锻造」暖黑 #0b0806 + 炉火橙 #ff6a1f，Noto Serif SC 900 标题
- B「精工冷钢」石墨蓝 #0b1014 + 钢银，工程框线，强调色 #5cb8ff
- C「由火入钢」（Agent 推荐）毛坯段暖调 → 成品段冷钢，橙色 #ff6a1f 为贯穿品牌色，Noto Sans SC 900 + Barlow Condensed 数字

## 重新生成 styleframe

```bash
cd styleframe && npm install && python3 -m http.server 4321 &
node shoot.cjs 'flange.html?mode=split&theme=duo&cut=-0.02&w=1080&h=1080' img/fl-C.png 1080 1080 1
node shoot.cjs 'styleframe.html?dir=C' out/sf-C.png 4320 1920 1
```
