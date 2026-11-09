import { describe, expect, it } from 'vitest';
import { Maze } from './maze';
import { advance, positionOf, reverse, type Mover, type MoveRules } from './movement';
import { greedyDirection, legalDirections, pathDirection, randomDirection } from './ai';
import type { MaybeDir } from './types';

const maze = new Maze([
  '#######',
  '#.....#',
  '#.###.#',
  '  .P.  ',
  '#.#-#.#',
  '#.#E#.#',
  '#######',
]);

function rulesFor(wanted: () => MaybeDir): MoveRules {
  return {
    canEnter: (c) => maze.canEnter(c.x, c.y),
    decide: (m) => {
      const w = wanted();
      if (w !== 'none' && maze.canEnter(maze.step(m.tile, w).x, maze.step(m.tile, w).y)) return w;
      return m.dir;
    },
  };
}

describe('grid movement', () => {
  it('stops at walls instead of passing through', () => {
    const m: Mover = { tile: { x: 3, y: 3 }, dir: 'none', progress: 0 };
    advance(maze, m, 1, rulesFor(() => 'up'));
    expect(m).toMatchObject({ tile: { x: 3, y: 3 }, dir: 'none' });
    advance(maze, m, 10, rulesFor(() => 'down')); // gate is closed to the player
    expect(m.tile).toEqual({ x: 3, y: 3 });
  });

  it('buffers a turn and takes it at the next center', () => {
    const m: Mover = { tile: { x: 3, y: 3 }, dir: 'right', progress: 0.5 };
    advance(maze, m, 1.75, rulesFor(() => 'down'));
    // reaches (4,3) — down is a wall there — continues right to (5,3), turns down.
    expect(m.tile).toEqual({ x: 5, y: 3 });
    expect(m.dir).toBe('down');
    expect(m.progress).toBeCloseTo(0.25);
  });

  it('reverses mid-tile without snapping', () => {
    const m: Mover = { tile: { x: 3, y: 3 }, dir: 'right', progress: 0.3 };
    reverse(maze, m);
    expect(m).toMatchObject({ tile: { x: 4, y: 3 }, dir: 'left' });
    expect(positionOf(m).x).toBeCloseTo(3.3);
  });

  it('wraps through the tunnel', () => {
    const m: Mover = { tile: { x: 1, y: 3 }, dir: 'left', progress: 0 };
    advance(maze, m, 2, rulesFor(() => 'left'));
    expect(m.tile).toEqual({ x: 6, y: 3 });
  });
});

describe('enemy steering', () => {
  it('never reverses unless at a dead end', () => {
    expect(legalDirections(maze, { x: 3, y: 3 }, 'right', false)).not.toContain('left');
    expect(legalDirections(maze, { x: 3, y: 5 }, 'down', true)).toEqual(['up']);
  });

  it('greedy picks the direction closest to the target', () => {
    expect(greedyDirection(maze, { x: 3, y: 3 }, 'none', { x: 0, y: 3 })).toBe('left');
  });

  it('path search finds the way out of the house', () => {
    expect(pathDirection(maze, { x: 3, y: 5 }, 'none', { x: 3, y: 3 }, true)).toBe('up');
  });

  it('random choice is always legal', () => {
    for (let i = 0; i < 20; i++) {
      const d = randomDirection(maze, { x: 1, y: 1 }, 'up', Math.random);
      expect(['right', 'down']).toContain(d);
    }
  });
});
