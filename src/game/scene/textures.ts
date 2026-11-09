import Phaser from 'phaser';
import { drawEnemyBody, drawEyes, drawFrozenEnemy, EYE_DIRS } from '../../art/enemies';
import { drawCrystal, drawGift, drawSnowflake, drawStar } from '../../art/items';
import { drawPlayer, drawSparkle } from '../../art/player';
import { ENEMY_ORDER } from '../ai';
import type { SkinId } from '../types';

export const TILE = 40;
export const SPRITE = TILE * 2;
export const PLAYER_FRAMES = [0, 1, 2, 3, 4, 3, 2, 1];

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

export const playerKey = (skin: SkinId) => `player-${skin}`;
export const enemyKey = (kind: string) => `enemy-${kind}`;

/** Generates every sprite procedurally; textures persist in the game's texture manager across restarts. */
export function buildTextures(scene: Phaser.Scene, skin: SkinId) {
  sheet(scene, playerKey(skin), SPRITE, 5, (ctx, i, cx, cy) => drawPlayer(ctx, skin, cx, cy, TILE * 0.44, i / 4));
  for (const kind of ENEMY_ORDER) {
    sheet(scene, enemyKey(kind), SPRITE, 2, (ctx, i, cx, cy) => drawEnemyBody(ctx, kind, cx, cy + 2, TILE * 0.4, i));
  }
  sheet(scene, 'enemy-frozen', SPRITE, 4, (ctx, i, cx, cy) => drawFrozenEnemy(ctx, cx, cy + 2, TILE * 0.38, i % 2, i >= 2));
  sheet(scene, 'eyes', SPRITE, 4, (ctx, i, cx, cy) => drawEyes(ctx, cx, cy + 2, TILE * 0.4, EYE_DIRS[i]));
  sheet(scene, 'snowflake', 24, 1, (ctx, _i, cx, cy) => drawSnowflake(ctx, cx, cy, 6));
  sheet(scene, 'crystal', 48, 1, (ctx, _i, cx, cy) => drawCrystal(ctx, cx, cy, 14));
  sheet(scene, 'star', 52, 1, (ctx, _i, cx, cy) => drawStar(ctx, cx, cy, 15));
  sheet(scene, 'gift', 56, 1, (ctx, _i, cx, cy) => drawGift(ctx, cx, cy, 24));
  sheet(scene, 'flake', 16, 1, (ctx, _i, cx, cy) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(230,245,255,0.6)');
    g.addColorStop(1, 'rgba(230,245,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  });
  sheet(scene, 'spark', 24, 1, (ctx, _i, cx, cy) => drawSparkle(ctx, cx, cy, 11, '#ffffff'));
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
