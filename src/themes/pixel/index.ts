import { drawPixelEnemy, drawPixelEyes, drawPixelFrightened } from './enemies';
import { drawPixelItem, drawPixelParticle } from './items';
import { drawPixelMaze, type PixelLevelStyle } from './maze';
import { pixelSound } from './music';
import { PAL } from './palette';
import { drawPixelPlayer } from './player';
import type { ThemeConfig, ThemeRenderer } from '../types';

const LEVEL_STYLES: PixelLevelStyle[] = [
  { background: '#000000', wall: PAL.blue, fill: '#05052a' },
  { background: '#000000', wall: PAL.magenta, fill: '#1e0630' },
  { background: '#000000', wall: PAL.orange, fill: '#261000' },
];

const renderer: ThemeRenderer = {
  drawPlayer: drawPixelPlayer,
  drawEnemy: drawPixelEnemy,
  drawFrightened: drawPixelFrightened,
  drawEyes: drawPixelEyes,
  drawItem: drawPixelItem,
  drawMaze(ctx, maze, levelIndex, tile, opts) {
    drawPixelMaze(ctx, maze, LEVEL_STYLES[levelIndex % LEVEL_STYLES.length], tile, opts);
  },
  drawParticle: drawPixelParticle,
};

export const pixelTheme: ThemeConfig = {
  id: 'pixel',
  name: 'Pixel Classic',
  tagline: '8-bit arcade cabinet',
  description: 'Chunky sprites, blinking power orbs and chiptune beats straight from the coin-op era.',
  edition: 'Insert Coin',
  swatches: ['#000000', PAL.blue, PAL.yellow, PAL.red, PAL.pink, PAL.cyan],
  levels: [
    {
      name: 'Coin Alley',
      description: 'Blue-line corridors packed with coins. A warm-up round for new players.',
      accent: PAL.sky,
      background: ['#000000', '#000000'],
    },
    {
      name: 'Pixel Galaxy',
      description: 'Neon magenta maze in deep space. The ghosts start to coordinate.',
      accent: PAL.magenta,
      background: ['#000000', '#000000'],
    },
    {
      name: 'Final Credits',
      description: 'The orange boss stage. Every monster is awake and out for your last life.',
      accent: PAL.orange,
      background: ['#000000', '#000000'],
    },
  ],
  renderer,
  fx: {
    pixelArt: true,
    rotatePlayer: true,
    ambient: 'none',
    bulbs: false,
    glitch: false,
    itemMotion: 'blink',
    bursts: {
      power: [0x2ee8ff, 0xffffff, 0x2a32ff],
      star: [0xffe81a, 0xffffff, 0xff9a1e],
      enemy: [0x2a32ff, 0xffffff, 0x2ee8ff],
      death: [0xffe81a, 0xff2440, 0xffffff],
      gift: [0xff2440, 0x34e060, 0xffffff],
      win: [0xffe81a, 0xff9ed8, 0x2ee8ff, 0x34e060],
    },
    flash: [255, 255, 255],
    winTint: 0xffffff,
    text: {
      font: '"Press Start 2P", monospace',
      titleSize: 24,
      titleColor: '#ffffff',
      titleStroke: '#000000',
      readyColor: PAL.yellow,
      readyStroke: '#000000',
      floatFont: '"Press Start 2P", monospace',
      floatStroke: '#000000',
      float: { star: PAL.yellow, enemy: PAL.cyan, gift: PAL.pink },
    },
  },
  labels: { pellets: 'Coins', foes: 'Ghosts eaten', power: 'Power up', boost: 'Turbo' },
  sound: pixelSound,
  canvasFonts: ['24px "Press Start 2P"'],
};
