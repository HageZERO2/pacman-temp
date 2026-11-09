import { BACKDROPS } from '../backdrops';
import { useProgress } from '../hooks/useProgress';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { useTheme } from '../hooks/useTheme';

/** Shared animated backdrop for every screen; crossfades when the theme changes. */
export function Backdrop({ dimmed = false }: { dimmed?: boolean }) {
  const { settings } = useProgress();
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const calm = settings.reducedEffects || reducedMotion;
  const Scene = BACKDROPS[theme.id];
  return (
    <div className={`backdrop ${dimmed ? 'backdrop--dimmed' : ''} ${calm ? 'backdrop--calm' : ''}`} aria-hidden="true">
      <div className="backdrop__layer" key={theme.id}>
        <Scene dimmed={dimmed} calm={calm} />
      </div>
    </div>
  );
}
