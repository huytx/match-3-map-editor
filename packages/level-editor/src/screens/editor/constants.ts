import type { Match3Mode } from '@puzzling-potions/core';

export const ROWS = 9;
export const COLUMNS = 7;

export const PIECE_COUNT: Record<Match3Mode, number> = {
  test: 3,
  easy: 4,
  normal: 5,
  hard: 6,
};

export const PIECE_INFO = [
  { name: 'Dragon', bg: '#e8412b', img: '/assets/editor/piece-dragon.png' },
  { name: 'Frog', bg: '#2288ee', img: '/assets/editor/piece-frog.png' },
  { name: 'Newt', bg: '#66cc22', img: '/assets/editor/piece-newt.png' },
  { name: 'Snake', bg: '#9922cc', img: '/assets/editor/piece-snake.png' },
  { name: 'Spider', bg: '#f0b210', img: '/assets/editor/piece-spider.png' },
  { name: 'Yeti', bg: '#f070b5', img: '/assets/editor/piece-yeti.png' },
] as const;

export const SPECIAL_INFO = [
  { name: 'Blast', key: 'special-blast', bg: '#ff9235', img: '/assets/editor/special-blast.png' },
  { name: 'Row', key: 'special-row', bg: '#e84b9b', img: '/assets/editor/special-row.png' },
  { name: 'Column', key: 'special-column', bg: '#4be8c8', img: '/assets/editor/special-column.png' },
  { name: 'Colour', key: 'special-colour', bg: '#ffd579', img: '/assets/editor/special-colour.png' },
] as const;

export const BLOCK_INFO = { name: 'Block', bg: '#7a6e8e', img: '' } as const;

export type PaletteEntry = { kind: 'piece'; type: number } | { kind: 'special'; index: number } | { kind: 'block' };
export type ToolMode = 'paint' | 'fill' | 'remove';
