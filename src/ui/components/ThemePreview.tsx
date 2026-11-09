import { useMemo } from 'react';
import { ENEMY_ORDER } from '../../game/ai';
import { LEVELS } from '../../game/levels';
import { Maze } from '../../game/maze';
import type { SkinId } from '../../game/types';
import type { ThemeConfig } from '../../themes/types';
import { useCanvas } from '../hooks/useCanvas';

/** Top rows of the first level: enough corridors to stage a little scene. */
const ROWS = 7;
const PREVIEW_ROW = 3;

/**
 * Living illustration of a theme for the picker: its maze, items, hero and monsters,
 * all drawn by the theme's own renderer. Animates only while `animate` is set.
 */
export function ThemePreview({ theme, skin, width, animate }: { theme: ThemeConfig; skin: SkinId; width: number; animate: boolean }) {
  const maze = useMemo(() => new Maze(LEVELS[0].map), []);
  const tile = width / maze.width;
  const height = Math.round(tile * ROWS);

  // Maze art is static; bake it once per theme at 2x for crisp downscaling.
  const baked = useMemo(() => {
    const c = document.createElement('canvas');
    const scale = 2;
    c.width = Math.round(maze.width * tile * scale);
    c.height = Math.round(maze.height * tile * scale);
    const ctx = c.getContext('2d')!;
    ctx.scale(scale, scale);
    theme.renderer.drawMaze(ctx, maze, 0, tile);
    return c;
  }, [theme, maze, tile]);

  const ref = useCanvas(
    (ctx, w, h, t) => {
      const r = theme.renderer;
      ctx.imageSmoothingEnabled = !theme.fx.pixelArt;
      ctx.drawImage(baked, 0, 0, baked.width, (baked.height * ROWS) / maze.height, 0, 0, w, h);

      const cycle = 6;
      const p = animate ? (t % cycle) / cycle : 0.32;
      const px = 1 + p * (maze.width - 3);
      const at = (x: number, y: number) => [(x + 0.5) * tile, (y + 0.5) * tile] as const;

      for (const it of maze.pickups) {
        if (it.y >= ROWS) continue;
        if (it.y === PREVIEW_ROW && it.x < px) continue;
        const [x, y] = at(it.x, it.y);
        r.drawItem(ctx, it.kind, x, y, it.kind === 'snowflake' ? tile * 1.1 : tile * 1.5);
      }

      const frame = Math.floor(t * 6) % 2;
      const er = tile * 0.42;
      const chaserX = px - 3.2;
      if (chaserX > 0.5) {
        const [x, y] = at(chaserX, PREVIEW_ROW);
        r.drawEnemy(ctx, ENEMY_ORDER[0], x, y, er, frame);
        r.drawEyes(ctx, x, y, er, 'right');
      }
      const patrol = 4 + Math.abs(((t * 1.6) % 10) - 5) * 2;
      {
        const [x, y] = at(patrol, 1);
        r.drawEnemy(ctx, ENEMY_ORDER[1], x, y, er, frame);
        r.drawEyes(ctx, x, y, er, 'left');
      }
      {
        const [x, y] = at(maze.width - 3, 5);
        r.drawFrightened(ctx, x, y, er, frame, Math.floor(t * 4) % 2 === 0);
      }
      {
        const [x, y] = at(maze.width - 6, 5);
        r.drawEnemy(ctx, ENEMY_ORDER[3], x, y, er, frame);
        r.drawEyes(ctx, x, y, er, 'up');
      }
      const [hx, hy] = at(px, PREVIEW_ROW);
      r.drawPlayer(ctx, skin, hx, hy, tile * 0.46, animate ? Math.abs(Math.sin(t * 9)) : 0.6);
    },
    width,
    height,
    animate,
    `${theme.id}-${skin}`,
  );

  return (
    <canvas
      ref={ref}
      className="theme-preview"
      style={{ width, height, imageRendering: theme.fx.pixelArt ? 'pixelated' : undefined }}
      aria-hidden="true"
    />
  );
}
