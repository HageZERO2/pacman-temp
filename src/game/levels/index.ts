import { christmasVillage } from './christmasVillage';
import { frozenKingdom } from './frozenKingdom';
import { santasWorkshop } from './santasWorkshop';
import type { LevelDef } from './types';

/** Campaign order. Add a new map file and append it here to extend the game. */
export const LEVELS: readonly LevelDef[] = [christmasVillage, frozenKingdom, santasWorkshop];

export type { LevelDef } from './types';
