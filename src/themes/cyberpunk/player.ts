import type { SkinId } from '../../game/types';
import { NEON, TAU, glow, lw, neon, noGlow, poly, rgba, type Ctx } from './shared';

/** Body silhouette facing right, with a mouth wedge of half-angle `a`. */
function bodyPath(ctx: Ctx, cx: number, cy: number, r: number, a: number) {
  ctx.beginPath();
  if (a < 0.02) {
    ctx.arc(cx, cy, r, 0, TAU);
  } else {
    ctx.moveTo(cx - r * 0.1, cy);
    ctx.arc(cx, cy, r, a, TAU - a);
  }
  ctx.closePath();
}

interface SkinStyle {
  rim: string;
  light: string;
  base: string;
  dark: string;
  visor: string;
}

const SKIN: Record<SkinId, SkinStyle> = {
  classic: { rim: NEON.cyan, light: '#c9feff', base: '#16a9c9', dark: '#041a36', visor: '#ffffff' },
  santa: { rim: NEON.red, light: '#ffa3bd', base: '#c8134d', dark: '#26031a', visor: '#fff3f8' },
  snowman: { rim: '#e9f6ff', light: '#ffffff', base: '#9aa7bd', dark: '#1d2336', visor: NEON.cyan },
  gingerbread: { rim: NEON.amber, light: '#f0a35c', base: '#7a3510', dark: '#1c0702', visor: '#fff0c8' },
  reindeer: { rim: NEON.violet, light: '#cfa6ff', base: '#55289a', dark: '#12052c', visor: NEON.cyan },
  ice: { rim: '#f0e2ff', light: '#ffffff', base: '#b9a6ff', dark: '#2a2470', visor: '#ffffff' },
};

function bodyFill(ctx: Ctx, skin: SkinId, st: SkinStyle, cx: number, cy: number, r: number) {
  if (skin === 'ice') {
    // Iridescent prism: pastel spectrum swept diagonally.
    const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, '#d6fbff');
    g.addColorStop(0.25, '#9ff3ff');
    g.addColorStop(0.45, '#c9a8ff');
    g.addColorStop(0.65, '#ff9fe6');
    g.addColorStop(0.85, '#fff3a8');
    g.addColorStop(1, '#7d6cff');
    return g;
  }
  if (skin === 'snowman') {
    // Chrome: hard horizon reflection across the middle.
    const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.38, '#c9d3e4');
    g.addColorStop(0.47, '#5b6680');
    g.addColorStop(0.52, '#2a3148');
    g.addColorStop(0.7, '#8d9ab4');
    g.addColorStop(1, '#dfe8f6');
    return g;
  }
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.08, cx, cy, r * 1.05);
  g.addColorStop(0, st.light);
  g.addColorStop(0.5, st.base);
  g.addColorStop(1, st.dark);
  return g;
}

