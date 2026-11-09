import type { Maze } from '../../game/maze';
import type { MazeDrawOptions } from '../types';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;

export interface PixelLevelStyle {
  background: string;
  wall: string;
  /** Solid fill inside wall blocks, a dark tint of `wall`. */
  fill: string;
}

/** Sub-pixels per tile; at TILE = 40 one sub-pixel is exactly 4 screen pixels. */
const SUB = 10;
const OFFSETS: [number, number, number][] = [];
for (let dy = -3; dy <= 3; dy++) {
  for (let dx = -3; dx <= 3; dx++) {
    if (dx || dy) OFFSETS.push([dx, dy, Math.hypot(dx, dy)]);
  }
}

/** Classic arcade outlines: a sharp line inset from every corridor, with stepped round corners. */
export function drawPixelMaze(ctx: Ctx, maze: Maze, style: PixelLevelStyle, tile: number, opts: MazeDrawOptions = {}) {
  const { background = true } = opts;
  const cols = maze.width * SUB;
  const rows = maze.height * SUB;
  const solid = new Uint8Array(cols * rows);
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (maze.kind(x, y) !== 'wall') continue;
      for (let sy = 0; sy < SUB; sy++) solid.fill(1, (y * SUB + sy) * cols + x * SUB, (y * SUB + sy) * cols + x * SUB + SUB);
    }
  }
  const isSolid = (x: number, y: number) => x >= 0 && y >= 0 && x < cols && y < rows && solid[y * cols + x] === 1;

  // Distance (sub-pixels, euclidean, capped) from each solid sub-pixel to open space.
  const dist = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!solid[y * cols + x]) continue;
      let d = 9;
      for (const [dx, dy, dd] of OFFSETS) if (dd < d && !isSolid(x + dx, y + dy)) d = dd;
      dist[y * cols + x] = d;
    }
  }

  // Snap everything to device pixels so the art is crisp at any canvas scale.
  const m = ctx.getTransform();
  const X = (sx: number) => Math.round(m.a * ((sx * tile) / SUB) + m.e);
  const Y = (sy: number) => Math.round(m.d * ((sy * tile) / SUB) + m.f);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (background) {
    ctx.fillStyle = style.background;
    ctx.fillRect(X(0), Y(0), X(cols) - X(0), Y(rows) - Y(0));
  }

  const colorAt = (i: number): string | null => {
    if (!solid[i]) return null;
    const d = dist[i];
    if (d < 1.5) return null;
    if (d < 2.5) return style.wall;
    return style.fill;
  };

  for (let y = 0; y < rows; y++) {
    let x = 0;
    while (x < cols) {
      const c = colorAt(y * cols + x);
      let end = x + 1;
      while (end < cols && colorAt(y * cols + end) === c) end++;
      if (c) {
        ctx.fillStyle = c;
        ctx.fillRect(X(x), Y(y), X(end) - X(x), Y(y + 1) - Y(y));
      }
      x = end;
    }
  }

  // Enemy-house gate: a pink bar across the doorway.
  const gx = maze.gate.x * SUB;
  const gy = maze.gate.y * SUB;
  ctx.fillStyle = PAL.pink;
  ctx.fillRect(X(gx - 1), Y(gy + 4), X(gx + SUB + 1) - X(gx - 1), Y(gy + 6) - Y(gy + 4));
  ctx.restore();
}
