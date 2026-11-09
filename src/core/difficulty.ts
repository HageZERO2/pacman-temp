import type { DifficultyId } from '../game/types';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  tagline: string;
  lives: number;
  maxLives: number;
  /** Enemy speed relative to the player's base speed. */
  enemySpeed: number;
  /** Probability (0..1) that an enemy takes the optimal turn while chasing. */
  aggression: number;
  /** Chasers use true shortest-path search instead of greedy steering. */
  smartPathing: boolean;
  frightenedSeconds: number;
  /** Seconds between enemies leaving the house. */
  releaseInterval: number;
  /** Alternating scatter/chase phase lengths in seconds; the last phase lasts forever. */
  phases: number[];
  /** Multiplier applied to coins earned for completing a level. */
  coinMultiplier: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    tagline: 'Cozy cocoa pace. Slow, sleepy monsters.',
    lives: 5,
    maxLives: 6,
    enemySpeed: 0.7,
    aggression: 0.55,
    smartPathing: false,
    frightenedSeconds: 9,
    releaseInterval: 7,
    phases: [9, 14, 9, 14, 8],
    coinMultiplier: 1,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    tagline: 'The classic arcade balance.',
    lives: 3,
    maxLives: 5,
    enemySpeed: 0.86,
    aggression: 0.85,
    smartPathing: false,
    frightenedSeconds: 6.5,
    releaseInterval: 4.5,
    phases: [7, 20, 7, 20, 5],
    coinMultiplier: 1.5,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    tagline: 'Blizzard mode. They hunt as a pack.',
    lives: 2,
    maxLives: 4,
    enemySpeed: 0.98,
    aggression: 1,
    smartPathing: true,
    frightenedSeconds: 4,
    releaseInterval: 2.5,
    phases: [5, 25, 4, 30, 3],
    coinMultiplier: 2,
  },
};

export const DIFFICULTY_ORDER: readonly DifficultyId[] = ['easy', 'normal', 'hard'];