/** Skin-specific surface detail, drawn clipped to the body. */
function innerDetail(ctx: Ctx, skin: SkinId, st: SkinStyle, cx: number, cy: number, r: number) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Tech ring + scanlines shared by every skin.
  ctx.strokeStyle = rgba(st.rim, 0.35);
  ctx.lineWidth = lw(r * 0.05, 0.5);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let y = cy - r; y < cy + r; y += Math.max(1.5, r * 0.16)) ctx.fillRect(cx - r, y, r * 2, Math.max(0.5, r * 0.05));

  switch (skin) {
    case 'classic': {
      // Hex plating segments on the back of the head.
      ctx.strokeStyle = rgba(NEON.cyan, 0.55);
      ctx.lineWidth = lw(r * 0.06, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, Math.PI * 0.62, Math.PI * 1.05);
      ctx.moveTo(cx - r * 0.7, cy + r * 0.05);
      ctx.lineTo(cx - r * 0.98, cy + r * 0.05);
      ctx.moveTo(cx - r * 0.45, cy + r * 0.54);
      ctx.lineTo(cx - r * 0.62, cy + r * 0.8);
      ctx.stroke();
      break;
    }
    case 'santa': {
      // Neon "fur" trim band across the lower body.
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(cx - r, cy + r * 0.48, r * 2, r * 0.2);
      break;
    }
    case 'snowman': {
      // Chrome rivets + visor reflection streaks.
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [dx, dy] of [[-0.62, 0.3], [-0.3, 0.62], [-0.72, -0.18]]) {
        ctx.beginPath();
        ctx.arc(cx + dx * r, cy + dy * r, r * 0.06, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = lw(r * 0.07, 0.5);
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.75, cy - r * 0.55);
      ctx.lineTo(cx - r * 0.45, cy - r * 0.78);
      ctx.stroke();
      break;
    }
    case 'gingerbread': {
      // Orange circuitry: traces with 45° bends ending in solder pads.
      glow(ctx, NEON.amber, r * 0.3);
      ctx.strokeStyle = '#ffb02e';
      ctx.fillStyle = '#ffe3a1';
      ctx.lineWidth = lw(r * 0.07, 0.6);
      const traces: [number, number][][] = [
        [[-0.95, -0.1], [-0.5, -0.1], [-0.3, 0.1], [-0.3, 0.55]],
        [[-0.75, 0.62], [-0.55, 0.42], [0.1, 0.42], [0.25, 0.6]],
        [[-0.6, -0.75], [-0.35, -0.5], [-0.35, -0.3]],
        [[0.05, 0.95], [0.05, 0.72]],
      ];
      for (const tr of traces) {
        ctx.beginPath();
        tr.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * r, cy + y * r) : ctx.moveTo(cx + x * r, cy + y * r)));
        ctx.stroke();
        const [ex, ey] = tr[tr.length - 1];
        ctx.beginPath();
        ctx.arc(cx + ex * r, cy + ey * r, r * 0.09, 0, TAU);
        ctx.fill();
      }
      noGlow(ctx);
      break;
    }
    case 'reindeer': {
      // Plated muzzle panel.
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.35, cy + r * 0.55, r * 0.55, r * 0.3, -0.3, 0, TAU);
      ctx.fill();
      break;
    }
    case 'ice': {
      // Low-poly facets.
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = lw(r * 0.04, 0.5);
      const pts: [number, number][] = [[-0.35, -0.25], [0.15, -0.05], [-0.2, 0.45], [0.35, 0.55]];
      const rim: [number, number][] = [[-1, 0], [-0.7, -0.75], [0, -1], [0.7, 0.75], [0, 1], [-0.75, 0.68]];
      ctx.beginPath();
      for (const [px, py] of pts) {
        for (const [qx, qy] of rim) {
          if (Math.hypot(px - qx, py - qy) > 1.15) continue;
          ctx.moveTo(cx + px * r, cy + py * r);
          ctx.lineTo(cx + qx * r, cy + qy * r);
        }
      }
      ctx.moveTo(cx - 0.35 * r, cy - 0.25 * r);
      ctx.lineTo(cx - 0.2 * r, cy + 0.45 * r);
      ctx.lineTo(cx + 0.35 * r, cy + 0.55 * r);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      poly(ctx, [[cx - r * 0.35, cy - r * 0.25], [cx - r * 0.7, cy - r * 0.75], [cx, cy - r]]);
      ctx.fill();
      break;
    }
  }
}

/** Glowing visor slit: the character's "eye". */
function visor(ctx: Ctx, st: SkinStyle, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx + r * 0.14, cy - r * 0.52);
  ctx.rotate(-0.18);
  ctx.fillStyle = 'rgba(2,4,14,0.85)';
  ctx.beginPath();
  ctx.roundRect(-r * 0.27, -r * 0.13, r * 0.54, r * 0.26, r * 0.13);
  ctx.fill();
  glow(ctx, st.rim, r * 0.5);
  ctx.fillStyle = st.visor;
  ctx.beginPath();
  ctx.roundRect(-r * 0.2, -r * 0.065, r * 0.4, r * 0.13, r * 0.065);
  ctx.fill();
  ctx.restore();
}

