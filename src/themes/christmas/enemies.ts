import type { Dir, EnemyKind, MaybeDir } from '../../game/types';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** Classic ghost silhouette with a wavy hem; `frame` (0|1) shifts the hem for a walk cycle. */
function ghostPath(ctx: Ctx, cx: number, cy: number, r: number, frame: number, bumps = 4, spiky = false) {
  const top = cy - r * 0.15;
  const bottom = cy + r * 0.85;
  ctx.beginPath();
  ctx.moveTo(cx - r, bottom);
  ctx.lineTo(cx - r, top);
  ctx.arc(cx, top, r, Math.PI, 0);
  ctx.lineTo(cx + r, bottom);
  const w = (r * 2) / bumps;
  for (let i = 0; i < bumps; i++) {
    const x0 = cx + r - i * w;
    const x1 = x0 - w;
    const phase = (i + frame) % 2 ? 0.22 : 0.08;
    if (spiky) {
      ctx.lineTo((x0 + x1) / 2, bottom - r * (0.3 + phase));
      ctx.lineTo(x1, bottom + (frame ? r * 0.05 : 0));
    } else {
      ctx.quadraticCurveTo((x0 + x1) / 2, bottom - r * (0.25 + phase), x1, bottom);
    }
  }
  ctx.closePath();
}

