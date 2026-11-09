import type { Maze } from '../../game/maze';
import type { MazeDrawOptions } from '../types';
import { Grid, hash, type Ctx } from './px';

/** Texels per tile edge. Rounded edges keep blocks crisp at any tile size. */
const N = 8;
/** Rows of a wall tile used by the front face when the tile below is open. */
const FRONT = 3;

/** Texel colour at global texel (gx, gy). */
type Tex = (gx: number, gy: number) => string;

interface BlockMat {
  top: Tex;
  front: Tex;
  /** Lit rim on exposed top edges. */
  rim: string;
  /** Darkest row at the foot of the front face. */
  foot: string;
}

export interface VoxelLevelStyle {
  background: [string, string];
  floor: Tex;
  house: Tex;
  void: Tex;
  gate: { face: string; dark: string; outline: string };
  /** Wall material for a tile. */
  wall: (maze: Maze, x: number, y: number) => BlockMat;
  /** Fine decoration drawn on top of everything (flowers, torches, embers). */
  decorate?: (g: Grid, maze: Maze, isWall: (x: number, y: number) => boolean) => void;
  /** Light pools on the floor, drawn before walls. */
  lights?: (maze: Maze, isWall: (x: number, y: number) => boolean) => { x: number; y: number; color: string }[];
}

const pick = (list: readonly string[], n: number) => list[Math.min(list.length - 1, Math.floor(n * list.length))];

// ---------------------------------------------------------------- materials

function noise(colors: readonly string[], seed: number): Tex {
  return (gx, gy) => pick(colors, hash(gx, gy, seed));
}

/** Irregular stones: cells of ~3 texels with dark seams. */
function cobble(colors: readonly string[], seam: string, seed: number): Tex {
  return (gx, gy) => {
    const row = Math.floor(gy / 3);
    const shift = row % 2 ? 1 : 0;
    const col = Math.floor((gx + shift + (hash(row, 0, seed) > 0.5 ? 1 : 0)) / 3);
    const lx = (gx + shift + (hash(row, 0, seed) > 0.5 ? 1 : 0)) % 3;
    if (gy % 3 === 2 && hash(col, row, seed + 1) > 0.25) return seam;
    if (lx === 2 && hash(col, row, seed + 2) > 0.35) return seam;
    const base = hash(col, row, seed);
    const n = hash(gx, gy, seed + 3);
    return pick(colors, Math.min(0.999, base * 0.75 + n * 0.25));
  };
}

/** Running-bond bricks `bw` × `bh` texels. */
function bricks(colors: readonly string[], mortar: string, bw: number, bh: number, seed: number): Tex {
  return (gx, gy) => {
    const row = Math.floor(gy / bh);
    const ox = row % 2 ? bw / 2 : 0;
    if (gy % bh === bh - 1) return mortar;
    if ((gx + ox) % bw === bw - 1) return mortar;
    const col = Math.floor((gx + ox) / bw);
    const n = hash(col, row, seed) * 0.7 + hash(gx, gy, seed + 1) * 0.3;
    return pick(colors, n);
  };
}

/** Horizontal planks with staggered end joints. */
function planks(colors: readonly string[], seam: string, seed: number): Tex {
  return (gx, gy) => {
    const row = Math.floor(gy / 3);
    if (gy % 3 === 2) return seam;
    const ox = Math.floor(hash(row, 1, seed) * 8);
    if ((gx + ox) % 8 === 7 && gy % 3 === 0) return seam;
    const n = hash(Math.floor((gx + ox) / 8), row, seed) * 0.6 + hash(gx, gy, seed + 1) * 0.4;
    return pick(colors, n);
  };
}

function withOre(base: Tex, ore: readonly string[], seed: number, chance = 0.14): Tex {
  return (gx, gy) => (hash(gx >> 1, gy >> 1, seed) < chance && hash(gx, gy, seed + 9) > 0.35 ? pick(ore, hash(gx, gy, seed + 5)) : base(gx, gy));
}

const border = (maze: Maze, x: number, y: number) => x === 0 || y === 0 || x === maze.width - 1 || y === maze.height - 1;
const nearHouse = (maze: Maze, x: number, y: number) => {
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const k = maze.kind(x + dx, y + dy);
      if (k === 'house' || k === 'gate') return true;
    }
  return false;
};

