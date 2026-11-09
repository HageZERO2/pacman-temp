import type { SkinId } from '../../game/types';

type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

/** Body silhouette facing right, with a mouth wedge of half-angle `a`. */
function bodyPath(ctx: Ctx, cx: number, cy: number, r: number, a: number) {
  ctx.beginPath();
  if (a < 0.02) {
    ctx.arc(cx, cy, r, 0, TAU);
  } else {
    ctx.moveTo(cx - r * 0.12, cy);
    ctx.arc(cx, cy, r, a, TAU - a);
  }
  ctx.closePath();
}

function shaded(ctx: Ctx, cx: number, cy: number, r: number, light: string, base: string, dark: string) {
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.05);
  g.addColorStop(0, light);
  g.addColorStop(0.55, base);
  g.addColorStop(1, dark);
  return g;
}

function eye(ctx: Ctx, x: number, y: number, r: number, color = '#1a1430') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r * 1.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.45, r * 0.38, 0, TAU);
  ctx.fill();
}

function gloss(ctx: Ctx, cx: number, cy: number, r: number, alpha = 0.45) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.42, cy - r * 0.5, r * 0.22, r * 0.12, -0.7, 0, TAU);
  ctx.fill();
}

function withClip(ctx: Ctx, cx: number, cy: number, r: number, a: number, fn: () => void) {
  ctx.save();
  bodyPath(ctx, cx, cy, r, a);
  ctx.clip();
  fn();
  ctx.restore();
}

interface BodyStyle {
  light: string;
  base: string;
  dark: string;
  glow: string;
}

const BODY: Record<SkinId, BodyStyle> = {
  classic: { light: '#fff3b0', base: '#ffc93c', dark: '#e07b00', glow: 'rgba(255,201,60,0.55)' },
  santa: { light: '#ff9a8f', base: '#e5303a', dark: '#8f0f1c', glow: 'rgba(255,80,80,0.5)' },
  snowman: { light: '#ffffff', base: '#e9f5ff', dark: '#93b7d8', glow: 'rgba(200,235,255,0.6)' },
  gingerbread: { light: '#f1b77d', base: '#c97a3d', dark: '#7a3d14', glow: 'rgba(230,150,80,0.45)' },
  reindeer: { light: '#d59a64', base: '#9b5f32', dark: '#4f2a12', glow: 'rgba(255,90,90,0.35)' },
  ice: { light: '#f2feff', base: '#62d3f5', dark: '#1a5fb4', glow: 'rgba(120,230,255,0.8)' },
};

/**
 * Draws a player skin facing right. `mouth` is 0 (closed) .. 1 (wide open).
 * Accessories extend up to ~1.5r above the centre, so frames should be ≥ 3.2r tall.
 */
