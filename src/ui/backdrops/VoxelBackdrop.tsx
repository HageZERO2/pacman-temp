import { Snowfall } from '../components/Snowfall';
import type { BackdropProps } from './types';

const W = 1600;
const H = 440;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

/** Deterministic 0..1 noise so the landscape is identical on every render. */
function rnd(i: number, s: number) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function heights(cols: number, base: number, amp: number, seed: number) {
  return Array.from({ length: cols }, (_, i) =>
    Math.max(1, Math.round(base + amp * (Math.sin(i * 0.42 + seed) * 0.6 + Math.sin(i * 0.17 + seed * 2.3) * 0.4))),
  );
}

interface Layer {
  block: number;
  base: number;
  amp: number;
  seed: number;
  grass: string;
  grassLight: string;
  dirt: string;
  dirtDark: string;
  trees: number;
}

const LAYERS: Layer[] = [
  { block: 24, base: 9, amp: 3, seed: 1.7, grass: '#5d4a86', grassLight: '#7a64a6', dirt: '#4a3a6c', dirtDark: '#40325e', trees: 0 },
  { block: 32, base: 5, amp: 2.4, seed: 4.1, grass: '#3f7a3c', grassLight: '#559a48', dirt: '#3d2f3a', dirtDark: '#33263a', trees: 0.12 },
  { block: 44, base: 2.6, amp: 1.6, seed: 8.3, grass: '#5aa83a', grassLight: '#79c64c', dirt: '#6b4529', dirtDark: '#583820', trees: 0.1 },
];

function buildLayer(l: Layer, li: number): Rect[] {
  const out: Rect[] = [];
  const cols = Math.ceil(W / l.block) + 1;
  const hs = heights(cols, l.base, l.amp, l.seed);
  const b = l.block;
  const trees: [number, number][] = [];
  hs.forEach((h, i) => {
    const x = i * b;
    const top = H - h * b;
    out.push({ x, y: top, w: b, h: H - top, fill: l.dirt });
    for (let k = 1; k < h; k++) out.push({ x, y: top + k * b, w: b, h: 2, fill: l.dirtDark });
    out.push({ x, y: top, w: b, h: Math.round(b * 0.28), fill: l.grass });
    out.push({ x, y: top, w: b, h: 3, fill: l.grassLight });
    // Grass drips and dirt speckles on the nearer layers.
    if (li > 0) {
      const t = b / 8;
      for (let k = 0; k < 8; k++) if (rnd(i * 8 + k, li) > 0.55) out.push({ x: x + k * t, y: top + b * 0.28, w: t, h: t, fill: l.grass });
      for (let k = 0; k < h * 2; k++) {
        const sx = x + Math.floor(rnd(i * 31 + k, li + 5) * 7) * t;
        const sy = top + b * 0.45 + Math.floor(rnd(i * 17 + k, li + 9) * (h * 8 - 4)) * t;
        out.push({ x: sx, y: sy, w: t, h: t, fill: l.dirtDark });
      }
    }
    if (l.trees && rnd(i, li + 20) < l.trees && i > 0 && i < cols - 1) trees.push([x, top]);
  });
  for (const [x, top] of trees) {
    const b2 = l.block / 2;
    const trunk = li === 2 ? '#5a3a1e' : '#2e2a24';
    const leaf = li === 2 ? '#3f8f2a' : '#2f5a32';
    const leafLight = li === 2 ? '#5aae3a' : '#3c6e3c';
    out.push({ x: x + b2 - b2 / 2, y: top - b * 2, w: b2, h: b * 2, fill: trunk });
    out.push({ x: x - b, y: top - b * 3.5, w: b * 3, h: b * 1.5, fill: leaf });
    out.push({ x: x - b2, y: top - b * 4.5, w: b * 2, h: b, fill: leaf });
    out.push({ x: x - b, y: top - b * 3.5, w: b * 3, h: b * 0.25, fill: leafLight });
    out.push({ x: x - b2, y: top - b * 4.5, w: b * 2, h: b * 0.25, fill: leafLight });
    for (let k = 0; k < 6; k++)
      out.push({ x: x - b + Math.floor(rnd(k, x) * 6) * b2, y: top - b * 3.2 + Math.floor(rnd(k + 9, x) * 2) * b2 * 0.5, w: b2 / 2, h: b2 / 2, fill: leafLight });
  }
  return out;
}

const LAND = LAYERS.map(buildLayer);

const CLOUDS = [
  { x: 0, y: 40, s: 1.2, dur: 140, delay: -20 },
  { x: 0, y: 120, s: 0.8, dur: 180, delay: -110 },
  { x: 0, y: 70, s: 1, dur: 160, delay: -70 },
];

const STARS = Array.from({ length: 34 }, (_, i) => ({ x: rnd(i, 3) * 100, y: rnd(i, 7) * 34, s: rnd(i, 11) > 0.8 ? 3 : 2, d: rnd(i, 13) * 4 }));

function Cloud() {
  return (
    <svg className="vx-cloud__art" viewBox="0 0 160 48" shapeRendering="crispEdges">
      <rect x="32" y="0" width="64" height="16" fill="#ffe4d2" />
      <rect x="0" y="16" width="160" height="16" fill="#ffd6c4" />
      <rect x="16" y="32" width="112" height="16" fill="#d99ab4" />
      <rect x="96" y="8" width="40" height="8" fill="#ffd6c4" />
      <rect x="32" y="0" width="64" height="4" fill="#fff4ea" />
    </svg>
  );
}

export default function VoxelBackdrop({ dimmed, calm }: BackdropProps) {
  return (
    <div className={`vx ${calm ? 'vx--calm' : ''}`}>
      <div className="vx-sky" />
      <div className="vx-stars">
        {STARS.map((s, i) => (
          <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${-s.d}s` }} />
        ))}
      </div>
      <div className="vx-sun" />
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="vx-cloud"
          style={{ top: c.y, ['--s' as string]: c.s, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
        >
          <Cloud />
        </div>
      ))}
      <svg className="vx-land" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {LAND.map((rects, li) => (
          <g key={li}>
            {rects.map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
            ))}
          </g>
        ))}
      </svg>
      <Snowfall variant="pixels" density={calm ? 0.12 : dimmed ? 0.18 : 0.35} colors={['#ffe9a8', '#c8f59a', '#ffffff', '#ffc88a']} />
    </div>
  );
}
