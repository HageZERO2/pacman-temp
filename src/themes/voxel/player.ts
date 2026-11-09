import type { SkinId } from '../../game/types';
import { cube, Grid, hash, speckle, type Ctx, type CubeColors } from './px';

interface SkinStyle extends CubeColors {
  outline: string;
  light: string;
  dark: string;
  eye: string;
  /** Translucent body (ice). */
  alpha?: number;
}

const SKINS: Record<SkinId, SkinStyle> = {
  classic: { top: '#ffe98a', front: '#f5b81c', side: '#b9790a', outline: '#3d2300', light: '#fff4bf', dark: '#d8930e', eye: '#2a1600' },
  santa: { top: '#ff6a6a', front: '#d9262f', side: '#8e1019', outline: '#330409', light: '#ff8f86', dark: '#b01822', eye: '#250306' },
  snowman: { top: '#ffffff', front: '#eaf3fb', side: '#b5c8dc', outline: '#2a3446', light: '#ffffff', dark: '#cfdeec', eye: '#1b1b22' },
  gingerbread: { top: '#e09a57', front: '#bd6d30', side: '#7a3f17', outline: '#2e1504', light: '#d4874a', dark: '#a25a24', eye: '#2e1504' },
  reindeer: { top: '#b67c4a', front: '#8c5730', side: '#5a3519', outline: '#24130a', light: '#a46a3e', dark: '#744523', eye: '#1a0d05' },
  ice: { top: 'rgba(225,250,255,0.92)', front: 'rgba(120,214,245,0.78)', side: 'rgba(52,140,205,0.85)', outline: '#0d3a63', light: 'rgba(255,255,255,0.85)', dark: 'rgba(70,170,225,0.7)', eye: '#0b2c55' },
};

// Body layout in texels on a 16-wide grid: front face 13×13 with 3 texels of depth.
const FX = 0;
const FW = 13;
const FH = 13;
const D = 3;

/**
 * Cube hero facing right. `mouth` 0..1 opens a slot that cuts through the front
 * and side faces; open frames hop one texel for a blocky gait.
 */
export function drawPlayer(ctx: Ctx, skin: SkinId, cx: number, cy: number, r: number, mouth: number) {
  const m = Math.max(0, Math.min(1, mouth));
  const u = r / 8;
  const g = new Grid(ctx, cx - 8 * u, cy - 8 * u, u);
  const st = SKINS[skin];
  const fy = 3 - (m > 0.6 ? 1 : 0);

  // Back accessories first so the body overlaps them.
  if (skin === 'reindeer') antlers(g, fy);

  cube(g, FX, fy, FW, FH, D, st);
  if (skin === 'ice') iceDetails(g, fy);
  else {
    speckle(g, FX + 1, fy + 1, FW - 2, FH - 2, st.light, st.dark, skinSeed(skin));
    // Bevel: lit top-left rim, shaded bottom row.
    g.rect(FX, fy, FW, 1, st.light);
    g.rect(FX, fy, 1, FH, st.light);
    g.rect(FX, fy + FH - 1, FW, 1, st.dark);
  }

  switch (skin) {
    case 'classic':
      for (const [x, y] of [[3, 4], [4, 3], [10, 10], [2, 11]]) g.dot(x, fy + y, '#ffffff');
      // Sprout on the lid.
      g.rect(6, fy - 5, 1, 3, '#3f8f2a');
      g.rect(4, fy - 6, 2, 1, '#67c94a');
      g.rect(7, fy - 7, 2, 2, '#67c94a');
      g.dot(5, fy - 6, '#8fe86a');
      break;
    case 'santa':
      santaCap(g, fy);
      g.rect(1, fy + 9, 4, 1, '#ffffff');
      break;
    case 'snowman':
      for (const [x, y] of [[3, 5], [2, 9], [4, 12]]) g.rect(x, fy + y, 1, 1, '#22222c');
      topHat(g, fy);
      break;
    case 'gingerbread':
      icing(g, fy);
      g.rect(3, fy + 6, 2, 2, '#ff3b5c');
      g.dot(3, fy + 6, '#ffb3c2');
      g.rect(3, fy + 10, 2, 2, '#3fd46a');
      g.dot(3, fy + 10, '#b8ffcb');
      break;
    case 'reindeer':
      g.rect(7, fy + 7, 6, 6, '#e7c49a');
      g.rect(7, fy + 12, 6, 1, '#c9a074');
      break;
    case 'ice':
      break;
  }

  face(g, skin, st, fy, m);

  if (skin === 'reindeer') {
    // Glowing nose sits on the corner between front and side.
    g.rect(11, fy + 6, 4, 4, 'rgba(255,60,60,0.35)');
    g.rect(12, fy + 7, 3, 2, '#ff2a2a');
    g.dot(12, fy + 7, '#ffb0b0');
  }
  if (skin === 'snowman') {
    g.rect(12, fy + 6, 3, 2, '#ff8a1f');
    g.rect(15, fy + 6, 2, 1, '#ff8a1f');
    g.rect(12, fy + 7, 3, 1, '#d4610a');
  }
}