function santaCap(ctx: Ctx, cx: number, cy: number, r: number) {
  const tip: [number, number] = [cx - r * 1.05, cy - r * 1.2];
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.86, cy - r * 0.5);
    ctx.quadraticCurveTo(cx - r * 0.75, cy - r * 1.35, cx - r * 0.1, cy - r * 1.5);
    ctx.quadraticCurveTo(cx - r * 0.75, cy - r * 1.45, tip[0], tip[1]);
    ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 1.75, cx + r * 0.42, cy - r * 0.9);
    ctx.closePath();
  };
  ctx.save();
  trace();
  ctx.fillStyle = 'rgba(255,40,90,0.3)';
  ctx.fill();
  neon(ctx, trace, NEON.red, r * 0.11);
  // Brim: a bright white tube.
  neon(
    ctx,
    () => {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.92, cy - r * 0.44);
      ctx.quadraticCurveTo(cx - r * 0.35, cy - r * 1.02, cx + r * 0.5, cy - r * 0.88);
    },
    '#ffd1e0',
    r * 0.2,
    '#ffffff',
  );
  glow(ctx, '#ffffff', r * 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(tip[0], tip[1], r * 0.17, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function holoHat(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.translate(cx - r * 0.12, cy - r * 0.86);
  ctx.rotate(-0.2);
  const w = r * 0.78;
  const h = r * 0.72;
  const g = ctx.createLinearGradient(-w / 2, -h, w / 2, 0);
  g.addColorStop(0, 'rgba(41,246,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,43,214,0.5)');
  g.addColorStop(1, 'rgba(246,255,58,0.45)');
  const crown = () => {
    ctx.beginPath();
    ctx.rect(-w / 2, -h, w, h);
  };
  crown();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  crown();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let y = -h; y < 0; y += Math.max(1.5, r * 0.14)) ctx.fillRect(-w / 2, y, w, Math.max(0.5, r * 0.04));
  ctx.restore();
  ctx.fillStyle = 'rgba(255,43,214,0.8)';
  ctx.fillRect(-w / 2, -h * 0.32, w, h * 0.14);
  neon(ctx, crown, NEON.cyan, r * 0.08);
  neon(
    ctx,
    () => {
      ctx.beginPath();
      ctx.moveTo(-w * 0.85, 0);
      ctx.lineTo(w * 0.85, 0);
    },
    NEON.cyan,
    r * 0.14,
  );
  ctx.restore();
}

function antennaAntlers(ctx: Ctx, cx: number, cy: number, r: number) {
  const branch = (bx: number, by: number, s: number) => {
    const top: [number, number] = [bx + s * r * 0.25, by - r * 0.85];
    const spur: [number, number] = [bx + s * r * 0.62, by - r * 0.62];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c9d3e4';
    ctx.lineWidth = lw(r * 0.1, 0.8);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(top[0], top[1]);
    ctx.moveTo(bx + s * r * 0.12, by - r * 0.42);
    ctx.lineTo(spur[0], spur[1]);
    ctx.stroke();
    glow(ctx, NEON.cyan, r * 0.5);
    ctx.fillStyle = '#c9feff';
    for (const [x, y] of [top, spur]) {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.12, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
  branch(cx - r * 0.42, cy - r * 0.86, -1);
  branch(cx + r * 0.05, cy - r * 0.98, 1);
}

function ledNose(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.save();
  glow(ctx, '#ff1a3c', r * 0.8);
  ctx.fillStyle = '#ff2448';
  ctx.beginPath();
  ctx.arc(cx + r * 0.52, cy - r * 0.7, r * 0.17, 0, TAU);
  ctx.fill();
  noGlow(ctx);
  ctx.fillStyle = '#ffd0d8';
  ctx.beginPath();
  ctx.arc(cx + r * 0.48, cy - r * 0.75, r * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a cyberpunk player skin facing right. `mouth` is 0 (closed) .. 1 (wide open).
 * Accessories extend up to ~1.75r above the centre.
 */
export function drawCyberPlayer(ctx: Ctx, skin: SkinId, cx: number, cy: number, r: number, mouth: number) {
  const a = Math.max(0, Math.min(1, mouth)) * 0.82;
  const st = SKIN[skin];

  ctx.save();
  if (skin === 'reindeer') antennaAntlers(ctx, cx, cy, r);

  glow(ctx, st.rim, r * 0.8);
  bodyPath(ctx, cx, cy, r, a);
  ctx.fillStyle = bodyFill(ctx, skin, st, cx, cy, r);
  ctx.fill();
  noGlow(ctx);

  ctx.save();
  bodyPath(ctx, cx, cy, r, a);
  ctx.clip();
  innerDetail(ctx, skin, st, cx, cy, r);
  ctx.restore();

  neon(ctx, () => bodyPath(ctx, cx, cy, r, a), st.rim, r * 0.13, '#ffffff', r * 0.6);
  visor(ctx, st, cx, cy, r);

  if (skin === 'santa') santaCap(ctx, cx, cy, r);
  if (skin === 'snowman') holoHat(ctx, cx, cy, r);
  if (skin === 'reindeer') ledNose(ctx, cx, cy, r);
  ctx.restore();
}

/** Four-point lens flare used for burst particles. */
export function drawFlare(ctx: Ctx, cx: number, cy: number, s: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.12, cy - s * 0.12);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx + s * 0.12, cy + s * 0.12);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s * 0.12, cy + s * 0.12);
  ctx.lineTo(cx - s, cy);
  ctx.lineTo(cx - s * 0.12, cy - s * 0.12);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.restore();
}
