import { drawEnemyBody, drawEyes, drawFrozenEnemy } from './enemies';
import { drawCrystal, drawGift, drawSnowflake, drawStar } from './items';
import { drawChristmasMaze, type ChristmasLevelStyle } from './maze';
import { christmasSound } from './music';
import { drawPlayer, drawSparkle } from './player';
import type { ThemeConfig, ThemeRenderer } from '../types';

const LEVEL_STYLES: ChristmasLevelStyle[] = [
  { sky: ['#0b1a3a', '#050b1e'], wall: '#1f6b4a', wallDark: '#0f3d2a', wallEdge: '#7be0a8', style: 'hedge' },
  { sky: ['#0a2348', '#030a1c'], wall: '#3a8fd6', wallDark: '#174a85', wallEdge: '#bdf3ff', style: 'ice' },
  { sky: ['#2a0d1e', '#0a0612'], wall: '#a8323a', wallDark: '#5c1420', wallEdge: '#ffd27a', style: 'wood' },
];

const renderer: ThemeRenderer = {
  drawPlayer,
  drawEnemy: drawEnemyBody,
  drawFrightened: drawFrozenEnemy,
  drawEyes,
  drawItem(ctx, kind, cx, cy, size) {
    if (kind === 'snowflake') drawSnowflake(ctx, cx, cy, size * 0.25);
    else if (kind === 'crystal') drawCrystal(ctx, cx, cy, size * 0.29);
    else if (kind === 'star') drawStar(ctx, cx, cy, size * 0.29);
    else drawGift(ctx, cx, cy, size * 0.43);
  },
  drawMaze(ctx, maze, levelIndex, tile, opts) {
    drawChristmasMaze(ctx, maze, LEVEL_STYLES[levelIndex % LEVEL_STYLES.length], tile, opts);
  },
  drawParticle(ctx, kind, cx, cy, size) {
    if (kind === 'spark') {
      drawSparkle(ctx, cx, cy, size * 0.46, '#ffffff');
      return;
    }
    const r = size / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(230,245,255,0.6)');
    g.addColorStop(1, 'rgba(230,245,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, size, size);
  },
};

export const christmasTheme: ThemeConfig = {
  id: 'christmas',
  name: 'Christmas',
  tagline: 'Snowy village nights',
  description: 'Twinkling garlands, festive skins and winter monsters under the northern lights.',
  edition: 'Christmas Edition',
  swatches: ['#0b1a3a', '#ff3b4e', '#ffcf3f', '#36d97f', '#7fe8ff'],
  levels: [
    {
      name: 'Christmas Village',
      description: 'Snowy hedges, cocoa-warm windows and a sleepy Yeti on patrol.',
      accent: '#ff5a5f',
      background: LEVEL_STYLES[0].sky,
      lights: ['#ff4d5e', '#ffd34d', '#4dd2ff', '#7cff7c'],
    },
    {
      name: 'Frozen Kingdom',
      description: 'Glassy ice halls under the aurora. Monsters grow bolder.',
      accent: '#5ee7ff',
      background: LEVEL_STYLES[1].sky,
      lights: ['#bdf3ff', '#7cc7ff', '#e0b0ff', '#ffffff'],
    },
    {
      name: "Santa's Workshop",
      description: 'Toy conveyor mazes and ribbon-wrapped walls. The whole gang is awake.',
      accent: '#ffc94d',
      background: LEVEL_STYLES[2].sky,
      lights: ['#ffc94d', '#ff4d5e', '#7cff9a', '#ffffff'],
    },
  ],
  renderer,
  fx: {
    pixelArt: false,
    rotatePlayer: true,
    ambient: 'snow',
    bulbs: true,
    glitch: false,
    itemMotion: 'festive',
    bursts: {
      power: [0xd9b3ff, 0x7fe8ff, 0xffffff],
      star: [0xffd34d, 0xffffff, 0xffa31a],
      enemy: [0xbdf3ff, 0xffffff, 0x7cc7ff],
      death: [0xffffff, 0xbdf3ff, 0xff4d5e],
      gift: [0xff4d5e, 0xffd34d, 0x7cff9a, 0xffffff],
      win: [0xff4d5e, 0xffd34d, 0x7cff9a, 0x7fe8ff],
    },
    flash: [120, 200, 255],
    winTint: 0xb8d8ff,
    text: {
      font: 'Bungee, Impact, sans-serif',
      titleSize: 30,
      titleColor: '#ffffff',
      titleStroke: '#0a1530',
      readyColor: '#ffd34d',
      readyStroke: '#5a1a00',
      floatFont: '"Press Start 2P", monospace',
      floatStroke: '#0a0f24',
      float: { star: '#ffd34d', enemy: '#7fe8ff', gift: '#ff8fa3' },
    },
  },
  labels: { pellets: 'Snowflakes', foes: 'Foes frozen', power: 'Frost power', boost: 'Sleigh boost' },
  sound: christmasSound,
  canvasFonts: ['30px Bungee', '14px "Press Start 2P"'],
};
