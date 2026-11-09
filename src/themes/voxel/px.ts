export type Ctx = CanvasRenderingContext2D;

/**
 * Texel grid anchored at (ox, oy) with texel size `u` (may be fractional).
 * Every edge is rounded to whole pixels, so blocks stay crisp at any scale
 * and neighbouring texels never leave seams.
 */
export class Grid {
  constructor(
    readonly ctx: Ctx,
    readonly ox: number,
    readonly oy: number,
    readonly u: number,
  ) {}

  x(t: number) {
    return Math.round(this.ox + t * this.u);
  }

  y(t: number) {
    return Math.round(this.oy + t * this.u);
  }

  rect(x: number, y: number, w: number, h: number, color: string) {
    if (w <= 0 || h <= 0) return;
    const x0 = this.x(x);
    const y0 = this.y(y);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x0, y0, Math.max(1, this.x(x + w) - x0), Math.max(1, this.y(y + h) - y0));
  }

  dot(x: number, y: number, color: string) {
    this.rect(x, y, 1, 1, color);
  }

  /** Pixel-art bitmap: one character per texel, '.' is transparent. Runs are merged per row. */
  bitmap(rows: readonly string[], palette: Record<string, string>, x = 0, y = 0) {
    rows.forEach((row, j) => {
      let i = 0;
      while (i < row.length) {
        const ch = row[i];
        let k = i + 1;
        while (k < row.length && row[k] === ch) k++;
        const color = palette[ch];
        if (color) this.rect(x + i, y + j, k - i, 1, color);
        i = k;
      }
    });
  }
}

/** Grid of `n` texels spanning `size` pixels, centred on (cx, cy). */
export function centred(ctx: Ctx, cx: number, cy: number, size: number, n: number) {
  return new Grid(ctx, cx - size / 2, cy - size / 2, size / n);
}

/** Deterministic 0..1 noise for texel textures. */
export function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export interface CubeColors {
  top: string;
  front: string;
  side: string;
  outline?: string;
}

/**
 * Oblique voxel cube: front face (x, y, w, h) with a top face and a right side
 * face receding `d` texels up and to the right.
 */
export function cube(g: Grid, x: number, y: number, w: number, h: number, d: number, c: CubeColors) {
  if (c.outline) cube(g, x - 1, y - 1, w + 2, h + 2, d, { top: c.outline, front: c.outline, side: c.outline });
  for (let k = 1; k <= d; k++) g.rect(x + w - 1 + k, y - k, 1, h, c.side);
  for (let k = 1; k <= d; k++) g.rect(x + k, y - k, w, 1, c.top);
  g.rect(x, y, w, h, c.front);
}

/** Head-on block: a lighter top strip above the front face (used for symmetric mobs). */
export function block(g: Grid, x: number, y: number, w: number, h: number, d: number, c: CubeColors) {
  if (c.outline) g.rect(x - 1, y - d - 1, w + 2, h + d + 2, c.outline);
  g.rect(x, y - d, w, d, c.top);
  g.rect(x, y, w, h, c.front);
}

/** Sprinkles light/dark texels over a rectangle for a hand-made pixel texture. */
export function speckle(g: Grid, x: number, y: number, w: number, h: number, light: string, dark: string, seed: number, amount = 0.18) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const n = hash(i, j, seed);
      if (n < amount / 2) g.dot(x + i, y + j, dark);
      else if (n > 1 - amount / 2) g.dot(x + i, y + j, light);
    }
  }
}
