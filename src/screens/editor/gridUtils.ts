import { ROWS, COLUMNS } from './constants';

// Special sentinels stored as negative numbers: -(specialIndex+1)
export const specialSentinel = (i: number) => -(i + 1);

export function makeEmptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => 0));
}

export function makeRandomGrid(maxType: number): number[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLUMNS }, () => Math.floor(Math.random() * maxType) + 1),
  );
}

/**
 * Cyclic diagonal pattern: grid[r][c] = (r+c) % maxType + 1
 * Provably deadlocked for any maxType > 2: no adjacent swap can produce 3-in-a-row.
 */
export function makeDeadlockGrid(maxType: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLUMNS }, (_, c) => ((r + c) % maxType) + 1));
}

export function adaptGrid(prev: number[][], maxType: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLUMNS }, (_, c) => {
      const v = prev[r]?.[c];
      if (v === undefined || v === 0) return 0;
      if (v < 0) return v; // keep special sentinel
      if (v >= 1 && v <= maxType) return v;
      return 0; // out-of-range piece → clear
    }),
  );
}

export function floodFill(grid: number[][], r: number, c: number, newVal: number): number[][] {
  const oldVal = grid[r][c];
  if (oldVal === newVal) return grid;
  const next = grid.map((row) => [...row]);
  const queue: [number, number][] = [[r, c]];
  while (queue.length) {
    const [cr, cc] = queue.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLUMNS) continue;
    if (next[cr][cc] !== oldVal) continue;
    next[cr][cc] = newVal;
    queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
  }
  return next;
}