export function drawPlayer(ctx: Ctx, skin: SkinId, cx: number, cy: number, r: number, mouth: number) {
  const a = Math.max(0, Math.min(1, mouth)) * 0.82;
  const st = BODY[skin];

  ctx.save();
  ctx.shadowColor = st.glow;
  ctx.shadowBlur = r * 0.6;
  bodyPath(ctx, cx, cy, r, a);
  ctx.fillStyle = shaded(ctx, cx, cy, r, st.light, st.base, st.dark);
  ctx.fill();
  ctx.restore();

  switch (skin) {
    case 'classic':
      gloss(ctx, cx, cy, r);
      eye(ctx, cx + r * 0.08, cy - r * 0.5, r * 0.13);
      drawHolly(ctx, cx - r * 0.25, cy - r * 0.92, r * 0.42);
      break;
    case 'santa':
      withClip(ctx, cx, cy, r, a, () => {
        ctx.fillStyle = '#fbfbff';
        for (let i = 0; i < 7; i++) {
          const ang = 0.85 + i * 0.32;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * r * 0.78, cy + Math.sin(ang) * r * 0.78, r * 0.36, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(160,190,220,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx - r * 0.2, cy + r * 0.95, r * 0.8, r * 0.25, 0, 0, TAU);
        ctx.fill();
      });
      gloss(ctx, cx, cy, r, 0.3);
      eye(ctx, cx + r * 0.05, cy - r * 0.32, r * 0.13);
      drawSantaHat(ctx, cx, cy, r);
      break;
    case 'snowman':
      gloss(ctx, cx, cy, r, 0.7);
      ctx.fillStyle = '#26232f';
      for (const [dx, dy] of [[-0.45, 0.25], [-0.3, 0.6]]) {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.09, 0, TAU);
        ctx.fill();
      }
      eye(ctx, cx - r * 0.05, cy - r * 0.42, r * 0.12, '#26232f');
      // carrot nose
      ctx.fillStyle = '#ff8a1f';
      ctx.beginPath();
      ctx.moveTo(cx + r * 0.18, cy - r * 0.34);
      ctx.lineTo(cx + r * 0.95, cy - r * 0.3);
      ctx.lineTo(cx + r * 0.2, cy - r * 0.16);
      ctx.closePath();
      ctx.fill();
      drawTopHat(ctx, cx - r * 0.12, cy - r * 0.78, r);
      break;
    case 'gingerbread':
      withClip(ctx, cx, cy, r, a, () => {
        ctx.strokeStyle = '#fffaf2';
        ctx.lineWidth = r * 0.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const t = (i / 64) * TAU;
          const rr = r * (0.8 + Math.sin(t * 12) * 0.05);
          const x = cx + Math.cos(t) * rr;
          const y = cy + Math.sin(t) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      gloss(ctx, cx, cy, r, 0.25);
      for (const [dx, dy, c] of [[-0.42, 0.12, '#ff3b5c'], [-0.18, 0.5, '#36d06a']] as const) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.13, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(cx + (dx - 0.04) * r, cy + (dy - 0.05) * r, r * 0.04, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#fffaf2';
      ctx.beginPath();
      ctx.arc(cx + r * 0.05, cy - r * 0.48, r * 0.14, 0, TAU);
      ctx.fill();
      eye(ctx, cx + r * 0.05, cy - r * 0.48, r * 0.08, '#3a1a0a');
      break;
    case 'reindeer':
      drawAntlers(ctx, cx, cy, r);
      ctx.fillStyle = BODY.reindeer.base;
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.68, cy - r * 0.68, r * 0.28, r * 0.14, -0.9, 0, TAU);
      ctx.fill();
      withClip(ctx, cx, cy, r, a, () => {
        ctx.fillStyle = 'rgba(245,215,170,0.85)';
        ctx.beginPath();
        ctx.ellipse(cx + r * 0.45, cy + r * 0.05, r * 0.6, r * 0.55, 0, 0, TAU);
        ctx.fill();
      });
      gloss(ctx, cx, cy, r, 0.25);
      eye(ctx, cx - r * 0.02, cy - r * 0.45, r * 0.13);
      ctx.save();
      ctx.shadowColor = '#ff3030';
      ctx.shadowBlur = r * 0.7;
      ctx.fillStyle = shaded(ctx, cx + r * 0.72, cy - r * 0.42, r * 0.2, '#ff9a9a', '#ff2a2a', '#a00000');
      ctx.beginPath();
      ctx.arc(cx + r * 0.72, cy - r * 0.42, r * 0.2, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    case 'ice':
      withClip(ctx, cx, cy, r, a, () => {
        const pts = 9;
        for (let i = 0; i < pts; i++) {
          const t0 = (i / pts) * TAU + 0.3;
          const t1 = ((i + 1) / pts) * TAU + 0.3;
          ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(10,60,140,0.18)';
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.15, cy - r * 0.1);
          ctx.lineTo(cx + Math.cos(t0) * r * 1.1, cy + Math.sin(t0) * r * 1.1);
          ctx.lineTo(cx + Math.cos(t1) * r * 1.1, cy + Math.sin(t1) * r * 1.1);
          ctx.closePath();
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = r * 0.04;
        ctx.beginPath();
        ctx.arc(cx - r * 0.15, cy - r * 0.1, r * 0.45, 0, TAU);
        ctx.stroke();
      });
      drawSparkle(ctx, cx - r * 0.45, cy - r * 0.45, r * 0.32, '#ffffff');
      drawSparkle(ctx, cx + r * 0.1, cy + r * 0.55, r * 0.16, '#e0fbff');
      eye(ctx, cx + r * 0.1, cy - r * 0.5, r * 0.12, '#0b2a5c');
      break;
  }
}

function drawHolly(ctx: Ctx, x: number, y: number, s: number) {
  ctx.fillStyle = '#1f9d55';
  for (const rot of [-0.5, 0.6]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(s * 0.45, 0, s * 0.5, s * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ff2b3d';
  for (const [dx, dy] of [[0, 0.05], [0.18, -0.12], [-0.16, -0.1]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, s * 0.14, 0, TAU);
    ctx.fill();
  }
}

function drawSantaHat(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.fillStyle = shaded(ctx, cx, cy - r, r, '#ff7a7a', '#e5303a', '#8f0f1c');
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.85, cy - r * 0.5);
  ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 1.7, cx - r * 1.25, cy - r * 1.25);
  ctx.quadraticCurveTo(cx + r * 0.1, cy - r * 1.75, cx + r * 0.65, cy - r * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fbfbff';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.82, cy - r * 0.52);
  ctx.quadraticCurveTo(cx - r * 0.1, cy - r * 0.95, cx + r * 0.62, cy - r * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#fbfbff';
  ctx.beginPath();
  ctx.arc(cx - r * 1.25, cy - r * 1.22, r * 0.22, 0, TAU);
  ctx.fill();
}

function drawTopHat(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = '#1d1b26';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.7, r * 0.14, -0.12, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  ctx.fillRect(-r * 0.42, -r * 0.7, r * 0.84, r * 0.7);
  ctx.fillStyle = '#d6263a';
  ctx.fillRect(-r * 0.42, -r * 0.22, r * 0.84, r * 0.14);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-r * 0.32, -r * 0.65, r * 0.12, r * 0.55);
  ctx.restore();
}

function drawAntlers(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.strokeStyle = '#e9d3a5';
  ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.12;
  const antler = (bx: number, by: number, lean: number) => {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * r * 0.2, by - r * 0.5, bx + lean * r * 0.45, by - r * 0.75);
    ctx.moveTo(bx + lean * r * 0.08, by - r * 0.3);
    ctx.lineTo(bx - lean * r * 0.22, by - r * 0.55);
    ctx.moveTo(bx + lean * r * 0.25, by - r * 0.55);
    ctx.lineTo(bx + lean * r * 0.05, by - r * 0.85);
    ctx.stroke();
  };
  antler(cx - r * 0.4, cy - r * 0.8, -1);
  antler(cx + r * 0.15, cy - r * 0.92, 1);
}

export function drawSparkle(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
}
