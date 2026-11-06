# BGM 原文件 vs 成片音轨的归一化交叉相关：直接量出 BGM 在成片中的实际起点
import sys, numpy as np, librosa
from scipy.signal import correlate
src, sr = librosa.load(sys.argv[1], sr=48000, mono=True)
ren, _ = librosa.load(sys.argv[2], sr=48000, mono=True)
for s0 in (6.0, 12.0, 20.0):
    probe = src[int(s0 * sr): int((s0 + 2.0) * sr)]
    exp = s0 + 28 / 30
    a = int((exp - 0.4) * sr); b = int((exp + 0.4) * sr) + len(probe)
    seg = ren[a:b]
    c = correlate(seg, probe, mode='valid')
    k = int(np.argmax(c)); measured = (a + k) / sr
    print(f'probe src {s0:.1f}s → render {measured:.5f}s, expected (no offset) {exp:.5f}s, lag {(measured-exp)*1000:.2f} ms = {(measured-exp)*30:.3f} f')