// ---- Meadow Blocks: grass and dirt, oak plank pen, mossy cobble rim.
const GRASS: BlockMat = {
  top: noise(['#4c9a32', '#57a83a', '#5fb240', '#68bc46', '#53a236'], 11),
  front: (gx, gy) => {
    const j = ((gy % N) + N) % N;
    if (j === N - FRONT) return hash(gx, gy, 3) > 0.15 ? '#5fb240' : '#4c9a32';
    if (j === N - FRONT + 1 && hash(gx, 1, 4) > 0.55) return '#4c9a32';
    return hash(gx, gy, 5) > 0.93 ? '#9a8f84' : pick(['#6b4529', '#7a5232', '#845a37', '#73492c'], hash(gx, gy, 6));
  },
  rim: '#8bd65e',
  foot: '#3d2615',
};
const OAK: BlockMat = {
  top: planks(['#a8773e', '#b6844a', '#c39256'], '#6b4520', 21),
  front: planks(['#8a5f2e', '#96683a', '#7d5428'], '#4a2e12', 22),
  rim: '#ddb276',
  foot: '#3a230c',
};
const MOSSY: BlockMat = {
  top: withOre(cobble(['#7d8188', '#8c9097', '#9a9ea5', '#70747b'], '#4c5057', 31), ['#5a9a38', '#4c8a2e', '#6aae42'], 32, 0.3),
  front: cobble(['#5d6168', '#6a6e75', '#55595f'], '#33363b', 33),
  rim: '#b7bbc2',
  foot: '#26282c',
};

// ---- Stone Depths: cobble with ore veins, polished bricks, torch-lit slate floor.
const COBBLE: BlockMat = {
  top: cobble(['#7a7d85', '#878a92', '#9598a0', '#6d7078'], '#474a52', 41),
  front: cobble(['#565960', '#5f626a', '#4d5057'], '#2e3036', 42),
  rim: '#b4b7bf',
  foot: '#1f2025',
};
const ORE_COBBLE: BlockMat = {
  ...COBBLE,
  top: withOre(COBBLE.top, ['#2a2b31', '#d98a5a', '#3a6be0', '#e6c26a'], 43, 0.22),
};
const STONE_BRICK: BlockMat = {
  top: bricks(['#9b9ea6', '#a6a9b1', '#8f929a'], '#5a5d65', 4, 3, 44),
  front: bricks(['#6e7179', '#787b83', '#666971'], '#3a3c42', 4, 3, 45),
  rim: '#d0d3da',
  foot: '#26272c',
};

// ---- Magma Forge: scorched bricks with lava veins, blackstone pen with gold trim.
const SCORCHED: BlockMat = {
  top: bricks(['#6a2a2b', '#7a3233', '#5e2426', '#843a36'], '#2a0e10', 4, 2, 51),
  front: bricks(['#43181a', '#4d1d1e', '#3b1416'], '#1a0607', 4, 2, 52),
  rim: '#b8564a',
  foot: '#120304',
};
const VEINED: BlockMat = {
  ...SCORCHED,
  top: withOre(SCORCHED.top, ['#ff8a1f', '#ffb03a', '#ff6a10'], 53, 0.26),
};
const BLACKSTONE: BlockMat = {
  top: (gx, gy) => {
    const j = ((gy % N) + N) % N;
    const i = ((gx % N) + N) % N;
    if ((i === 0 || i === N - 1) && (j === 0 || j === N - 1)) return '#f0c04a';
    return cobble(['#2e2833', '#38313e', '#252029'], '#141016', 54)(gx, gy);
  },
  front: cobble(['#221d26', '#2a242f'], '#0f0b11', 55),
  rim: '#6a5a78',
  foot: '#08060a',
};

