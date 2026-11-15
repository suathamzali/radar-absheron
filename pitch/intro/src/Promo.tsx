// 35-second vertical promo (1080x1920) in a kinetic-type style.
// Every picture is a real NASA image from the app; every number is a tested result from the README.
import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { loadFont as sans } from '@remotion/google-fonts/IBMPlexSans';
import { loadFont as mono } from '@remotion/google-fonts/IBMPlexMono';

const { fontFamily: SANS } = sans('normal', { weights: ['300', '400', '700'], subsets: ['latin'] });
const { fontFamily: MONO } = mono('normal', { weights: ['500'], subsets: ['latin'] });
const C = { paper: '#f5f6f2', ink: '#15212b', ink2: '#44515c', teal: '#0b5f66', pink: '#f2a6e3', magenta: '#a3237a', mint: '#9fe0d6', sky: '#dfe9ee' };
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.out(Easing.cubic);

// Words pop in one after another.
const Words = ({ text, start = 0, size = 104, color = C.ink, weight = 700, gap = 4, style = {} }: { text: string; start?: number; size?: number; color?: string; weight?: number; gap?: number; style?: React.CSSProperties }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: `0 ${size * 0.28}px`, fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.08, color, letterSpacing: '-0.015em', ...style }}>
      {text.split(' ').map((w, i) => {
        const s = spring({ frame: f - start - i * gap, fps, config: { damping: 13, stiffness: 160 } });
        return <span key={i} style={{ display: 'inline-block', opacity: s, transform: `translateY(${(1 - s) * 50}px) scale(${0.85 + 0.15 * s})` }}>{w}</span>;
      })}
    </div>
  );
};

const Label = ({ children, color = C.teal, style = {} }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 34, color, letterSpacing: '0.02em', ...style }}>{children}</div>
);

// The "echo" dot from the logo: our character.
const Echo = ({ x, y, r = 46, rings = 0 }: { x: number; y: number; r?: number; rings?: number }) => (
  <>
    {rings > 0 && [0, 1, 2].map((i) => {
      const p = (rings + i / 3) % 1, R = r * (1 + p * 5);
      return <div key={i} style={{ position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', border: `6px solid ${C.teal}`, opacity: 1 - p }} />;
    })}
    <div style={{ position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: C.pink, border: `8px solid ${C.teal}`, boxShadow: '0 12px 30px rgba(11,95,102,.25)' }} />
  </>
);

const Cloud = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: 300 * s, height: 140 * s }}>
    {[[0, 50, 110, 110], [70, 0, 150, 150], [170, 30, 120, 120], [40, 60, 220, 80]].map(([l, t, w, h], i) => (
      <div key={i} style={{ position: 'absolute', left: l * s, top: t * s, width: w * s, height: h * s, borderRadius: i === 3 ? 40 * s : '50%', background: '#ffffff', boxShadow: '0 10px 30px rgba(21,33,43,.08)' }} />
    ))}
  </div>
);

const CLOUDS: [number, number, number][] = [[-60, 380, 1.6], [520, 300, 1.3], [180, 700, 2.0], [640, 820, 1.5], [-120, 1050, 1.7], [480, 1180, 1.9], [80, 1420, 1.4], [600, 1500, 1.6]];

// 1. Clouds hide the farms.
const S1 = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.sky }}>
      {CLOUDS.map(([x, y, s], i) => {
        const inn = interpolate(f, [i * 3, i * 3 + 18], [i % 2 ? 1100 : -700, 0], { ...clamp, easing: ease });
        return <Cloud key={i} x={x + inn + Math.sin((f + i * 20) / 30) * 12} y={y} s={s} />;
      })}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 160 }}>
        <Label>JULY 12, 2026 · KURA-ARAZ</Label>
        <Words text="Clouds hide Azerbaijan's farms." start={8} style={{ marginTop: 20 }} />
      </div>
    </AbsoluteFill>
  );
};

// 2. NISAR sees through.
const S2 = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f, fps, config: { damping: 9, stiffness: 120 } });
  const part = interpolate(f, [22, 50], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: C.sky }}>
      {CLOUDS.map(([x, y, s], i) => <Cloud key={i} x={x + (x + 150 * s < 540 ? -1 : 1) * part * 900} y={y} s={s} />)}
      <Echo x={540} y={-120 + drop * 1080} r={60} rings={f > 18 ? ((f - 18) / 40) % 1 : 0} />
      <div style={{ position: 'absolute', left: 80, right: 80, top: 160 }}>
        <Words text="NISAR radar" start={4} color={C.teal} />
        <Words text="sees through." start={14} />
      </div>
      <div style={{ position: 'absolute', left: 80, bottom: 170, opacity: interpolate(f, [40, 55], [0, 1], clamp) }}>
        <Label color={C.ink2}>NASA-ISRO · L-band · day and night</Label>
      </div>
    </AbsoluteFill>
  );
};

