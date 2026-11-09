import { loadSave, writeSave, defaultSave, type SaveData, type Settings } from './storage';
import { getSkin } from './skins';
import { LEVELS } from '../game/levels';
import type { DifficultyId, SkinId } from '../game/types';

type Listener = () => void;

/** Single source of truth for persistent progress; every mutation is written to LocalStorage. */
class ProgressStore {
  private state: SaveData = loadSave();
  private listeners = new Set<Listener>();

  getState = (): SaveData => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(next: SaveData) {
    this.state = next;
    writeSave(next);
    this.listeners.forEach((l) => l());
  }

  updateSettings(patch: Partial<Settings>) {
    this.set({ ...this.state, settings: { ...this.state.settings, ...patch } });
  }

  setDifficulty(difficulty: DifficultyId) {
    this.set({ ...this.state, difficulty });
  }

  addCoins(amount: number) {
    if (amount <= 0) return;
    this.set({ ...this.state, coins: this.state.coins + Math.floor(amount) });
  }

  /** Returns false when the skin is unaffordable or already owned. */
  buySkin(id: SkinId): boolean {
    const skin = getSkin(id);
    if (this.state.unlockedSkins.includes(id) || this.state.coins < skin.price) return false;
    this.set({
      ...this.state,
      coins: this.state.coins - skin.price,
      unlockedSkins: [...this.state.unlockedSkins, id],
      selectedSkin: id,
    });
    return true;
  }

  selectSkin(id: SkinId) {
    if (!this.state.unlockedSkins.includes(id)) return;
    this.set({ ...this.state, selectedSkin: id });
  }

  recordScore(score: number) {
    if (score <= this.state.bestScore) return;
    this.set({ ...this.state, bestScore: score });
  }

  completeLevel(levelIndex: number, levelScore: number, totalScore: number) {
    const id = LEVELS[levelIndex]?.id;
    if (!id) return;
    this.set({
      ...this.state,
      bestScore: Math.max(this.state.bestScore, totalScore),
      levelBest: { ...this.state.levelBest, [id]: Math.max(this.state.levelBest[id] ?? 0, levelScore) },
      unlockedLevel: Math.min(LEVELS.length - 1, Math.max(this.state.unlockedLevel, levelIndex + 1)),
    });
  }

  recordStats(snowflakes: number, enemiesCaught: number, finishedRun: boolean) {
    const s = this.state.stats;
    this.set({
      ...this.state,
      stats: {
        gamesPlayed: s.gamesPlayed + (finishedRun ? 1 : 0),
        snowflakes: s.snowflakes + snowflakes,
        enemiesCaught: s.enemiesCaught + enemiesCaught,
      },
    });
  }

  /** Wipes progress but keeps audio/display preferences. */
  reset() {
    this.set({ ...defaultSave(), settings: this.state.settings });
  }
}

export const progress = new ProgressStore();
