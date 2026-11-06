# 网格相位核验：底鼓（40–160Hz）能量应落在整数拍，而不是半拍
import numpy as np, librosa
from scipy.signal import butter, sosfilt
y, sr = librosa.load('public/audio/bgm/bgm-tech-house.mp3', sr=None, mono=True)
T = 0.48384479657443435; t0 = 0.2633461514908024
sos = butter(4, [40, 160], btype='band', fs=sr, output='sos')
env = librosa.onset.onset_strength(y=sosfilt(sos, y), sr=sr)
tt = librosa.times_like(env, sr=sr)
def at(t):
    m = (tt >= t - 0.03) & (tt <= t + 0.03)
    return env[m].max()
for lo, hi, name in [(0, 16, 'intro b0-15'), (16, 32, 'build b16-31'), (32, 64, 'full b32-63')]:
    on = np.mean([at(t0 + n * T) for n in range(lo, hi)])
    half = np.mean([at(t0 + (n + 0.5) * T) for n in range(lo, hi)])
    print(f'{name}: kick@beat {on:.2f}  kick@half-beat {half:.2f}  ratio {on/(half+1e-9):.2f}')
# 细扫相位：在一个拍长内找底鼓能量最大的偏移
best = []
for ph in np.linspace(0, T, 48, endpoint=False):
    best.append((np.mean([at(t0 + ph + n * T) for n in range(32, 96)]), ph))
best.sort(reverse=True)
print('best kick phase offsets (s):', [(round(p, 4), round(v, 2)) for v, p in best[:4]], ' T/2 =', round(T / 2, 4))
