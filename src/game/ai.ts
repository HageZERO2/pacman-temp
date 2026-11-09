import type { Maze } from './maze';
import { DIR_VECTORS, DIRS, OPPOSITE, type Cell, type Dir, type EnemyKind, type MaybeDir } from './types';

export interface TargetContext {
  player: Cell;
  playerDir: MaybeDir;
  self: Cell;
  /** Position of the lead chaser (yeti), used by the flanking elf. */
  leader: Cell;
  maze: Maze;
}

export interface EnemyProfile {
  kind: EnemyKind;
  name: string;
  title: string;
  /** Scatter corner (may lie outside the maze, which is fine for distance targeting). */
  corner: (maze: Maze) => Cell;
  chaseTarget: (ctx: TargetContext) => Cell;
}

const dist2 = (a: Cell, b: Cell) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const ENEMY_PROFILES: Record<EnemyKind, EnemyProfile> = {
  yeti: {
    kind: 'yeti',
    name: 'Blizzard Yeti',
    title: 'Relentless chaser',
    corner: (m) => ({ x: m.width - 2, y: -2 }),
    chaseTarget: ({ player }) => player,
  },
  wisp: {
    kind: 'wisp',
    name: 'Frost Wisp',
    title: 'Cuts you off ahead',
    corner: () => ({ x: 1, y: -2 }),
    chaseTarget: ({ player, playerDir }) => {
      const v = DIR_VECTORS[playerDir];
      return { x: player.x + v.x * 4, y: player.y + v.y * 4 };
    },
  },
  goblin: {
    kind: 'goblin',
    name: 'Coal Goblin',
    title: 'Shy until you look away',
    corner: (m) => ({ x: 0, y: m.height + 1 }),
    chaseTarget: ({ player, self, maze }) =>
      dist2(player, self) > 64 ? player : ENEMY_PROFILES.goblin.corner(maze),
  },
  elf: {
    kind: 'elf',
    name: 'Rogue Elf',
    title: 'Flanks with the Yeti',
    corner: (m) => ({ x: m.width - 1, y: m.height + 1 }),
    chaseTarget: ({ player, playerDir, leader }) => {
      const v = DIR_VECTORS[playerDir];
      const pivot = { x: player.x + v.x * 2, y: player.y + v.y * 2 };
      return { x: pivot.x * 2 - leader.x, y: pivot.y * 2 - leader.y };
    },
  },
};

export const ENEMY_ORDER: readonly EnemyKind[] = ['yeti', 'wisp', 'goblin', 'elf'];

/** Legal directions at an intersection; reversing is only allowed in a dead end. */
export function legalDirections(maze: Maze, tile: Cell, current: MaybeDir, allowHouse: boolean): Dir[] {
  const options = DIRS.filter((d) => {
    if (d === OPPOSITE[current]) return false;
    const n = maze.step(tile, d);
    return maze.canEnter(n.x, n.y, allowHouse);
  });
  if (options.length === 0 && current !== 'none') {
    const back = OPPOSITE[current] as Dir;
    const n = maze.step(tile, back);
    if (maze.canEnter(n.x, n.y, allowHouse)) return [back];
  }
  return options;
}

/** Greedy arcade-style choice: the legal direction whose next tile is closest to the target. */
export function greedyDirection(maze: Maze, tile: Cell, current: MaybeDir, target: Cell, allowHouse = false): MaybeDir {
  const options = legalDirections(maze, tile, current, allowHouse);
  let best: MaybeDir = 'none';
  let bestDist = Infinity;
  for (const d of options) {
    const v = DIR_VECTORS[d];
    const d2 = dist2({ x: tile.x + v.x, y: tile.y + v.y }, target);
    if (d2 < bestDist) {
      bestDist = d2;
      best = d;
    }
  }
  return best;
}

export function randomDirection(maze: Maze, tile: Cell, current: MaybeDir, rng: () => number, allowHouse = false): MaybeDir {
  const options = legalDirections(maze, tile, current, allowHouse);
  if (options.length === 0) return 'none';
  return options[Math.floor(rng() * options.length) % options.length];
}

/** Shortest-path step without reversing; falls back to greedy when the only shortest path is behind. */
export function pathDirection(maze: Maze, tile: Cell, current: MaybeDir, target: Cell, allowHouse = false): MaybeDir {
  const forbidden = current === 'none' ? undefined : (OPPOSITE[current] as Dir);
  const clamped = {
    x: Math.max(0, Math.min(maze.width - 1, target.x)),
    y: Math.max(0, Math.min(maze.height - 1, target.y)),
  };
  if (maze.canEnter(clamped.x, clamped.y, allowHouse)) {
    const step = maze.firstStepTowards(tile, clamped, allowHouse, forbidden);
    if (step) return step;
  }
  return greedyDirection(maze, tile, current, target, allowHouse);
}
