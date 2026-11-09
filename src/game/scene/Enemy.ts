import Phaser from 'phaser';
import { ENEMY_PROFILES, greedyDirection, pathDirection, randomDirection } from '../ai';
import type { Maze } from '../maze';
import { advance, positionOf, reverse, type Mover } from '../movement';
import type { Cell, EnemyKind, EnemyMode, MaybeDir } from '../types';
import { EYE_FRAME_DIRS as EYE_DIRS } from '../../themes/types';
import { TILE, enemyKey } from './textures';

export interface EnemyBrain {
  /** Global wave mode the enemy should follow when not frightened/eaten. */
  wave: 'scatter' | 'chase';
  player: Cell;
  playerDir: MaybeDir;
  leader: Cell;
  aggression: number;
  smartPathing: boolean;
  rng: () => number;
}

export class Enemy {
  readonly mover: Mover;
  readonly body: Phaser.GameObjects.Sprite;
  readonly eyes: Phaser.GameObjects.Sprite;
  mode: EnemyMode = 'house';
  releaseIn = 0;
  private pendingReverse = false;
  private anim = 0;
  private bob = 0;

  constructor(
    scene: Phaser.Scene,
    private maze: Maze,
    readonly kind: EnemyKind,
    private readonly home: Cell,
    private readonly startsOutside: boolean,
  ) {
    this.mover = { tile: { ...home }, dir: 'none', progress: 0 };
    this.body = scene.add.sprite(0, 0, enemyKey(kind), 0).setDepth(4);
    this.eyes = scene.add.sprite(0, 0, 'eyes', 2).setDepth(4.1);
  }

  reset(releaseIn: number) {
    this.mover.progress = 0;
    this.pendingReverse = false;
    if (this.startsOutside) {
      this.mover.tile = { ...this.maze.exit };
      this.mover.dir = 'left';
      this.mode = 'scatter';
    } else {
      this.mover.tile = { ...this.home };
      this.mover.dir = 'none';
      this.mode = 'house';
    }
    this.releaseIn = releaseIn;
    this.body.setVisible(true).setAlpha(1).setScale(1);
    this.eyes.setVisible(true).setAlpha(1);
    this.render(false);
  }

  get position() {
    return positionOf(this.mover);
  }

  get isDangerous() {
    return this.mode === 'scatter' || this.mode === 'chase' || this.mode === 'leaving';
  }

  get isActive() {
    return this.mode === 'scatter' || this.mode === 'chase';
  }

  frighten() {
    if (!this.isActive) return;
    this.mode = 'frightened';
    this.pendingReverse = true;
  }

  calm(wave: 'scatter' | 'chase') {
    if (this.mode === 'frightened') this.mode = wave;
  }

  waveChanged(wave: 'scatter' | 'chase') {
    if (this.isActive) {
      this.mode = wave;
      this.pendingReverse = true;
    }
  }

  eat() {
    this.mode = 'eaten';
  }

  update(dt: number, speed: number, brain: EnemyBrain) {
    this.anim += dt;
    if (this.mode === 'house') {
      this.bob += dt * 5;
      this.releaseIn -= dt;
      if (this.releaseIn <= 0) this.mode = 'leaving';
      return;
    }
    if (this.pendingReverse) {
      this.pendingReverse = false;
      reverse(this.maze, this.mover);
    }
    const throughHouse = this.mode === 'leaving' || this.mode === 'eaten';
    advance(this.maze, this.mover, speed * dt, {
      canEnter: (c) => this.maze.canEnter(c.x, c.y, throughHouse),
      decide: (m) => this.decide(m, brain),
      onArrive: (m) => {
        if (this.mode === 'leaving' && m.tile.x === this.maze.exit.x && m.tile.y === this.maze.exit.y) {
          this.mode = brain.wave;
        } else if (this.mode === 'eaten' && m.tile.x === this.maze.houseCenter.x && m.tile.y === this.maze.houseCenter.y) {
          this.mode = 'leaving';
        }
      },
    });
  }

  private decide(m: Mover, brain: EnemyBrain): MaybeDir {
    const maze = this.maze;
    switch (this.mode) {
      case 'leaving':
        return maze.firstStepTowards(m.tile, maze.exit, true) ?? greedyDirection(maze, m.tile, m.dir, maze.exit, true);
      case 'eaten':
        return maze.firstStepTowards(m.tile, maze.houseCenter, true) ?? greedyDirection(maze, m.tile, m.dir, maze.houseCenter, true);
      case 'frightened':
        return randomDirection(maze, m.tile, m.dir, brain.rng);
      case 'scatter':
        return greedyDirection(maze, m.tile, m.dir, ENEMY_PROFILES[this.kind].corner(maze));
      case 'chase': {
        if (brain.rng() > brain.aggression) return randomDirection(maze, m.tile, m.dir, brain.rng);
        const target = ENEMY_PROFILES[this.kind].chaseTarget({
          player: brain.player,
          playerDir: brain.playerDir,
          self: m.tile,
          leader: brain.leader,
          maze,
        });
        return brain.smartPathing
          ? pathDirection(maze, m.tile, m.dir, target)
          : greedyDirection(maze, m.tile, m.dir, target);
      }
      default:
        return 'none';
    }
  }

  render(powerEnding: boolean) {
    const p = this.position;
    const bobY = this.mode === 'house' ? Math.sin(this.bob) * TILE * 0.18 : 0;
    const x = (p.x + 0.5) * TILE;
    const y = (p.y + 0.5) * TILE + bobY;
    const frame = Math.floor(this.anim / 0.16) % 2;
    this.body.setPosition(x, y);
    this.eyes.setPosition(x, y);
    const dirIndex = this.mover.dir === 'none' ? 0 : EYE_DIRS.indexOf(this.mover.dir);

    if (this.mode === 'frightened') {
      const flash = powerEnding && Math.floor(this.anim / 0.2) % 2 === 0;
      this.body.setTexture('enemy-frozen', frame + (flash ? 2 : 0)).setVisible(true);
      this.eyes.setVisible(false);
    } else if (this.mode === 'eaten') {
      this.body.setVisible(false);
      this.eyes.setVisible(true).setFrame(dirIndex).setAlpha(0.95);
    } else {
      this.body.setTexture(enemyKey(this.kind), frame).setVisible(true);
      this.eyes.setVisible(true).setFrame(dirIndex).setAlpha(1);
    }
  }

  setVisible(v: boolean) {
    this.body.setVisible(v);
    this.eyes.setVisible(v);
  }
}
