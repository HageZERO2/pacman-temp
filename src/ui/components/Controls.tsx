import { useId } from 'react';
import { audio } from '../../core/audio';

export function Slider({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const id = useId();
  const pct = Math.round(value * 100);
  return (
    <div className={`slider ${disabled ? 'is-disabled' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={pct}
        disabled={disabled}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={() => audio.play('click')}
      />
      <output htmlFor={id}>{pct}</output>
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => {
          audio.play('click');
          onChange(e.target.checked);
        }}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      <span className="segmented__label">{label}</span>
      <div className="segmented__options">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'is-on' : ''}
            onClick={() => {
              audio.play('click');
              onChange(o.value);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
