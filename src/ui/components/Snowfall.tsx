import { useEffect, useRef } from 'react';
import { drawSnowflake } from '../../themes/christmas/items';

export type WeatherVariant = 'snow' | 'rain' | 'pixels';

interface Props {
  density?: number;
  enabled?: boolean;
  /** snow = soft flakes, rain = neon streaks, pixels = crisp falling squares. */
  variant?: WeatherVariant;
  /** Palette for rain/pixels. */
  colors?: string[];
}

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  shape: boolean;
  color: string;
}

/** Full-screen falling weather. Pauses when the tab is hidden; cleans up its frame loop on unmount. */
export function Snowfall({ density = 1, enabled = true, variant = 'snow', colors = ['#ffffff'] }: Props) {
  const palette = colors.join(',');
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !enabled) return;

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    drawSnowflake(sprite.getContext('2d')!, 16, 16, 11, '#ffffff');

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cols = palette.split(',');
    const spawn = (anywhere: boolean): Flake => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -20,
      r: 0.8 + Math.random() * 2.6,
      vy: variant === 'rain' ? 520 + Math.random() * 380 : 18 + Math.random() * 46,
      sway: 8 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      shape: variant === 'snow' && Math.random() < 0.12,
      color: cols[Math.floor(Math.random() * cols.length)],
    });
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const target = Math.min(220, Math.round(((w * h) / 9000) * density));
      flakes = Array.from({ length: target }, () => spawn(true));
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.vy * dt;
        f.phase += dt;
        if (f.y > h + 20) flakes[i] = spawn(false);
        if (variant === 'rain') {
          const len = 8 + f.r * 7;
          ctx.globalAlpha = 0.15 + f.r / 9;
          ctx.strokeStyle = f.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(f.x - len * 0.12, f.y - len);
          ctx.stroke();
        } else if (variant === 'pixels') {
          const s = Math.round(f.r) * 2 + 2;
          ctx.globalAlpha = 0.45 + f.r / 7;
          ctx.fillStyle = f.color;
          ctx.fillRect(Math.round(f.x + Math.sin(f.phase * 0.5) * 6), Math.round(f.y), s, s);
        } else if (f.shape) {
          const x = f.x + Math.sin(f.phase) * f.sway;
          const s = f.r * 5;
          ctx.globalAlpha = 0.75;
          ctx.drawImage(sprite, x - s / 2, f.y - s / 2, s, s);
        } else {
          const x = f.x + Math.sin(f.phase) * f.sway;
          ctx.globalAlpha = 0.35 + f.r / 5;
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density, enabled, variant, palette]);

  if (!enabled) return null;
  return <canvas ref={ref} className="snowfall" aria-hidden="true" />;
}
