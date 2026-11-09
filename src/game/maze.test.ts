import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import { Maze } from './maze';
import { DIRS } from './types';

describe.each(LEVELS.map((l) => [l.name, l] as const))('level %s', (_name, level) => {
  const maze = new Maze(level.map);

  it('parses spawns, gate and house', () => {
    expect(maze.enemyHomes.length).toBeGreaterThanOrEqual(1);
    expect(maze.kind(maze.exit.x, maze.exit.y)).toBe('path');
    expect(maze.kind(maze.houseCenter.x, maze.houseCenter.y)).toBe('house');
    expect(maze.pickups.filter((p) => p.kind === 'crystal').length).toBeGreaterThanOrEqual(2);
  });

  it('lets the player reach every pickup', () => {
    const reach = maze.reachableFromStart();
    for (const p of maze.pickups) expect(reach.has(p.y * maze.width + p.x), `pickup at ${p.x},${p.y}`).toBe(true);
  });

  it('has no dead ends, so enemies never get stuck', () => {
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (!maze.canEnter(x, y)) continue;
        const exits = DIRS.filter((d) => {
          const n = maze.step({ x, y }, d);
          return maze.canEnter(n.x, n.y);
        });
        expect(exits.length, `corridor ${x},${y}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('connects every house tile to the exit through the gate', () => {
    for (const home of maze.enemyHomes) {
      expect(maze.firstStepTowards(home, maze.exit, true)).not.toBeNull();
      expect(maze.firstStepTowards(maze.exit, home, false)).toBeNull();
    }
  });

  it('wraps horizontally through tunnels', () => {
    for (const y of maze.tunnelRows) expect(maze.step({ x: 0, y }, 'left')).toEqual({ x: maze.width - 1, y });
  });
});

describe('Maze parsing errors', () => {
  it('rejects ragged rows and unknown characters', () => {
    expect(() => new Maze(['#P-E', '#'])).toThrow();
    expect(() => new Maze(['#P-E?'])).toThrow(/Unknown/);
  });
});
