import { Lock, Play } from 'lucide-react';
import { LEVELS } from '../../game/levels';
import { ArcadeButton } from '../components/ArcadeButton';
import { MazePreview } from '../components/MazePreview';
import { ScreenShell } from '../components/ScreenShell';
import { useProgress } from '../hooks/useProgress';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTheme } from '../hooks/useTheme';
import { levelLook } from '../../themes';
import type { Navigate } from '../navigation';

export function LevelSelect({ nav }: { nav: Navigate }) {
  const save = useProgress();
  const small = useMediaQuery('(max-width: 720px)');
  const theme = useTheme();
  return (
    <ScreenShell title="Level Select" kicker="Choose your route" onBack={() => nav.go('menu')}>
      <div className="levels">
        {LEVELS.map((level, i) => {
          const locked = i > save.unlockedLevel;
          const best = save.levelBest[level.id] ?? 0;
          const look = levelLook(theme, i);
          return (
            <article
              key={level.id}
              className={`ticket ${locked ? 'is-locked' : ''}`}
              style={{ ['--accent' as string]: look.accent, ['--sky' as string]: look.background[0] }}
            >
              <div className="ticket__stub">
                <span className="ticket__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="ticket__sub">{level.subtitle}</span>
              </div>
              <div className="ticket__preview">
                <MazePreview levelIndex={i} width={small ? 150 : 190} />
                {locked && (
                  <div className="ticket__lock">
                    <Lock size={30} />
                    <span>Clear level {i} to unlock</span>
                  </div>
                )}
              </div>
              <div className="ticket__info">
                <h2>{look.name}</h2>
                <p>{look.description}</p>
                <div className="ticket__meta">
                  <span>Best</span>
                  <strong>{best ? best.toLocaleString('en-US') : '—'}</strong>
                </div>
                <ArcadeButton
                  variant={locked ? 'ghost' : 'gold'}
                  icon={locked ? <Lock size={16} /> : <Play size={16} />}
                  disabled={locked}
                  onClick={() => nav.play(i)}
                >
                  {locked ? 'Locked' : 'Play'}
                </ArcadeButton>
              </div>
            </article>
          );
        })}
      </div>
    </ScreenShell>
  );
}