export const VOXEL_LEVELS: VoxelLevelStyle[] = [
  {
    background: ['#3a2a1c', '#21170f'],
    floor: (gx, gy) => (hash(gx, gy, 61) > 0.94 ? '#6e6359' : pick(['#3f2c1e', '#463222', '#4d3726', '#3a281b'], hash(gx >> 1, gy, 62))),
    house: planks(['#5c3f22', '#664728', '#53381e'], '#2f1d0c', 63),
    void: (gx, gy) => {
      const wave = (gx + Math.floor(gy / 3) * 2) % 7 === 0 && gy % 3 === 0;
      return wave ? '#7fb6f0' : pick(['#2f62bf', '#3870cc', '#2b58ae'], hash(gx >> 1, gy >> 1, 64));
    },
    gate: { face: '#d6a35a', dark: '#8a5f2e', outline: '#2e1a08' },
    wall: (maze, x, y) => (nearHouse(maze, x, y) ? OAK : border(maze, x, y) ? MOSSY : GRASS),
    decorate: (g, maze, isWall) => {
      for (let y = 0; y < maze.height; y++)
        for (let x = 0; x < maze.width; x++) {
          if (!isWall(x, y) || nearHouse(maze, x, y) || border(maze, x, y)) continue;
          const n = hash(x, y, 70);
          const bx = x * N + 1 + Math.floor(hash(x, y, 71) * 5);
          const by = y * N + 1 + Math.floor(hash(x, y, 72) * 2);
          if (n < 0.16) {
            const petal = n < 0.08 ? '#ff4d5a' : '#ffe14d';
            g.rect(bx, by + 1, 1, 2, '#2f7a1e');
            g.dot(bx, by, petal);
            g.dot(bx - 1, by, petal);
            g.dot(bx + 1, by, petal);
            g.dot(bx, by - 1, petal);
          } else if (n < 0.3) {
            g.dot(bx, by, '#8fe060');
            g.dot(bx + 2, by + 1, '#8fe060');
            g.dot(bx + 1, by + 1, '#3f8a2a');
          }
        }
    },
  },
  {
    background: ['#1e2029', '#121319'],
    floor: (gx, gy) => (gy % N === 0 && hash(gx >> 2, gy, 81) > 0.3 ? '#1a1c23' : pick(['#272a33', '#2c2f39', '#23262e', '#30333d'], hash(gx >> 1, gy >> 1, 82))),
    house: bricks(['#3a3c45', '#43454f'], '#24252b', 4, 3, 83),
    void: (gx, gy) => (hash(gx, gy, 84) > 0.97 ? '#3a3046' : '#0b0b10'),
    gate: { face: '#cfd3db', dark: '#7c818c', outline: '#121318' },
    wall: (maze, x, y) => (nearHouse(maze, x, y) ? STONE_BRICK : hash(x, y, 85) > 0.62 ? ORE_COBBLE : COBBLE),
    lights: (maze, isWall) => torches(maze, isWall).map((t) => ({ ...t, color: 'rgba(255,170,70,0.07)' })),
    decorate: (g, maze, isWall) => {
      for (const t of torches(maze, isWall)) {
        const bx = t.x * N + 3;
        const by = t.y * N + N - FRONT;
        g.rect(bx - 1, by - 2, 4, 5, 'rgba(255,200,90,0.25)');
        g.rect(bx, by, 2, 3, '#7a5228');
        g.rect(bx, by - 1, 2, 1, '#ff8a1f');
        g.rect(bx, by - 2, 2, 1, '#ffe066');
        g.dot(bx, by - 2, '#fffbe0');
      }
    },
  },
  {
    background: ['#1c0d14', '#0e060b'],
    floor: (gx, gy) => {
      const n = hash(gx, gy, 91);
      if (n > 0.985) return '#ff7a1a';
      if (n > 0.95) return '#3c2150';
      return pick(['#160d16', '#1b111b', '#130b13', '#20131f'], hash(gx >> 1, gy >> 1, 92));
    },
    house: cobble(['#241e29', '#2b2430'], '#120e14', 93),
    void: (gx, gy) => {
      const n = hash(gx >> 1, gy >> 1, 94);
      if (hash(gx, gy, 95) > 0.9) return '#ffe066';
      return pick(['#e0480a', '#ff6a10', '#ff8a1f', '#ffa030'], n);
    },
    gate: { face: '#f0c04a', dark: '#a8761a', outline: '#2a1600' },
    wall: (maze, x, y) => (nearHouse(maze, x, y) ? BLACKSTONE : hash(x, y, 96) > 0.7 ? VEINED : SCORCHED),
    lights: (maze) => {
      const out: { x: number; y: number; color: string }[] = [];
      for (let y = 0; y < maze.height; y++)
        for (let x = 0; x < maze.width; x++) if (maze.kind(x, y) === 'void') out.push({ x: x + 0.5, y: y + 0.5, color: 'rgba(255,110,30,0.05)' });
      return out;
    },
  },
];

