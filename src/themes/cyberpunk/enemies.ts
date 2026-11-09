import type { EnemyKind, MaybeDir } from '../../game/types';
import { NEON, TAU, glow, lw, neon, noGlow, poly, rgba, shade, type Ctx } from './shared';

/** Each unit has its own neon colour so they stay distinct from each other and from the player. */
export const ENEMY_COLORS: Record<EnemyKind, string> = {
  yeti: NEON.red,
  wisp: NEON.lime,
  goblin: NEON.amber,
  elf: NEON.magenta,
};

function hull(ctx: Ctx, color: string, cy: number, r: number) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, shade(color, -0.35));
  g.addColorStop(0.5, shade(color, -0.68));
  g.addColorStop(1, shade(color, -0.88));
  return g;
}

/** Fill the current-path-producing `trace` with a glowing hull, then outline it in neon. */
function body(ctx: Ctx, trace: () => void, color: string, cy: number, r: number) {
  ctx.save();
  glow(ctx, color, r * 0.7);
  trace();
  ctx.fillStyle = hull(ctx, color, cy, r);
  ctx.fill();
  ctx.restore();
  neon(ctx, trace, color, r * 0.11, '#ffffff', r * 0.5);
}

/** Heavy enforcer robot: boxy chassis, shoulder pads, visor band, tracked feet. */
function drawEnforcer(ctx: Ctx, cx: number, cy: number, r: number, frame: number) {
  const c = ENEMY_COLORS.yeti;
  const bob = frame ? r * 0.04 : 0;
  // Treads
  for (const s of [-1, 1]) {
    const x = cx + s * r * 0.48 - r * 0.3;
    ctx.fillStyle = '#14101e';
    ctx.beginPath();
    ctx.roundRect(x, cy + r * 0.55, r * 0.6, r * 0.42, r * 0.12);
    ctx.fill();
    ctx.strokeStyle = rgba(c, 0.85);
    ctx.lineWidth = lw(r * 0.06, 0.6);
    ctx.stroke();
    ctx.fillStyle = rgba(c, 0.7);
    for (let k = 0; k < 3; k++) ctx.fillRect(x + r * (0.08 + k * 0.18 + (frame ? 0.09 : 0)), cy + r * 0.68, lw(r * 0.06, 0.6), r * 0.18);
  }
  // Shoulder pads
  for (const s of [-1, 1]) {
    const trace = () =>
      poly(ctx, [
        [cx + s * r * 0.7, cy - r * 0.75 + bob],
        [cx + s * r * 1.22, cy - r * 0.55 + bob],
        [cx + s * r * 1.22, cy + r * 0.05 + bob],
        [cx + s * r * 0.7, cy + r * 0.2 + bob],
      ]);
    body(ctx, trace, c, cy, r);
  }
  // Antenna with LED
  ctx.strokeStyle = '#8a8fa8';
  ctx.lineWidth = lw(r * 0.07, 0.6);
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.35, cy - r * 0.95 + bob);
  ctx.lineTo(cx + r * 0.5, cy - r * 1.4 + bob);
  ctx.stroke();
  ctx.save();
  glow(ctx, c, r * (frame ? 0.9 : 0.3));
  ctx.fillStyle = frame ? '#ffffff' : c;
  ctx.beginPath();
  ctx.arc(cx + r * 0.5, cy - r * 1.42 + bob, r * 0.12, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Chassis
  const chassis = () => {
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.86, cy - r * 1.0 + bob, r * 1.72, r * 1.62, [r * 0.42, r * 0.42, r * 0.14, r * 0.14]);
  };
  body(ctx, chassis, c, cy, r);
  // Visor band (eyes overlay sits on it)
  ctx.fillStyle = '#05020c';
  ctx.beginPath();
  ctx.roundRect(cx - r * 0.72, cy - r * 0.44 + bob, r * 1.44, r * 0.5, r * 0.12);
  ctx.fill();
  ctx.strokeStyle = rgba(c, 0.9);
  ctx.lineWidth = lw(r * 0.05, 0.5);
  ctx.stroke();
  // Grille
  ctx.fillStyle = rgba(c, 0.75);
  for (let k = -2; k <= 2; k++) ctx.fillRect(cx + k * r * 0.2 - r * 0.04, cy + r * 0.2 + bob, lw(r * 0.08, 0.6), r * 0.26);
  // Hazard chevron on the brow
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.25, cy - r * 0.78 + bob);
  ctx.lineTo(cx, cy - r * 0.62 + bob);
  ctx.lineTo(cx + r * 0.25, cy - r * 0.78 + bob);
  ctx.stroke();
}

