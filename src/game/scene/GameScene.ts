import Phaser from 'phaser';
import { audio } from '../../core/audio';
import type { DifficultyConfig } from '../../core/difficulty';
import { GIFT_COINS, GIFT_LIFETIME, GIFT_TRIGGERS, POINTS, type LevelStats } from '../../core/rules';
import { levelLook } from '../../themes';
import type { BurstEvent, LevelLook, ThemeConfig } from '../../themes/types';
import { ENEMY_ORDER } from '../ai';
import type { GameBridge, GamePhase, HudState } from '../bridge';
import { LEVELS, type LevelDef } from '../levels';
import { Maze, type PickupKind } from '../maze';
import { occupiedCell, positionOf } from '../movement';
import type { MaybeDir, SkinId } from '../types';
import { Enemy } from './Enemy';
import { Player } from './Player';
import { TILE, buildTextures, itemKey } from './textures';

export interface SessionConfig {
  difficulty: DifficultyConfig;
  skin: SkinId;
  theme: ThemeConfig;
  reducedEffects: boolean;
}

export interface SceneData {
  bridge: GameBridge;
  session: SessionConfig;
  levelIndex: number;
  score: number;
  lives: number;
}

interface PickupSprite {
  kind: PickupKind;
  sprite: Phaser.GameObjects.Image;
}

