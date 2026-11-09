export type Ctx = CanvasRenderingContext2D;
export type Pt = readonly [number, number];

export const TAU = Math.PI * 2;

/** Core neon palette shared by every cyberpunk asset. */
export const NEON = {
  cyan: '#29f6ff',
  magenta: '#ff2bd6',
  violet: '#9b5cff',
  blue: '#2f6bff',
  pink: '#ff4f9a',
  acid: '#f6ff3a',
  lime: '#39ff9e',
  amber: '#ffb02e',
  red: '#ff3355',
  ink: '#07031a',
} as const;

/** Line width that never vanishes at tiny menu sizes. */
export const lw = (v: number, min = 0.75) => Math.max(min, v);

export function poly(ctx: Ctx, pts: readonly Pt[]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

export function glow(ctx: Ctx, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

export function noGlow(ctx: Ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

/** Vertical metal gradient across a body of radius r. */
export function metal(ctx: Ctx, cy: number, r: number, light: string, base: string, dark: string) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, light);
  g.addColorStop(0.45, base);
  g.addColorStop(1, dark);
  return g;
}

export function radial(ctx: Ctx, cx: number, cy: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** Deterministic PRNG so baked art is identical across runs and previews. */
export function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/** A small lightning-bolt glyph centred on (cx, cy) with height h. */
export function boltPath(ctx: Ctx, cx: number, cy: number, h: number) {
  const s = h / 2;
  poly(ctx, [
    [cx + s * 0.18, cy - s],
    [cx - s * 0.5, cy + s * 0.12],
    [cx - s * 0.02, cy + s * 0.12],
    [cx - s * 0.2, cy + s],
    [cx + s * 0.5, cy - s * 0.14],
    [cx + s * 0.02, cy - s * 0.14],
  ]);
}

/** `#rrggbb` → `rgba(r,g,b,a)`. */
export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Mix a `#rrggbb` colour toward black (t < 0) or white (t > 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const target = t < 0 ? 0 : 255;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (target - v) * k);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Neon tube: a coloured glowing stroke with a bright thin core.
 * `trace` must (re)build the path; it is called twice.
 */
export function neon(ctx: Ctx, trace: () => void, color: string, width: number, core = '#ffffff', blur = width * 3) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  glow(ctx, color, blur);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw(width);
  trace();
  ctx.stroke();
  noGlow(ctx);
  ctx.globalAlpha *= 0.8;
  ctx.strokeStyle = core;
  ctx.lineWidth = lw(width * 0.38, 0.5);
  trace();
  ctx.stroke();
  ctx.restore();
}

export function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, rad: number | number[]) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
}

/** Rectangle with chamfered (cut) corners — the house style for panels and chips. */
export function chamferPath(ctx: Ctx, x: number, y: number, w: number, h: number, c: number) {
  poly(ctx, [
    [x + c, y],
    [x + w - c, y],
    [x + w, y + c],
    [x + w, y + h - c],
    [x + w - c, y + h],
    [x + c, y + h],
    [x, y + h - c],
    [x, y + c],
  ]);
}

/** Soft additive halo behind a sprite. */
export function halo(ctx: Ctx, cx: number, cy: number, r: number, color: string, alpha = 0.5) {
  ctx.fillStyle = radial(ctx, cx, cy, r, [
    [0, rgba(color, alpha)],
    [0.45, rgba(color, alpha * 0.35)],
    [1, rgba(color, 0)],
  ]);
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}
