import type { Maze } from '../../game/maze';
import type { MazeDrawOptions } from '../types';
import { makeCanvas, rgba, rng, type Ctx } from './shared';

export interface CyberLevelStyle {
  sky: [string, string];
  /** Floor grid line colour. */
  grid: string;
  /** Wall panel gradient, top → bottom. */
  panel: [string, string];
  /** Outer neon tube. */
  outer: string;
  /** Inner neon tube. */
  inner: string;
  /** Circuit traces inside the panels. */
  trace: string;
  /** Holographic gate / spawn pad. */
  holo: string;
}

/**
 * Wall silhouette offset inward by `inset` from each tile edge, with merged joints.
 * Called with growing insets to build concentric outlines (outer tube, gap, inner tube, panel).
 */
function wallMask(maze: Maze, t: number, inset: number, rad: number): HTMLCanvasElement {
  const c = makeCanvas(maze.width * t, maze.height * t);
  const ctx = c.getContext('2d')!;
  const wall = (x: number, y: number) => x >= 0 && x < maze.width && maze.kind(x, y) === 'wall';
  const span = t - inset * 2;
  if (span <= 0) return c;
  ctx.fillStyle = '#fff';
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!wall(x, y)) continue;
      const px = x * t;
      const py = y * t;
      ctx.beginPath();
      ctx.roundRect(px + inset, py + inset, span, span, Math.max(0, rad));
      ctx.fill();
      // Extend to the maze border, bridging neighbours so the edge strip has no gaps.
      const x0 = wall(x - 1, y) ? 0 : inset;
      const x1 = wall(x + 1, y) ? t : t - inset;
      const y0 = wall(x, y - 1) && y > 0 ? 0 : inset;
      const y1 = wall(x, y + 1) && y < maze.height - 1 ? t : t - inset;
      if (x === 0) ctx.fillRect(px, py + y0, inset, y1 - y0);
      if (x === maze.width - 1) ctx.fillRect(px + t - inset, py + y0, inset, y1 - y0);
      if (y === 0) ctx.fillRect(px + x0, py, x1 - x0, inset);
      if (y === maze.height - 1) ctx.fillRect(px + x0, py + t - inset, x1 - x0, inset);
      if (wall(x + 1, y)) ctx.fillRect(px + t / 2, py + inset, t, span);
      if (wall(x, y + 1)) ctx.fillRect(px + inset, py + t / 2, span, t);
      if (wall(x + 1, y) && wall(x, y + 1) && wall(x + 1, y + 1)) ctx.fillRect(px + t / 2, py + t / 2, t, t);
    }
  }
  return c;
}

function fillMasked(mask: HTMLCanvasElement, paint: (ctx: Ctx) => void): HTMLCanvasElement {
  const c = makeCanvas(mask.width, mask.height);
  const ctx = c.getContext('2d')!;
  paint(ctx);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function solid(mask: HTMLCanvasElement, color: string) {
  return fillMasked(mask, (c) => {
    c.fillStyle = color;
    c.fillRect(0, 0, mask.width, mask.height);
  });
}

/** Dark tech panel: seams plus a circuit trace running along each wall's spine. */
function panelTexture(ctx: Ctx, maze: Maze, st: CyberLevelStyle, t: number, details: boolean) {
  const w = maze.width * t;
  const h = maze.height * t;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, st.panel[0]);
  g.addColorStop(1, st.panel[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Brushed diagonal sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = Math.max(1, t * 0.08);
  for (let x = -h; x < w; x += t * 0.9) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  if (!details) return;

  const wall = (x: number, y: number) => x >= 0 && x < maze.width && maze.kind(x, y) === 'wall';
  const rnd = rng(17);
  ctx.lineCap = 'round';
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (!wall(x, y)) continue;
      const mx = (x + 0.5) * t;
      const my = (y + 0.5) * t;
      const right = wall(x + 1, y);
      const down = wall(x, y + 1);
      const n = [right, down, wall(x - 1, y), wall(x, y - 1)].filter(Boolean).length;
      // Panel seams between tiles along a run.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      if (right && !down && !wall(x, y - 1)) ctx.fillRect((x + 1) * t - 0.5, y * t, 1, t);
      if (down && !right && !wall(x - 1, y)) ctx.fillRect(x * t, (y + 1) * t - 0.5, t, 1);
      // Spine trace
      ctx.strokeStyle = st.trace;
      ctx.lineWidth = Math.max(0.75, t * 0.035);
      ctx.beginPath();
      if (right) {
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + t, my);
      }
      if (down) {
        ctx.moveTo(mx, my);
        ctx.lineTo(mx, my + t);
      }
      ctx.stroke();
      if (n !== 2 || rnd() < 0.18) {
        // Solder node / status LED at ends, junctions and a few random points.
        const led = rnd() < 0.5 ? st.outer : st.inner;
        ctx.fillStyle = n === 2 ? rgba(led, 0.9) : st.trace;
        ctx.shadowColor = led;
        ctx.shadowBlur = n === 2 ? t * 0.25 : 0;
        ctx.beginPath();
        ctx.arc(mx, my, Math.max(0.8, t * (n === 2 ? 0.05 : 0.07)), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (right && rnd() < 0.3) {
        // Vent slots
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let k = 0; k < 3; k++) ctx.fillRect(x * t + t * (0.25 + k * 0.18), my - t * 0.14, Math.max(1, t * 0.06), t * 0.08);
      }
    }
  }
}