function skinSeed(skin: SkinId) {
  return skin.length * 31 + skin.charCodeAt(0);
}

function face(g: Grid, skin: SkinId, st: SkinStyle, fy: number, m: number) {
  // Eye: white texel with a pupil looking forward (right).
  const ey = fy + (skin === 'santa' ? 5 : 4);
  g.rect(8, ey, 2, 2, '#ffffff');
  g.rect(9, ey, 1, 2, st.eye);
  if (skin === 'gingerbread') g.rect(8, ey - 1, 2, 1, '#fff6ea');

  const open = Math.round(m * 4);
  const mid = fy + 9;
  const mouth = '#2b0b10';
  if (open === 0) {
    g.rect(8, mid, 5, 1, mouth);
    for (let k = 1; k <= D; k++) g.dot(12 + k, mid - k, mouth);
    return;
  }
  const top = mid - Math.floor(open / 2);
  const rows = open + 1;
  const x0 = 10 - open;
  g.rect(x0, top, FW - x0, rows, mouth);
  for (let k = 1; k <= D; k++) g.rect(12 + k, top - k, 1, rows, mouth);
  if (open >= 2) {
    g.rect(x0 + 1, top + rows - 1, FW - x0 - 2, 1, '#e8566c');
    g.rect(x0, top, 1, 1, '#ffffff');
    g.rect(x0 + 2, top, 1, 1, '#ffffff');
  }
}

function santaCap(g: Grid, fy: number) {
  const red: CubeColors = { top: '#ff5a62', front: '#d9262f', side: '#8e1019', outline: '#330409' };
  cube(g, 2, fy - 3, 9, 3, 2, red);
  g.rect(-1, fy - 6, 4, 2, '#330409');
  g.rect(0, fy - 5, 4, 2, '#d9262f');
  g.rect(-3, fy - 8, 3, 3, '#330409');
  g.rect(-2, fy - 7, 2, 2, '#ffffff');
  // Fur trim wraps the brim.
  g.rect(-1, fy - 1, FW + 2, 3, '#330409');
  g.rect(0, fy, FW, 1, '#ffffff');
  g.rect(0, fy + 1, FW, 1, '#dfe9f2');
  for (let k = 1; k <= D; k++) g.rect(12 + k, fy - k, 1, 2, k === D ? '#c9d6e2' : '#ffffff');
  for (let k = 1; k <= D; k++) g.rect(k, fy - k, FW, 1, '#ffffff');
}

function topHat(g: Grid, fy: number) {
  const hat: CubeColors = { top: '#3a3a48', front: '#1d1d26', side: '#0e0e14', outline: '#000000' };
  cube(g, 1, fy - 1, 13, 1, 3, hat);
  cube(g, 4, fy - 7, 7, 6, 2, hat);
  g.rect(4, fy - 3, 7, 1, '#d62a3a');
  g.dot(5, fy - 6, '#5a5a6a');
}

function icing(g: Grid, fy: number) {
  const c = '#fff6ea';
  for (let i = 1; i < FW - 1; i++) {
    g.dot(i, fy + 1 + (i % 2), c);
    g.dot(i, fy + FH - 2 - (i % 2), c);
  }
  for (let j = 3; j < FH - 3; j++) g.dot(1 + (j % 2), fy + j, c);
}

function antlers(g: Grid, fy: number) {
  const c = '#e9d3a5';
  const o = '#4a3218';
  for (const [x, lean] of [[3, -1], [9, 1]] as const) {
    g.rect(x - 1, fy - 7, 3, 7, o);
    g.rect(x, fy - 6, 1, 6, c);
    const bx = x + lean * 2;
    g.rect(Math.min(x, bx) - 1, fy - 5, 4, 3, o);
    g.rect(Math.min(x, bx), fy - 4, 3, 1, c);
    g.rect(bx - 1, fy - 8, 3, 5, o);
    g.rect(bx, fy - 7, 1, 4, c);
    g.dot(x, fy - 7, c);
  }
}

function iceDetails(g: Grid, fy: number) {
  // Frosty rim and diagonal glints suggest a clear block.
  g.rect(FX, fy, FW, 1, 'rgba(255,255,255,0.9)');
  g.rect(FX, fy, 1, FH, 'rgba(255,255,255,0.75)');
  for (let i = 0; i < 4; i++) g.dot(2 + i, fy + 6 - i, 'rgba(255,255,255,0.85)');
  for (let i = 0; i < 3; i++) g.dot(3 + i, fy + 10 - i, 'rgba(255,255,255,0.6)');
  g.rect(FX + 1, fy + FH - 2, FW - 2, 1, 'rgba(40,120,190,0.6)');
  for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) if (hash(i, j, 77) > 0.94) g.dot(FX + i, fy + j, 'rgba(255,255,255,0.7)');
}

export { hash };
