import { LEVELS } from '../game/levels';
import { christmasTheme } from './christmas';
import { cyberpunkTheme } from './cyberpunk';
import { pixelTheme } from './pixel';
import { voxelTheme } from './voxel';
import { THEME_IDS, type LevelLook, type ThemeConfig, type ThemeId } from './types';

/** Theme registry. To add a theme: create `src/themes/<id>/`, add its id to THEME_IDS and register it here. */
export const THEMES: Record<ThemeId, ThemeConfig> = {
  christmas: christmasTheme,
  cyberpunk: cyberpunkTheme,
  voxel: voxelTheme,
  pixel: pixelTheme,
};

export const THEME_ORDER: readonly ThemeId[] = THEME_IDS;

export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES[id] ?? christmasTheme;
}

/** Presentation for a campaign level; levels without a themed look reuse one cyclically with their own name. */
export function levelLook(theme: ThemeConfig, levelIndex: number): LevelLook {
  const own = theme.levels[levelIndex];
  if (own) return own;
  const level = LEVELS[levelIndex];
  return { ...theme.levels[levelIndex % theme.levels.length], name: level?.name ?? '', description: level?.description ?? '' };
}

export * from './types';
