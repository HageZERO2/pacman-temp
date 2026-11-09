import Phaser from 'phaser';
import type { Maze } from '../maze';
import { advance, positionOf, reverse, type Mover } from '../movement';
import { OPPOSITE, type Dir, type MaybeDir, type SkinId } from '../types';
import { PLAYER_FRAMES, TILE, playerKey } from './textures';

const ANGLES: Record<Dir, number> = { right: 0, left: 0, up: -90, down: 90 };

export class Player {
  readonly mover: Mover;
  readonly sprite: Phaser.GameObjects.Sprite;
  /** Buffered input: applied at the next tile centre where it is legal. */
  wanted: MaybeDir = 'none';
  private facing: Dir = 'left';
  private chomp = 0;

  constructor(scene: Phaser.Scene, private maze: Maze, skin: SkinId) {
    this.mover = { tile: { ...maze.playerStart }, dir: 'none', progress: 0 };
    this.sprite = scene.add.sprite(0, 0, playerKey(skin), 2).setDepth(5);
    this.reset();
  }

  reset() {
    this.mover.tile = { ...this.maze.playerStart };
    this.mover.dir = 'none';
    this.mover.progress = 0;
    this.wanted = 'none';
    this.facing = 'left';
    this.chomp = 0;
    this.sprite.setScale(1).setAngle(0).setAlpha(1).setVisible(true);
    this.sync();
  }

  private canEnter = (c: { x: number; y: number }) => this.maze.canEnter(c.x, c.y);

  update(distance: number) {
    const m = this.mover;
    if (this.wanted !== 'none' && m.dir !== 'none' && this.wanted === OPPOSITE[m.dir]) reverse(this.maze, m);
    const before = positionOf(m);
    advance(this.maze, m, distance, {
      canEnter: this.canEnter,
      decide: (mv) => {
        if (this.wanted !== 'none') {
          const n = this.maze.step(mv.tile, this.wanted);
          if (this.maze.canEnter(n.x, n.y)) return this.wanted;
        }
        return mv.dir;
      },
    });
    const after = positionOf(m);
    const moved = Math.abs(after.x - before.x) + Math.abs(after.y - before.y);
    if (m.dir !== 'none') this.facing = m.dir;
    // Mouth animates with distance travelled, so it rests when blocked.
    if (moved > 0 && moved < 2) this.chomp += moved * 2.4;
    this.sync();
  }

  sync() {
    const p = positionOf(this.mover);
    this.sprite.setPosition((p.x + 0.5) * TILE, (p.y + 0.5) * TILE);
    this.sprite.setFlipX(this.facing === 'left');
    this.sprite.setAngle(ANGLES[this.facing]);
    const idx = Math.floor(this.chomp * PLAYER_FRAMES.length) % PLAYER_FRAMES.length;
    this.sprite.setFrame(this.mover.dir === 'none' && this.chomp === 0 ? 2 : PLAYER_FRAMES[idx]);
  }
}
