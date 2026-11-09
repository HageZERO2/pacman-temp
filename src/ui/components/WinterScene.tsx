import { useMemo } from 'react';

interface Tree {
  x: number;
  base: number;
  h: number;
}

function pine({ x, base, h }: Tree, key: number) {
  const w = h * 0.55;
  const tiers = [0, 0.3, 0.55];
  return (
    <g key={key}>
      <rect x={x - h * 0.04} y={base - h * 0.12} width={h * 0.08} height={h * 0.14} fill="#2a1a12" />
      {tiers.map((o, i) => {
        const top = base - h + o * h;
        const tw = w * (0.55 + i * 0.25);
        const bottom = top + h * 0.45;
        return (
          <g key={i}>
            <path d={`M ${x} ${top} L ${x + tw / 2} ${bottom} L ${x - tw / 2} ${bottom} Z`} fill="#0d3b2c" />
            <path d={`M ${x} ${top} L ${x + tw * 0.22} ${top + h * 0.2} Q ${x} ${top + h * 0.26} ${x - tw * 0.22} ${top + h * 0.2} Z`} fill="#e8f4ff" opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

function house(x: number, base: number, s: number, key: number) {
  return (
    <g key={key}>
      <rect x={x} y={base - s * 0.7} width={s} height={s * 0.7} fill="#1b2347" />
      <path d={`M ${x - s * 0.12} ${base - s * 0.68} L ${x + s / 2} ${base - s * 1.15} L ${x + s * 1.12} ${base - s * 0.68} Z`} fill="#2b1830" />
      <path d={`M ${x - s * 0.14} ${base - s * 0.66} L ${x + s / 2} ${base - s * 1.17} L ${x + s * 1.14} ${base - s * 0.66} L ${x + s * 1.02} ${base - s * 0.62} L ${x + s / 2} ${base - s * 1.04} L ${x - s * 0.02} ${base - s * 0.62} Z`} fill="#f2f8ff" />
      <rect className="scene__window" x={x + s * 0.15} y={base - s * 0.5} width={s * 0.22} height={s * 0.2} rx="1.5" />
      <rect className="scene__window scene__window--late" x={x + s * 0.6} y={base - s * 0.5} width={s * 0.22} height={s * 0.2} rx="1.5" />
      <rect x={x + s * 0.4} y={base - s * 0.28} width={s * 0.18} height={s * 0.28} fill="#3a1f18" />
    </g>
  );
}

/** Night village silhouette with snowy hills, pines and glowing windows. */
export function WinterScene() {
  const trees = useMemo<Tree[]>(
    () => [
      { x: 40, base: 228, h: 90 }, { x: 95, base: 236, h: 60 }, { x: 250, base: 222, h: 74 },
      { x: 560, base: 214, h: 96 }, { x: 610, base: 222, h: 58 }, { x: 900, base: 232, h: 84 },
      { x: 960, base: 236, h: 62 }, { x: 1150, base: 226, h: 92 }, { x: 1200, base: 236, h: 56 },
    ],
    [],
  );
  return (
    <svg className="scene" viewBox="0 0 1240 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7dcf5" />
          <stop offset="1" stopColor="#5a77a8" />
        </linearGradient>
        <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#9fb9dc" />
        </linearGradient>
      </defs>
      <path d="M0 210 Q 180 150 380 196 T 760 180 T 1240 190 V300 H0Z" fill="url(#hillFar)" opacity="0.35" />
      {house(300, 205, 46, 1)}
      {house(360, 200, 38, 2)}
      {house(720, 192, 50, 3)}
      {house(1010, 206, 42, 4)}
      {trees.map(pine)}
      <path d="M0 250 Q 220 200 470 240 T 900 232 T 1240 236 V300 H0Z" fill="url(#hillNear)" />
      <path d="M0 270 Q 300 240 620 266 T 1240 262 V300 H0Z" fill="#eaf4ff" />
    </svg>
  );
}
