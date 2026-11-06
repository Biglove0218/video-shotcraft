import glob, os, json, numpy as np, librosa
for p in sorted(glob.glob('public/audio/sfx/*__*')):
    y, sr = librosa.load(p, sr=48000, mono=True)
    dur = len(y) / sr
    env = librosa.onset.onset_strength(y=y, sr=sr)
    on = librosa.onset.onset_detect(onset_envelope=env, sr=sr, units='time', backtrack=True)
    rms = librosa.feature.rms(y=y, frame_length=480, hop_length=480)[0]; rt = np.arange(len(rms)) * 0.01
    pk = rt[np.argmax(rms)]
    lv = [(round(float(t), 3), round(float(20*np.log10(rms[min(len(rms)-1, int(t/0.01)):min(len(rms), int(t/0.01)+15)].max()+1e-9)), 1)) for t in on[:12]]
    print(f"{os.path.basename(p)[:58]:58s} dur={dur:6.2f}s peak@{pk:.2f}s onsets(t,dB)={lv}")