function grad(ctx: Ctx, cx: number, cy: number, r: number, stops: [number, string][]) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.5, r * 0.1, cx, cy, r * 1.3);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function drawEnemyBody(ctx: Ctx, kind: EnemyKind, cx: number, cy: number, r: number, frame: number) {
  ctx.save();
  switch (kind) {
    case 'yeti': {
      ctx.fillStyle = '#9fd8ff';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.45, cy - r * 0.9);
        ctx.quadraticCurveTo(cx + s * r * 1.05, cy - r * 1.25, cx + s * r * 0.95, cy - r * 1.6);
        ctx.quadraticCurveTo(cx + s * r * 0.75, cy - r * 1.15, cx + s * r * 0.15, cy - r * 1.05);
        ctx.fill();
      }
      ctx.shadowColor = 'rgba(180,230,255,0.7)';
      ctx.shadowBlur = r * 0.5;
      ghostPath(ctx, cx, cy, r, frame, 6, true);
      ctx.fillStyle = grad(ctx, cx, cy, r, [[0, '#ffffff'], [0.6, '#e4f1fb'], [1, '#86a9cc']]);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#6f9cc9';
      ctx.beginPath();
      ctx.ellipse(cx, cy - r * 0.05, r * 0.72, r * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#2a1a3a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.38, r * 0.32, r * 0.12, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.22, cy + r * 0.38);
        ctx.lineTo(cx + s * r * 0.12, cy + r * 0.56);
        ctx.lineTo(cx + s * r * 0.04, cy + r * 0.38);
        ctx.fill();
      }
      break;
    }
    case 'wisp': {
      ctx.shadowColor = 'rgba(90,220,255,0.95)';
      ctx.shadowBlur = r * 0.9;
      ctx.beginPath();
      const sway = frame ? 0.12 : -0.12;
      ctx.moveTo(cx + r * sway, cy - r * 1.45);
      ctx.bezierCurveTo(cx + r * 0.6, cy - r * 0.9, cx + r * 1.05, cy - r * 0.2, cx + r * 0.9, cy + r * 0.4);
      ctx.quadraticCurveTo(cx + r * 0.7, cy + r * (frame ? 1.0 : 0.8), cx + r * 0.35, cy + r * 0.6);
      ctx.quadraticCurveTo(cx + r * 0.1, cy + r * (frame ? 0.8 : 1.05), cx - r * 0.2, cy + r * 0.62);
      ctx.quadraticCurveTo(cx - r * 0.55, cy + r * (frame ? 1.05 : 0.85), cx - r * 0.85, cy + r * 0.45);
      ctx.bezierCurveTo(cx - r * 1.1, cy - r * 0.2, cx - r * 0.6, cy - r * 0.8, cx + r * sway, cy - r * 1.45);
      ctx.closePath();
      ctx.fillStyle = grad(ctx, cx, cy, r, [[0, '#ffffff'], [0.35, '#b9f4ff'], [0.75, '#3fb8f5'], [1, 'rgba(40,120,255,0.75)']]);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (const [dx, dy, s] of [[-0.5, -0.6, 0.08], [0.55, -0.2, 0.06], [-0.1, 0.5, 0.05]]) {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, s * r, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'goblin': {
      ctx.fillStyle = '#3b3842';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.7, cy - r * 0.6);
        ctx.lineTo(cx + s * r * 1.35, cy - r * 0.95);
        ctx.lineTo(cx + s * r * 0.85, cy - r * 0.15);
        ctx.fill();
      }
      ctx.shadowColor = 'rgba(255,120,30,0.7)';
      ctx.shadowBlur = r * 0.6;
      ghostPath(ctx, cx, cy, r, frame, 4);
      ctx.fillStyle = grad(ctx, cx, cy, r, [[0, '#6b6573'], [0.6, '#38343f'], [1, '#18161c']]);
      ctx.fill();
      ctx.shadowBlur = r * 0.4;
      ctx.strokeStyle = '#ff8a1f';
      ctx.lineWidth = r * 0.08;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy + r * 0.2);
      ctx.lineTo(cx - r * 0.4, cy + r * 0.45);
      ctx.lineTo(cx - r * 0.5, cy + r * 0.7);
      ctx.moveTo(cx + r * 0.6, cy - r * 0.7);
      ctx.lineTo(cx + r * 0.35, cy - r * 0.5);
      ctx.moveTo(cx + r * 0.75, cy + r * 0.35);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 0.4, r * 0.28, r * 0.1, 0, 0, Math.PI);
      ctx.fill();
      break;
    }
    case 'elf': {
      ctx.fillStyle = '#f2c9a0';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + s * r * 0.85, cy - r * 0.3);
        ctx.lineTo(cx + s * r * 1.4, cy - r * 0.55);
        ctx.lineTo(cx + s * r * 0.9, cy + r * 0.05);
        ctx.fill();
      }
      ctx.shadowColor = 'rgba(80,255,140,0.6)';
      ctx.shadowBlur = r * 0.5;
      ghostPath(ctx, cx, cy, r, frame, 5);
      ctx.fillStyle = grad(ctx, cx, cy, r, [[0, '#8dffb0'], [0.55, '#2fae5a'], [1, '#125a2a']]);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffcc33';
      ctx.fillRect(cx - r, cy + r * 0.32, r * 2, r * 0.16);
      // floppy hat
      ctx.fillStyle = grad(ctx, cx, cy - r, r, [[0, '#ff8080'], [1, '#b0101c']]);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.95, cy - r * 0.55);
      ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 2.0, cx + r * 1.2, cy - r * (frame ? 1.25 : 1.05));
      ctx.quadraticCurveTo(cx + r * 0.3, cy - r * 1.2, cx + r * 0.95, cy - r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.9, cy - r * 0.6);
      ctx.lineTo(cx + r * 0.9, cy - r * 0.6);
      ctx.stroke();
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      ctx.arc(cx + r * 1.2, cy - r * (frame ? 1.25 : 1.05), r * 0.16, 0, TAU);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/** Enemy frozen in ice by a magic crystal — vulnerable. `flash` is the warning colour near expiry. */
export function drawFrozenEnemy(ctx: Ctx, cx: number, cy: number, r: number, frame: number, flash: boolean) {
  ctx.save();
  ghostPath(ctx, cx, cy, r, frame, 4);
  ctx.fillStyle = flash
    ? grad(ctx, cx, cy, r, [[0, '#ffffff'], [1, '#c7d6ea']])
    : grad(ctx, cx, cy, r, [[0, '#6f8cff'], [0.6, '#2a3fc4'], [1, '#141f6e']]);
  ctx.fill();
  const face = flash ? '#e0244a' : '#e6f0ff';
  ctx.fillStyle = face;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * r * 0.32, cy - r * 0.12, r * 0.13, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = face;
  ctx.lineWidth = r * 0.09;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const x = cx - r * 0.5 + (i * r) / 6;
    const y = cy + r * 0.35 + (i % 2 ? -r * 0.1 : 0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  // ice shell
  ctx.fillStyle = 'rgba(190,240,255,0.22)';
  ctx.strokeStyle = 'rgba(220,250,255,0.85)';
  ctx.lineWidth = r * 0.07;
  roundRect(ctx, cx - r * 1.12, cy - r * 1.2, r * 2.24, r * 2.24, r * 0.35);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.95, cy - r * 0.5);
  ctx.lineTo(cx - r * 0.95, cy - r * 1.0);
  ctx.lineTo(cx - r * 0.45, cy - r * 1.0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawEyes(ctx: Ctx, cx: number, cy: number, r: number, dir: MaybeDir) {
  const off: Record<MaybeDir, [number, number]> = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], none: [0, 0],
  };
  const [ox, oy] = off[dir];
  for (const s of [-1, 1]) {
    const ex = cx + s * r * 0.33 + ox * r * 0.08;
    const ey = cy - r * 0.18 + oy * r * 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * 0.24, r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#16123a';
    ctx.beginPath();
    ctx.arc(ex + ox * r * 0.1, ey + oy * r * 0.13, r * 0.13, 0, TAU);
    ctx.fill();
  }
}

export const EYE_DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, rad: number) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
