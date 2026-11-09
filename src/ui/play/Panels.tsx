import { Home, Play, RotateCcw, ChevronRight, Check, X, Trophy } from 'lucide-react';
import type { Settings } from '../../core/storage';
import type { LevelReward, LevelStats } from '../../core/rules';
import type { RunSummary } from '../../game/bridge';
import { LEVELS } from '../../game/levels';
import { levelLook } from '../../themes';
import { useTheme } from '../hooks/useTheme';
import { ArcadeButton } from '../components/ArcadeButton';
import { CoinIcon } from '../components/CoinCounter';
import { SoundSettings } from '../screens/SettingsScreen';
import { OverlayPanel } from './OverlayPanel';

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmt = (n: number) => n.toLocaleString('en-US');

export function PauseMenu({ settings, onResume, onRestart, onQuit }: {
  settings: Settings;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}) {
  return (
    <OverlayPanel title="Paused" kicker="Take a cocoa break" label="Pause menu">
      <div className="panel__buttons">
        <ArcadeButton variant="gold" size="lg" icon={<Play size={20} />} onClick={onResume} autoFocus>
          Resume
        </ArcadeButton>
        <ArcadeButton variant="ice" icon={<RotateCcw size={18} />} onClick={onRestart}>
          Restart level
        </ArcadeButton>
        <ArcadeButton variant="ghost" icon={<Home size={18} />} onClick={onQuit}>
          Main menu
        </ArcadeButton>
      </div>
      <div className="panel__section">
        <h3>Sound</h3>
        <SoundSettings settings={settings} />
      </div>
    </OverlayPanel>
  );
}

export function LevelCompletePanel({ stats, reward, newBest, onNext, onReplayCampaign, onQuit }: {
  stats: LevelStats;
  reward: LevelReward;
  newBest: boolean;
  onNext: () => void;
  onReplayCampaign: () => void;
  onQuit: () => void;
}) {
  const theme = useTheme();
  const last = stats.levelIndex >= LEVELS.length - 1;
  return (
    <OverlayPanel
      title={last ? 'Christmas Saved!' : 'Level Complete'}
      kicker={last ? 'You cleared every maze' : levelLook(theme, stats.levelIndex).name}
      tone="gold"
      label="Level complete"
    >
      {newBest && <div className="badge-new"><Trophy size={16} /> New best score</div>}
      <dl className="tally">
        <div><dt>Level score</dt><dd>{fmt(stats.levelScore)}</dd></div>
        <div><dt>Total score</dt><dd>{fmt(stats.score)}</dd></div>
        <div><dt>{theme.labels.pellets}</dt><dd>{stats.snowflakes}</dd></div>
        <div><dt>{theme.labels.foes}</dt><dd>{stats.enemiesCaught}</dd></div>
        <div><dt>Stars · Gifts</dt><dd>{stats.stars}/{stats.totalStars} · {stats.gifts}</dd></div>
        <div><dt>Time</dt><dd>{fmtTime(stats.seconds)}</dd></div>
      </dl>
      <ul className="challenges">
        <li className="is-done">
          <Check size={16} /> Level cleared <span><CoinIcon size={14} /> +{reward.base}</span>
        </li>
        {reward.challenges.map((c) => (
          <li key={c.id} className={c.done ? 'is-done' : ''}>
            {c.done ? <Check size={16} /> : <X size={16} />} {c.label}
            <span><CoinIcon size={14} /> {c.done ? `+${c.coins}` : c.coins}</span>
          </li>
        ))}
      </ul>
      <div className="earned">
        <CoinIcon size={22} /> +{reward.total} coins earned
      </div>
      <div className="panel__buttons">
        {last ? (
          <ArcadeButton variant="gold" size="lg" icon={<RotateCcw size={20} />} onClick={onReplayCampaign} autoFocus>
            Play again
          </ArcadeButton>
        ) : (
          <ArcadeButton variant="gold" size="lg" icon={<ChevronRight size={22} />} onClick={onNext} autoFocus>
            Next level
          </ArcadeButton>
        )}
        <ArcadeButton variant="ghost" icon={<Home size={18} />} onClick={onQuit}>
          Main menu
        </ArcadeButton>
      </div>
    </OverlayPanel>
  );
}

export function GameOverPanel({ summary, best, newBest, coinsEarned, onRetry, onQuit }: {
  summary: RunSummary;
  best: number;
  newBest: boolean;
  coinsEarned: number;
  onRetry: () => void;
  onQuit: () => void;
}) {
  const theme = useTheme();
  return (
    <OverlayPanel title="Game Over" kicker="The blizzard wins this round" tone="red" label="Game over">
      {newBest && <div className="badge-new"><Trophy size={16} /> New best score</div>}
      <div className="final-score">
        <span>Final score</span>
        <strong>{fmt(summary.score)}</strong>
      </div>
      <dl className="tally">
        <div><dt>Best</dt><dd>{fmt(best)}</dd></div>
        <div><dt>Reached</dt><dd>{levelLook(theme, summary.levelIndex).name}</dd></div>
        <div><dt>{theme.labels.pellets}</dt><dd>{summary.snowflakes}</dd></div>
        <div><dt>{theme.labels.foes}</dt><dd>{summary.enemiesCaught}</dd></div>
        <div><dt>Gifts</dt><dd>{summary.gifts}</dd></div>
        <div><dt>Coins this run</dt><dd>{coinsEarned}</dd></div>
      </dl>
      <div className="panel__buttons">
        <ArcadeButton variant="gold" size="lg" icon={<RotateCcw size={20} />} onClick={onRetry} autoFocus>
          Try again
        </ArcadeButton>
        <ArcadeButton variant="ghost" icon={<Home size={18} />} onClick={onQuit}>
          Main menu
        </ArcadeButton>
      </div>
    </OverlayPanel>
  );
}
