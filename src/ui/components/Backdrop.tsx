import { Snowfall } from './Snowfall';
import { Garland } from './Garland';
import { WinterScene } from './WinterScene';
import { useProgress } from '../hooks/useProgress';
import { useReducedMotion } from '../hooks/useMediaQuery';

/** Shared animated backdrop for every menu screen. */
export function Backdrop({ dimmed = false }: { dimmed?: boolean }) {
  const { settings } = useProgress();
  const reducedMotion = useReducedMotion();
  const calm = settings.reducedEffects || reducedMotion;
  return (
    <div className={`backdrop ${dimmed ? 'backdrop--dimmed' : ''} ${calm ? 'backdrop--calm' : ''}`} aria-hidden="true">
      <div className="backdrop__sky" />
      <div className="backdrop__aurora" />
      <div className="backdrop__moon" />
      <WinterScene />
      <Snowfall density={calm ? 0.25 : dimmed ? 0.5 : 1} />
      {!dimmed && <Garland />}
    </div>
  );
}
