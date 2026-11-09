import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import type { Dir } from '../../game/types';

const BUTTONS: { dir: Dir; Icon: typeof ChevronUp; label: string }[] = [
  { dir: 'up', Icon: ChevronUp, label: 'Up' },
  { dir: 'left', Icon: ChevronLeft, label: 'Left' },
  { dir: 'right', Icon: ChevronRight, label: 'Right' },
  { dir: 'down', Icon: ChevronDown, label: 'Down' },
];

/** On-screen D-pad. Fires on pointer-down for zero-latency turns. */
export function TouchControls({ onDirection }: { onDirection: (d: Dir) => void }) {
  return (
    <div className="dpad" role="group" aria-label="Direction pad">
      {BUTTONS.map(({ dir, Icon, label }) => (
        <button
          key={dir}
          type="button"
          className={`dpad__btn dpad__btn--${dir}`}
          aria-label={label}
          onPointerDown={(e) => {
            e.preventDefault();
            navigator.vibrate?.(8);
            onDirection(dir);
          }}
        >
          <Icon size={34} strokeWidth={3} />
        </button>
      ))}
      <span className="dpad__hub" aria-hidden="true" />
    </div>
  );
}
