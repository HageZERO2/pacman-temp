export type WallStyle = 'hedge' | 'ice' | 'wood';

export interface LevelTheme {
  /** Background gradient (top → bottom). */
  sky: [string, string];
  wall: string;
  wallDark: string;
  wallEdge: string;
  style: WallStyle;
  /** Accent colour used for UI chips and glows. */
  accent: string;
  lights: string[];
}

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  map: readonly string[];
  theme: LevelTheme;
  /** Player speed in tiles per second. */
  playerSpeed: number;
  /** Extra multiplier on enemy speed (stacks with difficulty). */
  enemySpeedScale: number;
  /** Multiplier on frightened duration (later levels are stingier). */
  frightenedScale: number;
}
