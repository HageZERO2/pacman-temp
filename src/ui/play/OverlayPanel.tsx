import type { ReactNode } from 'react';

interface Props {
  title: string;
  tone?: 'gold' | 'red' | 'ice';
  kicker?: string;
  children: ReactNode;
  label: string;
}

/** Modal overlay styled as a framed arcade marquee. */
export function OverlayPanel({ title, tone = 'ice', kicker, children, label }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={label}>
      <div className={`panel panel--${tone}`}>
        <div className="panel__icicles" aria-hidden="true" />
        {kicker && <div className="panel__kicker">{kicker}</div>}
        <h2 className="panel__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
