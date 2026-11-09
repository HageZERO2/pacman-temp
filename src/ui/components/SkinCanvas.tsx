import { drawPlayer } from '../../art/player';
import type { SkinId } from '../../game/types';
import { useCanvas } from '../hooks/useCanvas';

interface Props {
  skin: SkinId;
  size: number;
  animate?: boolean;
  locked?: boolean;
  className?: string;
}

/** Renders a skin with the exact same drawing routine the game uses. */
export function SkinCanvas({ skin, size, animate = false, locked = false, className }: Props) {
  const ref = useCanvas(
    (ctx, w, h, t) => {
      const mouth = animate ? Math.abs(Math.sin(t * 7)) : 0.55;
      if (locked) ctx.filter = 'brightness(0.12) saturate(0)';
      drawPlayer(ctx, skin, w * 0.5, h * 0.6, w * 0.3, mouth);
      ctx.filter = 'none';
    },
    size,
    size,
    animate,
  );
  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden="true" />;
}
