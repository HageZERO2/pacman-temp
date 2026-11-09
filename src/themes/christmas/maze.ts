import type { Maze } from '../../game/maze';
import type { MazeDrawOptions } from '../types';

export interface ChristmasLevelStyle {
  sky: [string, string];
  wall: string;
  wallDark: string;
  wallEdge: string;
  style: 'hedge' | 'ice' | 'wood';
}

type LevelTheme = ChristmasLevelStyle;

type Ctx = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Solid silhouette of the walls: rounded blocks inset from corridors, merged where walls touch. */
function wallMask(maze: Maze, t: number): HTMLCanvasElement {
  const c = makeCanvas(maze.width * t, maze.height * t);
  const ctx = c.getContext('2d')!;
  const inset = Math.round(t * 0.16);
  const rad = t * 0.28;
  const wall = (x: number, y: number) => x >= 0 && x < maze.width && maze.kind(x, y) === 'wall';
  ctx.fillStyle = '#fff';
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!wall(x, y)) continue;
      const px = x * t;
      const py = y * t;
      ctx.beginPath();
      ctx.roundRect(px + inset, py + inset, t - inset * 2, t - inset * 2, rad);
      ctx.fill();
      // Extend to the maze border so outer walls look solid.
      if (x === 0) ctx.fillRect(px, py + inset, inset, t - inset * 2);
      if (x === maze.width - 1) ctx.fillRect(px + t - inset, py + inset, inset, t - inset * 2);
      if (y === 0) ctx.fillRect(px + inset, py, t - inset * 2, inset);
      if (y === maze.height - 1) ctx.fillRect(px + inset, py + t - inset, t - inset * 2, inset);
      if (wall(x + 1, y)) ctx.fillRect(px + t / 2, py + inset, t, t - inset * 2);
      if (wall(x, y + 1)) ctx.fillRect(px + inset, py + t / 2, t - inset * 2, t);
      if (wall(x + 1, y) && wall(x, y + 1) && wall(x + 1, y + 1)) ctx.fillRect(px + t / 2, py + t / 2, t, t);
    }
  }
  return c;
}

function fillMasked(mask: HTMLCanvasElement, paint: (ctx: Ctx) => void): HTMLCanvasElement {
  const c = makeCanvas(mask.width, mask.height);
  const ctx = c.getContext('2d')!;
  paint(ctx);
  // Clip once at the end; compositing per stroke would be O(strokes × pixels).
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function pattern(ctx: Ctx, theme: LevelTheme, w: number, h: number, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, theme.wall);
  g.addColorStop(1, theme.wallDark);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  if (theme.style === 'hedge') {
    for (let i = 0; i < (w * h) / 60; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(0,30,15,0.35)' : 'rgba(140,255,190,0.12)';
      ctx.beginPath();
      ctx.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 3, 1.5 + rnd() * 1.5, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < (w * h) / 2600; i++) {
      ctx.fillStyle = '#ff3048';
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.style === 'ice') {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    for (let x = -h; x < w; x += t * 0.7) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < (w * h) / 900; i++) ctx.fillRect(rnd() * w, rnd() * h, 1.5, 1.5);
  } else {
    ctx.strokeStyle = 'rgba(40,0,10,0.35)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < h; y += t / 3) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,220,140,0.55)';
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x += t * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.4, h);
      ctx.stroke();
    }
  }
}

export function drawChristmasMaze(ctx: Ctx, maze: Maze, theme: ChristmasLevelStyle, t: number, opts: MazeDrawOptions = {}) {
  const { background = true, details = true } = opts;
  const w = maze.width * t;
  const h = maze.height * t;

  if (background) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    let seed = 99;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.35})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
    }
  }

  const mask = wallMask(maze, t);
  const body = fillMasked(mask, (c) => pattern(c, theme, w, h, t));
  const edge = fillMasked(mask, (c) => {
    c.fillStyle = theme.wallEdge;
    c.fillRect(0, 0, w, h);
  });

  ctx.save();
  if (details) {
    ctx.shadowColor = theme.wallEdge;
    ctx.shadowBlur = t * 0.45;
  }
  ctx.drawImage(edge, 0, 0);
  ctx.restore();
  ctx.drawImage(edge, 0, -Math.max(1, t * 0.06));
  ctx.drawImage(body, 0, Math.max(1, t * 0.05));

  if (!details) return;

  // Snow caps on every wall top that faces open air.
  const wall = (x: number, y: number) => x >= 0 && x < maze.width && maze.kind(x, y) === 'wall';
  const inset = Math.round(t * 0.16);
  const snow = theme.style === 'ice' ? '#e9fbff' : '#ffffff';
  ctx.fillStyle = snow;
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur = 4;
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!wall(x, y) || wall(x, y - 1)) continue;
      const left = wall(x - 1, y) && !wall(x - 1, y - 1) ? 0 : inset;
      const right = wall(x + 1, y) && !wall(x + 1, y - 1) ? t : t - inset;
      const py = y * t + inset - 2;
      ctx.beginPath();
      ctx.roundRect(x * t + left, py, right - left, t * 0.2, t * 0.1);
      ctx.fill();
      if (rnd() > 0.55) {
        ctx.beginPath();
        ctx.ellipse(x * t + left + rnd() * (right - left - 6) + 3, py + t * 0.2, 2.5, 3.5 + rnd() * 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.shadowBlur = 0;

  // Candy-cane gate.
  const gx = maze.gate.x * t;
  const gy = maze.gate.y * t + t * 0.42;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(gx - 2, gy, t + 4, t * 0.16, t * 0.08);
  ctx.clip();
  ctx.fillStyle = '#fff';
  ctx.fillRect(gx - 2, gy, t + 4, t * 0.16);
  ctx.fillStyle = '#e8283c';
  for (let i = -2; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(gx + i * 7, gy + t * 0.16);
    ctx.lineTo(gx + i * 7 + 4, gy + t * 0.16);
    ctx.lineTo(gx + i * 7 + 9, gy);
    ctx.lineTo(gx + i * 7 + 5, gy);
    ctx.fill();
  }
  ctx.restore();
}
