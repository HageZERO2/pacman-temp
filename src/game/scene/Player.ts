import Phaser from 'phaser';
import type { Maze } from '../maze';
import { advance, positionOf, reverse, type Mover } from '../movement';
import { OPPOSITE, type Dir, type MaybeDir } from '../types';
import { PLAYER_FRAMES, PLAYER_KEY, TILE } from './textures';

const ANGLES: Record<Dir, number> = { right: 0, left: 0, up: -90, down: 90 };

export interface PlayerLook {
  /** Rotate for up/down; otherwise the sprite stays upright and only mirrors. */
  rotate: boolean;
  /** Colour of a pulsing aura behind the player. */
  glow?: string;
}

export class Player {
  readonly mover: Mover;
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly aura?: Phaser.GameObjects.Image;
  /** Buffered input: applied at the next tile centre where it is legal. */
  wanted: MaybeDir = 'none';
  private facing: Dir = 'left';
  private horizontal: 'left' | 'right' = 'left';
  private chomp = 0;

  constructor(scene: Phaser.Scene, private maze: Maze, private look: PlayerLook, animateAura: boolean) {
    this.mover = { tile: { ...maze.playerStart }, dir: 'none', progress: 0 };
    if (look.glow) {
      this.aura = scene.add
        .image(0, 0, 'glow')
        .setTint(Phaser.Display.Color.HexStringToColor(look.glow).color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.05)
        .setAlpha(0.55)
        .setDepth(4.9);
      if (animateAura) {
        scene.tweens.add({ targets: this.aura, scale: { from: 0.85, to: 1.25 }, alpha: { from: 0.7, to: 0.3 }, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
    this.sprite = scene.add.sprite(0, 0, PLAYER_KEY, 2).setDepth(5);
    this.reset();
  }

  reset() {
    this.mover.tile = { ...this.maze.playerStart };
    this.mover.dir = 'none';
    this.mover.progress = 0;
    this.wanted = 'none';
    this.facing = 'left';
    this.horizontal = 'left';
    this.chomp = 0;
    this.sprite.setScale(1).setAngle(0).setAlpha(1).setVisible(true);
    this.aura?.setVisible(true);
    this.sync();
  }

  hideAura() {
    this.aura?.setVisible(false);
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
    if (m.dir === 'left' || m.dir === 'right') this.horizontal = m.dir;
    // Mouth animates with distance travelled, so it rests when blocked.
    if (moved > 0 && moved < 2) this.chomp += moved * 2.4;
    this.sync();
  }

  sync() {
    const p = positionOf(this.mover);
    const x = (p.x + 0.5) * TILE;
    const y = (p.y + 0.5) * TILE;
    this.sprite.setPosition(x, y);
    this.aura?.setPosition(x, y);
    if (this.look.rotate) {
      this.sprite.setFlipX(this.facing === 'left');
      this.sprite.setAngle(ANGLES[this.facing]);
    } else {
      this.sprite.setFlipX(this.horizontal === 'left');
    }
    const idx = Math.floor(this.chomp * PLAYER_FRAMES.length) % PLAYER_FRAMES.length;
    this.sprite.setFrame(this.mover.dir === 'none' && this.chomp === 0 ? 2 : PLAYER_FRAMES[idx]);
  }
}
