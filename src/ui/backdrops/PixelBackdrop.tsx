import { useEffect, useRef } from 'react';
import { Snowfall } from '../components/Snowfall';
import type { BackdropProps } from './types';

const STAR_COLORS = ['#ffffff', '#ffffff', '#2ee8ff', '#ff9ed8', '#ffe81a'];

/** Ringed pixel planet, drawn once into a tiny canvas that CSS scales up with nearest-neighbour. */
function PixelPlanet() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const N = 32;
    const c = 16;
    ctx.clearRect(0, 0, N, N);
    const ring = (front: boolean) => {
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          const dx = x - c + 0.5;
          const dy = y - c + 0.5;
          // Tilted ellipse band.
          const u = dx * 0.94 + dy * 0.34;
          const v = -dx * 0.34 + dy * 0.94;
          const e = (u * u) / 225 + (v * v) / 9;
          if (e < 0.72 || e > 1.05) continue;
          if (front !== v > 0) continue;
          ctx.fillStyle = e < 0.86 ? '#ffe81a' : '#ff9a1e';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };
    ring(false);
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        const dx = x - c + 0.5;
        const dy = y - c + 0.5;
        const d = Math.hypot(dx, dy);
        if (d > 9.5) continue;
        const light = dx + dy;
        ctx.fillStyle = light < -7 ? '#ff9ed8' : light < 4 ? '#d83cff' : d > 7.6 ? '#3a0a5a' : '#7a1aa8';
        // Pixel bands across the planet.
        if ((y === 12 || y === 18) && light > -9) ctx.fillStyle = '#5a1478';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ring(true);
  }, []);
  return <canvas ref={ref} width={32} height={32} className="px-bg__planet" />;
}

/** Row of glowing maze blocks on the horizon, as a crisp SVG tile. */
const SKYLINE = (() => {
  const blocks: [number, number, number][] = [
    [0, 14, 10], [12, 6, 6], [20, 10, 14], [36, 4, 8], [46, 12, 12], [60, 7, 4],
  ];
  const rects = blocks
    .map(([x, h, w]) => `<rect x='${x + 0.5}' y='${24 - h - 0.5 + 0.5}' width='${w - 1}' height='${h}' fill='%2305052a' stroke='%232a32ff' stroke-width='1'/>`)
    .join('');
  const coins = [9, 33, 58].map((x) => `<rect x='${x}' y='20' width='2' height='2' fill='%23ffe81a'/>`).join('');
  return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='24' viewBox='0 0 64 24' shape-rendering='crispEdges'>${rects}${coins}</svg>")`;
})();

export default function PixelBackdrop({ dimmed, calm }: BackdropProps) {
  return (
    <div className={`px-bg ${dimmed ? 'px-bg--dimmed' : ''} ${calm ? 'px-bg--calm' : ''}`}>
      <div className="px-bg__sky" />
      <div className="px-bg__stars" />
      {!calm && <Snowfall variant="pixels" colors={STAR_COLORS} density={dimmed ? 0.18 : 0.35} />}
      {!dimmed && <PixelPlanet />}
      <div className="px-bg__horizon" style={{ ['--skyline' as string]: SKYLINE }}>
        <div className="px-bg__skyline" />
        <div className="px-bg__floor" />
      </div>
      <div className="px-bg__vignette" />
    </div>
  );
}
