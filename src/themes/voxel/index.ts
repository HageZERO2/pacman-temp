import type { ThemeConfig, ThemeRenderer } from '../types';
import { drawMob, drawMobEyes, drawStunned } from './enemies';
import { drawDiamond, drawEmeraldLamp, drawIngot, drawRedstone } from './items';
import { drawVoxelMaze, VOXEL_LEVELS } from './maze';
import { voxelSound } from './music';
import { drawPlayer } from './player';
import { centred, cube } from './px';

const renderer: ThemeRenderer = {
  drawPlayer,
  drawEnemy: drawMob,
  drawFrightened: drawStunned,
  drawEyes: drawMobEyes,
  drawItem(ctx, kind, cx, cy, size) {
    if (kind === 'snowflake') drawRedstone(ctx, cx, cy, size);
    else if (kind === 'crystal') drawDiamond(ctx, cx, cy, size);
    else if (kind === 'star') drawIngot(ctx, cx, cy, size);
    else drawEmeraldLamp(ctx, cx, cy, size);
  },
  drawMaze(ctx, maze, levelIndex, tile, opts) {
    drawVoxelMaze(ctx, maze, VOXEL_LEVELS[levelIndex % VOXEL_LEVELS.length], tile, opts);
  },
  drawParticle(ctx, kind, cx, cy, size) {
    const g = centred(ctx, cx, cy, size, 8);
    // Spark is white so burst tints colour it; the ambient mote is a warm pollen/ember cube.
    if (kind === 'spark') cube(g, 2, 3, 3, 3, 2, { top: '#ffffff', front: '#e4e4e4', side: '#b4b4b4' });
    else cube(g, 2, 3, 3, 3, 1, { top: '#fff4c2', front: '#ffd36b', side: '#d9952a' });
  },
};

export const voxelTheme: ThemeConfig = {
  id: 'voxel',
  name: 'Voxel World',
  tagline: 'Build, dig, chomp',
  description: 'Grass blocks, ore-filled caves and a magma forge. Cube heroes, blocky mobs and gems to mine.',
  edition: 'Voxel Edition',
  swatches: ['#6cc24a', '#8a5a33', '#8d9098', '#4fdcef', '#ff4a2a'],
  levels: [
    {
      name: 'Meadow Blocks',
      description: 'Grass-topped walls, an oak plank pen and a lazy golem on patrol.',
      accent: '#7ccf4f',
      background: VOXEL_LEVELS[0].background,
    },
    {
      name: 'Stone Depths',
      description: 'Torch-lit cobble tunnels studded with ore. The mobs dig deeper.',
      accent: '#ffb347',
      background: VOXEL_LEVELS[1].background,
    },
    {
      name: 'Magma Forge',
      description: 'Scorched bricks over lava lakes. Every mob is wide awake.',
      accent: '#ff6a2a',
      background: VOXEL_LEVELS[2].background,
    },
  ],
  renderer,
  fx: {
    pixelArt: true,
    rotatePlayer: false,
    ambient: 'blocks',
    bulbs: false,
    glitch: false,
    itemMotion: 'bob',
    bursts: {
      power: [0x5fe8ff, 0xffffff, 0x2fb8d8],
      star: [0xffd84a, 0xfff1a8, 0xd99a1a],
      enemy: [0x9ad8ff, 0xffffff, 0x6a8cf0],
      death: [0xff5a3d, 0xffd84a, 0x8a5a33],
      gift: [0x3fe07a, 0xb8ff9a, 0xffd36b],
      win: [0x6fd34a, 0xffd84a, 0x5fe8ff, 0xff5a3d],
    },
    flash: [255, 214, 140],
    winTint: 0xfff0b8,
    text: {
      font: '"Pixelify Sans", monospace',
      titleSize: 32,
      titleColor: '#ffffff',
      titleStroke: '#2b1a0e',
      readyColor: '#ffd84a',
      readyStroke: '#4a2a00',
      floatFont: 'Silkscreen, monospace',
      floatStroke: '#1a0f05',
      float: { star: '#ffd84a', enemy: '#8fe8ff', gift: '#6dff9a' },
    },
  },
  labels: { pellets: 'Redstone', foes: 'Mobs stunned', power: 'Diamond power', boost: 'Speed boost' },
  sound: voxelSound,
  canvasFonts: ['32px "Pixelify Sans"', '700 32px "Pixelify Sans"', '14px Silkscreen'],
};
