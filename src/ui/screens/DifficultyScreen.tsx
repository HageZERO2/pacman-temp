import { Check, Heart } from 'lucide-react';
import { audio } from '../../core/audio';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../../core/difficulty';
import { progress } from '../../core/progress';
import { ScreenShell } from '../components/ScreenShell';
import { useProgress } from '../hooks/useProgress';
import type { Navigate } from '../navigation';

function Meter({ label, value }: { label: string; value: number }) {
  const lit = Math.round(value * 10);
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter__cells" aria-label={`${label} ${lit} of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < lit ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}

export function DifficultyScreen({ nav }: { nav: Navigate }) {
  const save = useProgress();
  return (
    <ScreenShell title="Difficulty" kicker="How fierce is the blizzard?" onBack={() => nav.go('menu')}>
      <div className="difficulty" role="radiogroup" aria-label="Difficulty">
        {DIFFICULTY_ORDER.map((id) => {
          const d = DIFFICULTIES[id];
          const active = save.difficulty === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              className={`dial dial--${id} ${active ? 'is-active' : ''}`}
              onClick={() => {
                audio.play('click');
                progress.setDifficulty(id);
              }}
            >
              <span className="dial__led" aria-hidden="true" />
              <span className="dial__name">{d.label}</span>
              <span className="dial__tag">{d.tagline}</span>
              <span className="dial__lives" aria-label={`${d.lives} lives`}>
                {Array.from({ length: d.lives }, (_, i) => (
                  <Heart key={i} size={18} fill="currentColor" />
                ))}
              </span>
              <Meter label="Monster speed" value={(d.enemySpeed - 0.5) / 0.5} />
              <Meter label="Aggression" value={d.aggression} />
              <Meter label="Freeze time" value={d.frightenedSeconds / 10} />
              <span className="dial__coins">×{d.coinMultiplier} coin reward</span>
              <span className="dial__state">{active ? <><Check size={16} /> Selected</> : 'Select'}</span>
            </button>
          );
        })}
      </div>
    </ScreenShell>
  );
}
