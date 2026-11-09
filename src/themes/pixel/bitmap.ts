type Ctx = CanvasRenderingContext2D;

/** One character per pixel; '.' (or any key missing from the palette) is transparent. */
export type Bitmap = readonly string[];
export type Palette = Readonly<Record<string, string>>;

/** Device pixels per user unit of the current (axis-aligned) transform. */
export function deviceScale(ctx: Ctx): number {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

/** Integer size, in device pixels, of one sprite pixel for an object of `worldSize` designed as `cells` pixels. */
export function pixelUnit(ctx: Ctx, worldSize: number, cells: number): number {
  return Math.max(1, Math.round((worldSize * deviceScale(ctx)) / cells));
}

/**
 * Draws a bitmap with crisp, integer-aligned squares. Works in device space so menu
 * canvases with DPR or fractional scaling stay sharp; mirrored transforms flip the art.
 * (ax, ay) is the anchor inside the bitmap, in pixels, that lands on (cx, cy).
 */
export function blit(ctx: Ctx, rows: Bitmap, pal: Palette, cx: number, cy: number, unit: number, ax?: number, ay?: number) {
  const h = rows.length;
  let w = 0;
  for (const r of rows) w = Math.max(w, r.length);
  const anchorX = ax ?? w / 2;
  const anchorY = ay ?? h / 2;
  const m = ctx.getTransform();
  const rotated = Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6;
  const fx = !rotated && m.a < 0;
  const fy = !rotated && m.d < 0;
  let ox: number;
  let oy: number;
  let u = unit;
  ctx.save();
  if (rotated) {
    // Not used by the game, but keep something sensible: draw in user space.
    u = unit / deviceScale(ctx);
    ox = cx - anchorX * u;
    oy = cy - anchorY * u;
  } else {
    const dcx = m.a * cx + m.c * cy + m.e;
    const dcy = m.b * cx + m.d * cy + m.f;
    ox = Math.round(dcx - (fx ? w - anchorX : anchorX) * u);
    oy = Math.round(dcy - (fy ? h - anchorY : anchorY) * u);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    const py = fy ? h - 1 - y : y;
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = pal[ch];
      if (color) {
        ctx.fillStyle = color;
        const px = fx ? w - end : x;
        ctx.fillRect(ox + px * u, oy + py * u, (end - x) * u, u);
      }
      x = end;
    }
  }
  ctx.restore();
}

/** Mutable pixel grid used to compose procedural sprites. */
export class Grid {
  private readonly cells: string[];
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.cells = new Array<string>(w * h).fill('.');
  }

  get(x: number, y: number) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? '.' : this.cells[y * this.w + x];
  }

  set(x: number, y: number, ch: string) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y * this.w + x] = ch;
  }

  /** Stamps a bitmap with its top-left at (x, y); '.' cells are skipped. */
  stamp(x: number, y: number, rows: Bitmap) {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) if (row[dx] !== '.') this.set(x + dx, y + dy, row[dx]);
    });
  }

  rows(): string[] {
    const out: string[] = [];
    for (let y = 0; y < this.h; y++) out.push(this.cells.slice(y * this.w, (y + 1) * this.w).join(''));
    return out;
  }
}
