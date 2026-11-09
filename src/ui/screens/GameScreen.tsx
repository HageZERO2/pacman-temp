import { useCallback, useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { audio } from '../../core/audio';
import { DIFFICULTIES } from '../../core/difficulty';
import { progress } from '../../core/progress';
import { levelReward, type LevelReward, type LevelStats } from '../../core/rules';
import { GameBridge, type GamePhase, type HudState, type RunSummary } from '../../game/bridge';
import { LEVELS } from '../../game/levels';
import { getTheme } from '../../themes';
import type { Dir } from '../../game/types';
import { useProgress } from '../hooks/useProgress';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Hud } from '../play/Hud';
import { GameOverPanel, LevelCompletePanel, PauseMenu } from '../play/Panels';
import { TouchControls } from '../play/TouchControls';

type Result =
  | { kind: 'complete'; stats: LevelStats; reward: LevelReward; newBest: boolean }
  | { kind: 'over'; summary: RunSummary; newBest: boolean; coinsEarned: number };

async function fontsReady(fonts: string[]) {
  try {
    await Promise.all(fonts.map((f) => document.fonts.load(f)));
  } catch {
    // Fallback fonts are fine.
  }
}

export default function GameScreen({ startLevel, onQuit }: { startLevel: number; onQuit: () => void }) {
  const save = useProgress();
  // The run is configured once at mount; changing difficulty/skin mid-run is not allowed.
  const [session] = useState(() => {
    const s = progress.getState();
    return { difficulty: DIFFICULTIES[s.difficulty], skin: s.selectedSkin, theme: getTheme(s.theme), reducedEffects: s.settings.reducedEffects };
  });
  const hostRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<GameBridge | null>(null);
  const runCoins = useRef(0);
  const [phase, setPhase] = useState<GamePhase | 'loading'>('loading');
  const [hud, setHud] = useState<HudState>({ score: 0, lives: session.difficulty.lives, levelIndex: startLevel, power: 0, boost: false });
  const [result, setResult] = useState<Result | null>(null);

  const coarse = useMediaQuery('(pointer: coarse)');
  const showTouch = save.settings.touchControls === 'on' || (save.settings.touchControls === 'auto' && coarse);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const bridge = new GameBridge();
    bridgeRef.current = bridge;
    let game: Phaser.Game | null = null;
    let cancelled = false;

    bridge.events.on('hud', setHud);
    bridge.events.on('phase', setPhase);
    bridge.events.on('coins', (n) => {
      runCoins.current += n;
      progress.addCoins(n);
    });
    bridge.events.on('levelComplete', (stats) => {
      const prevBest = progress.getState().bestScore;
      const reward = levelReward(stats, session.difficulty.coinMultiplier);
      const finished = stats.levelIndex >= LEVELS.length - 1;
      runCoins.current += reward.total;
      progress.addCoins(reward.total);
      progress.completeLevel(stats.levelIndex, stats.levelScore, stats.score);
      progress.recordStats(stats.snowflakes, stats.enemiesCaught, finished);
      setResult({ kind: 'complete', stats, reward, newBest: stats.score > prevBest });
    });
    bridge.events.on('gameOver', (summary) => {
      const prevBest = progress.getState().bestScore;
      progress.recordScore(summary.score);
      progress.recordStats(summary.snowflakes, summary.enemiesCaught, true);
      setResult({ kind: 'over', summary, newBest: summary.score > prevBest, coinsEarned: runCoins.current });
    });

    void (async () => {
      await fontsReady(session.theme.canvasFonts);
      const { createGame } = await import('../../game/createGame');
      if (cancelled) return;
      game = createGame(host, { bridge, session, levelIndex: startLevel, score: 0, lives: session.difficulty.lives });
    })();

    const ro = new ResizeObserver(() => game?.scale.refresh());
    ro.observe(host);

    return () => {
      cancelled = true;
      ro.disconnect();
      game?.destroy(true);
      bridge.dispose();
      bridgeRef.current = null;
    };
  }, [session, startLevel]);

  const send = useCallback(<K extends 'pause' | 'resume' | 'restartLevel' | 'nextLevel'>(cmd: K) => {
    bridgeRef.current?.commands.emit(cmd, undefined);
  }, []);

  const newRun = useCallback((levelIndex: number) => {
    runCoins.current = 0;
    setResult(null);
    bridgeRef.current?.commands.emit('newRun', levelIndex);
  }, []);

  const quit = useCallback(() => {
    progress.recordScore(hud.score);
    onQuit();
  }, [hud.score, onQuit]);

  // Keyboard pause toggle + auto-pause when the tab is hidden.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape' && e.code !== 'Space' && e.code !== 'KeyP') return;
      if (phase === 'playing' || phase === 'ready') {
        e.preventDefault();
        send('pause');
      } else if (phase === 'paused') {
        e.preventDefault();
        send('resume');
      }
    };
    const onVisibility = () => {
      if (document.hidden) send('pause');
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [phase, send]);

  useEffect(() => {
    audio.setDucked(phase === 'paused' || result !== null);
    return () => audio.setDucked(false);
  }, [phase, result]);

  const onDirection = useCallback((d: Dir) => bridgeRef.current?.commands.emit('direction', d), []);
  const canPause = phase === 'playing' || phase === 'ready';

  return (
    <section className={`play ${showTouch ? 'play--touch' : ''}`}>
      <Hud hud={hud} best={save.bestScore} coins={save.coins} skin={session.skin} onPause={() => send('pause')} canPause={canPause} />
      <div className="play__stage">
        <div className="play__frame">
          <div ref={hostRef} className="play__host" />
          {phase === 'loading' && <div className="play__loading">Loading the maze…</div>}
        </div>
      </div>
      {showTouch && <TouchControls onDirection={onDirection} />}

      {phase === 'paused' && !result && (
        <PauseMenu settings={save.settings} onResume={() => send('resume')} onRestart={() => send('restartLevel')} onQuit={quit} />
      )}
      {result?.kind === 'complete' && (
        <LevelCompletePanel
          stats={result.stats}
          reward={result.reward}
          newBest={result.newBest}
          onNext={() => {
            setResult(null);
            send('nextLevel');
          }}
          onReplayCampaign={() => newRun(0)}
          onQuit={onQuit}
        />
      )}
      {result?.kind === 'over' && (
        <GameOverPanel
          summary={result.summary}
          best={save.bestScore}
          newBest={result.newBest}
          coinsEarned={result.coinsEarned}
          onRetry={() => newRun(result.summary.levelIndex)}
          onQuit={onQuit}
        />
      )}
    </section>
  );
}
