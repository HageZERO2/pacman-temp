import { Pause, Zap } from 'lucide-react';
import type { HudState } from '../../game/bridge';
import { levelLook } from '../../themes';
import { useTheme } from '../hooks/useTheme';
import type { SkinId } from '../../game/types';
import { ArcadeButton } from '../components/ArcadeButton';
import { CoinIcon } from '../components/CoinCounter';
import { SkinCanvas } from '../components/SkinCanvas';

interface Props {
  hud: HudState;
  best: number;
  coins: number;
  skin: SkinId;
  onPause: () => void;
  canPause: boolean;
}

export function Hud({ hud, best, coins, skin, onPause, canPause }: Props) {
  const theme = useTheme();
  const level = levelLook(theme, hud.levelIndex);
  return (
    <header className="hud">
      <div className="hud__cell hud__cell--score">
        <span className="hud__label">Score</span>
        <span className="hud__value">{hud.score.toLocaleString('en-US')}</span>
      </div>
      <div className="hud__cell">
        <span className="hud__label">Best</span>
        <span className="hud__value hud__value--gold">{Math.max(best, hud.score).toLocaleString('en-US')}</span>
      </div>
      <div className="hud__cell hud__cell--level">
        <span className="hud__label">Level {hud.levelIndex + 1}</span>
        <span className="hud__value hud__value--name">{level?.name}</span>
      </div>
      <div className="hud__cell">
        <span className="hud__label">Lives</span>
        <span className="hud__lives" aria-label={`${hud.lives} lives`}>
          {Array.from({ length: Math.min(hud.lives, 6) }, (_, i) => (
            <SkinCanvas key={i} skin={skin} size={24} />
          ))}
          {hud.lives === 0 && <span className="hud__value">0</span>}
        </span>
      </div>
      <div className="hud__cell">
        <span className="hud__label">Coins</span>
        <span className="hud__value hud__value--coins">
          <CoinIcon size={14} /> {coins.toLocaleString('en-US')}
        </span>
      </div>
      <ArcadeButton variant="ghost" size="sm" className="hud__pause" icon={<Pause size={18} />} onClick={onPause} disabled={!canPause} aria-label="Pause" />
      <div className={`hud__power ${hud.power > 0 ? 'is-on' : ''}`} aria-hidden={hud.power === 0}>
        <span>{theme.labels.power}</span>
        <i style={{ transform: `scaleX(${hud.power})` }} />
      </div>
      {hud.boost && (
        <div className="hud__boost">
          <Zap size={14} /> {theme.labels.boost}
        </div>
      )}
    </header>
  );
}
