# 渲后回测（music-beat-sync §5b）：从成片音轨重测 BGM 网格，对比设计切点帧
import json, sys, numpy as np, librosa
y, sr = librosa.load(sys.argv[1], sr=None, mono=True)
y = y[int(1.0 * sr):int(32.0 * sr)]  # BGM 段（避开片尾淡出）
off0 = 1.0
yh, yp = librosa.effects.hpss(y)
tempo, beats = librosa.beat.beat_track(y=yp, sr=sr, tightness=400, units='time')
beats = beats + off0
i = np.arange(len(beats)); A = np.vstack([i, np.ones_like(i)]).T
(T, t0), *_ = np.linalg.lstsq(A, beats, rcond=None)
SRC_T = 0.48384479657443435; SRC_T0 = 0.2633461514908024; FROM = 28
design0 = FROM / 30 + SRC_T0
k = np.round((t0 - design0) / T); t0n = t0 - k * T
print(f'render grid: T={T:.5f} (src {SRC_T:.5f})  beat0={t0n:.4f}s  design beat0={design0:.4f}s  diff={(t0n-design0)*1000:.1f}ms = {(t0n-design0)*30:.2f}f')
cuts = {'stamp b0': 0, 'leak peak b6': 6, 'fill b8': 8, 'lathe b10': 10, 'portal b20': 20, 'fling b24': 24, 'flash1 b32': 32, 'flash2 b33.5': 33.5, 'flash3 b34.75': 34.75, 'outro b52': 52, 'stamp b54': 54, 'swap b58': 58}
rows = []
for name, n in cuts.items():
    design_f = round((design0 + n * SRC_T) * 30)
    measured_f = (t0n + n * T) * 30
    rows.append({'cut': name, 'design_frame': design_f, 'measured_beat_frame': round(measured_f, 2), 'err_f': round(measured_f - design_f, 2)})
for r in rows: print(r)
json.dump({'render_T': T, 'render_beat0_s': t0n, 'design_beat0_s': design0, 'rows': rows}, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