const KEY_DIRS: Record<string, MaybeDir> = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export class GameScene extends Phaser.Scene {
  private data0!: SceneData;
  private level!: LevelDef;
  private theme!: ThemeConfig;
  private look!: LevelLook;
  private maze!: Maze;
  private diff!: DifficultyConfig;
  private player!: Player;
  private enemies: Enemy[] = [];
  private pickups = new Map<number, PickupSprite>();
  private blinkers: Phaser.GameObjects.Image[] = [];
  private mazeImage!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private banner?: Phaser.GameObjects.Container;
  private gift?: Phaser.GameObjects.Image;

  private phase: GamePhase = 'ready';
  private phaseBeforePause: GamePhase = 'ready';
  private score = 0;
  private lives = 0;
  private levelStartScore = 0;
  private levelStartLives = 0;
  private requiredLeft = 0;
  private totalStars = 0;
  private waveIndex = 0;
  private waveTimer = 0;
  private powerLeft = 0;
  private powerTotal = 1;
  private chain = 0;
  private boostLeft = 0;
  private giftLeft = 0;
  private giftsSpawned = 0;
  private hitstop = 0;
  private hudSent = '';
  private hudTimer = 0;
  private swipeStart: Phaser.Math.Vector2 | null = null;
  private stats = { snowflakes: 0, crystals: 0, stars: 0, gifts: 0, enemiesCaught: 0, livesLost: 0, seconds: 0 };
  private unsubscribers: (() => void)[] = [];

  constructor() {
    super('game');
  }

  init(data: SceneData) {
    this.data0 = data;
    this.level = LEVELS[data.levelIndex];
    this.theme = data.session.theme;
    this.look = levelLook(this.theme, data.levelIndex);
    this.diff = data.session.difficulty;
    this.maze = new Maze(this.level.map);
    this.score = data.score;
    this.lives = data.lives;
    this.levelStartScore = data.score;
    this.levelStartLives = data.lives;
    this.enemies = [];
    this.pickups = new Map();
    this.blinkers = [];
    this.banner = undefined;
    this.gift = undefined;
    this.giftsSpawned = 0;
    this.hudSent = '';
    this.stats = { snowflakes: 0, crystals: 0, stars: 0, gifts: 0, enemiesCaught: 0, livesLost: 0, seconds: 0 };
  }

  create() {
    const { session, bridge } = this.data0;
    const w = this.maze.width * TILE;
    const h = this.maze.height * TILE;
    if (this.scale.width !== w || this.scale.height !== h) this.scale.setGameSize(w, h);
    this.cameras.main.setBackgroundColor(this.look.background[1]);

    buildTextures(this, this.theme, session.skin);
    this.createMazeImage();
    this.createDecorations();
    this.createPickups();

    this.player = new Player(this, this.maze, { rotate: this.theme.fx.rotatePlayer, glow: this.theme.fx.playerGlow }, !session.reducedEffects);
    const homes = this.maze.enemyHomes;
    const homeFor = [this.maze.exit, this.maze.houseCenter, homes[0], homes[homes.length - 1]];
    this.enemies = ENEMY_ORDER.map((kind, i) => new Enemy(this, this.maze, kind, homeFor[i] ?? this.maze.houseCenter, i === 0));

    this.sparks = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 200 },
      lifespan: 650,
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 180 },
      blendMode: this.theme.fx.pixelArt ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(7);

    this.setupInput();
    this.unsubscribers = [
      bridge.commands.on('pause', () => this.pauseGame()),
      bridge.commands.on('resume', () => this.resumeGame()),
      bridge.commands.on('restartLevel', () => this.restartWith(this.data0.levelIndex, this.levelStartScore, this.levelStartLives)),
      bridge.commands.on('nextLevel', () => {
        const next = this.data0.levelIndex + 1;
        if (next < LEVELS.length) this.restartWith(next, this.score, this.lives);
      }),
      bridge.commands.on('newRun', (levelIndex) => this.restartWith(levelIndex, 0, this.diff.lives)),
      bridge.commands.on('direction', (d) => {
        if (this.player) this.player.wanted = d;
      }),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());

    this.resetActors();
    this.startReady(true);
  }

  /** Phaser clears input, tweens and timers itself; only bridge subscriptions are ours to drop. */
  private cleanup() {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.time.paused = false;
  }

  private restartWith(levelIndex: number, score: number, lives: number) {
    this.scene.restart({ ...this.data0, levelIndex, score, lives } satisfies SceneData);
  }

  // ---------------------------------------------------------------- setup

  private createMazeImage() {
    const key = `maze-${this.level.id}`;
    if (!this.textures.exists(key)) {
      const tex = this.textures.createCanvas(key, this.maze.width * TILE, this.maze.height * TILE);
      if (tex) {
        this.theme.renderer.drawMaze(tex.getContext(), this.maze, this.data0.levelIndex, TILE);
        tex.refresh();
      }
    }
    this.mazeImage = this.add.image(0, 0, key).setOrigin(0).setDepth(0);
  }

  private createDecorations() {
    const { fx } = this.theme;
    const reduced = this.data0.session.reducedEffects;
    if (fx.bulbs) this.createBulbs(this.look.lights ?? ['#ffffff'], reduced);
    if (!reduced) this.createAmbient();
    if (fx.glitch && !reduced) this.scheduleGlitch();
  }

  private createAmbient() {
    const w = this.maze.width * TILE;
    const h = this.maze.height * TILE;
    const base = { x: { min: 0, max: w }, y: -10 };
    switch (this.theme.fx.ambient) {
      case 'snow':
        this.add.particles(0, 0, 'ambient', {
          ...base, lifespan: 14000, speedY: { min: 18, max: 48 }, speedX: { min: -14, max: 14 },
          scale: { min: 0.25, max: 0.75 }, alpha: { min: 0.25, max: 0.7 }, frequency: 160, advance: 8000,
        }).setDepth(9);
        break;
      case 'rain':
        this.add.particles(0, 0, 'ambient', {
          ...base, lifespan: 2600, speedY: { min: 420, max: 620 }, speedX: { min: -30, max: -10 },
          scale: { min: 0.6, max: 1.2 }, alpha: { min: 0.15, max: 0.4 }, frequency: 45, advance: 3000,
          blendMode: Phaser.BlendModes.ADD,
        }).setDepth(9);
        break;
      case 'blocks':
        // Slow drifting cubes (dust/embers); integer scales keep pixel edges crisp.
        this.add.particles(0, 0, 'ambient', {
          x: { min: 0, max: w }, y: h + 10, lifespan: 16000, speedY: { min: -26, max: -12 }, speedX: { min: -8, max: 8 },
          scale: { min: 0.5, max: 1 }, alpha: { start: 0.8, end: 0 }, frequency: 420, advance: 9000,
        }).setDepth(9);
        break;
      case 'none':
        break;
    }
  }

  /** Brief digital glitch: the maze jumps sideways and flickers a neon tint. */
  private scheduleGlitch() {
    this.time.delayedCall(Phaser.Math.Between(3500, 8000), () => {
      if (this.phase === 'playing' || this.phase === 'ready') {
        const tints = [0xff2bd6, 0x2bf3ff];
        this.mazeImage.setTint(Phaser.Utils.Array.GetRandom(tints)).setX(Phaser.Math.Between(-4, 4));
        this.time.delayedCall(70, () => this.mazeImage.setX(Phaser.Math.Between(-2, 2)));
        this.time.delayedCall(140, () => this.mazeImage.clearTint().setX(0));
      }
      this.scheduleGlitch();
    });
  }

  private createBulbs(lights: string[], reduced: boolean) {
    const wire = this.add.graphics().setDepth(1);
    wire.lineStyle(2, 0x0d1a12, 0.9);
    for (const row of [0, this.maze.height - 1]) {
      const y0 = row * TILE + TILE * 0.35;
      wire.beginPath();
      wire.moveTo(0, y0);
      const bulbs: [number, number][] = [];
      for (let x = 0; x < this.maze.width; x++) {
        const cx = (x + 0.5) * TILE;
        const sag = y0 + TILE * 0.22;
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(x * TILE, y0),
          new Phaser.Math.Vector2(cx, sag + TILE * 0.18),
          new Phaser.Math.Vector2((x + 1) * TILE, y0),
        );
        curve.getPoints(8).forEach((p) => wire.lineTo(p.x, p.y));
        bulbs.push([cx, sag + 4]);
      }
      wire.strokePath();
      bulbs.forEach(([bx, by], i) => {
        const color = Phaser.Display.Color.HexStringToColor(lights[i % lights.length]).color;
        const glow = this.add.image(bx, by + 2, 'glow').setTint(color).setScale(0.45).setAlpha(0.55).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
        const bulb = this.add.image(bx, by, 'bulb').setTint(color).setDepth(1.1);
        if (!reduced) {
          this.tweens.add({
            targets: [glow, bulb],
            alpha: { from: 1, to: 0.35 },
            duration: 600 + ((i * 137) % 500),
            yoyo: true,
            repeat: -1,
            delay: (i * 211) % 900,
            ease: 'Sine.easeInOut',
          });
        }
      });
    }
  }

  private createPickups() {
    this.requiredLeft = 0;
    this.totalStars = 0;
    const reduced = this.data0.session.reducedEffects;
    const motion = this.theme.fx.itemMotion;
    for (const p of this.maze.pickups) {
      const x = (p.x + 0.5) * TILE;
      const y = (p.y + 0.5) * TILE;
      const sprite = this.add.image(x, y, itemKey(p.kind)).setDepth(2);
      if (p.kind === 'star') this.totalStars++;
      else this.requiredLeft++;
      if (!reduced && p.kind !== 'snowflake') this.animateItem(sprite, p.kind === 'star', motion);
      this.pickups.set(p.y * this.maze.width + p.x, { kind: p.kind, sprite });
    }
    if (this.blinkers.length) {
      this.time.addEvent({ delay: 260, loop: true, callback: () => this.blinkers.forEach((s) => s.active && s.setVisible(!s.visible)) });
    }
  }

  private animateItem(sprite: Phaser.GameObjects.Image, star: boolean, motion: ThemeConfig['fx']['itemMotion']) {
    const loop = { yoyo: true, repeat: -1, ease: 'Sine.easeInOut' };
    switch (motion) {
      case 'festive':
        if (star) this.tweens.add({ targets: sprite, scale: { from: 0.85, to: 1.12 }, angle: { from: -8, to: 8 }, duration: 700, ...loop });
        else this.tweens.add({ targets: sprite, scale: { from: 0.8, to: 1.15 }, duration: 520, ...loop });
        break;
      case 'pulse':
        this.tweens.add({ targets: sprite, scale: { from: 0.82, to: 1.14 }, alpha: { from: 1, to: 0.75 }, duration: star ? 640 : 480, ...loop });
        break;
      case 'bob':
        this.tweens.add({ targets: sprite, y: sprite.y - 4, duration: star ? 900 : 700, ...loop });
        break;
      case 'blink':
        // Hard on/off like an arcade cabinet; no scaling so pixels stay crisp.
        this.blinkers.push(sprite);
        break;
    }
  }

  private setupInput() {
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
      kb.on('keydown', (e: KeyboardEvent) => {
        const d = KEY_DIRS[e.code];
        if (d) this.player.wanted = d;
      });
    }
    // Swipe anywhere on the playfield.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => (this.swipeStart = new Phaser.Math.Vector2(p.x, p.y)));
    this.input.on('pointerup', () => (this.swipeStart = null));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.swipeStart || !p.isDown) return;
      const dx = p.x - this.swipeStart.x;
      const dy = p.y - this.swipeStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < TILE * 0.6) return;
      this.player.wanted = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      this.swipeStart.set(p.x, p.y);
    });
  }

  // ---------------------------------------------------------------- flow

  private setPhase(phase: GamePhase) {
    this.phase = phase;
    this.data0.bridge.events.emit('phase', phase);
  }

  private resetActors() {
    this.player.reset();
    const ri = this.diff.releaseInterval;
    this.enemies.forEach((e, i) => e.reset(i * ri * 0.75 + (i > 0 ? 0.5 : 0)));
    this.powerLeft = 0;
    this.chain = 0;
    this.boostLeft = 0;
    this.waveIndex = 0;
    this.waveTimer = this.diff.phases[0];
    this.removeGift();
    this.pushHud(true);
  }

  private get wave(): 'scatter' | 'chase' {
    return this.waveIndex % 2 === 0 ? 'scatter' : 'chase';
  }

  private startReady(levelStart: boolean) {
    this.setPhase('ready');
    this.banner?.destroy();
    const cx = this.maze.width * TILE * 0.5;
    const cy = (this.maze.playerStart.y - 0.5) * TILE;
    const items: Phaser.GameObjects.GameObject[] = [];
    const tx = this.theme.fx.text;
    if (levelStart) {
      items.push(
        this.add.text(0, -TILE * 3.6, this.look.name.toUpperCase(), {
          fontFamily: tx.font, fontSize: `${tx.titleSize}px`, color: tx.titleColor, stroke: tx.titleStroke, strokeThickness: 8,
        }).setOrigin(0.5),
      );
      audio.play('start');
    }
    const ready = this.add.text(0, 0, 'READY!', {
      fontFamily: tx.font, fontSize: `${Math.round(tx.titleSize * 1.13)}px`, color: tx.readyColor, stroke: tx.readyStroke, strokeThickness: 8,
    }).setOrigin(0.5);
    items.push(ready);
    this.banner = this.add.container(cx, cy, items).setDepth(10);
    this.tweens.add({ targets: ready, scale: { from: 0.6, to: 1 }, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({ targets: ready, alpha: { from: 1, to: 0.4 }, duration: 300, yoyo: true, repeat: -1, delay: 400 });
    this.time.delayedCall(levelStart ? 2200 : 1400, () => {
      this.banner?.destroy();
      this.banner = undefined;
      if (this.phase === 'ready') this.setPhase('playing');
    });
  }

  private pauseGame() {
    if (this.phase !== 'playing' && this.phase !== 'ready') return;
    this.phaseBeforePause = this.phase;
    this.setPhase('paused');
    this.tweens.pauseAll();
    this.time.paused = true;
  }

  private resumeGame() {
    if (this.phase !== 'paused') return;
    this.tweens.resumeAll();
    this.time.paused = false;
    this.setPhase(this.phaseBeforePause);
  }

  // ---------------------------------------------------------------- loop

  update(_time: number, deltaMs: number) {
    const dt = Math.min(deltaMs, 50) / 1000;
    if (this.phase === 'paused') return;
    this.rotateSnowflakes(dt);
    if (this.phase === 'ready') {
      this.enemies.forEach((e) => e.render(false));
      return;
    }
    if (this.phase !== 'playing') return;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }

    this.stats.seconds += dt;
    this.tickTimers(dt);

    const playerSpeed = this.level.playerSpeed * (this.boostLeft > 0 ? 1.3 : 1) * (this.powerLeft > 0 ? 1.08 : 1);
    this.player.update(playerSpeed * dt);
    this.collect();
    if (this.phase !== 'playing') return;

    const pc = occupiedCell(this.maze, this.player.mover);
    const leader = this.enemies[0];
    const brain = {
      wave: this.wave,
      player: pc,
      playerDir: this.player.mover.dir,
      leader: leader ? occupiedCell(this.maze, leader.mover) : pc,
      aggression: this.diff.aggression,
      smartPathing: this.diff.smartPathing,
      rng: Math.random,
    };
    const powerEnding = this.powerLeft > 0 && this.powerLeft < 2;
    for (const e of this.enemies) {
      e.update(dt, this.enemySpeed(e), brain);
      e.render(powerEnding);
    }
    this.checkCollisions();
    this.pushHud(false, dt);
  }

  private rotateSnowflakes(dt: number) {
    if (this.data0.session.reducedEffects || this.theme.fx.itemMotion !== 'festive') return;
    const delta = dt * 0.8;
    this.pickups.forEach((p) => {
      if (p.kind === 'snowflake') p.sprite.rotation += delta;
    });
  }

  private tickTimers(dt: number) {
    if (this.powerLeft > 0) {
      this.powerLeft -= dt;
      if (this.powerLeft <= 0) {
        this.powerLeft = 0;
        this.enemies.forEach((e) => e.calm(this.wave));
        audio.setDucked(false);
      }
    } else if (this.waveIndex < this.diff.phases.length) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.waveIndex++;
        this.waveTimer = this.diff.phases[this.waveIndex] ?? Infinity;
        this.enemies.forEach((e) => e.waveChanged(this.wave));
      }
    }
    if (this.boostLeft > 0) this.boostLeft = Math.max(0, this.boostLeft - dt);
    if (this.gift) {
      this.giftLeft -= dt;
      this.gift.setAlpha(this.giftLeft < 2.5 ? (Math.floor(this.giftLeft * 6) % 2 ? 0.3 : 1) : 1);
      if (this.giftLeft <= 0) this.removeGift();
    }
  }

  private enemySpeed(e: Enemy): number {
    const base = this.level.playerSpeed * this.diff.enemySpeed * this.level.enemySpeedScale;
    let speed = base;
    if (e.mode === 'frightened') speed = this.level.playerSpeed * 0.5;
    else if (e.mode === 'eaten') speed = this.level.playerSpeed * 2.2;
    else if (e.mode === 'leaving') speed = base * 0.6;
    else if (e.kind === 'yeti' && this.requiredLeft < 20) speed = base * 1.1;
    if (e.mode !== 'eaten' && this.maze.isTunnel(e.mover.tile)) speed *= 0.55;
    return speed;
  }

  // ---------------------------------------------------------------- interactions

  private collect() {
    const cell = occupiedCell(this.maze, this.player.mover);
    const key = cell.y * this.maze.width + cell.x;
    const pickup = this.pickups.get(key);
    const x = (cell.x + 0.5) * TILE;
    const y = (cell.y + 0.5) * TILE;
    if (pickup) {
      this.pickups.delete(key);
      pickup.sprite.destroy();
      switch (pickup.kind) {
        case 'snowflake':
          this.score += POINTS.snowflake;
          this.stats.snowflakes++;
          this.requiredLeft--;
          audio.play('pellet');
          this.maybeSpawnGift();
          break;
        case 'crystal':
          this.score += POINTS.crystal;
          this.stats.crystals++;
          this.requiredLeft--;
          this.activatePower();
          this.burst(x, y, 18, 'power');
          break;
        case 'star':
          this.score += POINTS.star;
          this.stats.stars++;
          audio.play('star');
          this.burst(x, y, 22, 'star');
          this.floatText(x, y, `+${POINTS.star}`, this.theme.fx.text.float.star);
          break;
      }
      if (this.requiredLeft <= 0) {
        this.levelComplete();
        return;
      }
    }
    if (this.gift && cell.x === this.maze.playerStart.x && cell.y === this.maze.playerStart.y) this.collectGift(x, y);
  }

  private activatePower() {
    this.powerTotal = this.diff.frightenedSeconds * this.level.frightenedScale;
    this.powerLeft = this.powerTotal;
    this.chain = 0;
    this.enemies.forEach((e) => e.frighten());
    audio.play('crystal');
    audio.setDucked(true);
    this.cameras.main.flash(180, ...this.theme.fx.flash);
  }

  private maybeSpawnGift() {
    const trigger = GIFT_TRIGGERS[this.giftsSpawned];
    if (trigger === undefined || this.stats.snowflakes < trigger) return;
    this.giftsSpawned++;
    this.removeGift();
    const x = (this.maze.playerStart.x + 0.5) * TILE;
    const y = (this.maze.playerStart.y + 0.5) * TILE;
    this.gift = this.add.image(x, y, itemKey('gift')).setDepth(3).setScale(0);
    this.tweens.add({ targets: this.gift, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.giftLeft = GIFT_LIFETIME;
  }

  private removeGift() {
    this.gift?.destroy();
    this.gift = undefined;
  }

  private collectGift(x: number, y: number) {
    this.removeGift();
    this.stats.gifts++;
    this.score += POINTS.gift;
    const roll = Math.random();
    let label: string;
    if (roll < 0.25 && this.lives < this.diff.maxLives) {
      this.lives++;
      label = 'EXTRA LIFE!';
      audio.play('extraLife');
    } else if (roll < 0.5) {
      this.boostLeft = 6;
      label = `${this.theme.labels.boost.toUpperCase()}!`;
      audio.play('gift');
    } else if (roll < 0.7) {
      this.score += 1000;
      label = '+1300';
      audio.play('gift');
    } else {
      this.data0.bridge.events.emit('coins', GIFT_COINS * 2);
      label = `+${GIFT_COINS * 2} COINS`;
      audio.play('buy');
    }
    this.data0.bridge.events.emit('coins', GIFT_COINS);
    this.floatText(x, y - TILE * 0.4, label, this.theme.fx.text.float.gift);
    this.burst(x, y, 24, 'gift');
    this.pushHud(true);
  }

  private checkCollisions() {
    const pp = positionOf(this.player.mover);
    for (const e of this.enemies) {
      if (e.mode === 'house' || e.mode === 'eaten') continue;
      const ep = e.position;
      let dx = Math.abs(ep.x - pp.x);
      dx = Math.min(dx, this.maze.width - dx);
      const dy = Math.abs(ep.y - pp.y);
      if (dx * dx + dy * dy > 0.62 * 0.62) continue;
      if (e.mode === 'frightened') this.eatEnemy(e);
      else if (e.isDangerous) {
        this.die();
        return;
      }
    }
  }

  private eatEnemy(e: Enemy) {
    const points = POINTS.enemyChain[Math.min(this.chain, POINTS.enemyChain.length - 1)];
    this.chain++;
    this.score += points;
    this.stats.enemiesCaught++;
    e.eat();
    const x = (e.position.x + 0.5) * TILE;
    const y = (e.position.y + 0.5) * TILE;
    this.burst(x, y, 20, 'enemy');
    this.floatText(x, y, `${points}`, this.theme.fx.text.float.enemy);
    audio.play('eatEnemy');
    this.hitstop = 0.35;
    e.render(false);
  }

  private die() {
    this.setPhase('dying');
    this.player.hideAura();
    audio.setDucked(false);
    audio.play('death');
    this.cameras.main.shake(260, 0.01);
    this.removeGift();
    this.time.delayedCall(450, () => this.enemies.forEach((e) => e.setVisible(false)));
    const s = this.player.sprite;
    this.tweens.add({
      targets: s,
      angle: s.angle + 720,
      scale: 0,
      alpha: 0.2,
      duration: 1100,
      delay: 350,
      ease: 'Cubic.easeIn',
      onStart: () => this.burst(s.x, s.y, 30, 'death'),
    });
    this.time.delayedCall(1800, () => {
      this.lives--;
      this.stats.livesLost++;
      if (this.lives <= 0) {
        this.lives = 0;
        this.pushHud(true);
        this.gameOver();
      } else {
        this.resetActors();
        this.startReady(false);
      }
    });
  }

  private levelComplete() {
    this.setPhase('levelComplete');
    audio.setDucked(false);
    audio.play('levelUp');
    this.player.sprite.setFrame(2);
    this.pushHud(true);
    this.time.delayedCall(400, () => this.enemies.forEach((e) => e.setVisible(false)));
    this.time.addEvent({
      delay: 180,
      repeat: 7,
      callback: () => (this.mazeImage.isTinted ? this.mazeImage.clearTint() : this.mazeImage.setTint(this.theme.fx.winTint)),
    });
    const w = this.maze.width * TILE;
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 220, () => this.burst(Phaser.Math.Between(TILE * 2, w - TILE * 2), Phaser.Math.Between(TILE * 2, TILE * 8), 26, 'win'));
    }
    this.time.delayedCall(1700, () => {
      this.mazeImage.clearTint();
      const stats: LevelStats = {
        levelIndex: this.data0.levelIndex,
        score: this.score,
        levelScore: this.score - this.levelStartScore,
        totalStars: this.totalStars,
        ...this.stats,
      };
      this.data0.bridge.events.emit('levelComplete', stats);
    });
  }

  private gameOver() {
    this.setPhase('gameOver');
    audio.play('gameOver');
    this.data0.bridge.events.emit('gameOver', {
      score: this.score,
      levelIndex: this.data0.levelIndex,
      snowflakes: this.stats.snowflakes,
      enemiesCaught: this.stats.enemiesCaught,
      gifts: this.stats.gifts,
      seconds: this.stats.seconds,
    });
  }

  // ---------------------------------------------------------------- fx & hud

  private burst(x: number, y: number, count: number, event: BurstEvent) {
    const tints = this.theme.fx.bursts[event];
    const n = this.data0.session.reducedEffects ? Math.ceil(count / 3) : count;
    this.sparks.setParticleTint(Phaser.Utils.Array.GetRandom(tints));
    this.sparks.explode(n, x, y);
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: this.theme.fx.text.floatFont, fontSize: '14px', color, stroke: this.theme.fx.text.floatStroke, strokeThickness: 5,
    }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: t, y: y - TILE * 1.1, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  private pushHud(force: boolean, dt = 0) {
    this.hudTimer += dt;
    if (!force && this.hudTimer < 0.1) return;
    this.hudTimer = 0;
    const hud: HudState = {
      score: this.score,
      lives: this.lives,
      levelIndex: this.data0.levelIndex,
      power: this.powerLeft > 0 ? Math.round((this.powerLeft / this.powerTotal) * 50) / 50 : 0,
      boost: this.boostLeft > 0,
    };
    const sig = `${hud.score}|${hud.lives}|${hud.power}|${hud.boost}`;
    if (!force && sig === this.hudSent) return;
    this.hudSent = sig;
    this.data0.bridge.events.emit('hud', hud);
  }
}
