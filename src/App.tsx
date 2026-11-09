import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { audio } from './core/audio';
import { Backdrop } from './ui/components/Backdrop';
import { useProgress } from './ui/hooks/useProgress';
import type { Navigate, ScreenId } from './ui/navigation';
import { DifficultyScreen } from './ui/screens/DifficultyScreen';
import { LevelSelect } from './ui/screens/LevelSelect';
import { MainMenu } from './ui/screens/MainMenu';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { SkinsScreen } from './ui/screens/SkinsScreen';

// Phaser is only downloaded once the player actually starts a game.
const GameScreen = lazy(() => import('./ui/screens/GameScreen'));

export default function App() {
  const { settings } = useProgress();
  const [screen, setScreen] = useState<ScreenId>('menu');
  const [level, setLevel] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => audio.applySettings(settings), [settings]);

  // Browsers block audio until a user gesture; music starts on the first one.
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    audio.playMusic(screen === 'game' ? 'game' : 'menu');
  }, [screen]);

  const nav: Navigate = {
    go: setScreen,
    play: (levelIndex) => {
      setLevel(levelIndex);
      setRunId((r) => r + 1);
      setScreen('game');
    },
  };
  const toMenu = useCallback(() => setScreen('menu'), []);

  return (
    <div className="app">
      <Backdrop dimmed={screen === 'game'} />
      <main className="app__stage" key={screen === 'game' ? `game-${runId}` : screen}>
        {screen === 'menu' && <MainMenu nav={nav} />}
        {screen === 'levels' && <LevelSelect nav={nav} />}
        {screen === 'difficulty' && <DifficultyScreen nav={nav} />}
        {screen === 'skins' && <SkinsScreen nav={nav} />}
        {screen === 'settings' && <SettingsScreen nav={nav} />}
        {screen === 'game' && (
          <Suspense fallback={<div className="play__loading play__loading--page">Loading the maze…</div>}>
            <GameScreen startLevel={level} onQuit={toMenu} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
