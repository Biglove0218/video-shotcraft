# 程序化拟音（Freesound 站点拒绝本云端环境访问时的替代方案）：
# 全部由滤波噪声 / 非谐泛音 / 包络合成，固定随机种子，可复现。输出 48kHz 16bit WAV。
# 用法：uv run --with numpy --with scipy --python 3.11 analysis/synth_sfx.py public/audio/sfx
import json, sys, hashlib, os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(20261106)

def t(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=4): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=4): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def noise(d): return rng.standard_normal(int(d * SR))
def env_exp(d, tau, attack=0.002):
    tt = t(d); a = np.clip(tt / attack, 0, 1); return a * np.exp(-tt / tau)
def reverb(x, dur=0.9, mix=0.18, damp=3000):
    ir = noise(dur) * np.exp(-t(dur) / (dur / 5)); ir = lp(ir, damp); ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(x, ir)[: len(x) + int(dur * SR)]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix
def norm(x, peak_db=-3.0):
    return x / (np.max(np.abs(x)) + 1e-9) * (10 ** (peak_db / 20))
def stereo(x, width=0.12, delay_ms=7):
    d = int(SR * delay_ms / 1000)
    r = np.concatenate([np.zeros(d), x])[: len(x)]
    return np.stack([x, x * (1 - width) + r * width], axis=1)

S = {}

# 1 炉火噼啪（开场底噪，5s）：低频火焰轰鸣 + 随机噼啪脉冲
d = 5.0; x = lp(np.cumsum(noise(d)) * 0.002, 180) * 3
x += bp(noise(d), 300, 2500) * 0.05 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t(d)))
for k in range(70):
    p = int(rng.uniform(0, d - 0.05) * SR); L = int(rng.uniform(0.002, 0.012) * SR)
    burst = bp(rng.standard_normal(L), 1500, 7000, 2) * np.exp(-np.arange(L) / (L / 4)) * rng.uniform(0.2, 1.0)
    x[p:p + L] += burst
fade = np.minimum(1, np.minimum(t(d) / 0.6, (d - t(d)) / 0.8)); S['fire-crackle'] = x * fade

# 2 锻锤砸砧（印章落下）：非谐金属泛音 + 冲击瞬态 + 低频撞击
d = 2.6; tt = t(d); x = np.zeros_like(tt)
for f, a, tau in [(523, 1.0, 0.9), (1307, 0.7, 0.55), (2291, 0.45, 0.35), (3483, 0.3, 0.22), (5112, 0.18, 0.12), (7020, 0.1, 0.06)]:
    x += a * np.sin(2 * np.pi * f * tt * (1 + 0.0004 * np.exp(-tt / 0.05))) * np.exp(-tt / tau)
x += hp(noise(d), 1500) * env_exp(d, 0.012) * 1.6
x += np.sin(2 * np.pi * 62 * tt) * env_exp(d, 0.09) * 1.4
S['anvil-hit'] = reverb(x * 0.6, 1.1, 0.22)

# 3 漏光暖光涌起（峰值在 0.93s）：滤波噪声上扬后回落
d = 2.6; tt = t(d); pk = 0.93
e = np.where(tt < pk, (tt / pk) ** 2.2, np.exp(-(tt - pk) / 0.45))
x = np.zeros_like(tt)
for lo, hi, a in [(200, 900, 1.0), (900, 3000, 0.5), (3000, 9000, 0.18)]:
    x += bp(noise(d), lo, hi) * a
S['leak-swell'] = x * e

# 4 出炉轰燃（毛坯成形）：火焰 whoosh
d = 1.6; tt = t(d); e = np.clip(tt / 0.06, 0, 1) * np.exp(-tt / 0.45)
x = bp(noise(d), 120, 1800) * e + bp(noise(d), 1800, 6000) * e * 0.25
x += lp(noise(d), 90) * e * 2.0
S['furnace-roar'] = reverb(x, 0.8, 0.15)

# 5 车削切削（2.2s）：金属刮削噪声 + 刀具啸叫（随主轴调制）
d = 2.2; tt = t(d)
e = np.clip(tt / 0.12, 0, 1) * np.clip((d - tt) / 0.25, 0, 1)
mod = 0.75 + 0.25 * np.sin(2 * np.pi * 5.3 * tt)
x = bp(noise(d), 2200, 5200) * mod * 0.9 + bp(noise(d), 600, 1400) * 0.35
whine = np.sin(2 * np.pi * (1840 + 22 * np.sin(2 * np.pi * 3.1 * tt)) * tt) * 0.22 + np.sin(2 * np.pi * 3690 * tt) * 0.08
x = (x + whine * mod) * e
S['lathe-cut'] = reverb(x, 0.6, 0.12)

# 6 钻孔（两种样本交替）：短促钻头啸叫 + 钻穿的一声脆响
for name, f0 in [('drill-a', 2650), ('drill-b', 3120)]:
    d = 0.42; tt = t(d)
    e = np.clip(tt / 0.015, 0, 1) * np.clip((0.26 - tt) / 0.05, 0, 1)
    x = (np.sin(2 * np.pi * f0 * tt * (1 + 0.04 * tt)) * 0.35 + bp(noise(d), 1800, 6000) * 0.5) * e
    c0 = int(0.25 * SR); L = int(0.03 * SR)
    x[c0:c0 + L] += hp(noise(0.03), 2500) * np.exp(-np.arange(L) / (L / 5)) * 1.4
    S[name] = reverb(x, 0.4, 0.1)