// 3. Same morning: optical vs radar wipe.
const S3 = () => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [22, 62], [0, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 150 }}>
        <Words text="Same morning." start={0} />
        <Words text="Two satellites." start={8} color={C.teal} weight={300} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 560, width: 960, height: 835, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(21,33,43,.25)' }}>
        <Img src={staticFile('radar-0712.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <Img src={staticFile('optical-0712.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', clipPath: `inset(0 0 0 ${wipe}%)` }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe}%`, width: 8, marginLeft: -4, background: '#fff', opacity: wipe > 0 && wipe < 100 ? 1 : 0 }} />
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 1440, display: 'flex', justifyContent: 'space-between' }}>
        <Label color={C.ink2} style={{ opacity: interpolate(f, [0, 10, 55, 65], [0, 1, 1, 0.3], clamp) }}>MODIS photo: clouds</Label>
        <Label style={{ opacity: interpolate(f, [35, 50], [0, 1], clamp) }}>NISAR: the ground</Label>
      </div>
    </AbsoluteFill>
  );
};

// 4. The land felt the rain.
const S4 = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [40, 95], [0.18, 0.23], { ...clamp, easing: ease });
  const after = interpolate(f, [40, 95], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {Array.from({ length: 34 }, (_, i) => {
        const x = (i * 157) % 1080, sp = 28 + (i % 5) * 6, y = ((f * sp + i * 211) % 2300) - 300;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 6, height: 70, borderRadius: 3, background: '#3a7fc0', opacity: interpolate(f, [0, 10, 60, 80], [0, 0.45, 0.45, 0], clamp) }} />;
      })}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 150 }}>
        <Label>OCTOBER 3, 2026 · RAIN</Label>
        <Words text="The land felt the rain." start={4} style={{ marginTop: 20 }} />
      </div>
      <div style={{ position: 'absolute', left: 140, top: 640, width: 800, height: 800, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(21,33,43,.25)' }}>
        <Img src={staticFile('sm-before.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <Img src={staticFile('sm-after.jpg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: after }} />
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 1490, fontFamily: SANS, fontWeight: 700, fontSize: 150, color: C.teal, letterSpacing: '-0.02em' }}>
        {v.toFixed(2)} <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 500, color: C.ink2 }}>m³/m³ soil moisture</span>
      </div>
      <Label color={C.ink2} style={{ position: 'absolute', left: 80, top: 1700, fontSize: 30 }}>Blue = wetter · 22 Sep → 4 Oct · land median</Label>
    </AbsoluteFill>
  );
};

// 5. The sea dances with the wind.
const S5 = () => {
  const f = useCurrentFrame();
  const amp = interpolate(f, [5, 70], [8, 60], clamp);
  const path = (off: number, a: number) => {
    let d = `M -20 ${off}`;
    for (let x = -20; x <= 1100; x += 20) d += ` L ${x} ${off + Math.sin((x + f * 12) / 70) * a}`;
    return d;
  };
  const r = interpolate(f, [28, 62], [0, 0.63], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.paper} 0%, #d6e8ec 100%)` }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 150 }}>
        <Label>THE CASPIAN SEA</Label>
        <Words text="Windier mornings," start={2} style={{ marginTop: 20 }} />
        <Words text="brighter sea." start={12} color={C.teal} />
      </div>
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={path(900 + i * 120, amp * (1 - i * 0.12))} fill="none" stroke={i % 2 ? C.teal : '#3a7fc0'} strokeWidth={10} strokeLinecap="round" opacity={0.85 - i * 0.12} />)}
      </svg>
      <div style={{ position: 'absolute', left: 80, top: 1530, fontFamily: SANS, fontWeight: 700, fontSize: 150, color: C.ink }}>r = {r.toFixed(2)}</div>
      <Label color={C.ink2} style={{ position: 'absolute', left: 80, top: 1720, fontSize: 30 }}>radar vs NASA POWER hourly wind · 15 passes</Label>
    </AbsoluteFill>
  );
};

