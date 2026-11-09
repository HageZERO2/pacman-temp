/** Gameplay definition of a level. Visual presentation lives in each theme (see src/themes). */
export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  map: readonly string[];
  /** Player speed in tiles per second. */
  playerSpeed: number;
  /** Extra multiplier on enemy speed (stacks with difficulty). */
  enemySpeedScale: number;
  /** Multiplier on frightened duration (later levels are stingier). */
  frightenedScale: number;
}
