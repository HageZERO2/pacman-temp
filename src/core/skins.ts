import type { SkinId } from '../game/types';

export interface SkinDef {
  id: SkinId;
  name: string;
  description: string;
  price: number;
  /** Primary colour, used for UI glows around the preview. */
  color: string;
}

/** Purely cosmetic: skins never change speed, hitbox or scoring. */
export const SKINS: readonly SkinDef[] = [
  { id: 'classic', name: 'Classic', description: 'The original golden muncher. Warm as a fireplace.', price: 0, color: '#ffc93c' },
  { id: 'santa', name: 'Santa', description: 'Fluffy hat, fluffier beard. Delivers chomps on time.', price: 120, color: '#ff4d4d' },
  { id: 'snowman', name: 'Snowman', description: 'Top hat, carrot nose and a frosty grin.', price: 220, color: '#e8f6ff' },
  { id: 'gingerbread', name: 'Gingerbread', description: 'Freshly baked with icing swirls and gumdrops.', price: 320, color: '#c97a3d' },
  { id: 'reindeer', name: 'Reindeer', description: 'Velvet antlers and a nose that glows in a blizzard.', price: 450, color: '#a0663a' },
  { id: 'ice', name: 'Ice Crystal', description: 'A living gem carved from the northern lights.', price: 700, color: '#7fe8ff' },
];

export const SKIN_IDS = SKINS.map((s) => s.id);

export function getSkin(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