# 7 whoosh（快 / 柔）：带通中心频率扫掠的噪声，峰值在 60% 处
for name, d, f_lo, f_hi, pkr in [('whoosh-fast', 0.7, 300, 3500, 0.55), ('whoosh-soft', 1.2, 200, 1800, 0.6)]:
    tt = t(d); pk = d * pkr
    e = np.where(tt < pk, (tt / pk) ** 2, np.exp(-(tt - pk) / (d * 0.18)))
    nseg = 24; seg = len(tt) // nseg; x = np.zeros_like(tt); base = noise(d)
    for i in range(nseg):
        fc = f_lo + (f_hi - f_lo) * np.sin(np.pi * i / nseg)
        lo, hi = max(60, fc * 0.6), min(16000, fc * 1.6)
        y = bp(base, lo, hi, 2); a, b = i * seg, (i + 1) * seg if i < nseg - 1 else len(tt)
        x[a:b] = y[a:b]
    S[name] = x * e

# 8 快门（反光镜 + 快门帘两声）
d = 0.3; x = np.zeros(int(d * SR))
for off, a, f in [(0.0, 1.0, 3200), (0.028, 0.8, 4600)]:
    p = int(off * SR); L = int(0.03 * SR)
    burst = bp(noise(0.03), 1200, 9000, 2) * np.exp(-np.arange(L) / (L / 6)) * a
    ring = np.sin(2 * np.pi * f * np.arange(L) / SR) * np.exp(-np.arange(L) / (L / 8)) * a * 0.3
    x[p:p + L] += burst + ring
x[: int(0.06 * SR)] += lp(noise(0.06), 400) * np.exp(-np.arange(int(0.06 * SR)) / (0.01 * SR)) * 0.5
S['shutter'] = reverb(x, 0.25, 0.08)

# 9 轻 tick（拉杆回弹）
d = 0.12; tt = t(d); x = (np.sin(2 * np.pi * 2400 * tt) * 0.5 + hp(noise(d), 3000) * 0.6) * env_exp(d, 0.012)
S['tick'] = x

# 10 轻金属敲击（规格格子点亮，两种）
for name, base in [('metal-tap-a', 1880), ('metal-tap-b', 2210)]:
    d = 0.9; tt = t(d); x = np.zeros_like(tt)
    for k, (m, a, tau) in enumerate([(1, 1.0, 0.35), (2.76, 0.5, 0.18), (5.4, 0.25, 0.09), (8.93, 0.12, 0.05)]):
        x += a * np.sin(2 * np.pi * base * m * tt) * np.exp(-tt / tau)
    x += hp(noise(d), 4000) * env_exp(d, 0.004) * 0.6
    S[name] = reverb(x * 0.6, 0.6, 0.18)

# 11 riser（合影组装铺垫，1.0s 末端抵达落点）
d = 1.0; tt = t(d); e = (tt / d) ** 2.5
sweep = np.sin(2 * np.pi * np.cumsum(220 + 900 * (tt / d) ** 2) / SR) * 0.25
x = (bp(noise(d), 500, 6000) * 0.6 + sweep) * e
x *= np.clip((d - tt) / 0.01, 0, 1)
S['riser'] = x

# 12 深沉落地重击（字标压印）
d = 2.6; tt = t(d)
boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt / 0.25) + 38) / SR) * env_exp(d, 0.35, 0.003)
x = boom * 1.5 + bp(noise(d), 80, 2500) * env_exp(d, 0.06) * 0.8 + hp(noise(d), 2500) * env_exp(d, 0.01) * 0.5
S['impact-deep'] = reverb(x, 1.6, 0.25, 2200)

# 13 余韵 shimmer（印章橙线长出时，极轻）
d = 1.4; tt = t(d); x = np.zeros_like(tt)
for k in range(14):
    f = rng.uniform(3800, 8500); st = rng.uniform(0, 0.35); a = rng.uniform(0.2, 0.6)
    x += a * np.sin(2 * np.pi * f * tt) * np.clip((tt - st) / 0.02, 0, 1) * np.exp(-np.clip(tt - st, 0, None) / 0.35) * (tt >= st)
S['shimmer'] = reverb(x * 0.4, 0.9, 0.35, 9000)

manifest = []
for name, x in S.items():
    y = stereo(norm(x))
    path = os.path.join(OUT, f'{name}.wav')
    wavfile.write(path, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
    mono = y[:, 0]
    win = int(0.01 * SR); rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode='same'))
    pk = float(np.argmax(rms) / SR)
    manifest.append({
        'file': f'{name}.wav', 'source': 'procedural synthesis (analysis/synth_sfx.py, seed 20261106)',
        'license': 'project-original (no third-party audio)', 'duration_s': round(len(mono) / SR, 3),
        'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(mono)) + 1e-9), 2), 'rms_peak_time_s': round(pk, 4),
        'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(),
    })
json.dump({'note': 'Freesound 站点对本云端环境返回 403（反爬拦截），按用户确认的分镜动作程序化合成拟音；本地可替换为 Freesound 实录后重测峰值。', 'files': manifest},
          open(os.path.join(OUT, 'audio-manifest.json'), 'w'), indent=1, ensure_ascii=False)
for m in manifest: print(m['file'], m['duration_s'], 'peak@', m['rms_peak_time_s'])
