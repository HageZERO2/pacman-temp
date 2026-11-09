import { describe, expect, it } from 'vitest';
import { defaultSave, loadSave, sanitizeSave, writeSave, STORAGE_KEY, type KeyValueStorage } from './storage';
import { levelReward, type LevelStats } from './rules';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

describe('save data', () => {
  it('round-trips through storage', () => {
    const s = memoryStorage();
    const save = { ...defaultSave(), coins: 42, unlockedSkins: ['classic', 'santa'] as const, selectedSkin: 'santa' as const };
    writeSave({ ...save, unlockedSkins: [...save.unlockedSkins] }, s);
    expect(loadSave(s)).toMatchObject({ coins: 42, selectedSkin: 'santa' });
  });

  it('falls back to defaults on corrupted JSON', () => {
    expect(loadSave(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toEqual(defaultSave());
    expect(loadSave(null)).toEqual(defaultSave());
  });

  it('repairs invalid fields', () => {
    const fixed = sanitizeSave({
      bestScore: -5,
      coins: 'lots',
      unlockedSkins: ['santa', 'dragon'],
      selectedSkin: 'ice',
      difficulty: 'nightmare',
      unlockedLevel: 99,
      settings: { master: 7, muted: 'yes', touchControls: 'sideways' },
    });
    expect(fixed.bestScore).toBe(0);
    expect(fixed.coins).toBe(0);
    expect(fixed.unlockedSkins).toEqual(['classic', 'santa']);
    expect(fixed.selectedSkin).toBe('classic');
    expect(fixed.difficulty).toBe('normal');
    expect(fixed.unlockedLevel).toBe(2);
    expect(fixed.settings).toMatchObject({ master: 1, muted: false, touchControls: 'auto' });
  });
});

describe('level rewards', () => {
  const stats: LevelStats = {
    levelIndex: 0, score: 4000, levelScore: 4000, snowflakes: 171, crystals: 4, stars: 1, totalStars: 1,
    gifts: 1, enemiesCaught: 4, livesLost: 0, seconds: 120,
  };

  it('pays base coins plus completed challenges', () => {
    const r = levelReward(stats, 1);
    expect(r.base).toBe(60);
    expect(r.challenges.every((c) => c.done)).toBe(true);
    expect(r.total).toBe(60 + 25 + 20 + 15 + 15);
  });

  it('scales base coins by difficulty and skips failed challenges', () => {
    const r = levelReward({ ...stats, livesLost: 2, seconds: 400 }, 2);
    expect(r.base).toBe(120);
    expect(r.total).toBe(120 + 20 + 15);
  });
});
