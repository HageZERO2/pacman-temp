import { Snowfall } from '../components/Snowfall';
import type { BackdropProps } from './types';

const W = 1600;
const H = 520;
const RAIN = ['#29f6ff', '#ff2bd6', '#9b5cff', '#bff9ff'];
const WINDOW_COLORS = ['#29f6ff', '#ff4f9a', '#ffd36a', '#9b5cff', '#bff9ff'];

/** Deterministic 0..1 noise so the skyline is identical on every render. */
function rnd(i: number, s: number) {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

interface Tower {
  x: number;
  w: number;
  h: number;
  cap: number;
  antenna: boolean;
}

interface Layer {
  id: string;
  fill: string;
  edge: string;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  seed: number;
  /** Window pattern opacity (0 = none). */
  windows: number;
}

const LAYERS: Layer[] = [
  { id: 'far', fill: '#1a0b3a', edge: '#3d1f7a', minH: 220, maxH: 470, minW: 50, maxW: 120, seed: 1, windows: 0.35 },
  { id: 'mid', fill: '#100626', edge: '#5a1f8a', minH: 140, maxH: 380, minW: 70, maxW: 160, seed: 2, windows: 0.7 },
  { id: 'near', fill: '#06020f', edge: '#ff2bd6', minH: 70, maxH: 250, minW: 90, maxW: 200, seed: 3, windows: 0.9 },
];

function towers(l: Layer): Tower[] {
  const out: Tower[] = [];
  let x = -20;
  let i = 0;
  while (x < W + 20) {
    const w = l.minW + rnd(i, l.seed) * (l.maxW - l.minW);
    const h = l.minH + rnd(i, l.seed + 7) * (l.maxH - l.minH);
    out.push({ x, w, h, cap: Math.floor(rnd(i, l.seed + 13) * 3), antenna: rnd(i, l.seed + 21) > 0.6 });
    x += w + (rnd(i, l.seed + 3) > 0.7 ? 8 + rnd(i, l.seed + 5) * 20 : 0);
    i++;
  }
  return out;
}

const CITY = LAYERS.map((l) => ({ layer: l, towers: towers(l) }));

/** A tile of windows with a seeded mix of lit and dark panes. */
function WindowPattern({ id, seed }: { id: string; seed: number }) {
  const cells = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      const k = r * 4 + c;
      const v = rnd(k, seed);
      if (v < 0.45) continue;
      cells.push(
        <rect key={k} x={c * 12 + 3} y={r * 14 + 4} width={6} height={8} fill={WINDOW_COLORS[Math.floor(rnd(k, seed + 9) * WINDOW_COLORS.length)]} opacity={0.35 + v * 0.6} />,
      );
    }
  }
  return (
    <pattern id={id} width={48} height={84} patternUnits="userSpaceOnUse">
      {cells}
    </pattern>
  );
}

interface Sign {
  x: number;
  y: number;
  text: string;
  color: string;
  vertical?: boolean;
  size: number;
  /** Animation delay in seconds; negative delays desync the flicker. */
  delay: number;
}

const SIGNS: Sign[] = [
  // Kept to the outer edges so they never sit behind the logo or menu text.
  { x: 60, y: 150, text: 'RAMEN', color: '#ff2bd6', vertical: true, size: 26, delay: -1.3 },
  { x: 175, y: 470, text: 'NOVA', color: '#29f6ff', size: 22, delay: -0.4 },
  { x: 1545, y: 120, text: 'DATA', color: '#f6ff3a', vertical: true, size: 28, delay: -2.7 },
  { x: 1430, y: 470, text: 'OPEN 24H', color: '#ff4f9a', size: 20, delay: -3.6 },
];

