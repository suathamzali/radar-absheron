"""Synthesize the 30-second promo soundtrack from scratch (no samples, no third-party music).

120 BPM, A minor (Am - F - C - G). Whooshes and pings follow the
scene starts of the voiced cut (see CUTS); the logo appears at about 24.0 s.
Writes out/music.wav (44.1 kHz, stereo, 16-bit).
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 30.0
BEAT = 0.5
N = int(SR * DUR)
t = np.arange(N) / SR
CUTS = [87 / 30, 175 / 30, 269 / 30, 388 / 30, 477 / 30, 552 / 30, 673 / 30]  # scene starts in src/Promo.tsx
LOGO = 673 / 30 + 95 / 30
rng = np.random.default_rng(7)


def hz(note):
    """MIDI note number to frequency."""
    return 440.0 * 2 ** ((note - 69) / 12)


def env(n, a, d):
    """Linear attack, exponential decay envelope of n samples."""
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / max(d, 1e-4))


def lowpass(x, cutoff):
    """One-pole low-pass filter."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    j = min(N, i + len(sig))
    if i < N:
        buf[i:j] += sig[: j - i] * gain


# one bar = 4 beats = 2 s per chord: Am, F, C, G
CHORDS = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]
ROOTS = [45, 41, 48, 43]


def chord_at(time):
    return int(time // 2.0) % 4


# 1. Pad: detuned soft saws, low-passed, whole track
pad = np.zeros(N)
for k in range(int(DUR // 2)):
    c = CHORDS[k % 4] if k * 2 < 23.5 else CHORDS[0]
    seg = int(2.0 * SR)
    x = np.arange(seg) / SR
    s = np.zeros(seg)
    for n in c:
        for det in (-0.12, 0.12):
            s += 2 * ((x * hz(n + det)) % 1) - 1
    s *= np.minimum(1, x / 0.6) * np.minimum(1, (2.0 - x) / 0.3)
    add(pad, k * 2.0, s, 0.05)
pad = lowpass(pad, 900) * np.clip(t / 2.0, 0, 1)

# 2. Arpeggio pluck in 8ths from the radar drop (2.5 s) to the end card
arp = np.zeros(N)
pattern = [0, 1, 2, 1, 2, 0, 1, 2]
step, time = 0, 2.5
while time < 23.5:
    n = CHORDS[chord_at(time)][pattern[step % 8]] + 12
    seg = int(0.35 * SR)
    x = np.arange(seg) / SR
    s = (np.sin(2 * np.pi * hz(n) * x) + 0.3 * np.sin(4 * np.pi * hz(n) * x)) * env(seg, 0.003, 0.12)
    add(arp, time, s, 0.16)
    step += 1
    time += BEAT / 2

# 3. Kick and bass on every beat from 5 s
kick = np.zeros(N)
bass = np.zeros(N)
time = 5.0
while time < 23.5:
    seg = int(0.3 * SR)
    x = np.arange(seg) / SR
    ph = 2 * np.pi * np.cumsum(45 + 80 * np.exp(-x / 0.03)) / SR
    add(kick, time, np.sin(ph) * env(seg, 0.001, 0.09), 0.55)
    r = ROOTS[chord_at(time)]
    bseg = int(0.42 * SR)
    bx = np.arange(bseg) / SR
    add(bass, time, (np.sin(2 * np.pi * hz(r) * bx) + 0.25 * np.sin(4 * np.pi * hz(r) * bx)) * env(bseg, 0.005, 0.25), 0.22)
    time += BEAT

# 4. Hi-hat on off-beats from 8.5 s
hat = np.zeros(N)
time = 8.5 + BEAT / 2
while time < 23.5:
    seg = int(0.06 * SR)
    noise = rng.standard_normal(seg)
    add(hat, time, (noise - lowpass(noise, 6000)) * env(seg, 0.001, 0.02), 0.12)
    time += BEAT

# 5. Rain bed during the rain scene (8.5-12.5 s)
rain = rng.standard_normal(N) * 0.5
rain = lowpass(rain - lowpass(rain, 1500), 7000) * np.interp(t, [CUTS[2], CUTS[2] + 0.5, CUTS[3] - 0.5, CUTS[3]], [0, 1, 1, 0]) * 0.18

# 6. Whoosh into each cut, radar pings with echoes, final chord under the logo
fx = np.zeros(N)
for cut in CUTS:
    seg = int(0.45 * SR)
    x = np.arange(seg) / SR
    add(fx, cut - 0.45, lowpass(rng.standard_normal(seg), 2500) * (x / 0.45) ** 2, 0.35)


def ping(at, note=93, gain=0.22):
    seg = int(1.2 * SR)
    x = np.arange(seg) / SR
    s = np.sin(2 * np.pi * hz(note) * x) * env(seg, 0.002, 0.25)
    for k, g in ((0, 1.0), (0.18, 0.45), (0.36, 0.2)):
        add(fx, at + k, s, gain * g)


ping(CUTS[0] + 0.55)    # the echo dot lands
ping(CUTS[0] + 0.6 + 40 / 30, 88)
ping(CUTS[5] + 1.0, 91)  # tap on the map
ping(LOGO, 81, 0.28)    # logo
seg = int((DUR - 23.5) * SR)
x = np.arange(seg) / SR
s = sum(np.sin(2 * np.pi * hz(n) * x) + 0.4 * np.sin(2 * np.pi * hz(n + 12) * x) for n in (45, 57, 60, 64))
add(fx, 23.5, s * np.minimum(1, x / 1.5), 0.05)

center = kick + bass + rain
L = center + pad + arp * 0.7 + hat * 0.8 + fx
R = center + pad * 0.9 + arp + hat + fx
fade = np.interp(t, [0, 0.05, DUR - 1.8, DUR], [0, 1, 1, 0])
st = np.stack([L * fade, R * fade], axis=1)
st /= np.max(np.abs(st)) / 0.89
out = Path(__file__).with_name('out') / 'music.wav'
out.parent.mkdir(exist_ok=True)
with wave.open(str(out), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print(out, f'{DUR:.1f} s')
