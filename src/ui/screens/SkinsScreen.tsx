import { useState } from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { audio } from '../../core/audio';
import { progress } from '../../core/progress';
import { SKINS, getSkin } from '../../core/skins';
import type { SkinId } from '../../game/types';
import { ArcadeButton } from '../components/ArcadeButton';
import { CoinIcon } from '../components/CoinCounter';
import { ScreenShell } from '../components/ScreenShell';
import { SkinCanvas } from '../components/SkinCanvas';
import { useProgress } from '../hooks/useProgress';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Navigate } from '../navigation';

export function SkinsScreen({ nav }: { nav: Navigate }) {
  const save = useProgress();
  const [viewing, setViewing] = useState<SkinId>(save.selectedSkin);
  const [flash, setFlash] = useState<string | null>(null);
  const small = useMediaQuery('(max-width: 720px)');
  const skin = getSkin(viewing);
  const owned = save.unlockedSkins.includes(viewing);
  const equipped = save.selectedSkin === viewing;
  const missing = skin.price - save.coins;

  const buy = () => {
    if (progress.buySkin(viewing)) {
      audio.play('buy');
      setFlash(`${skin.name} unlocked!`);
    } else {
      audio.play('denied');
      setFlash(`Need ${missing} more coins`);
    }
    window.setTimeout(() => setFlash(null), 1800);
  };

  return (
    <ScreenShell title="Skins" kicker="Cosmetic only · no gameplay advantage" onBack={() => nav.go('menu')}>
      <div className="skins">
        <div className="showcase" style={{ ['--skin' as string]: skin.color }}>
          <div className="showcase__spot" aria-hidden="true" />
          <SkinCanvas key={viewing} skin={viewing} size={small ? 150 : 210} animate={owned} locked={!owned} className="showcase__hero" />
          <div className="showcase__pedestal" aria-hidden="true" />
          <h2>{skin.name}</h2>
          <p>{owned ? skin.description : 'Locked — unlock it with coins earned by clearing levels and challenges.'}</p>
          <div className="showcase__actions">
            {equipped ? (
              <ArcadeButton variant="ghost" icon={<Check size={18} />} disabled>
                Equipped
              </ArcadeButton>
            ) : owned ? (
              <ArcadeButton variant="ice" onClick={() => progress.selectSkin(viewing)}>
                Equip
              </ArcadeButton>
            ) : (
              <ArcadeButton variant="gold" sound={null} icon={<CoinIcon size={18} />} onClick={buy} aria-disabled={missing > 0}>
                Unlock · {skin.price}
              </ArcadeButton>
            )}
          </div>
          <p className="showcase__note" role="status">
            {flash ?? (!owned && missing > 0 ? `You need ${missing} more coins` : '\u00a0')}
          </p>
        </div>

        <div className="racks" aria-label="Skin collection">
          {[SKINS.slice(0, 3), SKINS.slice(3)].map((row, r) => (
          <ul className="ornaments" key={r}>
          {row.map((s, j) => {
            const i = r * 3 + j;
            const has = save.unlockedSkins.includes(s.id);
            return (
              <li key={s.id} style={{ ['--i' as string]: i, ['--skin' as string]: s.color }}>
                <button
                  type="button"
                  className={`ornament ${viewing === s.id ? 'is-viewing' : ''} ${has ? '' : 'is-locked'}`}
                  aria-pressed={viewing === s.id}
                  aria-label={`${s.name}${has ? '' : `, locked, ${s.price} coins`}`}
                  onClick={() => {
                    audio.play('hover');
                    setViewing(s.id);
                  }}
                >
                  <span className="ornament__cap" aria-hidden="true" />
                  <SkinCanvas skin={s.id} size={small ? 64 : 78} locked={!has} />
                  <span className="ornament__name">{s.name}</span>
                  <span className="ornament__price">
                    {save.selectedSkin === s.id ? (
                      <><Sparkles size={12} /> On</>
                    ) : has ? (
                      'Owned'
                    ) : (
                      <><Lock size={11} /> {s.price}</>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          </ul>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}
