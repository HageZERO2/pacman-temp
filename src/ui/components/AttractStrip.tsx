import { ENEMY_ORDER } from '../../game/ai';
import type { SkinId } from '../../game/types';
import { useCanvas } from '../hooks/useCanvas';
import { useTheme } from '../hooks/useTheme';

/**
 * Arcade "attract mode" strip: the hero chases pellets with the monster gang behind,
 * then grabs a power item and the roles flip.
 */
export function AttractStrip({ skin, width, animate }: { skin: SkinId; width: number; animate: boolean }) {
  const theme = useTheme();
  const h = 64;
  const ref = useCanvas(
    (ctx, w, _h, t) => {
      const r = theme.renderer;
      const cycle = 9;
      const p = (t % cycle) / cycle;
      const flipped = p > 0.5;
      const span = w + 360;
      const cy = h / 2 + 4;
      // Hero runs right in the first half, back left (hunting) in the second.
      const hx = flipped ? span * (1 - (p - 0.5) * 2) - 180 : span * p * 2 - 180;
      const powerX = w - 40;
      if (!flipped) {
        for (let x = 24; x < w; x += 34) if (x >= hx) r.drawItem(ctx, 'snowflake', x, cy, 16);
        if (hx < powerX) r.drawItem(ctx, 'crystal', powerX, cy, 34);
      }
      const mouth = Math.abs(Math.sin(t * 9));
      ctx.save();
      if (flipped) {
        ctx.translate(hx * 2, 0);
        ctx.scale(-1, 1);
      }
      r.drawPlayer(ctx, skin, hx, cy, 15, mouth);
      ctx.restore();
      ENEMY_ORDER.forEach((kind, i) => {
        const ex = flipped ? hx - 70 - i * 44 + (p - 0.5) * 60 : hx - 80 - i * 44;
        const frame = Math.floor(t * 6) % 2;
        if (flipped) {
          r.drawFrightened(ctx, ex, cy, 13, frame, Math.floor(t * 5) % 2 === 0 && p > 0.85);
        } else {
          r.drawEnemy(ctx, kind, ex, cy, 13, frame);
          r.drawEyes(ctx, ex, cy, 13, 'right');
        }
      });
    },
    width,
    h,
    animate,
    theme.id,
  );
  return (
    <canvas
      ref={ref}
      className="attract"
      style={{ width, height: h, imageRendering: theme.fx.pixelArt ? 'pixelated' : undefined }}
      aria-hidden="true"
    />
  );
}
