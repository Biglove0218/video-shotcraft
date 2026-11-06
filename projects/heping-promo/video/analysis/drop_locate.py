import numpy as np, librosa
from scipy.signal import butter, sosfilt
y, sr = librosa.load('public/audio/bgm/bgm-tech-house.mp3', sr=None, mono=True)
T = 0.48384479657443435; t0k = 0.2633461514908024 + T / 2  # 底鼓相位网格
sos = butter(4, [40, 160], btype='band', fs=sr, output='sos')
env = librosa.onset.onset_strength(y=sosfilt(sos, y), sr=sr); tt = librosa.times_like(env, sr=sr)
rms = librosa.feature.rms(y=y)[0]; rt = librosa.times_like(rms, sr=sr)
def at(t):
    m = (tt >= t - 0.03) & (tt <= t + 0.03); return env[m].max()
def r(t):
    m = (rt >= t) & (rt < t + T); return rms[m].mean()
print('kick-grid beats around the drop:')
for n in range(26, 38):
    t = t0k + n * T
    print(f'  n={n:2d} t={t:.3f}s kick={at(t):.2f} rms={r(t):.3f}')
print('first beats:')
for n in range(-1, 6):
    t = t0k + n * T
    print(f'  n={n:2d} t={t:.3f}s kick={at(t):.2f} rms={r(t):.3f}')
