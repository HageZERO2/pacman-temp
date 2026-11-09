import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ArcadeButton } from './ArcadeButton';
import { CoinCounter } from './CoinCounter';
import { useProgress } from '../hooks/useProgress';

interface Props {
  title: string;
  kicker?: string;
  onBack: () => void;
  children: ReactNode;
  className?: string;
}

/** Common frame for sub-screens: marquee header, back button and coin purse. */
export function ScreenShell({ title, kicker, onBack, children, className = '' }: Props) {
  const { coins } = useProgress();
  return (
    <section className={`shell ${className}`}>
      <header className="shell__bar">
        <ArcadeButton variant="ghost" size="sm" icon={<ArrowLeft size={18} />} onClick={onBack} aria-label="Back to main menu">
          Back
        </ArcadeButton>
        <div className="shell__title">
          {kicker && <span className="shell__kicker">{kicker}</span>}
          <h1>{title}</h1>
        </div>
        <CoinCounter coins={coins} />
      </header>
      <div className="shell__body">{children}</div>
    </section>
  );
}
