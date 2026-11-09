import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { audio } from '../../core/audio';

type Variant = 'primary' | 'gold' | 'ice' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  /** Sound played on click; `null` for silent buttons. */
  sound?: 'click' | 'buy' | null;
}

export function ArcadeButton({ variant = 'primary', size = 'md', icon, sound = 'click', className = '', children, onClick, onPointerEnter, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`abtn abtn--${variant} abtn--${size} ${className}`}
      onClick={(e) => {
        if (sound) audio.play(sound);
        onClick?.(e);
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse' && !rest.disabled) audio.play('hover');
        onPointerEnter?.(e);
      }}
      {...rest}
    >
      {icon && <span className="abtn__icon">{icon}</span>}
      {children && <span className="abtn__label">{children}</span>}
    </button>
  );
}
