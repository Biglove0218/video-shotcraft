import json, sys, numpy as np, librosa
from scipy.signal import butter, sosfilt
path = sys.argv[1]
y, sr = librosa.load(path, sr=None, mono=True)
yh, yp = librosa.effects.hpss(y)
tempo, beats = librosa.beat.beat_track(y=yp, sr=sr, tightness=400, units="time")
def fit(b):
    i = np.arange(len(b)); A = np.vstack([i, np.ones_like(i)]).T
    (T, t0), *_ = np.linalg.lstsq(A, b, rcond=None); return T, t0
T, t0 = fit(beats)
while t0 - T > -0.01: t0 -= T  # earliest beat >= 0
def band_env(lo, hi):
    sos = butter(4, [lo, hi], btype="band", fs=sr, output="sos")
    env = librosa.onset.onset_strength(y=sosfilt(sos, yp), sr=sr)
    return env, librosa.times_like(env, sr=sr)
kick, times = band_env(40, 160)
snare, _ = band_env(150, 500)
hat, _ = band_env(6000, 14000)
on_env = librosa.onset.onset_strength(y=yp, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=on_env, sr=sr, units="time", backtrack=False)
dur = len(y) / sr
def score(Tc, t0c):
    n = int((dur - t0c) / Tc); errs = []; hits = 0
    for k in range(n):
        t = t0c + k * Tc; d = onsets[np.argmin(np.abs(onsets - t))] - t
        if abs(d) < 0.035: hits += 1; errs.append(d)
    errs = np.array(errs); ks = np.arange(len(errs))
    drift = np.polyfit(ks, errs, 1)[0] * len(errs) if len(errs) > 2 else 0
    return dict(T=Tc, bpm=60 / Tc, t0=t0c, match=hits / max(n, 1), mean_abs_ms=float(np.mean(np.abs(errs)) * 1000), drift_ms=float(drift * 1000))
cands = {"1x": score(T, t0), "2x": score(T / 2, t0), "0.5x": score(T * 2, t0)}
# refine phase on 1x via mean onset error
c = cands["1x"]
rows = []
for n in range(int((dur - t0) / T)):
    t = t0 + n * T; j = np.argmin(np.abs(times - t))
    rows.append(dict(n=n, t=round(t, 4), kick=float(kick[j]), snare=float(snare[j]), hat=float(hat[j])))
rms = librosa.feature.rms(y=y)[0]; rt = librosa.times_like(rms, sr=sr)
bar_rms = []
for b in range(int((dur - t0) / (4 * T))):
    a, z = t0 + b * 4 * T, t0 + (b + 1) * 4 * T
    m = (rt >= a) & (rt < z); bar_rms.append(round(float(rms[m].mean()), 4))
out = dict(file=path, duration=dur, bpm=60 / T, T=T, t0=t0, beat_track_tempo=float(np.atleast_1d(tempo)[0]),
           candidates=cands, beats_per_bar=4, bar_rms=bar_rms,
           top_kicks=sorted(rows, key=lambda r: -r["kick"])[:12])
json.dump(out, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
print(json.dumps({k: out[k] for k in ("bpm", "T", "t0", "duration", "candidates")}, indent=1))
print("bar_rms", out["bar_rms"])
print("top kicks", [(r["n"], round(r["kick"], 1)) for r in out["top_kicks"]])
