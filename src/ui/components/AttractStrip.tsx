import { drawEnemyBody, drawEyes, drawFrozenEnemy } from '../../art/enemies';
import { drawSnowflake, drawCrystal } from '../../art/items';
import { drawPlayer } from '../../art/player';
import { ENEMY_ORDER } from '../../game/ai';
import type { SkinId } from '../../game/types';
import { useCanvas } from '../hooks/useCanvas';

/**
 * Arcade "attract mode" strip: the hero chases snowflakes with the monster gang behind,
 * then grabs a crystal and the roles flip.
 */
export function AttractStrip({ skin, width, animate }: { skin: SkinId; width: number; animate: boolean }) {
  const h = 64;
  const ref = useCanvas(
    (ctx, w, _h, t) => {
      const cycle = 9;
      const p = (t % cycle) / cycle;
      const flipped = p > 0.5;
      const span = w + 360;
      const cy = h / 2 + 4;
      const r = 15;
      // Hero runs right in the first half, back left (hunting) in the second.
      const hx = flipped ? span * (1 - (p - 0.5) * 2) - 180 : span * p * 2 - 180;
      const crystalX = w - 40;
      for (let x = 24; x < w; x += 34) {
        const eaten = flipped ? true : x < hx;
        if (!eaten) drawSnowflake(ctx, x, cy, 4);
      }
      if (!flipped && hx < crystalX) drawCrystal(ctx, crystalX, cy, 10);
      const mouth = Math.abs(Math.sin(t * 9));
      ctx.save();
      if (flipped) {
        ctx.translate(hx * 2, 0);
        ctx.scale(-1, 1);
      }
      drawPlayer(ctx, skin, hx, cy, r, mouth);
      ctx.restore();
      ENEMY_ORDER.forEach((kind, i) => {
        const ex = flipped ? hx - 70 - i * 44 + (p - 0.5) * 60 : hx - 80 - i * 44;
        const frame = Math.floor(t * 6) % 2;
        if (flipped) {
          drawFrozenEnemy(ctx, ex, cy, 13, frame, Math.floor(t * 5) % 2 === 0 && p > 0.85);
        } else {
          drawEnemyBody(ctx, kind, ex, cy, 13, frame);
          drawEyes(ctx, ex, cy, 13, 'right');
        }
      });
    },
    width,
    h,
    animate,
  );
  return <canvas ref={ref} className="attract" style={{ width, height: h }} aria-hidden="true" />;
}
