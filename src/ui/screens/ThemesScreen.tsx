import { useState } from 'react';
import { Check } from 'lucide-react';
import { audio } from '../../core/audio';
import { THEME_ORDER, getTheme } from '../../themes';
import { themeManager } from '../../themes/ThemeManager';
import { ScreenShell } from '../components/ScreenShell';
import { ThemePreview } from '../components/ThemePreview';
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import { useProgress } from '../hooks/useProgress';
import type { Navigate } from '../navigation';

export function ThemesScreen({ nav }: { nav: Navigate }) {
  const save = useProgress();
  const [hovered, setHovered] = useState<string | null>(null);
  const narrow = useMediaQuery('(max-width: 760px)');
  const small = useMediaQuery('(max-width: 420px)');
  const reducedMotion = useReducedMotion();
  const still = save.settings.reducedEffects || reducedMotion;
  const previewWidth = small ? 300 : narrow ? 380 : 440;

  return (
    <ScreenShell title="Themes" kicker="Pick a world · same game, new look" onBack={() => nav.go('menu')}>
      <div className="themes" role="radiogroup" aria-label="Game theme">
        {THEME_ORDER.map((id, i) => {
          const theme = getTheme(id);
          const active = save.theme === id;
          return (
            // Each card carries its own data-theme so CSS variables render it in that theme's fonts and colours.
            <article
              key={id}
              data-theme={id}
              className={`theme-card ${active ? 'is-active' : ''}`}
              style={{ ['--i' as string]: i }}
              onPointerEnter={() => setHovered(id)}
              onPointerLeave={() => setHovered((h) => (h === id ? null : h))}
            >
              <div className="theme-card__art">
                <ThemePreview theme={theme} skin={save.selectedSkin} width={previewWidth} animate={!still && (hovered === id || active)} />
                {active && (
                  <span className="theme-card__badge">
                    <Check size={14} /> Active
                  </span>
                )}
              </div>
              <div className="theme-card__body">
                <div className="theme-card__head">
                  <h2>{theme.name}</h2>
                  <span className="theme-card__tag">{theme.tagline}</span>
                </div>
                <p>{theme.description}</p>
                <div className="theme-card__foot">
                  <ul className="theme-card__swatches" aria-label="Palette">
                    {theme.swatches.map((c) => (
                      <li key={c} style={{ background: c }} />
                    ))}
                  </ul>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${active ? 'Active' : 'Select'} ${theme.name}`}
                    className="theme-card__select"
                    disabled={active}
                    onClick={() => {
                      audio.play('buy');
                      themeManager.select(id);
                    }}
                  >
                    {active ? 'Active' : 'Select'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </ScreenShell>
  );
}
