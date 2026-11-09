import type { SkinId } from '../../game/types';
import { blit, Grid, pixelUnit, type Palette } from './bitmap';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;

/** Body is a 13px disc; the grid leaves room above for hats and antlers. */
const W = 17;
const H = 20;
const BX = 2;
const BY = 7;
const BODY = 13;
const ANCHOR_X = BX + BODY / 2;
const ANCHOR_Y = BY + BODY / 2;

interface SkinLook {
  base: string;
  light: string;
  dark: string;
  eye: string;
  /** Extra pixels; body coordinates are 0..12, the grid is offset by (BX, BY). */
  decorate?: (g: Grid, inBody: (x: number, y: number) => boolean) => void;
}

const ACCENTS: Palette = {
  W: PAL.white,
  K: PAL.black,
  R: PAL.red,
  O: PAL.orange,
  G: PAL.green,
  Y: PAL.yellow,
  C: PAL.cyan,
  B: PAL.blue,
  N: PAL.peach,
  S: PAL.silver,
  Z: PAL.slate,
};

const body = (g: Grid, x: number, y: number, ch: string) => g.set(BX + x, BY + y, ch);

const SKINS: Record<SkinId, SkinLook> = {
  classic: { base: PAL.yellow, light: PAL.cream, dark: PAL.orange, eye: PAL.black },
  santa: {
    base: PAL.red,
    light: PAL.pink,
    dark: PAL.darkRed,
    eye: PAL.black,
    decorate(g) {
      // Floppy stocking cap leaning back, white brim and pom-pom.
      g.stamp(0, 3, [
        '......RRRRR....', //
        '..RRRRRRRRRRR..',
        'WRRR..RRRRRRRR.',
        'WW..WWWWWWWWW..',
      ]);
    },
  },
  snowman: {
    base: PAL.white,
    light: PAL.white,
    dark: PAL.silver,
    eye: PAL.black,
    decorate(g, inBody) {
      g.stamp(3, 3, [
        '...SZZZZ...', //
        '...SZZZZ...',
        '...RRRRR...',
        '.SSSSSSSSS.',
        '..ZZZZZZZ..',
      ]);
      body(g, 8, 4, 'O');
      body(g, 9, 4, 'O');
      for (const [x, y] of [[3, 8], [4, 10]]) if (inBody(x, y)) body(g, x, y, 'K');
    },
  },
  gingerbread: {
    base: PAL.tan,
    light: PAL.peach,
    dark: PAL.brown,
    eye: PAL.darkBrown,
    decorate(g, inBody) {
      // Zigzag icing band and two gumdrop buttons.
      for (let x = 0; x < BODY; x++) {
        if (inBody(x, 9 + (x % 2))) body(g, x, 9 + (x % 2), 'W');
      }
      for (const [x, y] of [[1, 5], [3, 1], [6, 0]]) if (inBody(x, y)) body(g, x, y, 'W');
      if (inBody(3, 6)) body(g, 3, 6, 'R');
      if (inBody(5, 7)) body(g, 5, 7, 'G');
    },
  },
  reindeer: {
    base: PAL.brown,
    light: PAL.tan,
    dark: PAL.darkBrown,
    eye: PAL.black,
    decorate(g) {
      g.stamp(2, 3, [
        'N..N.....N..N', //
        '.N.N.....N.N.',
        '..NN.....NN..',
        '...N.....N...',
        '...N.....N...',
      ]);
      body(g, 10, 3, 'R');
      body(g, 11, 3, 'R');
      body(g, 11, 2, 'W');
    },
  },
  ice: {
    base: PAL.cyan,
    light: PAL.white,
    dark: PAL.blue,
    eye: PAL.navy,
    decorate(g, inBody) {
      g.stamp(4, 3, [
        '.W..W..W.', //
        '.C.CWC.C.',
        '.CCCCCCC.',
        '..BBBBB..',
      ]);
      // Crystal sheen: two diagonal glints across the body.
      for (let y = 0; y < BODY; y++) {
        for (const d of [5, 9]) {
          const x = d - y;
          if (y > 1 && inBody(x, y) && g.get(BX + x, BY + y) === 'b') body(g, x, y, 'l');
        }
      }
    },
  },
};

const cache = new Map<string, string[]>();

function build(skin: SkinId, frame: number): string[] {
  const key = `${skin}:${frame}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const look = SKINS[skin];
  const g = new Grid(W, H);
  const angle = (frame / 4) * 0.8;
  const slope = Math.tan(angle);
  const inBody = (x: number, y: number) => {
    const dx = x - 6;
    const dy = y - 6;
    if (x < 0 || y < 0 || x >= BODY || y >= BODY || dx * dx + dy * dy > 42.25) return false;
    return !(frame > 0 && dx >= 1 && Math.abs(dy) < dx * slope + 0.4);
  };
  for (let y = 0; y < BODY; y++) {
    for (let x = 0; x < BODY; x++) {
      if (!inBody(x, y)) continue;
      const dx = x - 6;
      const dy = y - 6;
      const rim = Math.sqrt(dx * dx + dy * dy) >= 5.2 && dy >= 2;
      body(g, x, y, rim ? 'd' : 'b');
    }
  }
  for (const [x, y] of [[3, 2], [2, 3], [4, 1]]) if (inBody(x, y)) body(g, x, y, 'l');
  look.decorate?.(g, inBody);
  for (const y of [2, 3]) if (inBody(7, y)) body(g, 7, y, 'e');
  const rows = g.rows();
  cache.set(key, rows);
  return rows;
}

const palettes = new Map<SkinId, Palette>();
function paletteFor(skin: SkinId): Palette {
  let p = palettes.get(skin);
  if (!p) {
    const s = SKINS[skin];
    p = { ...ACCENTS, b: s.base, l: s.light, d: s.dark, e: s.eye };
    palettes.set(skin, p);
  }
  return p;
}

/** Five mouth frames, 0 = closed .. 4 = wide; all crisp integer pixels. */
export function drawPixelPlayer(ctx: Ctx, skin: SkinId, cx: number, cy: number, r: number, mouth: number) {
  const frame = Math.round(Math.max(0, Math.min(1, mouth)) * 4);
  const unit = pixelUnit(ctx, r, 6.5);
  blit(ctx, build(skin, frame), paletteFor(skin), cx, cy, unit, ANCHOR_X, ANCHOR_Y);
}
