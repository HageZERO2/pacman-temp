import type { EnemyKind, MaybeDir } from '../../game/types';
import { block, Grid, hash, speckle, type Ctx } from './px';

/** Mobs share a 16-texel grid centred on (cx, cy); the face band (rows 4–7) stays clear for the eye overlay. */
function grid(ctx: Ctx, cx: number, cy: number, r: number) {
  const u = r / 8;
  return new Grid(ctx, cx - 8 * u, cy - 8 * u, u);
}

export function drawMob(ctx: Ctx, kind: EnemyKind, cx: number, cy: number, r: number, frame: number) {
  const g = grid(ctx, cx, cy, r);
  const f = frame % 2;
  switch (kind) {
    case 'yeti':
      golem(g, f);
      break;
    case 'wisp':
      jelly(g, f);
      break;
    case 'goblin':
      ember(g, f);
      break;
    case 'elf':
      voidling(g, f);
      break;
  }
}

/** Mossy stone golem: broad cobble torso, swinging boulder fists, stomping feet. */
function golem(g: Grid, f: number) {
  const o = '#1b1d22';
  // Fists swing opposite each other.
  const la = f ? 1 : -1;
  for (const [x, dy] of [[-3, la], [15, -la]] as const) {
    g.rect(x - 1, 7 + dy, 6, 6, o);
    g.rect(x, 8 + dy, 4, 4, '#7d828c');
    g.rect(x, 8 + dy, 4, 1, '#a7acb5');
    g.dot(x + 1, 10 + dy, '#5a5f68');
  }
  // Feet.
  for (const [x, lift] of [[3, f], [9, 1 - f]] as const) {
    g.rect(x - 1, 13 - lift, 6, 4, o);
    g.rect(x, 14 - lift, 4, 2, '#5c616b');
  }
  block(g, 1, 3, 14, 11, 2, { top: '#62b23f', front: '#8a8f98', side: '#8a8f98', outline: o });
  speckle(g, 1, 3, 14, 11, '#a9aeb7', '#666b75', 11, 0.34);
  // Cobble seams.
  for (const [x, y, w] of [[1, 8, 4], [7, 9, 5], [3, 12, 6], [11, 12, 4]] as const) g.rect(x, y, w, 1, '#5d626c');
  // Moss on the crown dripping down the face.
  g.rect(1, 1, 14, 1, '#86d95a');
  for (let i = 0; i < 14; i++) {
    const n = hash(i, 3, 5);
    if (n > 0.45) g.dot(1 + i, 3, '#4f9a31');
    if (n > 0.8) g.dot(1 + i, 4, '#4f9a31');
  }
  g.dot(4, 1, '#ff6fa0');
  g.dot(11, 2, '#ffe36b');
  // Craggy mouth.
  g.rect(5, 10, 6, 2, '#24262c');
  g.dot(6, 10, '#c9ccd2');
  g.dot(9, 10, '#c9ccd2');
}

/** Wobbly aqua jelly cube; squashes and stretches between frames. */
function jelly(g: Grid, f: number) {
  const o = '#0c4a52';
  const [x, y, w, h] = f ? [0, 5, 16, 11] : [1, 3, 14, 13];
  g.rect(x - 1, y - 3, w + 2, h + 4, o);
  g.rect(x, y - 2, w, 2, 'rgba(190,255,245,0.92)');
  g.rect(x, y, w, h, 'rgba(70,214,205,0.82)');
  g.rect(x, y + h - 3, w, 3, 'rgba(36,160,170,0.9)');
  // Bubbles and inner core seen through the gel.
  g.rect(x + w / 2 - 3, y + h - 7, 6, 4, 'rgba(18,110,125,0.75)');
  for (const [bx, by] of [[2, 2], [w - 3, 4], [3, h - 3], [w - 5, h - 2]] as const) g.dot(x + bx, y + by, 'rgba(230,255,252,0.9)');
  g.rect(x, y - 2, 2, 1, '#ffffff');
  g.rect(x, y - 2, 1, 4, '#ffffff');
  // Drip feet.
  for (const dx of f ? [2, 7, 12] : [3, 10]) g.rect(x + dx, y + h, 2, 1, 'rgba(70,214,205,0.82)');
  g.rect(6, y + 6 - (f ? 0 : 1), 4, 1, '#0c4a52');
}

