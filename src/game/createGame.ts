import Phaser from 'phaser';
import { LEVELS } from './levels';
import { Maze } from './maze';
import { GameScene, type SceneData } from './scene/GameScene';
import { TILE } from './scene/textures';

/** Boots a Phaser instance into `parent`. The caller owns it and must call `game.destroy(true)`. */
export function createGame(parent: HTMLElement, data: SceneData): Phaser.Game {
  const maze = new Maze(LEVELS[data.levelIndex].map);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: maze.width * TILE,
    height: maze.height * TILE,
    backgroundColor: '#050b1e',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, powerPreference: 'high-performance' },
    input: { keyboard: true, touch: true },
    disableContextMenu: true,
  });
  game.scene.add('game', GameScene, true, data);
  // Dev-only handle for automated browser checks; stripped from production builds.
  if (import.meta.env.DEV) (window as unknown as { __winterMaze?: Phaser.Game }).__winterMaze = game;
  return game;
}