/** Quad-rotor drone with twin rotor arms and a downward thruster. */
function drawDrone(ctx: Ctx, cx: number, cy: number, r: number, frame: number) {
  const c = ENEMY_COLORS.wisp;
  const y = cy + (frame ? -r * 0.06 : r * 0.04);
  // Thruster cone
  const flame = r * (frame ? 0.9 : 0.6);
  const g = ctx.createLinearGradient(0, y + r * 0.5, 0, y + r * 0.5 + flame);
  g.addColorStop(0, rgba(c, 0.85));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g;
  poly(ctx, [
    [cx - r * 0.28, y + r * 0.5],
    [cx + r * 0.28, y + r * 0.5],
    [cx, y + r * 0.5 + flame],
  ]);
  ctx.fill();
  // Arms + rotors
  for (const s of [-1, 1]) {
    const hx = cx + s * r * 1.12;
    const hy = y - r * 0.82;
    ctx.strokeStyle = '#6d7491';
    ctx.lineWidth = lw(r * 0.12, 0.8);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + s * r * 0.5, y - r * 0.35);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = rgba(c, 0.16);
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.62, r * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(c, 0.6);
    ctx.lineWidth = lw(r * 0.04, 0.5);
    ctx.stroke();
    // Blade blur: two positions alternate to read as spinning.
    neon(
      ctx,
      () => {
        ctx.beginPath();
        const k = frame ? 0.25 : 0.55;
        ctx.moveTo(hx - r * k, hy - r * 0.08);
        ctx.lineTo(hx + r * k, hy + r * 0.08);
      },
      c,
      r * 0.07,
    );
    ctx.fillStyle = '#e8fff4';
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.09, 0, TAU);
    ctx.fill();
  }
  // Hull
  body(
    ctx,
    () => {
      ctx.beginPath();
      ctx.ellipse(cx, y - r * 0.1, r * 0.92, r * 0.72, 0, 0, TAU);
    },
    c,
    cy,
    r,
  );
  // Lens ring + under-lights
  ctx.strokeStyle = rgba(c, 0.55);
  ctx.lineWidth = lw(r * 0.05, 0.5);
  ctx.beginPath();
  ctx.ellipse(cx, y - r * 0.12, r * 0.66, r * 0.42, 0, 0, TAU);
  ctx.stroke();
  ctx.save();
  glow(ctx, c, r * 0.4);
  ctx.fillStyle = '#eafff5';
  for (const dx of [-0.42, 0, 0.42]) {
    ctx.beginPath();
    ctx.arc(cx + dx * r, y + r * 0.42, r * 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Six-legged cyber crawler with a domed carapace and mandibles. */
function drawCrawler(ctx: Ctx, cx: number, cy: number, r: number, frame: number) {
  const c = ENEMY_COLORS.goblin;
  // Legs
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const lift = (k + frame) % 2 ? -r * 0.14 : 0;
      const by = cy + r * (0.05 + k * 0.2);
      const knee: [number, number] = [cx + s * r * (1.08 + k * 0.08), cy - r * (0.38 - k * 0.22) + lift];
      const foot: [number, number] = [cx + s * r * (1.42 - k * 0.06), cy + r * (0.55 + k * 0.18) + lift];
      ctx.strokeStyle = '#3a3346';
      ctx.lineWidth = lw(r * 0.16, 1);
      ctx.beginPath();
      ctx.moveTo(cx + s * r * 0.55, by);
      ctx.lineTo(...knee);
      ctx.lineTo(...foot);
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = lw(r * 0.06, 0.5);
      ctx.stroke();
    }
  }
  ctx.restore();
  // Mandibles
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#e7e2f0';
    poly(ctx, [
      [cx + s * r * 0.12, cy + r * 0.48],
      [cx + s * r * 0.36, cy + r * 0.5],
      [cx + s * r * 0.16, cy + r * 0.9],
    ]);
    ctx.fill();
  }
  // Carapace
  const dome = () => {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.92, cy + r * 0.48);
    ctx.lineTo(cx - r * 0.92, cy + r * 0.12);
    ctx.arc(cx, cy + r * 0.12, r * 0.92, Math.PI, 0);
    ctx.lineTo(cx + r * 0.92, cy + r * 0.48);
    ctx.quadraticCurveTo(cx, cy + r * 0.66, cx - r * 0.92, cy + r * 0.48);
    ctx.closePath();
  };
  body(ctx, dome, c, cy, r);
  // Hazard stripes on the back of the dome
  ctx.save();
  dome();
  ctx.clip();
  ctx.fillStyle = rgba(c, 0.45);
  for (let k = -3; k <= 3; k++) {
    poly(ctx, [
      [cx + k * r * 0.34, cy - r * 0.86],
      [cx + k * r * 0.34 + r * 0.16, cy - r * 0.86],
      [cx + k * r * 0.34 + r * 0.02, cy - r * 0.58],
      [cx + k * r * 0.34 - r * 0.14, cy - r * 0.58],
    ]);
    ctx.fill();
  }
  ctx.fillStyle = rgba(c, 0.8);
  ctx.fillRect(cx - r, cy + r * 0.22, r * 2, lw(r * 0.07, 0.6));
  ctx.restore();
  // Sensor cluster
  ctx.save();
  glow(ctx, '#ff3355', r * 0.4);
  ctx.fillStyle = '#ff6a7f';
  for (const dx of [-0.16, 0.16]) {
    ctx.beginPath();
    ctx.arc(cx + dx * r, cy + r * 0.36, r * 0.07, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Arrow-head hunter mech with horn fins and a pulsing core. */
function drawHunter(ctx: Ctx, cx: number, cy: number, r: number, frame: number) {
  const c = ENEMY_COLORS.elf;
  // Side thruster fins
  for (const s of [-1, 1]) {
    const flick = frame ? r * 0.12 : 0;
    ctx.fillStyle = rgba(NEON.cyan, 0.55);
    poly(ctx, [
      [cx + s * r * 0.92, cy - r * 0.35],
      [cx + s * (r * 1.48 + flick), cy - r * 0.05],
      [cx + s * r * 0.8, cy + r * 0.15],
    ]);
    ctx.fill();
  }
  const shell = () =>
    poly(ctx, [
      [cx - r * 1.08, cy - r * 0.72],
      [cx - r * 0.82, cy - r * 1.42],
      [cx - r * 0.42, cy - r * 0.88],
      [cx + r * 0.42, cy - r * 0.88],
      [cx + r * 0.82, cy - r * 1.42],
      [cx + r * 1.08, cy - r * 0.72],
      [cx + r * 0.12, cy + r * 1.06],
      [cx - r * 0.12, cy + r * 1.06],
    ]);
  body(ctx, shell, c, cy, r);
  // Panel lines
  ctx.strokeStyle = rgba(c, 0.6);
  ctx.lineWidth = lw(r * 0.05, 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.8, cy + r * 0.05);
  ctx.lineTo(cx - r * 0.2, cy + r * 0.12);
  ctx.moveTo(cx + r * 0.8, cy + r * 0.05);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.12);
  ctx.moveTo(cx, cy + r * 0.62);
  ctx.lineTo(cx, cy + r * 0.92);
  ctx.stroke();
  // Pulsing core
  ctx.save();
  glow(ctx, '#ffffff', r * (frame ? 0.9 : 0.5));
  ctx.fillStyle = frame ? '#ffffff' : '#ffc4f2';
  poly(ctx, [
    [cx, cy + r * 0.2],
    [cx + r * 0.18, cy + r * 0.4],
    [cx, cy + r * 0.6],
    [cx - r * 0.18, cy + r * 0.4],
  ]);
  ctx.fill();
  ctx.restore();
}

export function drawCyberEnemy(ctx: Ctx, kind: EnemyKind, cx: number, cy: number, r: number, frame: number) {
  ctx.save();
  if (kind === 'yeti') drawEnforcer(ctx, cx, cy, r, frame);
  else if (kind === 'wisp') drawDrone(ctx, cx, cy, r, frame);
  else if (kind === 'goblin') drawCrawler(ctx, cx, cy, r, frame);
  else drawHunter(ctx, cx, cy, r, frame);
  ctx.restore();
}

/** Generic chassis outline used for the hacked (vulnerable) state. */
function chassisPath(ctx: Ctx, cx: number, cy: number, r: number, frame: number) {
  const top = cy - r * 0.2;
  const bottom = cy + r * 0.85;
  ctx.beginPath();
  ctx.moveTo(cx - r, bottom);
  ctx.lineTo(cx - r, top);
  ctx.lineTo(cx - r * 0.6, cy - r);
  ctx.lineTo(cx + r * 0.6, cy - r);
  ctx.lineTo(cx + r, top);
  ctx.lineTo(cx + r, bottom);
  const teeth = 4;
  const w = (r * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const x0 = cx + r - i * w;
    const up = (i + frame) % 2 ? r * 0.28 : r * 0.12;
    ctx.lineTo(x0 - w / 2, bottom - up);
    ctx.lineTo(x0 - w, bottom);
  }
  ctx.closePath();
}

/** Hacked enemy: a blue wireframe with glitch slices. `flash` is the white/magenta warning frame. */
export function drawCyberHacked(ctx: Ctx, cx: number, cy: number, r: number, frame: number, flash: boolean) {
  const line = flash ? '#ffffff' : NEON.blue;
  const core = flash ? NEON.magenta : '#bfe0ff';
  const face = flash ? NEON.magenta : '#dff0ff';
  ctx.save();
  glow(ctx, line, r * 0.6);
  chassisPath(ctx, cx, cy, r, frame);
  ctx.fillStyle = flash ? 'rgba(255,43,214,0.4)' : 'rgba(18,40,170,0.62)';
  ctx.fill();
  noGlow(ctx);
  // Wireframe mesh
  ctx.save();
  chassisPath(ctx, cx, cy, r, frame);
  ctx.clip();
  ctx.strokeStyle = flash ? 'rgba(255,255,255,0.55)' : 'rgba(80,170,255,0.5)';
  ctx.lineWidth = lw(r * 0.04, 0.5);
  ctx.beginPath();
  for (let k = -2; k <= 2; k++) {
    ctx.moveTo(cx + k * r * 0.4, cy - r);
    ctx.lineTo(cx + k * r * 0.48, cy + r);
  }
  for (let k = 0; k < 4; k++) {
    const y = cy - r * 0.62 + k * r * 0.45;
    ctx.moveTo(cx - r, y);
    ctx.lineTo(cx + r, y);
  }
  ctx.stroke();
  ctx.restore();
  neon(ctx, () => chassisPath(ctx, cx, cy, r, frame), line, r * 0.1, core, r * 0.4);
  // Glitch slices (offset per frame)
  const off = frame ? r * 0.22 : -r * 0.18;
  ctx.fillStyle = rgba(NEON.cyan, flash ? 0.5 : 0.7);
  ctx.fillRect(cx - r * 0.9 + off, cy - r * 0.48, r * 1.3, lw(r * 0.1, 0.8));
  ctx.fillStyle = rgba(NEON.magenta, 0.75);
  ctx.fillRect(cx - r * 0.5 - off, cy + r * 0.5, r * 1.2, lw(r * 0.08, 0.8));
  // Face: square "error" eyes + jagged mouth
  ctx.fillStyle = face;
  for (const s of [-1, 1]) ctx.fillRect(cx + s * r * 0.34 - r * 0.12, cy - r * 0.3, r * 0.24, r * 0.24);
  ctx.strokeStyle = face;
  ctx.lineWidth = lw(r * 0.09, 0.7);
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const x = cx - r * 0.5 + (i * r) / 6;
    const y = cy + r * 0.25 + (i % 2 ? -r * 0.12 : 0);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** LED eyes shared by every unit; drawn alone when an enemy has been hacked and is returning home. */
export function drawCyberEyes(ctx: Ctx, cx: number, cy: number, r: number, dir: MaybeDir) {
  const off: Record<MaybeDir, [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
    none: [0, 0],
  };
  const [ox, oy] = off[dir];
  ctx.save();
  for (const s of [-1, 1]) {
    const ex = cx + s * r * 0.33 + ox * r * 0.06;
    const ey = cy - r * 0.18 + oy * r * 0.06;
    ctx.fillStyle = '#04020a';
    ctx.beginPath();
    ctx.roundRect(ex - r * 0.25, ey - r * 0.19, r * 0.5, r * 0.38, r * 0.1);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = lw(r * 0.05, 0.5);
    ctx.stroke();
    glow(ctx, NEON.cyan, r * 0.45);
    ctx.fillStyle = '#eaffff';
    ctx.beginPath();
    ctx.roundRect(ex + ox * r * 0.1 - r * 0.1, ey + oy * r * 0.07 - r * 0.09, r * 0.2, r * 0.18, r * 0.05);
    ctx.fill();
    noGlow(ctx);
  }
  ctx.restore();
}
