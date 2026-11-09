const COLORS = ['#ff4d5e', '#ffd34d', '#4dd2ff', '#7cff7c', '#ff9a3d', '#e08bff'];
const SEGMENTS = 9;

/** Point on the scalloped wire, matching the SVG path below (viewBox height 60). */
function wireY(t: number) {
  return (1 - t) ** 2 * 6 + 2 * t * (1 - t) * 34 + t ** 2 * 6;
}

/** Festive string of twinkling bulbs hung across the top of the screen. */
export function Garland({ className = '' }: { className?: string }) {
  const seg = 100 / SEGMENTS;
  const path = Array.from({ length: SEGMENTS }, (_, i) => {
    const x0 = i * seg;
    return `${i === 0 ? `M ${x0} 6` : ''} Q ${x0 + seg / 2} 34 ${x0 + seg} 6`;
  }).join(' ');
  const bulbs = Array.from({ length: SEGMENTS }, (_, i) =>
    [0.3, 0.7].map((t) => ({ left: (i + t) * seg, top: (wireY(t) / 60) * 100, tilt: (t - 0.5) * -50 })),
  ).flat();

  return (
    <div className={`garland ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="garland__wire">
        <path d={path} fill="none" stroke="#173322" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
      {bulbs.map((b, i) => (
        <span
          key={i}
          className="garland__bulb"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            ['--bulb' as string]: COLORS[i % COLORS.length],
            ['--tilt' as string]: `${b.tilt}deg`,
            animationDelay: `${(i * 0.37) % 2.2}s`,
          }}
        />
      ))}
    </div>
  );
}
