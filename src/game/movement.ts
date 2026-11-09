import type { Maze } from './maze';
import { DIR_VECTORS, OPPOSITE, type Cell, type MaybeDir } from './types';

/**
 * Grid-locked movement: an actor is always at `tile` + `progress` (0..1) along `dir`.
 * Direction changes happen only on tile centers, so actors can never clip through walls.
 */
export interface Mover {
  tile: Cell;
  dir: MaybeDir;
  progress: number;
}

export interface MoveRules {
  canEnter(cell: Cell): boolean;
  /** Called each time the mover reaches a tile center; returns the direction to continue in. */
  decide(mover: Mover): MaybeDir;
  onArrive?(mover: Mover): void;
}

export function nextCell(maze: Maze, m: Mover): Cell {
  if (m.dir === 'none') return m.tile;
  return maze.step(m.tile, m.dir);
}

/** Reverse in place mid-corridor (used for player U-turns and enemy mode flips). */
export function reverse(maze: Maze, m: Mover): void {
  if (m.dir === 'none') return;
  if (m.progress > 0) {
    m.tile = nextCell(maze, m);
    m.progress = 1 - m.progress;
  }
  m.dir = OPPOSITE[m.dir];
}

export function advance(maze: Maze, m: Mover, distance: number, rules: MoveRules): void {
  let remaining = distance;
  let guard = 0;
  while (remaining > 1e-9 && guard++ < 16) {
    if (m.dir === 'none') {
      const d = rules.decide(m);
      if (d === 'none' || !rules.canEnter(maze.step(m.tile, d))) return;
      m.dir = d;
    }
    const toCenter = 1 - m.progress;
    if (remaining < toCenter) {
      m.progress += remaining;
      return;
    }
    remaining -= toCenter;
    m.tile = nextCell(maze, m);
    m.progress = 0;
    rules.onArrive?.(m);
    const wanted = rules.decide(m);
    if (wanted !== 'none' && rules.canEnter(maze.step(m.tile, wanted))) m.dir = wanted;
    else if (!rules.canEnter(maze.step(m.tile, m.dir))) {
      m.dir = 'none';
      return;
    }
  }
}

/** Continuous position in tile units (tile centers are at integer coordinates). */
export function positionOf(m: Mover): { x: number; y: number } {
  const v = DIR_VECTORS[m.dir];
  return { x: m.tile.x + v.x * m.progress, y: m.tile.y + v.y * m.progress };
}

/** Tile the actor visually occupies (switches halfway between centers). */
export function occupiedCell(maze: Maze, m: Mover): Cell {
  return m.progress >= 0.5 ? nextCell(maze, m) : m.tile;
}
