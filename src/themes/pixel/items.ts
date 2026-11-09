import type { ItemKind } from '../types';
import { blit, pixelUnit, type Bitmap, type Palette } from './bitmap';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;

const ITEM_PAL: Palette = {
  y: PAL.yellow,
  l: PAL.cream,
  o: PAL.orange,
  w: PAL.white,
  c: PAL.cyan,
  b: PAL.blue,
  s: PAL.sky,
  r: PAL.red,
  d: PAL.darkRed,
  g: PAL.green,
  k: PAL.darkGreen,
  n: PAL.brown,
};

/** Each item: bitmap plus how many sprite pixels span its frame (sets the scale). */
const ITEMS: Record<ItemKind, { art: Bitmap; cells: number }> = {
  // Regular pellet: a small gold coin.
  snowflake: {
    cells: 12,
    art: [
      '.yyy.', //
      'ylyyo',
      'ylyyo',
      'yyyyo',
      '.ooo.',
    ],
  },
  // Power item: a big energy sphere with sparkles.
  crystal: {
    cells: 16,
    art: [
      'w..........w',
      '....bbbb....',
      '...bccccb...',
      '..bcwwcccb..',
      '.bcwwcccccb.',
      '.bcwcccccsb.',
      '.bccccccssb.',
      '.bcccccsssb.',
      '..bccsssbb..',
      '...bbbbbb...',
      '............',
      'w..........w',
    ],
  },
  star: {
    cells: 17,
    art: [
      '.....y.....',
      '....yyy....',
      '....yly....',
      '...yylyy...',
      'yyyyyllyyyy',
      '.yyyyyyyyo.',
      '..yyyyyyo..',
      '...yyyyy...',
      '..yyyoyyy..',
      '..yyo.oyy..',
      '.yyo...oyo.',
      '.oo.....oo.',
    ],
  },
  // Turbo bonus: an original pixel cherry pair.
  gift: {
    cells: 18,
    art: [
      '........kgg.',
      '.......kgggg',
      '......kk.gg.',
      '.....k..k...',
      '....k....k..',
      '...k.....k..',
      '..k......k..',
      '.rrr....rrr.',
      'rrwrr..rwrrr',
      'rwrrr..rrrrr',
      'rrrrd..rrrrd',
      'rrrdd..rrrdd',
      '.dd.....dd..',
    ],
  },
};

export function drawPixelItem(ctx: Ctx, kind: ItemKind, cx: number, cy: number, size: number) {
  const it = ITEMS[kind];
  blit(ctx, it.art, ITEM_PAL, cx, cy, pixelUnit(ctx, size, it.cells));
}

const SPARK: Bitmap = ['.w.', 'www', '.w.'];

export function drawPixelParticle(ctx: Ctx, kind: 'spark' | 'ambient', cx: number, cy: number, size: number) {
  if (kind === 'spark') blit(ctx, SPARK, { w: '#ffffff' }, cx, cy, pixelUnit(ctx, size, 8));
  else blit(ctx, ['ww', 'ww'], { w: '#ffffff' }, cx, cy, pixelUnit(ctx, size, 8));
}
