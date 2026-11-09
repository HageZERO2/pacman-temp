import { roundRect } from './enemies';
import { drawSparkle } from './player';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export function drawSnowflake(ctx: Ctx, cx: number, cy: number, r: number, color = '#e8fbff') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, r * 0.22);
  ctx.shadowColor = 'rgba(160,230,255,0.9)';
  ctx.shadowBlur = r * 1.2;
  for (let i = 0; i < 6; i++) {
    ctx.rotate(TAU / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -r);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(r * 0.3, -r * 0.8);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(-r * 0.3, -r * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCrystal(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(190,120,255,0.95)';
  ctx.shadowBlur = r * 1.1;
  const top = { x: cx, y: cy - r };
  const bottom = { x: cx, y: cy + r };
  const l = { x: cx - r * 0.68, y: cy - r * 0.15 };
  const rr = { x: cx + r * 0.68, y: cy - r * 0.15 };
  const mid = { x: cx + r * 0.08, y: cy - r * 0.2 };
  const faces: [typeof top, typeof top, typeof top, string][] = [
    [top, l, mid, '#f3d9ff'],
    [top, mid, rr, '#b48bff'],
    [l, bottom, mid, '#7a5cff'],
    [mid, bottom, rr, '#4f3ad8'],
  ];
  for (const [a, b, c, color] of faces) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(l.x, l.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(rr.x, rr.y);
  ctx.closePath();
  ctx.stroke();
  drawSparkle(ctx, cx - r * 0.25, cy - r * 0.45, r * 0.22, '#ffffff');
  ctx.restore();
}

export function starPath(ctx: Ctx, cx: number, cy: number, outer: number, inner: number, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawStar(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(255,210,80,1)';
  ctx.shadowBlur = r * 1.2;
  starPath(ctx, cx, cy, r, r * 0.45);
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#fff6b5');
  g.addColorStop(0.5, '#ffcf3a');
  g.addColorStop(1, '#e58a00');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = r * 0.08;
  ctx.stroke();
  drawSparkle(ctx, cx - r * 0.2, cy - r * 0.3, r * 0.2, '#ffffff');
  ctx.restore();
}

export function drawGift(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(255,90,110,0.8)';
  ctx.shadowBlur = s * 0.4;
  const w = s * 1.2;
  const h = s * 0.95;
  const x = cx - w / 2;
  const y = cy - h / 2 + s * 0.15;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#ff5a6a');
  g.addColorStop(1, '#b3122c');
  ctx.fillStyle = g;
  roundRect(ctx, x, y, w, h, s * 0.1);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#c4202f';
  ctx.fillRect(x - s * 0.06, y - s * 0.02, w + s * 0.12, s * 0.26);
  ctx.fillStyle = '#ffd34d';
  ctx.fillRect(cx - s * 0.1, y - s * 0.02, s * 0.2, h + s * 0.02);
  ctx.fillRect(x - s * 0.06, y + s * 0.06, w + s * 0.12, s * 0.1);
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.22, y - s * 0.16, s * 0.24, s * 0.14, -0.5, 0, TAU);
  ctx.ellipse(cx + s * 0.22, y - s * 0.16, s * 0.24, s * 0.14, 0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffeaa0';
  ctx.beginPath();
  ctx.arc(cx, y - s * 0.08, s * 0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
}
