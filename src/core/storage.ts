import { DIFFICULTY_ORDER } from './difficulty';
import { SKIN_IDS, getSkin } from './skins';
import { LEVELS } from '../game/levels';
import type { DifficultyId, SkinId } from '../game/types';

export type TouchMode = 'auto' | 'on' | 'off';

export interface Settings {
  muted: boolean;
  master: number;
  music: number;
  sfx: number;
  reducedEffects: boolean;
  touchControls: TouchMode;
}

export interface SaveData {
  version: 1;
  bestScore: number;
  levelBest: Record<string, number>;
  coins: number;
  unlockedSkins: SkinId[];
  selectedSkin: SkinId;
  difficulty: DifficultyId;
  /** Highest campaign level index the player may start from. */
  unlockedLevel: number;
  settings: Settings;
  stats: { gamesPlayed: number; snowflakes: number; enemiesCaught: number };
}

export const STORAGE_KEY = 'winter-maze/save/v1';

export function defaultSave(): SaveData {
  return {
    version: 1,
    bestScore: 0,
    levelBest: {},
    coins: 0,
    unlockedSkins: ['classic'],
    selectedSkin: 'classic',
    difficulty: 'normal',
    unlockedLevel: 0,
    settings: { muted: false, master: 0.8, music: 0.5, sfx: 0.8, reducedEffects: false, touchControls: 'auto' },
    stats: { gamesPlayed: 0, snowflakes: 0, enemiesCaught: 0 },
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function num(v: unknown, fallback: number, min: number, max: number, integer = true): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  const n = Math.min(max, Math.max(min, v));
  return integer ? Math.floor(n) : n;
}

const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);

/** Coerces arbitrary (possibly corrupted or outdated) JSON into a valid save. */
export function sanitizeSave(raw: unknown): SaveData {
  const d = defaultSave();
  if (!isObj(raw)) return d;

  const skins = Array.isArray(raw.unlockedSkins)
    ? raw.unlockedSkins.filter((s): s is SkinId => SKIN_IDS.includes(s as SkinId))
    : [];
  const unlockedSkins = Array.from(new Set<SkinId>(['classic', ...skins]));
  const selected = unlockedSkins.includes(raw.selectedSkin as SkinId) ? (raw.selectedSkin as SkinId) : 'classic';

  const levelBest: Record<string, number> = {};
  if (isObj(raw.levelBest)) {
    for (const lvl of LEVELS) levelBest[lvl.id] = num(raw.levelBest[lvl.id], 0, 0, 1e9);
  }

  const s = isObj(raw.settings) ? raw.settings : {};
  const st = isObj(raw.stats) ? raw.stats : {};
  const touch = ['auto', 'on', 'off'].includes(s.touchControls as string) ? (s.touchControls as TouchMode) : 'auto';

  return {
    version: 1,
    bestScore: num(raw.bestScore, 0, 0, 1e9),
    levelBest,
    coins: num(raw.coins, 0, 0, 1e7),
    unlockedSkins,
    selectedSkin: getSkin(selected).id,
    difficulty: DIFFICULTY_ORDER.includes(raw.difficulty as DifficultyId) ? (raw.difficulty as DifficultyId) : d.difficulty,
    unlockedLevel: num(raw.unlockedLevel, 0, 0, LEVELS.length - 1),
    settings: {
      muted: bool(s.muted, d.settings.muted),
      master: num(s.master, d.settings.master, 0, 1, false),
      music: num(s.music, d.settings.music, 0, 1, false),
      sfx: num(s.sfx, d.settings.sfx, 0, 1, false),
      reducedEffects: bool(s.reducedEffects, d.settings.reducedEffects),
      touchControls: touch,
    },
    stats: {
      gamesPlayed: num(st.gamesPlayed, 0, 0, 1e9),
      snowflakes: num(st.snowflakes, 0, 0, 1e12),
      enemiesCaught: num(st.enemiesCaught, 0, 0, 1e9),
    },
  };
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // access can throw in privacy modes
  }
}

export function loadSave(storage: KeyValueStorage | null = browserStorage()): SaveData {
  if (!storage) return defaultSave();
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text ? sanitizeSave(JSON.parse(text)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData, storage: KeyValueStorage | null = browserStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota or privacy-mode failures should never break gameplay.
  }
}
