import type { SoundProfile } from '../core/audio';
import type { Maze, PickupKind } from '../game/maze';
import type { Dir, EnemyKind, MaybeDir, SkinId } from '../game/types';

export const THEME_IDS = ['christmas', 'cyberpunk', 'voxel', 'pixel'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** Collectible visuals. Mechanics are shared; only the art differs per theme. */
export type ItemKind = PickupKind | 'gift';

/** Frame order of the enemy "eyes" sprite sheet. */
export const EYE_FRAME_DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

export interface LevelLook {
  name: string;
  description: string;
  /** UI accent colour for this level (tickets, chips). */
  accent: string;
  /** Canvas background gradient, top → bottom. */
  background: [string, string];
  /** Optional decoration colours (e.g. string lights). */
  lights?: string[];
}

export interface MazeDrawOptions {
  /** Paint the level background behind the walls (default true). */
  background?: boolean;
  /** Fine decoration such as glows and caps; off for tiny previews (default true). */
  details?: boolean;
}

/**
 * Pure Canvas2D drawing routines. Used to bake Phaser textures and to draw
 * menu previews, so a theme looks identical everywhere.
 *
 * Coordinate conventions (shared by every theme):
 * - Player faces right, centred on (cx, cy) with body radius r; accessories may
 *   extend up to ~1.6r, so callers reserve a 4r × 4r frame.
 * - Enemies are centred on (cx, cy) with body radius r, same frame budget.
 * - Eyes are drawn as a separate overlay on top of the enemy body.
 * - Items get a square frame of side `size` centred on (cx, cy).
 */
export interface ThemeRenderer {
  drawPlayer(ctx: CanvasRenderingContext2D, skin: SkinId, cx: number, cy: number, r: number, mouth: number): void;
  drawEnemy(ctx: CanvasRenderingContext2D, kind: EnemyKind, cx: number, cy: number, r: number, frame: number): void;
  /** Vulnerable enemy (after a power item). `flash` is the warning frame shown before it recovers. */
  drawFrightened(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, frame: number, flash: boolean): void;
  drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, dir: MaybeDir): void;
  drawItem(ctx: CanvasRenderingContext2D, kind: ItemKind, cx: number, cy: number, size: number): void;
  drawMaze(ctx: CanvasRenderingContext2D, maze: Maze, levelIndex: number, tile: number, opts?: MazeDrawOptions): void;
  /** `spark`: burst particle (24px frame). `ambient`: background weather particle (16px frame). */
  drawParticle(ctx: CanvasRenderingContext2D, kind: 'spark' | 'ambient', cx: number, cy: number, size: number): void;
}

export type AmbientKind = 'snow' | 'rain' | 'blocks' | 'none';
/** How items idle: festive = spin/wobble, pulse = scale, bob = float, blink = arcade blink. */
export type ItemMotion = 'festive' | 'pulse' | 'bob' | 'blink';
export type BurstEvent = 'power' | 'star' | 'enemy' | 'death' | 'gift' | 'win';

/** In-game presentation knobs read by the Phaser scene. */
export interface ThemeFx {
  /** Nearest-neighbour scaling and rounded pixels (pixel/voxel art). */
  pixelArt: boolean;
  /** Rotate the player sprite for up/down; false keeps it upright and only mirrors left/right. */
  rotatePlayer: boolean;
  /** Colour of a pulsing additive aura behind the player. */
  playerGlow?: string;
  ambient: AmbientKind;
  /** Christmas string lights along the maze edges (colours from LevelLook.lights). */
  bulbs: boolean;
  /** Occasional digital glitch on the maze. */
  glitch: boolean;
  itemMotion: ItemMotion;
  bursts: Record<BurstEvent, number[]>;
  /** Camera flash colour when a power item is taken. */
  flash: [number, number, number];
  /** Maze tint used for the level-clear flash. */
  winTint: number;
  text: {
    font: string;
    titleSize: number;
    titleColor: string;
    titleStroke: string;
    readyColor: string;
    readyStroke: string;
    floatFont: string;
    floatStroke: string;
    float: { star: string; enemy: string; gift: string };
  };
}

export interface ThemeLabels {
  /** Plural name of the regular pickup, e.g. "Snowflakes". */
  pellets: string;
  /** Stat label for caught enemies. */
  foes: string;
  /** HUD label of the power timer. */
  power: string;
  /** Name of the gift speed bonus. */
  boost: string;
  /** Optional flavour text; generic defaults are used when omitted. */
  pauseKicker?: string;
  victoryTitle?: string;
  gameOverKicker?: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  /** Subtitle under the WINTER MAZE logo. */
  edition: string;
  /** Palette chips for the theme picker. */
  swatches: string[];
  /** Per-level presentation; index matches the campaign order. */
  levels: LevelLook[];
  renderer: ThemeRenderer;
  fx: ThemeFx;
  labels: ThemeLabels;
  sound: SoundProfile;
  /** Fonts to load before Phaser draws text (CSS font shorthand). */
  canvasFonts: string[];
}
