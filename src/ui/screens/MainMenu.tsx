import { useEffect, useState } from 'react';
import { Play, Map, Gauge, Shirt, Settings2, Trophy } from 'lucide-react';
import { audio } from '../../core/audio';
import { DIFFICULTIES } from '../../core/difficulty';
import { getSkin } from '../../core/skins';
import { LEVELS } from '../../game/levels';
import { AttractStrip } from '../components/AttractStrip';
import { CoinCounter } from '../components/CoinCounter';
import { Logo } from '../components/Logo';
import { SkinCanvas } from '../components/SkinCanvas';
import { useProgress } from '../hooks/useProgress';
import { useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery';
import type { Navigate, ScreenId } from '../navigation';

interface Item {
  id: ScreenId | 'play';
  label: string;
  icon: typeof Play;
  hint: (ctx: { difficulty: string; skin: string; unlocked: number }) => string;
}

const ITEMS: Item[] = [
  { id: 'play', label: 'Play', icon: Play, hint: () => 'Start from Level 1' },
  { id: 'levels', label: 'Level Select', icon: Map, hint: ({ unlocked }) => `${unlocked} of ${LEVELS.length} unlocked` },
  { id: 'difficulty', label: 'Difficulty', icon: Gauge, hint: ({ difficulty }) => difficulty },
  { id: 'skins', label: 'Skins', icon: Shirt, hint: ({ skin }) => skin },
  { id: 'settings', label: 'Settings', icon: Settings2, hint: () => 'Sound · Display · Data' },
];

const pad = (n: number) => String(n).padStart(7, '0');

export function MainMenu({ nav }: { nav: Navigate }) {
  const save = useProgress();
  const [sel, setSel] = useState(0);
  const reducedMotion = useReducedMotion();
  const narrow = useMediaQuery('(max-width: 560px)');
  const animate = !save.settings.reducedEffects && !reducedMotion;

  const activate = (i: number) => {
    const item = ITEMS[i];
    audio.play('click');
    if (item.id === 'play') nav.play(0);
    else nav.go(item.id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        setSel((s) => (s + 1) % ITEMS.length);
        audio.play('hover');
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        setSel((s) => (s - 1 + ITEMS.length) % ITEMS.length);
        audio.play('hover');
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        // Let focused buttons handle Enter natively to avoid double activation.
        if (document.activeElement instanceof HTMLButtonElement) return;
        e.preventDefault();
        activate(sel);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const ctx = {
    difficulty: DIFFICULTIES[save.difficulty].label,
    skin: getSkin(save.selectedSkin).name,
    unlocked: save.unlockedLevel + 1,
  };

  return (
    <section className="menu">
      <div className="menu__top">
        <CoinCounter coins={save.coins} />
      </div>

      <Logo />

      <div className="menu__cabinet">
        <nav className="menu__list" aria-label="Main menu">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            const active = i === sel;
            return (
              <button
                key={item.id}
                type="button"
                className={`menu__item ${active ? 'is-active' : ''} ${item.id === 'play' ? 'menu__item--play' : ''}`}
                onPointerEnter={() => {
                  if (sel !== i) audio.play('hover');
                  setSel(i);
                }}
                onFocus={() => setSel(i)}
                onClick={() => activate(i)}
              >
                <span className="menu__cursor" aria-hidden="true">
                  {active && <SkinCanvas skin={save.selectedSkin} size={44} animate={animate} />}
                </span>
                <Icon className="menu__icon" size={22} aria-hidden="true" />
                <span className="menu__label">{item.label}</span>
                <span className="menu__hint">{item.hint(ctx)}</span>
                <span className="menu__dots" aria-hidden="true">
                  <i /><i /><i />
                </span>
              </button>
            );
          })}
        </nav>

        <aside className="hiscore" aria-label="Best score">
          <div className="hiscore__head">
            <Trophy size={18} aria-hidden="true" /> Best Score
          </div>
          <div className="hiscore__value">{pad(save.bestScore)}</div>
          <dl className="hiscore__stats">
            <div><dt>Runs</dt><dd>{save.stats.gamesPlayed}</dd></div>
            <div><dt>Snowflakes</dt><dd>{save.stats.snowflakes.toLocaleString('en-US')}</dd></div>
            <div><dt>Foes frozen</dt><dd>{save.stats.enemiesCaught}</dd></div>
          </dl>
        </aside>
      </div>

      <AttractStrip skin={save.selectedSkin} width={narrow ? 320 : 520} animate={animate} />

      <p className="menu__help">
        <kbd>↑</kbd><kbd>↓</kbd> choose · <kbd>Enter</kbd> select · Move with <kbd>WASD</kbd> / arrows · <kbd>Esc</kbd> pause
      </p>
    </section>
  );
}