function NeonSign({ s }: { s: Sign }) {
  if (s.vertical) {
    const step = s.size * 1.08;
    const h = step * s.text.length + 16;
    const w = s.size + 18;
    return (
      <g className="cp-bg__sign" style={{ color: s.color, animationDelay: `${s.delay}s` }}>
        <rect x={s.x - w / 2} y={s.y - 12} width={w} height={h} rx={4} fill="#07021a" stroke="currentColor" strokeWidth={2.5} />
        {[...s.text].map((ch, i) => (
          <text key={i} x={s.x} y={s.y + 8 + i * step + s.size * 0.42} fontSize={s.size} textAnchor="middle" fill="currentColor">
            {ch}
          </text>
        ))}
      </g>
    );
  }
  const w = s.text.length * s.size * 0.78 + 28;
  const h = s.size + 20;
  return (
    <g className="cp-bg__sign" style={{ color: s.color, animationDelay: `${s.delay}s` }}>
      <rect x={s.x - w / 2} y={s.y - h / 2} width={w} height={h} rx={6} fill="#07021a" stroke="currentColor" strokeWidth={2.5} />
      <text x={s.x} y={s.y + s.size * 0.36} fontSize={s.size} textAnchor="middle" fill="currentColor">
        {s.text}
      </text>
    </g>
  );
}

function Skyline({ signs }: { signs: boolean }) {
  return (
    <svg className="cp-bg__city" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      <defs>
        {LAYERS.map((l) => (
          <WindowPattern key={l.id} id={`cp-win-${l.id}`} seed={l.seed * 31} />
        ))}
        <linearGradient id="cp-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff2bd6" stopOpacity="0" />
          <stop offset="1" stopColor="#ff2bd6" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {CITY.map(({ layer, towers: list }) => (
        <g key={layer.id} className={`cp-bg__layer cp-bg__layer--${layer.id}`}>
          {list.map((t, i) => {
            const y = H - t.h;
            return (
              <g key={i}>
                {t.antenna && (
                  <>
                    <line x1={t.x + t.w * 0.5} y1={y} x2={t.x + t.w * 0.5} y2={y - 40} stroke={layer.edge} strokeWidth={2} />
                    <circle className="cp-bg__beacon" cx={t.x + t.w * 0.5} cy={y - 40} r={3} fill="#ff3355" style={{ animationDelay: `${-i * 0.37}s` }} />
                  </>
                )}
                {t.cap === 1 && <rect x={t.x + t.w * 0.2} y={y - 14} width={t.w * 0.6} height={14} fill={layer.fill} />}
                {t.cap === 2 && <polygon points={`${t.x},${y} ${t.x + t.w},${y} ${t.x + t.w * 0.75},${y - 22} ${t.x + t.w * 0.25},${y - 22}`} fill={layer.fill} />}
                <rect x={t.x} y={y} width={t.w} height={t.h} fill={layer.fill} />
                <rect x={t.x + 6} y={y + 10} width={Math.max(0, t.w - 12)} height={t.h - 10} fill={`url(#cp-win-${layer.id})`} opacity={layer.windows} />
                <line x1={t.x} y1={y + 0.5} x2={t.x + t.w} y2={y + 0.5} stroke={layer.edge} strokeWidth={layer.id === 'near' ? 2 : 1.5} opacity={layer.id === 'near' ? 0.9 : 0.6} />
              </g>
            );
          })}
          {layer.id === 'mid' && <rect x={0} y={H - 160} width={W} height={160} fill="url(#cp-fog)" />}
        </g>
      ))}
      {signs && SIGNS.map((s) => <NeonSign key={s.text} s={s} />)}
    </svg>
  );
}

export default function CyberpunkBackdrop({ dimmed, calm }: BackdropProps) {
  return (
    <div className={`cp-bg ${dimmed ? 'cp-bg--dimmed' : ''} ${calm ? 'cp-bg--calm' : ''}`}>
      <div className="cp-bg__sky" />
      <div className="cp-bg__sun" />
      <Skyline signs={!dimmed} />
      <div className="cp-bg__floor">
        <div className="cp-bg__grid" />
      </div>
      <div className="cp-bg__horizon" />
      <Snowfall variant="rain" colors={RAIN} density={calm ? 0.2 : dimmed ? 0.35 : 0.8} />
      <div className="cp-bg__scan" />
    </div>
  );
}