/** Charred ember cube with glowing seams; frame 1 springs its lid open on a lava core. */
function ember(g: Grid, f: number) {
  const o = '#120404';
  const gap = f ? 2 : 0;
  const lo = 10 + gap;
  // Molten core between the halves.
  g.rect(1, 7, 14, 4 + gap, '#ff9a1f');
  g.rect(3, 8, 10, 2 + gap, '#ffe066');
  const half = (y: number, h: number, seed: number, cap: boolean) => {
    block(g, 0, y, 16, h, cap ? 2 : 0, { top: '#6a3226', front: '#3a1814', side: '#3a1814', outline: o });
    speckle(g, 0, y, 16, h, '#5c2a22', '#220a08', seed, 0.3);
    for (let i = 0; i < 16; i++) if (hash(i, y, seed) > 0.72) g.dot(i, y + h - 1, '#ff7a1a');
  };
  half(3, 5, 3, true);
  half(lo, 5, 4, false);
  // Lava cracks.
  for (const [x, y, w, hgt] of [[2, 2, 3, 1], [4, 1, 1, 2], [11, 1, 1, 3], [12, 3, 3, 1], [8, 4, 1, 1]] as const) g.rect(x, lo + y, w, hgt, '#ff8a1f');
  g.dot(12, lo + 3, '#ffe066');
  g.rect(1, 1, 2, 1, '#ff7a1a');
  g.rect(12, 2, 3, 1, '#ff7a1a');
  // Grin on the lower half.
  g.rect(5, lo, 6, 1, '#ffe066');
}

/** Void block: violet crystal body with three orbiting shards and dangling feelers. */
function voidling(g: Grid, f: number) {
  const o = '#0f0520';
  for (const [x, y] of (f ? [[2, -3], [7, -5], [12, -2]] : [[2, -2], [7, -4], [12, -3]]) as [number, number][]) {
    g.rect(x - 1, y - 1, 4, 4, o);
    g.rect(x, y, 2, 2, '#e07bff');
    g.dot(x, y, '#ffd6ff');
  }
  for (const [x, len] of (f ? [[3, 3], [7, 2], [11, 3]] : [[3, 2], [7, 3], [11, 2]]) as [number, number][]) {
    g.rect(x - 1, 13, 4, len + 1, o);
    g.rect(x, 13, 2, len, '#5d2a9c');
    g.dot(x, 12 + len, '#b46bff');
  }
  block(g, 1, 3, 14, 10, 2, { top: '#9a5bea', front: '#5b2a9e', side: '#5b2a9e', outline: o });
  speckle(g, 1, 3, 14, 10, '#7a42c8', '#3d1873', 21, 0.3);
  g.rect(1, 1, 14, 1, '#c79bff');
  for (const [x, y] of [[2, 9], [12, 4], [10, 11], [4, 11]] as const) g.dot(x, y, '#ff7bf0');
  g.rect(5, 10, 6, 1, '#1a0833');
  g.dot(5, 9, '#1a0833');
  g.dot(10, 9, '#1a0833');
}

/** Square eyes; drawn on their own so eaten mobs can float home as a pair of eyes. */
export function drawMobEyes(ctx: Ctx, cx: number, cy: number, r: number, dir: MaybeDir) {
  const g = grid(ctx, cx, cy, r);
  const off: Record<MaybeDir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], none: [0, 0] };
  const [ox, oy] = off[dir];
  for (const x of [2, 10]) {
    g.rect(x - 1, 3, 6, 6, '#14081f');
    g.rect(x, 4, 4, 4, '#ffffff');
    g.rect(x + 1 + ox, 5 + oy, 2, 2, '#1d1240');
  }
}

/** Stunned mob frozen into a blue block. `flash` = white warning frame before recovery. */
export function drawStunned(ctx: Ctx, cx: number, cy: number, r: number, frame: number, flash: boolean) {
  const g = grid(ctx, cx, cy, r);
  const c = flash
    ? { top: '#ffffff', front: '#e6ecf5', side: '#e6ecf5', outline: '#5a6478', light: '#ffffff', dark: '#c3ccdb', face: '#e0244a' }
    : { top: '#8fb6ff', front: '#3557d6', side: '#3557d6', outline: '#0a1240', light: '#5d7ff0', dark: '#22379c', face: '#e9f1ff' };
  const bob = frame % 2;
  block(g, 1, 3 + bob, 14, 12, 2, c);
  speckle(g, 1, 3 + bob, 14, 12, c.light, c.dark, 41, 0.22);
  g.rect(1, 3 + bob, 14, 1, c.light);
  // Swirly dizzy eyes.
  for (const x of [3, 9]) {
    const y = 5 + bob;
    g.rect(x, y, 4, 1, c.face);
    g.rect(x + 3, y, 1, 4, c.face);
    g.rect(x, y + 3, 4, 1, c.face);
    g.rect(x, y + 1, 1, 2, c.face);
    g.dot(x + 1, y + 1, c.face);
  }
  // Wobbly mouth.
  for (let i = 0; i < 8; i++) g.dot(4 + i, 11 + bob + (i % 2), c.face);
  // Orbiting stars.
  const star = flash ? '#ff5a7a' : '#ffe66b';
  const spots = frame % 2 ? [[0, -1], [12, 0]] : [[4, 0], [14, -2]];
  for (const [x, y] of spots) {
    g.dot(x + 1, y, star);
    g.rect(x, y + 1, 3, 1, star);
    g.dot(x + 1, y + 2, star);
  }
}
