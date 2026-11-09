import { centred, cube, Grid, type Ctx } from './px';

/** Regular pellet: a small glowing redstone-dust cube. */
export function drawRedstone(ctx: Ctx, cx: number, cy: number, size: number) {
  const g = centred(ctx, cx, cy, size, 12);
  g.rect(3, 4, 6, 6, 'rgba(255,40,30,0.16)');
  cube(g, 4, 6, 3, 3, 1, { top: '#ff6a52', front: '#e3201c', side: '#8f0b0e', outline: '#3a0406' });
  g.dot(4, 6, '#ffc2b0');
}

const DIAMOND = [
  '...oooooooo...',
  '..oWWLLMLLMo..',
  '.oWLLMMLLMMDo.',
  'oWLLLMMMLMMDDo',
  'oDDDDDDDDDDDBo',
  'oLMMMDDDMMMDBo',
  '.oLMMMDDMMDBo.',
  '..oLMMDDMDBo..',
  '...oLMDDDBo...',
  '....oLMDBo....',
  '.....oLBo.....',
  '......oo......',
];

/** Power item: a faceted diamond. */
export function drawDiamond(ctx: Ctx, cx: number, cy: number, size: number) {
  const u = Math.max(1, size * 0.62) / 14;
  const g = new Grid(ctx, cx - 7 * u, cy - 6 * u, u);
  g.rect(-1, 2, 16, 6, 'rgba(120,240,255,0.16)');
  g.bitmap(DIAMOND, { o: '#0b3346', W: '#ffffff', L: '#bff8ff', M: '#4fdcef', D: '#1fa7c4', B: '#127090' });
  sparkle(g, 12, 0, '#ffffff');
}

const INGOT = [
  '....oooooooooo..',
  '...oWWLLLLLLLDo.',
  '..oWLLLLLLLLLDDo',
  '.oooooooooooooDo',
  '.oMMMMMMMMMMMoDo',
  '.oMHMMMMMMMMMoBo',
  '.oMMMMMMMMMMMoo.',
  '.oDDDDDDDDDDDo..',
  '.ooooooooooooo..',
];

/** Rare bonus: a gold ingot. */
export function drawIngot(ctx: Ctx, cx: number, cy: number, size: number) {
  const u = (size * 0.72) / 16;
  const g = new Grid(ctx, cx - 8 * u, cy - 4.5 * u, u);
  g.bitmap(INGOT, { o: '#4a2a00', W: '#fffbe0', L: '#ffe066', M: '#f2b51e', H: '#fff2a8', D: '#c07a0a', B: '#8a5200' });
  sparkle(g, 1, -3, '#fffbe0');
}

const EMERALD = [
  '..oooo..',
  '.oWLMDo.',
  'oWLMMDDo',
  'oLMMMDDo',
  'oLMMMDDo',
  'oLMMDDBo',
  '.oMDDBo.',
  '..oooo..',
];

/** Speed bonus: an emerald hovering over a glowing lamp block. */
export function drawEmeraldLamp(ctx: Ctx, cx: number, cy: number, size: number) {
  const u = (size * 0.78) / 16;
  const g = new Grid(ctx, cx - 8 * u, cy - 8 * u, u);
  g.rect(1, 6, 15, 11, 'rgba(255,214,107,0.18)');
  cube(g, 3, 10, 9, 6, 3, { top: '#fff1b0', front: '#ffc94a', side: '#c98a1a', outline: '#3d2400' });
  // Lamp lattice.
  g.rect(3, 12, 9, 1, '#d98a12');
  g.rect(7, 10, 1, 6, '#d98a12');
  g.rect(4, 11, 2, 1, '#fffbe0');
  g.bitmap(EMERALD, { o: '#053d1c', W: '#eafff0', L: '#7dffa8', M: '#24d266', D: '#11994a', B: '#0a6b33' }, 4, 0);
}

function sparkle(g: Grid, x: number, y: number, color: string) {
  g.dot(x + 1, y, color);
  g.rect(x, y + 1, 3, 1, color);
  g.dot(x + 1, y + 2, color);
}
