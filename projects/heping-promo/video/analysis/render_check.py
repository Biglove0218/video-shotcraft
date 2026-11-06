# 渲后回测：BGM 原文件交叉相关求 BGM 实际起点 → 底鼓网格在成片中的帧位 → 与设计切点比对；并写 render-check.json
import json, sys, numpy as np, librosa
from scipy.signal import correlate, butter, sosfilt
src, sr = librosa.load('public/audio/bgm/bgm-tech-house.mp3', sr=48000, mono=True)
ren, _ = librosa.load(sys.argv[1], sr=48000, mono=True)
lags = []
for s0 in (6.0, 12.0, 20.0):
    probe = src[int(s0 * sr): int((s0 + 2.0) * sr)]
    exp = s0 + 34 / 30
    a = int((exp - 0.4) * sr); b = int((exp + 0.4) * sr) + len(probe)
    c = correlate(ren[a:b], probe, mode='valid'); k = int(np.argmax(c))
    lags.append((a + k) / sr - exp)
bgm_offset = float(np.median(lags))
T = 0.48384479657443435; t0 = 0.0214231532
# 源曲底鼓实测位置（40–160Hz onset 峰值，±40ms 内）
sos = butter(4, [40, 160], btype='band', fs=sr, output='sos')
env = librosa.onset.onset_strength(y=sosfilt(sos, src), sr=sr); tt = librosa.times_like(env, sr=sr)
def kick_true(t):
    m = (tt >= t - 0.04) & (tt <= t + 0.04); i = np.argmax(env[m]); return tt[m][i], env[m][i]
cuts = json.load(open('analysis/cuts.json'))
rows = []
for c in cuts:
    t_grid_src = t0 + c['beat'] * T
    tk, strength = kick_true(t_grid_src) if float(c['beat']).is_integer() else (t_grid_src, 0.0)
    heard_s = tk + 34 / 30 + bgm_offset
    rows.append({**c, 'heard_frame': round(heard_s * 30, 2), 'err_f': round(heard_s * 30 - c['frame'], 2), 'kick_strength': round(float(strength), 2)})
for r in rows: print(r)
errs = [abs(r['err_f']) for r in rows]
out = {'pipeline': 'Remotion 4.0.484 audio-only WAV → +2048 sample pad → ffmpeg aac 320k → mp4 mux (video stream copy from promo-v1.mp4)',
       'bgm_xcorr_lag_ms': round(bgm_offset * 1000, 2), 'max_abs_err_f': max(errs), 'rows': rows}
json.dump(out, open('analysis/render-check.json', 'w'), indent=1, ensure_ascii=False)
print('bgm lag ms', out['bgm_xcorr_lag_ms'], 'max |err| f', out['max_abs_err_f'])
