// 6-second logo intro: the radar waves draw through the cloud, then the name, slogan and credits appear.
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { loadFont as sans } from '@remotion/google-fonts/IBMPlexSans';
import { loadFont as mono } from '@remotion/google-fonts/IBMPlexMono';

const { fontFamily: SANS } = sans('normal', { weights: ['600'], subsets: ['latin'] });
const { fontFamily: MONO } = mono('normal', { weights: ['500'], subsets: ['latin'] });
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const Arc = ({ d, len, start }: { d: string; len: number; start: number }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <path d={d} strokeDasharray={len} strokeDashoffset={len * (1 - p)} />;
};

const Mark = ({ size }: { size: number }) => {
  const f = useCurrentFrame();
  const land = interpolate(f, [8, 24], [20, 0], clamp);
  const cloud = interpolate(f, [4, 18], [0, 0.3], clamp);
  const echo = spring({ frame: f - 46, fps: 30, config: { damping: 9 } });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs><clipPath id="c"><rect width="64" height="64" rx="14" /></clipPath></defs>
      <g clipPath="url(#c)">
        <rect width="64" height="64" fill="#0b5f66" />
        <path transform={`translate(0 ${land})`} d="M0 64V47c8-2 15 0 23-1.5s14-4 22-5.5c6-1 11-1 13 1.5s-1 4.5-6 5.5c-7 1.5-12 3-16 6.5S30 64 30 64z" fill="#3fae6a" />
        <path d="M6 30h25a5 5 0 0 0 0-10 7.5 7.5 0 0 0-14-2.5 6 6 0 0 0-11 4.2A4.2 4.2 0 0 0 6 30z" fill="#ffffff" fillOpacity={cloud} />
        <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth={3.6}>
          <Arc d="M40.4 20A13 13 0 0 1 23.6 20" len={20} start={20} />
          <Arc d="M45.5 26.1A21 21 0 0 1 18.5 26.1" len={32} start={28} />
          <Arc d="M50.6 32.2A29 29 0 0 1 13.4 32.2" len={44} start={36} />
        </g>
        <g fill="#ffffff"><rect x="29" y="7" width="6" height="6" rx="1.2" /><rect x="21" y="8.6" width="6.5" height="2.8" rx=".8" /><rect x="36.5" y="8.6" width="6.5" height="2.8" rx=".8" /></g>
        <circle cx="32" cy="45.5" r={3.6 * echo} fill="#f2a6e3" stroke="#0b5f66" strokeWidth={1.4} />
      </g>
    </svg>
  );
};

export const Intro = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 14 } });
  const name = interpolate(f, [52, 70], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tag = interpolate(f, [72, 90], [0, 1], clamp);
  const credit = interpolate(f, [100, 118], [0, 1], clamp);
  const hero = interpolate(f, [40, 80], [0, 1], clamp);
  const out = interpolate(f, [165, 180], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0b5f66 0%, #15212b 100%)', opacity: out }}>
      <Img src={staticFile('3d-hero.png')} style={{ position: 'absolute', right: -60, top: 60, width: 1120, opacity: hero * 0.95, transform: `scale(${1 + f * 0.0009})`, transformOrigin: '60% 40%' }} />
      <div style={{ position: 'absolute', left: 140, top: 300, display: 'flex', flexDirection: 'column', gap: 36 }}>
        <div style={{ transform: `scale(${pop})`, transformOrigin: 'left center' }}><Mark size={220} /></div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 104, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1, opacity: name, transform: `translateY(${(1 - name) * 30}px)` }}>Radar Absheron</div>
        <div style={{ fontFamily: MONO, fontSize: 44, color: '#7fd3c9', opacity: tag }}>See through the clouds.</div>
        <div style={{ fontFamily: MONO, fontSize: 26, color: '#d7e6e4', opacity: credit, lineHeight: 1.6 }}>
          NASA-ISRO NISAR L-band radar · Baku · Kura-Araz<br />NASA Space Apps Challenge 2026 · team NasAda
        </div>
      </div>
    </AbsoluteFill>
  );
};
