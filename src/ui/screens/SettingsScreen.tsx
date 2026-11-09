import { useState } from 'react';
import { RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { progress } from '../../core/progress';
import type { Settings } from '../../core/storage';
import { ArcadeButton } from '../components/ArcadeButton';
import { Segmented, Slider, Toggle } from '../components/Controls';
import { ScreenShell } from '../components/ScreenShell';
import { useProgress } from '../hooks/useProgress';
import type { Navigate } from '../navigation';

/** Volume controls, shared by the settings screen and the pause menu. */
export function SoundSettings({ settings }: { settings: Settings }) {
  const set = (patch: Partial<Settings>) => progress.updateSettings(patch);
  return (
    <div className="sound-settings">
      <Toggle label="Sound" hint={settings.muted ? 'Muted' : 'On'} checked={!settings.muted} onChange={(on) => set({ muted: !on })} />
      <Slider label="Master" value={settings.master} disabled={settings.muted} onChange={(master) => set({ master })} />
      <Slider label="Music" value={settings.music} disabled={settings.muted} onChange={(music) => set({ music })} />
      <Slider label="Effects" value={settings.sfx} disabled={settings.muted} onChange={(sfx) => set({ sfx })} />
    </div>
  );
}

export function SettingsScreen({ nav }: { nav: Navigate }) {
  const { settings } = useProgress();
  const [confirm, setConfirm] = useState(false);
  return (
    <ScreenShell title="Settings" kicker="Tune the workshop" onBack={() => nav.go('menu')}>
      <div className="settings">
        <section className="board">
          <h2>{settings.muted ? <VolumeX size={20} /> : <Volume2 size={20} />} Sound</h2>
          <SoundSettings settings={settings} />
        </section>

        <section className="board">
          <h2>Display &amp; Controls</h2>
          <Toggle
            label="Reduced effects"
            hint="Less snow, no twinkling — easier on older devices"
            checked={settings.reducedEffects}
            onChange={(reducedEffects) => progress.updateSettings({ reducedEffects })}
          />
          <Segmented
            label="Touch controls"
            value={settings.touchControls}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'on', label: 'Always' },
              { value: 'off', label: 'Hidden' },
            ]}
            onChange={(touchControls) => progress.updateSettings({ touchControls })}
          />
          <dl className="keys">
            <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows</dt><dd>Move (turns are buffered)</dd></div>
            <div><dt><kbd>Esc</kbd> / <kbd>Space</kbd></dt><dd>Pause / resume</dd></div>
            <div><dt>Swipe / D-pad</dt><dd>Move on touch screens</dd></div>
          </dl>
        </section>

        <section className="board board--danger">
          <h2>Save Data</h2>
          <p>Progress is saved automatically in this browser. Resetting clears score, coins, skins and unlocked levels (settings are kept).</p>
          {confirm ? (
            <div className="confirm">
              <ArcadeButton
                variant="danger"
                onClick={() => {
                  progress.reset();
                  setConfirm(false);
                }}
              >
                Yes, reset everything
              </ArcadeButton>
              <ArcadeButton variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </ArcadeButton>
            </div>
          ) : (
            <ArcadeButton variant="ghost" icon={<RotateCcw size={16} />} onClick={() => setConfirm(true)}>
              Reset progress
            </ArcadeButton>
          )}
        </section>
      </div>
    </ScreenShell>
  );
}