function drawFloor(ctx: Ctx, maze: Maze, st: CyberLevelStyle, t: number) {
  const w = maze.width * t;
  const h = maze.height * t;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, st.sky[0]);
  g.addColorStop(1, st.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Central bloom from the holo core
  const cx = (maze.houseCenter.x + 0.5) * t;
  const cy = (maze.houseCenter.y + 0.5) * t;
  const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
  bloom.addColorStop(0, rgba(st.holo, 0.14));
  bloom.addColorStop(1, rgba(st.holo, 0));
  ctx.fillStyle = bloom;
  ctx.fillRect(0, 0, w, h);
  // Tile grid
  ctx.fillStyle = st.grid;
  const line = Math.max(0.5, t * 0.025);
  for (let x = 0; x <= maze.width; x++) ctx.fillRect(x * t - line / 2, 0, line, h);
  for (let y = 0; y <= maze.height; y++) ctx.fillRect(0, y * t - line / 2, w, line);
  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const step = Math.max(2, t * 0.1);
  for (let y = 0; y < h; y += step) ctx.fillRect(0, y, w, step / 2);
}

function drawHolo(ctx: Ctx, maze: Maze, st: CyberLevelStyle, t: number) {
  // Spawn chamber floor: hex-dot lattice + projector ring.
  ctx.save();
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (maze.kind(x, y) !== 'house') continue;
      ctx.fillStyle = rgba(st.holo, 0.08);
      ctx.fillRect(x * t, y * t, t, t);
      ctx.fillStyle = rgba(st.holo, 0.35);
      for (let k = 0; k < 4; k++) {
        const dx = (k % 2) * 0.5 + 0.25 + (Math.floor(k / 2) % 2) * 0.12;
        const dy = Math.floor(k / 2) * 0.5 + 0.25;
        ctx.fillRect(x * t + dx * t, y * t + dy * t, Math.max(0.8, t * 0.04), Math.max(0.8, t * 0.04));
      }
    }
  }
  const hx = (maze.houseCenter.x + 0.5) * t;
  const hy = (maze.houseCenter.y + 0.5) * t;
  ctx.shadowColor = st.holo;
  ctx.shadowBlur = t * 0.4;
  ctx.strokeStyle = rgba(st.holo, 0.75);
  ctx.lineWidth = Math.max(0.8, t * 0.04);
  ctx.beginPath();
  ctx.ellipse(hx, hy + t * 0.18, t * 0.9, t * 0.22, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([t * 0.12, t * 0.1]);
  ctx.beginPath();
  ctx.ellipse(hx, hy + t * 0.18, t * 1.25, t * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Gate: energy barrier with scan bars.
  const gx = maze.gate.x * t;
  const gy = maze.gate.y * t + t * 0.38;
  const gh = t * 0.24;
  const bar = ctx.createLinearGradient(0, gy, 0, gy + gh);
  bar.addColorStop(0, rgba(st.holo, 0.15));
  bar.addColorStop(0.5, rgba(st.holo, 0.9));
  bar.addColorStop(1, rgba(st.holo, 0.15));
  ctx.shadowBlur = t * 0.5;
  ctx.fillStyle = bar;
  ctx.fillRect(gx - t * 0.1, gy, t * 1.2, gh);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(gx - t * 0.1, gy + gh / 2 - Math.max(0.5, t * 0.015), t * 1.2, Math.max(1, t * 0.03));
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let k = 1; k < 5; k++) ctx.fillRect(gx + (k * t) / 5, gy - t * 0.04, Math.max(0.6, t * 0.02), gh + t * 0.08);
  ctx.restore();
}

export function drawCyberMaze(ctx: Ctx, maze: Maze, st: CyberLevelStyle, t: number, opts: MazeDrawOptions = {}) {
  const { background = true, details = true } = opts;
  if (background) drawFloor(ctx, maze, st, t);

  const inset = t * 0.14;
  const rad = t * 0.2;
  const outerW = Math.max(1, t * 0.065);
  const gapW = Math.max(0.8, t * 0.05);
  const innerW = Math.max(0.75, t * 0.03);
  const m0 = wallMask(maze, t, inset, rad);
  const i1 = inset + outerW;
  const i2 = i1 + gapW;
  const i3 = i2 + innerW;
  const m1 = wallMask(maze, t, i1, rad - (i1 - inset));
  const m2 = wallMask(maze, t, i2, rad - (i2 - inset));
  const m3 = wallMask(maze, t, i3, rad - (i3 - inset));

  const outer = solid(m0, st.outer);
  ctx.save();
  if (details) {
    // Two glow passes: wide bloom + tight halo.
    ctx.shadowColor = st.outer;
    ctx.shadowBlur = t * 0.6;
    ctx.drawImage(outer, 0, 0);
    ctx.shadowBlur = t * 0.2;
  }
  ctx.drawImage(outer, 0, 0);
  ctx.restore();
  ctx.drawImage(solid(m1, '#030108'), 0, 0);
  const inner = solid(m2, st.inner);
  ctx.save();
  if (details) {
    ctx.shadowColor = st.inner;
    ctx.shadowBlur = t * 0.15;
  }
  ctx.globalAlpha = 0.85;
  ctx.drawImage(inner, 0, 0);
  ctx.restore();
  ctx.drawImage(
    fillMasked(m3, (c) => panelTexture(c, maze, st, t, details)),
    0,
    0,
  );

  if (details) drawHolo(ctx, maze, st, t);
  else {
    // Minimal gate for tiny previews.
    ctx.fillStyle = st.holo;
    ctx.fillRect(maze.gate.x * t, maze.gate.y * t + t * 0.42, t, Math.max(1, t * 0.14));
  }
}
