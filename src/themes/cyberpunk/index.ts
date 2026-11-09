import { drawCyberEnemy, drawCyberEyes, drawCyberHacked } from './enemies';
import { drawCyberItem, drawCyberParticle } from './items';
import { drawCyberMaze, type CyberLevelStyle } from './maze';
import { cyberpunkSound } from './music';
import { drawCyberPlayer } from './player';
import { NEON } from './shared';
import type { ThemeConfig, ThemeRenderer } from '../types';

const LEVEL_STYLES: CyberLevelStyle[] = [
  {
    sky: ['#14063a', '#05010f'],
    grid: 'rgba(255,43,214,0.11)',
    panel: ['#1f0d44', '#0b0422'],
    outer: NEON.magenta,
    inner: NEON.cyan,
    trace: 'rgba(41,246,255,0.4)',
    holo: NEON.cyan,
  },
  {
    sky: ['#03203a', '#010712'],
    grid: 'rgba(41,246,255,0.11)',
    panel: ['#07294a', '#020c1a'],
    outer: NEON.cyan,
    inner: NEON.blue,
    trace: 'rgba(57,255,158,0.45)',
    holo: NEON.magenta,
  },
  {
    sky: ['#240616', '#070106'],
    grid: 'rgba(255,176,46,0.1)',
    panel: ['#2c1222', '#0e040a'],
    outer: NEON.amber,
    inner: NEON.pink,
    trace: 'rgba(255,79,154,0.45)',
    holo: NEON.amber,
  },
];

const renderer: ThemeRenderer = {
  drawPlayer: drawCyberPlayer,
  drawEnemy: drawCyberEnemy,
  drawFrightened: drawCyberHacked,
  drawEyes: drawCyberEyes,
  drawItem: drawCyberItem,
  drawMaze(ctx, maze, levelIndex, tile, opts) {
    drawCyberMaze(ctx, maze, LEVEL_STYLES[levelIndex % LEVEL_STYLES.length], tile, opts);
  },
  drawParticle: drawCyberParticle,
};

export const cyberpunkTheme: ThemeConfig = {
  id: 'cyberpunk',
  name: 'Cyberpunk',
  tagline: 'Neon megacity after midnight',
  description: 'Glowing circuit mazes, hunter drones and holo-glitches under endless neon rain.',
  edition: 'Neon Overdrive',
  swatches: ['#07031a', NEON.magenta, NEON.cyan, NEON.violet, NEON.acid],
  levels: [
    {
      name: 'Neon District',
      description: 'Rain-slick alleys under magenta signs. A lone enforcer walks the beat.',
      accent: NEON.magenta,
      background: LEVEL_STYLES[0].sky,
      lights: [NEON.magenta, NEON.cyan, NEON.violet],
    },
    {
      name: 'Data Core',
      description: 'Deep inside the server spire. Security drones sync up and start to hunt.',
      accent: NEON.cyan,
      background: LEVEL_STYLES[1].sky,
      lights: [NEON.cyan, NEON.blue, NEON.lime],
    },
    {
      name: 'Chrome Foundry',
      description: 'Molten-orange assembly lines where every hunter mech is fully online.',
      accent: NEON.amber,
      background: LEVEL_STYLES[2].sky,
      lights: [NEON.amber, NEON.pink, '#ffffff'],
    },
  ],
  renderer,
  fx: {
    pixelArt: false,
    rotatePlayer: true,
    playerGlow: NEON.cyan,
    ambient: 'rain',
    bulbs: false,
    glitch: true,
    itemMotion: 'pulse',
    bursts: {
      power: [0xff2bd6, 0x9b5cff, 0xffffff],
      star: [0xf6ff3a, 0xffb02e, 0xffffff],
      enemy: [0x2f6bff, 0x29f6ff, 0xffffff],
      death: [0xff2bd6, 0x29f6ff, 0xffffff],
      gift: [0x39ff9e, 0x29f6ff, 0xffffff],
      win: [0xff2bd6, 0x29f6ff, 0xf6ff3a, 0x9b5cff],
    },
    flash: [255, 43, 214],
    winTint: 0x9ffcff,
    text: {
      font: 'Orbitron, "Share Tech Mono", sans-serif',
      titleSize: 28,
      titleColor: '#eaffff',
      titleStroke: '#3a0a5a',
      readyColor: NEON.cyan,
      readyStroke: '#06122e',
      floatFont: '"Share Tech Mono", monospace',
      floatStroke: '#07031a',
      float: { star: NEON.acid, enemy: NEON.cyan, gift: NEON.lime },
    },
  },
  labels: {
    pellets: 'Energy orbs',
    foes: 'Bots hacked',
    power: 'Overclock',
    boost: 'Turbo boost',
    pauseKicker: 'Connection on hold',
    victoryTitle: 'System Breached!',
    gameOverKicker: 'Signal lost — rebooting',
  },
  sound: cyberpunkSound,
  canvasFonts: ['500 28px Orbitron', '700 28px Orbitron', '16px "Share Tech Mono"'],
};
