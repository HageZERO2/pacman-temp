import { DIR_VECTORS, DIRS, type Cell, type Dir } from './types';

/**
 * Map legend:
 *  #  wall          _  void (outside the maze, not drawn)
 *  .  snowflake     o  magic crystal (power-up)
 *  *  golden star   ' ' empty corridor
 *  -  enemy gate    E  enemy house interior
 *  P  player start
 */
export type TileKind = 'wall' | 'void' | 'path' | 'gate' | 'house';

export type PickupKind = 'snowflake' | 'crystal' | 'star';

export interface Pickup extends Cell {
  kind: PickupKind;
}

const PICKUP_CHARS: Record<string, PickupKind> = { '.': 'snowflake', o: 'crystal', '*': 'star' };

export class Maze {
  readonly width: number;
  readonly height: number;
  readonly pickups: Pickup[] = [];
  readonly enemyHomes: Cell[] = [];
  readonly playerStart: Cell;
  readonly gate: Cell;
  /** Corridor tile directly above the gate; enemies leave the house through it. */
  readonly exit: Cell;
  /** House tile directly below the gate; eaten enemies regenerate here. */
  readonly houseCenter: Cell;
  readonly tunnelRows: Set<number>;
  private readonly tiles: TileKind[];

  constructor(rows: readonly string[]) {
    if (rows.length === 0) throw new Error('Maze has no rows');
    this.height = rows.length;
    this.width = rows[0].length;
    this.tiles = new Array<TileKind>(this.width * this.height);
    let player: Cell | undefined;
    let gate: Cell | undefined;

    rows.forEach((row, y) => {
      if (row.length !== this.width) throw new Error(`Row ${y} has width ${row.length}, expected ${this.width}`);
      for (let x = 0; x < this.width; x++) {
        const ch = row[x];
        let kind: TileKind = 'path';
        if (ch === '#') kind = 'wall';
        else if (ch === '_') kind = 'void';
        else if (ch === '-') {
          kind = 'gate';
          gate = { x, y };
        } else if (ch === 'E') {
          kind = 'house';
          this.enemyHomes.push({ x, y });
        } else if (ch === 'P') player = { x, y };
        else if (PICKUP_CHARS[ch]) this.pickups.push({ x, y, kind: PICKUP_CHARS[ch] });
        else if (ch !== ' ') throw new Error(`Unknown map character "${ch}" at ${x},${y}`);
        this.tiles[y * this.width + x] = kind;
      }
    });

    if (!player) throw new Error('Maze has no player start (P)');
    if (!gate) throw new Error('Maze has no enemy gate (-)');
    if (this.enemyHomes.length === 0) throw new Error('Maze has no enemy house (E)');
    this.playerStart = player;
    this.gate = gate;
    this.exit = { x: gate.x, y: gate.y - 1 };
    this.houseCenter = { x: gate.x, y: gate.y + 1 };
    this.tunnelRows = new Set(
      rows.map((_, y) => y).filter((y) => this.kind(0, y) === 'path' && this.kind(this.width - 1, y) === 'path'),
    );
  }

  wrapX(x: number): number {
    return ((x % this.width) + this.width) % this.width;
  }

  kind(x: number, y: number): TileKind {
    if (y < 0 || y >= this.height) return 'wall';
    return this.tiles[y * this.width + this.wrapX(x)];
  }

  isWallLike(x: number, y: number): boolean {
    const k = this.kind(x, y);
    return k === 'wall' || k === 'void';
  }

  /** Player may only use corridors; enemies may additionally pass the gate and house when allowed. */
  canEnter(x: number, y: number, allowHouse = false): boolean {
    const k = this.kind(x, y);
    if (k === 'path') return true;
    return allowHouse && (k === 'gate' || k === 'house');
  }

  step(cell: Cell, dir: Dir): Cell {
    const v = DIR_VECTORS[dir];
    return { x: this.wrapX(cell.x + v.x), y: cell.y + v.y };
  }

  isTunnel(cell: Cell): boolean {
    return this.tunnelRows.has(cell.y) && (cell.x < 3 || cell.x > this.width - 4);
  }

  /** First step of the shortest path between two cells, or null when unreachable. */
  firstStepTowards(from: Cell, to: Cell, allowHouse: boolean, forbidden?: Dir): Dir | null {
    if (from.x === to.x && from.y === to.y) return null;
    const key = (c: Cell) => c.y * this.width + c.x;
    const firstDir = new Map<number, Dir>();
    const queue: Cell[] = [];
    firstDir.set(key(from), DIRS[0]);
    for (const d of DIRS) {
      if (d === forbidden) continue;
      const n = this.step(from, d);
      if (!this.canEnter(n.x, n.y, allowHouse) || firstDir.has(key(n))) continue;
      firstDir.set(key(n), d);
      queue.push(n);
    }
    for (let i = 0; i < queue.length; i++) {
      const cur = queue[i];
      const d0 = firstDir.get(key(cur))!;
      if (cur.x === to.x && cur.y === to.y) return d0;
      for (const d of DIRS) {
        const n = this.step(cur, d);
        if (!this.canEnter(n.x, n.y, allowHouse) || firstDir.has(key(n))) continue;
        firstDir.set(key(n), d0);
        queue.push(n);
      }
    }
    return null;
  }

  /** All corridor cells reachable by the player from its start position. */
  reachableFromStart(): Set<number> {
    const seen = new Set<number>([this.playerStart.y * this.width + this.playerStart.x]);
    const stack: Cell[] = [this.playerStart];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const d of DIRS) {
        const n = this.step(cur, d);
        const k = n.y * this.width + n.x;
        if (!seen.has(k) && this.canEnter(n.x, n.y)) {
          seen.add(k);
          stack.push(n);
        }
      }
    }
    return seen;
  }
}
