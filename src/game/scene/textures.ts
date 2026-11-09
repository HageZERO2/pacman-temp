import Phaser from 'phaser';
import { ENEMY_ORDER } from '../ai';
import { EYE_FRAME_DIRS, type ItemKind, type ThemeConfig } from '../../themes/types';
import type { SkinId } from '../types';

export const TILE = 40;
export const SPRITE = TILE * 2;
export const PLAYER_FRAMES = [0, 1, 2, 3, 4, 3, 2, 1];

/** Square frame size reserved for each collectible texture. */
export const ITEM_FRAME: Record<ItemKind, number> = { snowflake: 24, crystal: 48, star: 52, gift: 56 };

type Draw = (ctx: CanvasRenderingContext2D, index: number, cx: number, cy: number) => void;

function sheet(scene: Phaser.Scene, key: string, size: number, count: number, draw: Draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, size * count, size);
  if (!tex) return;
  const ctx = tex.getContext();
  for (let i = 0; i < count; i++) {
    ctx.save();
    draw(ctx, i, i * size + size / 2, size / 2);
    ctx.restore();
    tex.add(i, 0, i * size, 0, size, size);
  }
  tex.refresh();
}

export const PLAYER_KEY = 'player';
export const enemyKey = (kind: string) => `enemy-${kind}`;
export const itemKey = (kind: ItemKind) => `item-${kind}`;

/**
 * Bakes every sprite from the theme's renderer. A Phaser game is created per run
 * with a fixed theme and skin, so plain keys are safe; they persist across scene restarts.
 */
export function buildTextures(scene: Phaser.Scene, theme: ThemeConfig, skin: SkinId) {
  const r = theme.renderer;
  sheet(scene, PLAYER_KEY, SPRITE, 5, (ctx, i, cx, cy) => r.drawPlayer(ctx, skin, cx, cy, TILE * 0.44, i / 4));
  for (const kind of ENEMY_ORDER) {
    sheet(scene, enemyKey(kind), SPRITE, 2, (ctx, i, cx, cy) => r.drawEnemy(ctx, kind, cx, cy + 2, TILE * 0.4, i));
  }
  sheet(scene, 'enemy-frozen', SPRITE, 4, (ctx, i, cx, cy) => r.drawFrightened(ctx, cx, cy + 2, TILE * 0.38, i % 2, i >= 2));
  sheet(scene, 'eyes', SPRITE, 4, (ctx, i, cx, cy) => r.drawEyes(ctx, cx, cy + 2, TILE * 0.4, EYE_FRAME_DIRS[i]));
  for (const kind of Object.keys(ITEM_FRAME) as ItemKind[]) {
    const size = ITEM_FRAME[kind];
    sheet(scene, itemKey(kind), size, 1, (ctx, _i, cx, cy) => r.drawItem(ctx, kind, cx, cy, size));
  }
  sheet(scene, 'spark', 24, 1, (ctx, _i, cx, cy) => r.drawParticle(ctx, 'spark', cx, cy, 24));
  sheet(scene, 'ambient', 16, 1, (ctx, _i, cx, cy) => r.drawParticle(ctx, 'ambient', cx, cy, 16));
  sheet(scene, 'bulb', 16, 1, (ctx, _i, cx, cy) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, 4, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,50,60,1)';
    ctx.fillRect(cx - 2.5, cy - 7, 5, 3);
  });
  sheet(scene, 'glow', 64, 1, (ctx, _i, cx, cy) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
}
