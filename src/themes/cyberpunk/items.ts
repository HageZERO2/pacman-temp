import type { ItemKind } from '../types';
import { NEON, TAU, boltPath, chamferPath, glow, halo, lw, neon, noGlow, poly, radial, rgba, type Ctx } from './shared';
import { drawFlare } from './player';

/** Regular pellet: a small plasma orb. */
function energyOrb(ctx: Ctx, cx: number, cy: number, size: number) {
  halo(ctx, cx, cy, size * 0.42, NEON.cyan, 0.55);
  const r = size * 0.15;
  ctx.fillStyle = radial(ctx, cx - r * 0.3, cy - r * 0.3, r * 1.3, [
    [0, '#ffffff'],
    [0.45, '#bffcff'],
    [1, NEON.cyan],
  ]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.fill();
}

/** Power item: a faceted data crystal orbited by a holo ring and loose bits. */
function dataCrystal(ctx: Ctx, cx: number, cy: number, size: number) {
  const h = size * 0.36;
  const w = size * 0.2;
  halo(ctx, cx, cy, size * 0.5, NEON.magenta, 0.5);
  // Back half of the ring
  ctx.strokeStyle = rgba(NEON.cyan, 0.45);
  ctx.lineWidth = lw(size * 0.025, 0.6);
  ctx.beginPath();
  ctx.ellipse(cx, cy + h * 0.1, size * 0.4, size * 0.11, -0.25, Math.PI, TAU);
  ctx.stroke();

  const gem = () =>
    poly(ctx, [
      [cx, cy - h],
      [cx + w, cy - h * 0.35],
      [cx + w * 0.7, cy + h * 0.45],
      [cx, cy + h],
      [cx - w * 0.7, cy + h * 0.45],
      [cx - w, cy - h * 0.35],
    ]);
  ctx.save();
  glow(ctx, NEON.magenta, size * 0.2);
  gem();
  const g = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  g.addColorStop(0, '#ffd6f7');
  g.addColorStop(0.4, NEON.magenta);
  g.addColorStop(0.75, NEON.violet);
  g.addColorStop(1, '#2a0a6a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  // Facets
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  poly(ctx, [
    [cx, cy - h],
    [cx - w, cy - h * 0.35],
    [cx - w * 0.2, cy - h * 0.2],
  ]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = lw(size * 0.018, 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - h * 0.35);
  ctx.lineTo(cx - w * 0.2, cy - h * 0.2);
  ctx.lineTo(cx + w, cy - h * 0.35);
  ctx.moveTo(cx - w * 0.2, cy - h * 0.2);
  ctx.lineTo(cx, cy + h);
  ctx.stroke();
  neon(ctx, gem, '#ffb8f2', size * 0.035, '#ffffff', size * 0.12);
  // Front half of the ring
  neon(
    ctx,
    () => {
      ctx.beginPath();
      ctx.ellipse(cx, cy + h * 0.1, size * 0.4, size * 0.11, -0.25, 0, Math.PI);
    },
    NEON.cyan,
    size * 0.03,
  );
  // Data bits
  ctx.fillStyle = NEON.cyan;
  for (const [dx, dy, s] of [[0.36, -0.3, 0.05], [-0.38, -0.12, 0.04], [0.3, 0.32, 0.035]] as const) {
    ctx.fillRect(cx + dx * size - (s * size) / 2, cy + dy * size - (s * size) / 2, s * size, s * size);
  }
}

/** Bonus star: hexagonal neon token with a star glyph. */
function neonToken(ctx: Ctx, cx: number, cy: number, size: number) {
  const R = size * 0.3;
  halo(ctx, cx, cy, size * 0.5, NEON.acid, 0.45);
  const hex = (rad: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
  };
  hex(R);
  ctx.fillStyle = radial(ctx, cx, cy, R, [
    [0, '#3a2a00'],
    [1, '#120a00'],
  ]);
  ctx.fill();
  neon(ctx, () => hex(R), NEON.amber, size * 0.05, '#fff4c2', size * 0.15);
  ctx.strokeStyle = rgba(NEON.acid, 0.55);
  ctx.lineWidth = lw(size * 0.015, 0.5);
  hex(R * 0.8);
  ctx.stroke();
  const star = () => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const rad = i % 2 ? R * 0.26 : R * 0.6;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
      else ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
  };
  ctx.save();
  glow(ctx, NEON.acid, size * 0.15);
  star();
  ctx.fillStyle = NEON.acid;
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(cx - R * 0.12, cy - R * 0.18, R * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Speed bonus: a charged power cell. */
function powerCell(ctx: Ctx, cx: number, cy: number, size: number) {
  const w = size * 0.36;
  const h = size * 0.56;
  const x = cx - w / 2;
  const y = cy - h / 2 + size * 0.03;
  halo(ctx, cx, cy, size * 0.5, NEON.lime, 0.45);
  // Terminal
  ctx.fillStyle = '#c9d3e4';
  ctx.fillRect(cx - w * 0.22, y - size * 0.06, w * 0.44, size * 0.07);
  const casing = () => chamferPath(ctx, x, y, w, h, w * 0.18);
  casing();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#1a2230');
  g.addColorStop(0.35, '#3a4660');
  g.addColorStop(1, '#0c1018');
  ctx.fillStyle = g;
  ctx.fill();
  // Charge window
  const wx = x + w * 0.18;
  const wy = y + h * 0.12;
  const ww = w * 0.64;
  const wh = h * 0.76;
  ctx.fillStyle = '#03120a';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.save();
  glow(ctx, NEON.lime, size * 0.12);
  const bars = 4;
  const gap = wh * 0.06;
  const bh = (wh - gap * (bars + 1)) / bars;
  for (let i = 0; i < bars; i++) {
    ctx.fillStyle = i === 0 ? rgba(NEON.lime, 0.35) : NEON.lime;
    ctx.fillRect(wx + gap, wy + gap + i * (bh + gap), ww - gap * 2, bh);
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  boltPath(ctx, cx, wy + wh * 0.55, wh * 0.62);
  ctx.fill();
  ctx.strokeStyle = '#03120a';
  ctx.lineWidth = lw(size * 0.012, 0.4);
  ctx.stroke();
  neon(ctx, casing, NEON.lime, size * 0.035, '#eafff4', size * 0.12);
}

export function drawCyberItem(ctx: Ctx, kind: ItemKind, cx: number, cy: number, size: number) {
  ctx.save();
  if (kind === 'snowflake') energyOrb(ctx, cx, cy, size);
  else if (kind === 'crystal') dataCrystal(ctx, cx, cy, size);
  else if (kind === 'star') neonToken(ctx, cx, cy, size);
  else powerCell(ctx, cx, cy, size);
  ctx.restore();
}

export function drawCyberParticle(ctx: Ctx, kind: 'spark' | 'ambient', cx: number, cy: number, size: number) {
  if (kind === 'spark') {
    drawFlare(ctx, cx, cy, size * 0.46);
    return;
  }
  // Neon rain streak: bright head at the bottom, fading tail.
  const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
  g.addColorStop(0, 'rgba(160,240,255,0)');
  g.addColorStop(0.7, 'rgba(190,245,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 0.75, cy - size / 2, 1.5, size);
}
