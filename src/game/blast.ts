import type { Color, Cube, Grid, HeroId, Power } from "./types";

let counter = 0;
const uid = () =>
  `c${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function makeCube(color: Color): Cube {
  return { id: uid(), color, power: null };
}

export function makePower(color: Color, power: Power): Cube {
  return { id: uid(), color, power };
}

const clone = (grid: Grid): Grid =>
  grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

export function createGrid(
  size: number,
  palette: Color[],
  seedPowers = 0,
  seedCrates = 0,
): Grid {
  let grid: Grid = [];
  for (let r = 0; r < size; r++) {
    const row: (Cube | null)[] = [];
    for (let c = 0; c < size; c++) row.push(makeCube(pick(palette)));
    grid.push(row);
  }
  for (let i = 0; i < seedPowers; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const powers: Power[] = ["rocketH", "rocketV", "bomb"];
    grid[r][c] = makePower(pick(palette), pick(powers));
  }
  let placed = 0;
  let guard = 0;
  while (placed < seedCrates && guard < size * size * 3) {
    guard += 1;
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const cell = grid[r][c];
    if (!cell || cell.power || cell.crate) continue;
    grid[r][c] = { ...cell, crate: 1 };
    placed += 1;
  }
  if (!hasMove(grid)) grid = createGrid(size, palette, seedPowers, seedCrates);
  return grid;
}

export function group(
  grid: Grid,
  r: number,
  c: number,
): { r: number; c: number }[] {
  const start = grid[r]?.[c];
  if (!start || start.power) return [];
  const color = start.color;
  const seen = new Set<string>();
  const stack = [{ r, c }];
  const out: { r: number; c: number }[] = [];
  while (stack.length) {
    const p = stack.pop()!;
    const key = `${p.r}:${p.c}`;
    if (seen.has(key)) continue;
    const cell = grid[p.r]?.[p.c];
    if (!cell || cell.power || cell.crate || cell.color !== color) continue;
    seen.add(key);
    out.push(p);
    stack.push(
      { r: p.r + 1, c: p.c },
      { r: p.r - 1, c: p.c },
      { r: p.r, c: p.c + 1 },
      { r: p.r, c: p.c - 1 },
    );
  }
  return out;
}

export function hasMove(grid: Grid): boolean {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.power) return true;
      if (cell.crate) continue;
      const right = grid[r][c + 1];
      const down = grid[r + 1]?.[c];
      if (right && !right.power && !right.crate && right.color === cell.color)
        return true;
      if (down && !down.power && !down.crate && down.color === cell.color)
        return true;
    }
  }
  return false;
}

function powerFor(size: number): Power | null {
  if (size >= 9) return "disco";
  if (size >= 7) return "bomb";
  if (size >= 5) return Math.random() < 0.5 ? "rocketH" : "rocketV";
  return null;
}

function mostCommonColor(grid: Grid, fallback: Color): Color {
  const counts: Partial<Record<Color, number>> = {};
  for (const row of grid)
    for (const cell of row)
      if (cell && !cell.power)
        counts[cell.color] = (counts[cell.color] || 0) + 1;
  let best: Color | null = null;
  let max = -1;
  for (const key of Object.keys(counts) as Color[]) {
    if ((counts[key] || 0) > max) {
      max = counts[key] || 0;
      best = key;
    }
  }
  return best ?? fallback;
}

export interface Blast {
  type: Power;
  r: number;
  c: number;
}

export interface ClearedCell {
  r: number;
  c: number;
  color: Color;
  power: Power | null;
}

export interface TapResult {
  grid: Grid;
  cleared: ClearedCell[];
  collected: Partial<Record<Color, number>>;
  blasts: Blast[];
  spawned: { r: number; c: number; power: Power } | null;
}

function detonate(
  grid: Grid,
  starts: { r: number; c: number }[],
): { cells: Set<string>; blasts: Blast[] } {
  const n = grid.length;
  const cleared = new Set<string>();
  const activated = new Set<string>();
  const blasts: Blast[] = [];
  const queue = [...starts];

  while (queue.length) {
    const { r, c } = queue.shift()!;
    const key = `${r}:${c}`;
    const cell = grid[r]?.[c];
    if (!cell) continue;

    const area = new Set<string>();

    if (cell.power) {
      if (activated.has(key)) {
        cleared.add(key);
        continue;
      }
      activated.add(key);
      blasts.push({ type: cell.power, r, c });
      if (cell.power === "rocketH") {
        for (let cc = 0; cc < grid[r].length; cc++) area.add(`${r}:${cc}`);
      } else if (cell.power === "rocketV") {
        for (let rr = 0; rr < n; rr++) area.add(`${rr}:${c}`);
      } else if (cell.power === "bomb") {
        for (let dr = -2; dr <= 2; dr++)
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= n || cc >= grid[rr].length) continue;
            area.add(`${rr}:${cc}`);
          }
      } else if (cell.power === "disco") {
        const target = mostCommonColor(grid, cell.color);
        for (let rr = 0; rr < n; rr++)
          for (let cc = 0; cc < grid[rr].length; cc++) {
            const x = grid[rr][cc];
            if (x && !x.power && x.color === target) area.add(`${rr}:${cc}`);
          }
        area.add(key);
      }
    } else {
      area.add(key);
    }

    for (const a of area) {
      cleared.add(a);
      const [rr, cc] = a.split(":").map(Number);
      const ac = grid[rr]?.[cc];
      if (ac && ac.power && !activated.has(a)) queue.push({ r: rr, c: cc });
    }
  }

  return { cells: cleared, blasts };
}

function crackCrates(work: Grid, keys: Set<string>): Set<string> {
  const extra = new Set<string>();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const key of keys) {
    const [r, c] = key.split(":").map(Number);
    for (const [dr, dc] of dirs) {
      const rr = r + dr;
      const cc = c + dc;
      const k = `${rr}:${cc}`;
      const cell = work[rr]?.[cc];
      if (!cell?.crate || keys.has(k) || extra.has(k)) continue;
      const next = cell.crate - 1;
      if (next <= 0) extra.add(k);
      else work[rr][cc] = { ...cell, crate: next };
    }
  }
  return extra;
}

function neighborsOf(r: number, c: number) {
  return [
    { r, c },
    { r: r + 1, c },
    { r: r - 1, c },
    { r, c: c + 1 },
    { r, c: c - 1 },
  ];
}

function comboStarts(work: Grid, r: number, c: number) {
  const starts: { r: number; c: number }[] = [];
  for (const p of neighborsOf(r, c)) {
    const cell = work[p.r]?.[p.c];
    if (cell?.power) starts.push(p);
  }
  return starts.length ? starts : [{ r, c }];
}

function applyDiscoCombo(work: Grid, starts: { r: number; c: number }[]) {
  const powers = starts
    .map((s) => work[s.r]?.[s.c])
    .filter((c): c is Cube => !!c?.power);
  const disco = powers.find((p) => p.power === "disco");
  const other = powers.find((p) => p.power && p.power !== "disco");
  if (!disco || !other || starts.length < 2) return;
  const target = mostCommonColor(work, other.color);
  const n = work.length;
  for (let rr = 0; rr < n; rr++) {
    for (let cc = 0; cc < work[rr].length; cc++) {
      const cell = work[rr][cc];
      if (cell && !cell.power && !cell.crate && cell.color === target) {
        work[rr][cc] = makePower(cell.color, other.power!);
      }
    }
  }
}

function collapse(grid: Grid, palette: Color[]): Grid {
  const n = grid.length;
  const out: Grid = grid.map((row) => row.slice());
  const cols = grid[0].length;
  for (let c = 0; c < cols; c++) {
    const stack: (Cube | null)[] = [];
    for (let r = n - 1; r >= 0; r--) if (grid[r][c]) stack.push(grid[r][c]);
    for (let r = n - 1, i = 0; r >= 0; r--, i++) {
      out[r][c] = i < stack.length ? stack[i] : makeCube(pick(palette));
    }
  }
  return out;
}

export function shuffle(grid: Grid, palette: Color[]): Grid {
  let next = grid.map((row) =>
    row.map((cell) =>
      cell && !cell.power ? makeCube(pick(palette)) : cell,
    ),
  );
  let tries = 0;
  while (!hasMove(next) && tries < 30) {
    next = next.map((row) =>
      row.map((cell) =>
        cell && !cell.power ? makeCube(pick(palette)) : cell,
      ),
    );
    tries++;
  }
  return next;
}

function finalize(
  work: Grid,
  clearedKeys: Set<string>,
  blasts: Blast[],
  spawned: { r: number; c: number; power: Power } | null,
  fallbackColor: Color,
  palette: Color[],
): TapResult {
  const cleared: ClearedCell[] = [];
  const collected: Partial<Record<Color, number>> = {};
  for (const key of clearedKeys) {
    const [r, c] = key.split(":").map(Number);
    const cell = work[r][c];
    if (!cell) continue;
    cleared.push({ r, c, color: cell.color, power: cell.power });
    if (!cell.power && !cell.crate)
      collected[cell.color] = (collected[cell.color] || 0) + 1;
    work[r][c] = null;
  }
  if (spawned) {
    const base = work[spawned.r][spawned.c];
    const color = base ? base.color : fallbackColor;
    work[spawned.r][spawned.c] = makePower(color, spawned.power);
  }
  let grid = collapse(work, palette);
  if (!hasMove(grid)) grid = shuffle(grid, palette);
  return { grid, cleared, collected, blasts, spawned };
}

export function tap(
  grid: Grid,
  r: number,
  c: number,
  palette: Color[],
): TapResult | null {
  const cell = grid[r]?.[c];
  if (!cell) return null;
  const work = clone(grid);

  if (cell.power) {
    const starts = comboStarts(work, r, c);
    applyDiscoCombo(work, starts);
    const res = detonate(work, starts);
    const cracked = crackCrates(work, res.cells);
    for (const k of cracked) res.cells.add(k);
    return finalize(work, res.cells, res.blasts, null, cell.color, palette);
  }

  const g = group(work, r, c);
  if (g.length < 2) return null;
  const clearedKeys = new Set(g.map((p) => `${p.r}:${p.c}`));
  const cracked = crackCrates(work, clearedKeys);
  for (const k of cracked) clearedKeys.add(k);
  const power = powerFor(g.length);
  let spawned: { r: number; c: number; power: Power } | null = null;
  if (power) {
    spawned = { r, c, power };
    clearedKeys.delete(`${r}:${c}`);
  }
  return finalize(work, clearedKeys, [], spawned, cell.color, palette);
}

export function boosterTap(
  grid: Grid,
  hero: HeroId,
  palette: Color[],
): TapResult | null {
  const n = grid.length;
  const work = clone(grid);
  if (hero === "aidar") {
    const r = Math.floor(n / 2);
    const c = Math.floor(n / 2);
    const base = work[r][c];
    work[r][c] = makePower(base ? base.color : palette[0], "rocketH");
    return tap(work, r, c, palette);
  }
  if (hero === "artem") {
    const r = Math.floor(n / 2);
    const c = Math.floor(n / 2);
    const base = work[r][c];
    work[r][c] = makePower(
      mostCommonColor(work, base ? base.color : palette[0]),
      "disco",
    );
    return tap(work, r, c, palette);
  }
  return null;
}