/** Torches hang on front faces of walls above corridors, spaced out deterministically. */
function torches(maze: Maze, isWall: (x: number, y: number) => boolean) {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < maze.height - 1; y++)
    for (let x = 1; x < maze.width - 1; x++) {
      if (!isWall(x, y) || maze.kind(x, y + 1) !== 'path') continue;
      if ((x * 7 + y * 13) % 11 !== 0) continue;
      out.push({ x, y });
    }
  return out;
}

// ---------------------------------------------------------------- drawing

function paint(g: Grid, x: number, y: number, j0: number, j1: number, tex: Tex) {
  for (let j = j0; j < j1; j++) {
    const gy = y * N + j;
    let i = 0;
    while (i < N) {
      const c = tex(x * N + i, gy);
      let k = i + 1;
      while (k < N && tex(x * N + k, gy) === c) k++;
      g.rect(x * N + i, gy, k - i, 1, c);
      i = k;
    }
  }
}

/** Stepped (pixel) light pool. */
function pool(g: Grid, cx: number, cy: number, radius: number, color: string) {
  for (const r of [radius, radius * 0.7, radius * 0.45]) {
    const R = Math.round(r);
    for (let dy = -R; dy <= R; dy++) {
      const half = Math.round(Math.sqrt(R * R - dy * dy));
      g.rect(cx - half, cy + dy, half * 2, 1, color);
    }
  }
}

export function drawVoxelMaze(ctx: Ctx, maze: Maze, style: VoxelLevelStyle, tile: number, opts: MazeDrawOptions = {}) {
  const { background = true, details = true } = opts;
  const g = new Grid(ctx, 0, 0, tile / N);
  const isWall = (x: number, y: number) => x >= 0 && x < maze.width && maze.kind(x, y) === 'wall';

  if (background) {
    const w = maze.width * tile;
    const h = maze.height * tile;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, style.background[0]);
    grad.addColorStop(1, style.background[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < maze.height; y++)
      for (let x = 0; x < maze.width; x++) {
        const k = maze.kind(x, y);
        if (k === 'wall') continue;
        paint(g, x, y, 0, N, k === 'void' ? style.void : k === 'house' || k === 'gate' ? style.house : style.floor);
        if (k === 'void') continue;
        // Ambient occlusion from walls lit from the top-left.
        if (isWall(x, y - 1)) {
          g.rect(x * N, y * N, N, 1, 'rgba(0,0,0,0.42)');
          g.rect(x * N, y * N + 1, N, 1, 'rgba(0,0,0,0.2)');
        }
        if (isWall(x - 1, y)) g.rect(x * N, y * N, 1, N, 'rgba(0,0,0,0.28)');
        if (isWall(x + 1, y)) g.rect(x * N + N - 1, y * N, 1, N, 'rgba(0,0,0,0.12)');
      }
    if (details && style.lights) for (const l of style.lights(maze, isWall)) pool(g, l.x * N + N / 2, (l.y + 1) * N, N * 2, l.color);
  }

  for (let y = 0; y < maze.height; y++)
    for (let x = 0; x < maze.width; x++) {
      if (!isWall(x, y)) continue;
      const mat = style.wall(maze, x, y);
      const front = !isWall(x, y + 1) && y + 1 < maze.height;
      const split = front ? N - FRONT : N;
      paint(g, x, y, 0, split, mat.top);
      const px = x * N;
      const py = y * N;
      if (!isWall(x, y - 1) && y > 0) g.rect(px, py, N, 1, mat.rim);
      if (!isWall(x - 1, y)) g.rect(px, py, 1, split, mat.rim);
      if (!isWall(x + 1, y)) g.rect(px + N - 1, py, 1, split, 'rgba(0,0,0,0.22)');
      if (front) {
        paint(g, x, y, split, N, mat.front);
        g.rect(px, py + N - 1, N, 1, mat.foot);
        if (!isWall(x + 1, y)) g.rect(px + N - 1, py + split, 1, FRONT, 'rgba(0,0,0,0.3)');
      }
    }

  // Gate: a slab bar across the pen entrance.
  const gx = maze.gate.x * N;
  const gy = maze.gate.y * N;
  g.rect(gx - 1, gy + 2, N + 2, 4, style.gate.outline);
  g.rect(gx - 1, gy + 3, N + 2, 1, style.gate.face);
  g.rect(gx - 1, gy + 4, N + 2, 1, style.gate.dark);

  if (details && style.decorate) style.decorate(g, maze, isWall);
}
