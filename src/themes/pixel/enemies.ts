import type { EnemyKind, MaybeDir } from '../../game/types';
import { blit, pixelUnit, type Bitmap, type Palette } from './bitmap';
import { PAL } from './palette';

type Ctx = CanvasRenderingContext2D;

/**
 * Every monster is a 13×13 bitmap with two frames and a distinct silhouette.
 * The shared eye overlay sits on rows 3..6, so each body keeps that band solid.
 */
const SIZE = 13;

interface Monster {
  frames: [Bitmap, Bitmap];
  pal: Palette;
}

const MONSTERS: Record<EnemyKind, Monster> = {
  // Horned blob with fangs and a rippling hem.
  yeti: {
    pal: { x: PAL.red, h: PAL.pink, d: PAL.darkRed, w: PAL.white, k: PAL.black },
    frames: [
      [
        '.x.........x.',
        '.xx..xxx..xx.',
        '..xxhxxxxxx..',
        '.xhhxxxxxxxx.',
        '.xhxxxxxxxxx.',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxkkkkkkkkkxx',
        'xxkwxxxxxwkxx',
        'xxxxxxxxxxxdd',
        'xxdxxxdxxxdxd',
        'x...xx.xx...x',
      ],
      [
        '.x.........x.',
        '.xx..xxx..xx.',
        '..xxhxxxxxx..',
        '.xhhxxxxxxxx.',
        '.xhxxxxxxxxx.',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxkkkkkkkkkxx',
        'xxkwxxxxxwkxx',
        'xxxxxxxxxxxdd',
        'xdxxxdxdxxxdx',
        '.xx.x...x.xx.',
      ],
    ],
  },
  // Dome-headed squid with curling tentacles.
  wisp: {
    pal: { x: PAL.pink, h: PAL.white, d: PAL.magenta, w: PAL.white, k: PAL.black },
    frames: [
      [
        '....xxxxx....',
        '..xxhhxxxxx..',
        '.xhhxxxxxxxx.',
        '.xhxxxxxxxxx.',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xdxxdxxxdxxdx',
        '.xdx.xdx.xdx.',
        'xx..xx.xx..xx',
        'x..xx...xx..x',
        '..x.......x..',
      ],
      [
        '....xxxxx....',
        '..xxhhxxxxx..',
        '.xhhxxxxxxxx.',
        '.xhxxxxxxxxx.',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xdxxdxxxdxxdx',
        '.xdx.xdx.xdx.',
        '.xx..x.x..xx.',
        '..xx.x.x.xx..',
        '...x.x.x.x...',
      ],
    ],
  },
  // Crab-like invader snapping its claws.
  goblin: {
    pal: { x: PAL.green, h: PAL.cream, d: PAL.darkGreen, w: PAL.white, k: PAL.black },
    frames: [
      [
        '..x.......x..',
        '...x.....x...',
        '..xxxxxxxxx..',
        '.xxhxxxxxxxx.',
        'xxhxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'xxxxxxxxxxxxx',
        'x.xxkkkkkxx.x',
        'x.xxxxxxxxx.x',
        'x.dd.....dd.x',
        '...dd...dd...',
        '.............',
      ],
      [
        'x.x.......x.x',
        'x..x.....x..x',
        'x.xxxxxxxxx.x',
        'xxxhxxxxxxxxx',
        '.xhxxxxxxxxx.',
        '.xxxxxxxxxxx.',
        '.xxxxxxxxxxx.',
        '.xxxxxxxxxxx.',
        '..xxkkkkkxx..',
        '..xxxxxxxxx..',
        '.dd.d...d.dd.',
        'dd..d...d..dd',
        '.............',
      ],
    ],
  },
  // Big-eared bat flapping its wings.
  elf: {
    pal: { x: PAL.cyan, h: PAL.white, d: PAL.teal, w: PAL.white, k: PAL.black },
    frames: [
      [
        'd..x.....x..d',
        'dd.xx...xx.dd',
        'ddxxxxxxxxxdd',
        'ddxhxxxxxxxdd',
        'ddhxxxxxxxxdd',
        'dxxxxxxxxxxxd',
        '.dxxxxxxxxxd.',
        '.dxxxxxxxxxd.',
        '..xxxxxxxxx..',
        '...xxxxxxx...',
        '...xwxxxwx...',
        '....w...w....',
        '.............',
      ],
      [
        '...x.....x...',
        '...xx...xx...',
        '..xxxxxxxxx..',
        '..xhxxxxxxx..',
        '.dhxxxxxxxxd.',
        'ddxxxxxxxxxdd',
        'ddxxxxxxxxxdd',
        'ddxxxxxxxxxdd',
        'd.dxxxxxxxd.d',
        'd..dxxxxxd..d',
        '...xwxxxwx...',
        '....w...w....',
        '.............',
      ],
    ],
  },
};

const FRIGHT: [Bitmap, Bitmap] = [
  [
    '....xxxxx....',
    '..xxxxxxxxx..',
    '.xxxxxxxxxxx.',
    '.xxxxxxxxxxx.',
    'xxxffxxxffxxx',
    'xxxffxxxffxxx',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    'xxfxfxfxfxfxx',
    'xfxfxfxfxfxfx',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    'xx.xxx.xxx.xx',
  ],
  [
    '....xxxxx....',
    '..xxxxxxxxx..',
    '.xxxxxxxxxxx.',
    '.xxxxxxxxxxx.',
    'xxxffxxxffxxx',
    'xxxffxxxffxxx',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    'xxfxfxfxfxfxx',
    'xfxfxfxfxfxfx',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    'x.xxx.x.xxx.x',
  ],
];
const FRIGHT_PAL: Palette = { x: PAL.blue, f: PAL.peach };
const FLASH_PAL: Palette = { x: PAL.white, f: PAL.red };

/** Pixel unit shared by bodies and eyes so the overlay lines up exactly. */
const unitFor = (ctx: Ctx, r: number) => pixelUnit(ctx, r, 5.6);

export function drawPixelEnemy(ctx: Ctx, kind: EnemyKind, cx: number, cy: number, r: number, frame: number) {
  const m = MONSTERS[kind];
  blit(ctx, m.frames[frame % 2], m.pal, cx, cy, unitFor(ctx, r));
}

export function drawPixelFrightened(ctx: Ctx, cx: number, cy: number, r: number, frame: number, flash: boolean) {
  blit(ctx, FRIGHT[frame % 2], flash ? FLASH_PAL : FRIGHT_PAL, cx, cy, unitFor(ctx, r));
}

const EYE_PAL: Palette = { w: PAL.white, p: PAL.blue };
const PUPIL: Record<MaybeDir, [number, number]> = { none: [1, 1], up: [1, 0], down: [1, 2], left: [0, 1], right: [2, 1] };
const eyeCache = new Map<MaybeDir, string[]>();

function eyes(dir: MaybeDir): string[] {
  const hit = eyeCache.get(dir);
  if (hit) return hit;
  const rows = Array.from({ length: SIZE }, () => new Array<string>(SIZE).fill('.'));
  const [px, py] = PUPIL[dir];
  for (const ex of [1, 8]) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const pupil = x >= px && x < px + 2 && y >= py && y < py + 2;
        rows[3 + y][ex + x] = pupil ? 'p' : 'w';
      }
    }
  }
  const out = rows.map((r) => r.join(''));
  eyeCache.set(dir, out);
  return out;
}

export function drawPixelEyes(ctx: Ctx, cx: number, cy: number, r: number, dir: MaybeDir) {
  blit(ctx, eyes(dir), EYE_PAL, cx, cy, unitFor(ctx, r));
}
