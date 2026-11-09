import type { LevelStats } from '../core/rules';
import type { MaybeDir } from './types';

type Handler<T> = (payload: T) => void;

/** Minimal typed event emitter (kept framework-free so React never imports Phaser). */
export class Emitter<Events extends object> {
  private handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((h) => (h as Handler<Events[K]>)(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export type GamePhase = 'ready' | 'playing' | 'paused' | 'dying' | 'levelComplete' | 'gameOver';

export interface HudState {
  score: number;
  lives: number;
  levelIndex: number;
  /** 0..1 remaining crystal power, 0 when inactive. */
  power: number;
  boost: boolean;
}

export interface RunSummary {
  score: number;
  levelIndex: number;
  snowflakes: number;
  enemiesCaught: number;
  gifts: number;
  seconds: number;
}

/** Scene → UI. */
export interface GameEvents {
  hud: HudState;
  phase: GamePhase;
  levelComplete: LevelStats;
  gameOver: RunSummary;
  coins: number;
}

/** UI → Scene. */
export interface GameCommands {
  pause: void;
  resume: void;
  restartLevel: void;
  nextLevel: void;
  newRun: number;
  direction: MaybeDir;
}

export class GameBridge {
  readonly events = new Emitter<GameEvents>();
  readonly commands = new Emitter<GameCommands>();

  dispose() {
    this.events.clear();
    this.commands.clear();
  }
}
