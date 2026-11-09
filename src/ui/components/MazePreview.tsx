import { useMemo } from 'react';
import { LEVELS } from '../../game/levels';
import { Maze } from '../../game/maze';
import { useCanvas } from '../hooks/useCanvas';
import { useTheme } from '../hooks/useTheme';

/** Miniature render of a level in the active theme, using the same art routines as the game. */
export function MazePreview({ levelIndex, width }: { levelIndex: number; width: number }) {
  const theme = useTheme();
  const maze = useMemo(() => new Maze(LEVELS[levelIndex].map), [levelIndex]);
  const tile = width / maze.width;
  const height = tile * maze.height;
  const ref = useCanvas(
    (ctx) => {
      const r = theme.renderer;
      r.drawMaze(ctx, maze, levelIndex, tile, { details: false });
      for (const p of maze.pickups) {
        const x = (p.x + 0.5) * tile;
        const y = (p.y + 0.5) * tile;
        r.drawItem(ctx, p.kind, x, y, p.kind === 'snowflake' ? tile : tile * 1.4);
      }
    },
    width,
    height,
    false,
    theme.id,
  );
  return (
    <canvas
      ref={ref}
      style={{ width, height, imageRendering: theme.fx.pixelArt ? 'pixelated' : undefined }}
      className="maze-preview"
      aria-hidden="true"
    />
  );
}
