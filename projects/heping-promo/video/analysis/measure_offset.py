# 输出音轨偏移实测（sound-design §4.6）：用 SFX 原文件与渲出音轨做归一化交叉相关。
# 用法：uv run --with numpy --with scipy --python 3.11 analysis/measure_offset.py out/render.wav public/audio/sfx probes.json
# probes.json: [{"src": "shutter.wav", "from": 495, "label": "shutter-1"}, ...]（from = 实际 Sequence.from 帧）
import json, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import correlate, resample_poly

FPS = 30
render_path, sfx_dir, probes_path = sys.argv[1:4]
sr, y = wavfile.read(render_path)
y = y.astype(np.float64)
if y.ndim > 1: y = y.mean(axis=1)
y /= (np.max(np.abs(y)) + 1e-9)
rows = []
for p in json.load(open(probes_path)):
    s_sr, s = wavfile.read(f"{sfx_dir}/{p['src']}")
    s = s.astype(np.float64)
    if s.ndim > 1: s = s.mean(axis=1)
    if s_sr != sr: s = resample_poly(s, sr, s_sr)
    tr = int(p.get('trimS', 0) * sr); s = s[tr: tr + int(0.25 * sr)]  # 只用（裁入点后的）攻击段做探针
    t0 = p['from'] / FPS
    a = max(0, int((t0 - 0.25) * sr)); b = min(len(y), int((t0 + 0.5) * sr) + len(s))
    seg = y[a:b]
    c = correlate(seg, s, mode='valid')
    norm = np.sqrt(np.convolve(seg ** 2, np.ones(len(s)), mode='valid')) * np.sqrt(np.sum(s ** 2)) + 1e-9
    nc = c / np.maximum(norm, 0.05 * norm.max())  # 静音段能量≈0 时不让归一化爆掉
    k = int(np.argmax(nc))
    measured = (a + k) / sr
    rows.append({**p, 'measured_start_s': round(measured, 5), 'design_start_s': round(t0, 5),
                 'offset_samples': int(round((measured - t0) * sr)), 'offset_frames': round((measured - t0) * FPS, 3), 'ncc': round(float(nc[k]), 3)})
for r in rows: print(r)
off = [r['offset_frames'] for r in rows if r['ncc'] > 0.5]
print('median offset frames:', np.median(off) if off else None, 'spread:', (max(off) - min(off)) if off else None, 'sr:', sr)
