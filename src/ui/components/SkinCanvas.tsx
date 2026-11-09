import type { SkinId } from '../../game/types';
import type { ThemeConfig } from '../../themes/types';
import { useCanvas } from '../hooks/useCanvas';
import { useTheme } from '../hooks/useTheme';

interface Props {
  skin: SkinId;
  size: number;
  animate?: boolean;
  locked?: boolean;
  className?: string;
  /** Defaults to the active theme. */
  theme?: ThemeConfig;
}

/** Renders a skin with the exact same drawing routine the game uses. */
export function SkinCanvas({ skin, size, animate = false, locked = false, className, theme }: Props) {
  const active = useTheme();
  const t = theme ?? active;
  const ref = useCanvas(
    (ctx, w, h, time) => {
      const mouth = animate ? Math.abs(Math.sin(time * 7)) : 0.55;
      if (locked) ctx.filter = 'brightness(0.12) saturate(0)';
      t.renderer.drawPlayer(ctx, skin, w * 0.5, h * 0.6, w * 0.3, mouth);
      ctx.filter = 'none';
    },
    size,
    size,
    animate,
    t.id,
  );
  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: size, height: size, imageRendering: t.fx.pixelArt ? 'pixelated' : undefined }}
      aria-hidden="true"
    />
  );
}
