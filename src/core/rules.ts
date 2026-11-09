/** Point values and coin rewards shared by the game scene and result screens. */
export const POINTS = {
  snowflake: 10,
  crystal: 50,
  star: 500,
  gift: 300,
  /** Score for catching frozen enemies in a row during one crystal. */
  enemyChain: [200, 400, 800, 1600],
} as const;

export const GIFT_COINS = 5;

/** Snowflakes eaten before a gift appears at the bonus spot. */
export const GIFT_TRIGGERS = [55, 125];
export const GIFT_LIFETIME = 10;

export interface LevelStats {
  levelIndex: number;
  score: number;
  levelScore: number;
  snowflakes: number;
  crystals: number;
  stars: number;
  totalStars: number;
  gifts: number;
  enemiesCaught: number;
  livesLost: number;
  seconds: number;
}

export interface Challenge {
  id: string;
  label: string;
  coins: number;
  done: boolean;
}

export function levelChallenges(stats: LevelStats): Challenge[] {
  return [
    { id: 'flawless', label: 'Flawless — no lives lost', coins: 25, done: stats.livesLost === 0 },
    { id: 'hunter', label: 'Monster hunter — catch 4 frozen foes', coins: 20, done: stats.enemiesCaught >= 4 },
    { id: 'stars', label: 'Stargazer — grab every golden star', coins: 15, done: stats.stars >= stats.totalStars },
    { id: 'speed', label: 'Sleigh speed — clear in under 2:30', coins: 15, done: stats.seconds < 150 },
  ];
}

export interface LevelReward {
  base: number;
  challenges: Challenge[];
  total: number;
}

export function levelReward(stats: LevelStats, coinMultiplier: number): LevelReward {
  const base = Math.round((20 + stats.levelScore / 100) * coinMultiplier);
  const challenges = levelChallenges(stats);
  const bonus = challenges.filter((c) => c.done).reduce((sum, c) => sum + c.coins, 0);
  return { base, challenges, total: base + bonus };
}
