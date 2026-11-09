export interface Cell {
  x: number;
  y: number;
}

export type Dir = 'up' | 'down' | 'left' | 'right';
export type MaybeDir = Dir | 'none';

export const DIR_VECTORS: Record<MaybeDir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
};

/** Tie-break order used by the enemy AI (classic arcade priority). */
export const DIRS: readonly Dir[] = ['up', 'left', 'down', 'right'];

export const OPPOSITE: Record<MaybeDir, MaybeDir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  none: 'none',
};

export type DifficultyId = 'easy' | 'normal' | 'hard';

export type SkinId = 'classic' | 'santa' | 'snowman' | 'gingerbread' | 'reindeer' | 'ice';

export type EnemyKind = 'yeti' | 'wisp' | 'goblin' | 'elf';

export type EnemyMode = 'house' | 'leaving' | 'scatter' | 'chase' | 'frightened' | 'eaten';
