/**
 * Swap match-3.
 * Rules taken from PixiJS Puzzling Potions (MIT):
 * https://github.com/pixijs/open-games/tree/main/puzzling-potions
 * Swap neighbours, resolve 3+ lines, spawn specials, cascade, refill.
 */
import type { Color, Cube, Grid, HeroId, Power } from "./types";

let counter = 0;
const uid = () =>
  `c${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function makeCube(color: Color, power: Power | null = null): Cube {
  return { id: uid(), color, power };
}

const clone = (grid: Grid): Grid =>
  grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));

export function adjacent(
  a: { r: number; c: number },
  b: { r: number; c: number },
) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function inBounds(grid: Grid, r: number, c: number) {
  return r >= 0 && c >= 0 && r < grid.length && c < (grid[r]?.length ?? 0);
}

export function findRuns(grid: Grid) {
  const runs: { cells: { r: number; c: number }[]; axis: "h" | "v" }[] = [];
  const n = grid.length;

  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < grid[r].length) {
      const cell = grid[r][c];
      if (!cell || cell.crate) {
        c += 1;
        continue;
      }
      let end = c + 1;
      while (
        end < grid[r].length &&
        grid[r][end] &&
        !grid[r][end]!.crate &&
        grid[r][end]!.color === cell.color
      )
        end += 1;
      if (end - c >= 3) {
        const cells = [];
        for (let x = c; x < end; x++) cells.push({ r, c: x });
        runs.push({ cells, axis: "h" });
      }
      c = end;
    }
  }

  const cols = grid[0]?.length ?? 0;
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < n) {
      const cell = grid[r]?.[c];
      if (!cell || cell.crate) {
        r += 1;
        continue;
      }
      let end = r + 1;
      while (
        end < n &&
        grid[end][c] &&
        !grid[end][c]!.crate &&
        grid[end][c]!.color === cell.color
      )
        end += 1;
      if (end - r >= 3) {
        const cells = [];
        for (let y = r; y < end; y++) cells.push({ r: y, c });
        runs.push({ cells, axis: "v" });
      }
      r = end;
    }
  }
  return runs;
}

function keyOf(r: number, c: number) {
  return `${r}:${c}`;
}

function specialFromRuns(
  runs: ReturnType<typeof findRuns>,
  prefer?: { r: number; c: number },
): { r: number; c: number; power: Power } | null {
  if (!runs.length) return null;
  const cover = new Map<string, { h: number; v: number }>();
  for (const run of runs) {
    for (const p of run.cells) {
      const cur = cover.get(keyOf(p.r, p.c)) ?? { h: 0, v: 0 };
      if (run.axis === "h") cur.h = Math.max(cur.h, run.cells.length);
      else cur.v = Math.max(cur.v, run.cells.length);
      cover.set(keyOf(p.r, p.c), cur);
    }
  }

  let bomb: { r: number; c: number } | null = null;
  let five: { r: number; c: number } | null = null;
  let four: { r: number; c: number; power: Power } | null = null;

  for (const [k, v] of cover) {
    const [r, c] = k.split(":").map(Number);
    if (v.h >= 3 && v.v >= 3) bomb = { r, c };
    if (v.h >= 5 || v.v >= 5) five = { r, c };
    else if (v.h >= 4) four = { r, c, power: "rocketH" };
    else if (v.v >= 4) four = { r, c, power: "rocketV" };
  }

  const pickPos = (fallback: { r: number; c: number }) => {
    if (prefer && cover.has(keyOf(prefer.r, prefer.c))) return prefer;
    return fallback;
  };

  if (five) return { ...pickPos(five), power: "disco" };
  if (bomb) return { ...pickPos(bomb), power: "bomb" };
  if (four) return { ...pickPos(four), power: four.power };
  return null;
}

export interface SwapBlast {
  type: Power;
  r: number;
  c: number;
}

export interface SwapCleared {
  r: number;
  c: number;
  color: Color;
  power: Power | null;
}

export interface SwapResult {
  grid: Grid;
  cleared: SwapCleared[];
  collected: Partial<Record<Color, number>>;
  blasts: SwapBlast[];
  combo: number;
}

function mostCommonColor(grid: Grid, fallback: Color): Color {
  const counts: Partial<Record<Color, number>> = {};
  for (const row of grid)
    for (const cell of row)
      if (cell && !cell.power && !cell.crate)
        counts[cell.color] = (counts[cell.color] || 0) + 1;
  let best: Color = fallback;
  let max = -1;
  for (const key of Object.keys(counts) as Color[]) {
    if ((counts[key] || 0) > max) {
      max = counts[key] || 0;
      best = key;
    }
  }
  return best;
}

function detonatePower(
  grid: Grid,
  r: number,
  c: number,
  area: Set<string>,
  blasts: SwapBlast[],
) {
  const cell = grid[r]?.[c];
  if (!cell?.power) return;
  blasts.push({ type: cell.power, r, c });
  const n = grid.length;
  if (cell.power === "rocketH") {
    for (let cc = 0; cc < grid[r].length; cc++) area.add(keyOf(r, cc));
  } else if (cell.power === "rocketV") {
    for (let rr = 0; rr < n; rr++) area.add(keyOf(rr, c));
  } else if (cell.power === "bomb") {
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        if (inBounds(grid, r + dr, c + dc)) area.add(keyOf(r + dr, c + dc));
      }
  } else if (cell.power === "disco") {
    const target = mostCommonColor(grid, cell.color);
    for (let rr = 0; rr < n; rr++)
      for (let cc = 0; cc < grid[rr].length; cc++) {
        const x = grid[rr][cc];
        if (x && !x.crate && x.color === target) area.add(keyOf(rr, cc));
      }
    area.add(keyOf(r, c));
  }
}

function crackCrates(work: Grid, keys: Set<string>) {
  const extra = new Set<string>();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const k of keys) {
    const [r, c] = k.split(":").map(Number);
    for (const [dr, dc] of dirs) {
      const rr = r + dr;
      const cc = c + dc;
      const nk = keyOf(rr, cc);
      const cell = work[rr]?.[cc];
      if (!cell?.crate || keys.has(nk) || extra.has(nk)) continue;
      const next = cell.crate - 1;
      if (next <= 0) extra.add(nk);
      else work[rr][cc] = { ...cell, crate: next };
    }
  }
  return extra;
}

function collapse(grid: Grid, palette: Color[]): Grid {
  const n = grid.length;
  const cols = grid[0].length;
  const out: Grid = grid.map((row) => row.slice());
  for (let c = 0; c < cols; c++) {
    const stack: Cube[] = [];
    for (let r = n - 1; r >= 0; r--) if (grid[r][c]) stack.push(grid[r][c]!);
    for (let r = n - 1, i = 0; r >= 0; r--, i++) {
      out[r][c] = i < stack.length ? stack[i] : makeCube(pick(palette));
    }
  }
  return out;
}

function resolve(
  work: Grid,
  palette: Color[],
  prefer?: { r: number; c: number },
  initialArea?: Set<string>,
  initialBlasts?: SwapBlast[],
  specials = true,
): SwapResult {
  const collected: Partial<Record<Color, number>> = {};
  const cleared: SwapCleared[] = [];
  const blasts: SwapBlast[] = [...(initialBlasts ?? [])];
  let combo = 0;
  let grid = work;
  let primed = initialArea ? new Set(initialArea) : null;

  for (let step = 0; step < 12; step++) {
    const runs = findRuns(grid);
    const area = primed ?? new Set<string>();
    primed = null;
    for (const run of runs)
      for (const p of run.cells) area.add(keyOf(p.r, p.c));

    if (!area.size) break;
    combo += 1;

    const spawned = specials ? specialFromRuns(runs, prefer) : null;
    const activated = new Set<string>();
    const queue = [...area];
    while (queue.length) {
      const k = queue.pop()!;
      const [r, c] = k.split(":").map(Number);
      const cell = grid[r]?.[c];
      if (cell?.power && !activated.has(k)) {
        activated.add(k);
        detonatePower(grid, r, c, area, blasts);
        for (const nk of area) if (!activated.has(nk)) queue.push(nk);
      }
    }

    for (const extra of crackCrates(grid, area)) area.add(extra);

    if (spawned) area.delete(keyOf(spawned.r, spawned.c));

    for (const k of area) {
      const [r, c] = k.split(":").map(Number);
      const cell = grid[r]?.[c];
      if (!cell) continue;
      cleared.push({ r, c, color: cell.color, power: cell.power });
      if (!cell.power && !cell.crate)
        collected[cell.color] = (collected[cell.color] || 0) + 1;
      grid[r][c] = null;
    }

    if (spawned) {
      const base = grid[spawned.r][spawned.c];
      grid[spawned.r][spawned.c] = makeCube(
        base?.color ?? pick(palette),
        spawned.power,
      );
    }

    grid = collapse(grid, palette);
    prefer = undefined;
  }

  if (!hasMove(grid, palette)) grid = shuffle(grid, palette);
  return { grid, cleared, collected, blasts, combo };
}

export function wouldMatch(
  grid: Grid,
  a: { r: number; c: number },
  b: { r: number; c: number },
) {
  const work = clone(grid);
  const t = work[a.r][a.c];
  work[a.r][a.c] = work[b.r][b.c];
  work[b.r][b.c] = t;
  return findRuns(work).length > 0;
}

export function hasMove(grid: Grid, _palette?: Color[]) {
  const n = grid.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (!cell) continue;
      if (cell.power) return true;
      const right = { r, c: c + 1 };
      const down = { r: r + 1, c };
      if (inBounds(grid, right.r, right.c) && wouldMatch(grid, { r, c }, right))
        return true;
      if (inBounds(grid, down.r, down.c) && wouldMatch(grid, { r, c }, down))
        return true;
    }
  }
  return false;
}

export function shuffle(grid: Grid, palette: Color[]): Grid {
  let next = grid.map((row) =>
    row.map((cell) =>
      cell && !cell.power && !cell.crate ? makeCube(pick(palette)) : cell,
    ),
  );
  let tries = 0;
  while ((!hasMove(next) || findRuns(next).length) && tries < 40) {
    next = next.map((row) =>
      row.map((cell) =>
        cell && !cell.power && !cell.crate ? makeCube(pick(palette)) : cell,
      ),
    );
    tries += 1;
  }
  return next;
}

export function createSwapGrid(
  size: number,
  palette: Color[],
  seedPowers = 0,
  seedCrates = 0,
  tries = 0,
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
    grid[r][c] = makeCube(pick(palette), pick(powers));
  }
  let placed = 0;
  let guard = 0;
  while (placed < seedCrates && guard < size * size * 4) {
    guard += 1;
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const cell = grid[r][c];
    if (!cell || cell.power || cell.crate) continue;
    grid[r][c] = { ...cell, crate: 1 };
    placed += 1;
  }
  if ((findRuns(grid).length || !hasMove(grid)) && tries < 24)
    return createSwapGrid(size, palette, seedPowers, seedCrates, tries + 1);
  if (findRuns(grid).length) grid = shuffle(grid, palette);
  return grid;
}

export function swapCells(
  grid: Grid,
  a: { r: number; c: number },
  b: { r: number; c: number },
  palette: Color[],
  specials = true,
): SwapResult | null {
  if (!adjacent(a, b)) return null;
  const A = grid[a.r]?.[a.c];
  const B = grid[b.r]?.[b.c];
  if (!A || !B) return null;

  const work = clone(grid);
  work[a.r][a.c] = B;
  work[b.r][b.c] = A;

  const area = new Set<string>();
  const blasts: SwapBlast[] = [];

  if (A.power === "disco" || B.power === "disco") {
    const other = A.power === "disco" ? B : A;
    const pos = A.power === "disco" ? b : a;
    blasts.push({ type: "disco", r: pos.r, c: pos.c });
    const n = work.length;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < work[r].length; c++) {
        const cell = work[r][c];
        if (cell && !cell.crate && cell.color === other.color)
          area.add(keyOf(r, c));
      }
    area.add(keyOf(a.r, a.c));
    area.add(keyOf(b.r, b.c));
  } else if (A.power || B.power) {
    if (A.power) detonatePower(work, b.r, b.c, area, blasts);
    if (B.power) detonatePower(work, a.r, a.c, area, blasts);
  }

  if (!area.size && !findRuns(work).length) return null;
  return resolve(
    work,
    palette,
    a,
    area.size ? area : undefined,
    blasts,
    specials,
  );
}

export function boosterSwap(
  grid: Grid,
  hero: HeroId,
  palette: Color[],
): SwapResult | null {
  const n = grid.length;
  const work = clone(grid);
  const r = Math.floor(n / 2);
  const c = Math.floor(n / 2);
  if (hero === "aidar") {
    work[r][c] = makeCube(work[r][c]?.color ?? palette[0], "rocketH");
    const area = new Set<string>();
    const blasts: SwapBlast[] = [];
    detonatePower(work, r, c, area, blasts);
    return resolve(work, palette, { r, c }, area, blasts);
  }
  if (hero === "artem") {
    work[r][c] = makeCube(mostCommonColor(work, palette[0]), "disco");
    const area = new Set<string>();
    const blasts: SwapBlast[] = [];
    detonatePower(work, r, c, area, blasts);
    return resolve(work, palette, { r, c }, area, blasts);
  }
  return null;
}
