export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? 'logo--compact' : ''}`}>
      <h1 className="logo__title" aria-label="Winter Maze">
        <span className="logo__line logo__line--1" data-text="WINTER">WINTER</span>
        <span className="logo__line logo__line--2" data-text="MAZE">MAZE</span>
      </h1>
      <div className="logo__ribbon">
        <span>Christmas Edition</span>
      </div>
    </div>
  );
}
