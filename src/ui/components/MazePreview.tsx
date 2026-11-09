import { drawMaze } from '../../art/maze';
import { drawCrystal, drawStar } from '../../art/items';
import type { LevelDef } from '../../game/levels';
import { Maze } from '../../game/maze';
import { useCanvas } from '../hooks/useCanvas';
import { useMemo } from 'react';

/** Miniature render of a level, using the same art routine as the game. */
export function MazePreview({ level, width }: { level: LevelDef; width: number }) {
  const maze = useMemo(() => new Maze(level.map), [level]);
  const tile = width / maze.width;
  const height = tile * maze.height;
  const ref = useCanvas(
    (ctx) => {
      drawMaze(ctx, maze, level.theme, tile, { details: false });
      ctx.fillStyle = 'rgba(232,251,255,0.85)';
      for (const p of maze.pickups) {
        const x = (p.x + 0.5) * tile;
        const y = (p.y + 0.5) * tile;
        if (p.kind === 'snowflake') ctx.fillRect(x - 1, y - 1, 2, 2);
        else if (p.kind === 'crystal') drawCrystal(ctx, x, y, tile * 0.38);
        else drawStar(ctx, x, y, tile * 0.42);
      }
    },
    width,
    height,
  );
  return <canvas ref={ref} style={{ width, height }} className="maze-preview" aria-hidden="true" />;
}