// 6. Every 12 days.
const S6 = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 6, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 150 }}>
        <Words text="Every 12 days." start={0} />
        <Words text="Day and night." start={8} color={C.teal} weight={300} />
      </div>
      <Img src={staticFile('3d-stack.png')} style={{ position: 'absolute', left: -120, top: 600, width: 1250, opacity: s, transform: `translateY(${(1 - s) * 120}px)` }} />
    </AbsoluteFill>
  );
};

// 7. Tap any place.
const S7 = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tap = spring({ frame: f - 30, fps, config: { damping: 10 } });
  const card = spring({ frame: f - 48, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 150 }}>
        <Words text="Tap any place." start={0} />
        <Words text="Read what it means." start={10} color={C.teal} weight={300} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 560, width: 960, height: 760, borderRadius: 36, overflow: 'hidden', boxShadow: '0 30px 80px rgba(21,33,43,.25)' }}>
        <Img src={staticFile('app-clouds.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 50%' }} />
      </div>
      <Echo x={interpolate(f, [0, 30], [900, 600], { ...clamp, easing: ease })} y={interpolate(f, [0, 30], [1500, 1000], { ...clamp, easing: ease })} r={34 + 10 * (1 - tap)} rings={f > 30 && f < 70 ? ((f - 30) / 40) % 1 : 0} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1180 + (1 - card) * 700, background: '#fff', borderRadius: 36, padding: '44px 52px', boxShadow: '0 -10px 60px rgba(21,33,43,.18)', borderTop: `10px solid ${C.teal}` }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 46, color: C.teal }}>What these numbers say</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: C.ink2, marginTop: 6 }}>Kura fields · real output of the app</div>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.ink, lineHeight: 1.45, marginTop: 18 }}>
          Soil moisture <b>0.23</b>: <b>wetter</b> than the lowland average (0.18).<br />Strong reaction to the 3 October rain (<b>+0.07</b>).<br /><span style={{ color: C.ink2 }}>→ A good point to follow irrigation every 12 days.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 8. Free, in Azerbaijani; logo end card.
const S8 = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f - 95, fps, config: { damping: 12 } });
  const fadeWords = interpolate(f, [84, 96], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.teal} 0%, ${C.ink} 100%)` }}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 600, opacity: fadeWords }}>
        <Words text="Free." start={0} color="#fff" size={150} />
        <Words text="In Azerbaijani." start={8} color={C.mint} size={120} weight={300} />
        <Words text="For everyone." start={16} color="#fff" size={120} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: logo, transform: `scale(${0.8 + 0.2 * logo})` }}>
        <Img src={staticFile('logo-mark.svg')} style={{ width: 300, height: 300 }} />
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 112, color: '#fff', letterSpacing: '-0.015em' }}>Radar Absheron</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 52, color: C.mint }}>See through the clouds.</div>
        <div style={{ background: '#fff', borderRadius: 28, padding: 26, marginTop: 30 }}><Img src={staticFile('qr.svg')} style={{ width: 300, height: 300, display: 'block' }} /></div>
        <div style={{ fontFamily: MONO, fontSize: 34, color: '#d7e6e4' }}>suathamzali.github.io/radar-absheron</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: '#9fb8b5', marginTop: 40, textAlign: 'center', lineHeight: 1.6 }}>Data: NASA-ISRO NISAR · NASA MODIS · NASA POWER<br />NASA Space Apps Challenge 2026 · team NasAda</div>
      </div>
    </AbsoluteFill>
  );
};

const Fade = ({ d, children }: { d: number; children: React.ReactNode }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, d - 6, d], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

// 900 frames = 30 s. Each scene starts 0.25 s before its sentence in the Azerbaijani voiceover
// (voice-roger.wav, ElevenLabs "Roger"): 0, 2.9, 5.83, 8.97, 12.93, 15.9, 18.4, 22.43 s.
export const SCENES: [React.FC, number][] = [[S1, 87], [S2, 88], [S3, 94], [S4, 119], [S5, 89], [S6, 75], [S7, 121], [S8, 227]];
export const PROMO_FRAMES = SCENES.reduce((a, [, d]) => a + d, 0);

export const Promo = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {SCENES.map(([Scene, d], i) => {
        const from = at; at += d;
        return <Sequence key={i} from={from} durationInFrames={d}><Fade d={d}><Scene /></Fade></Sequence>;
      })}
    </AbsoluteFill>
  );
};
