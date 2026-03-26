/** List of all valid game modes */
export const match3ValidModes = ['test', 'easy', 'normal', 'hard'] as const;

/** The game mode type */
export type Match3Mode = (typeof match3ValidModes)[number];

/**
 * Map of all available blocks for the game, ordered by game mode.
 * Each item in these lists should have a corresponding pixi texture with the same name
 */
const blocks: Record<Match3Mode | 'special', string[]> = {
  /** Test mode piece set */
  test: ['piece-dragon', 'piece-frog', 'piece-newt'],
  /** Easy mode piece set */
  easy: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake'],
  /** Normal mode piece set */
  normal: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake', 'piece-spider'],
  /** Hard mode piece set */
  hard: ['piece-dragon', 'piece-frog', 'piece-newt', 'piece-snake', 'piece-spider', 'piece-yeti'],
  /** Special types that will be added to the game regardless the mode */
  special: ['special-blast', 'special-row', 'special-column', 'special-colour'],
};

import { Match3Grid } from './Match3Utility';

/** Scoring tuning knobs — all fields are optional (defaults used when omitted) */
export interface Match3ScoringConfig {
  /** Points per piece popped by a normal match (default: 1) */
  pointsPerPop?: number;
  /** Points per piece popped by a special ability (default: 3) */
  pointsPerSpecialPop?: number;
  /** Multiplier applied per matched piece in a match reward (default: 1) */
  matchPieceMultiplier?: number;
  /** Multiplier applied to the combo bonus per match (default: 1) */
  comboMultiplier?: number;
  /** Baseline pts/sec used for grade thresholds (default: 8) */
  avgPointsPerSecond?: number;
}

/** Match3 configuration */
export interface Match3Config {
  /** Number of rows in the game */
  rows: number;
  /** Number of columns in the game */
  columns: number;
  /** The size (width & height, in pixels) of each cell in the grid */
  tileSize: number;
  /** Validate all moves, regardless if they create a match or not */
  freeMoves: boolean;
  /** Gameplay duration, in seconds. Set to 0 for timeless mode (only move count or goals matter) */
  duration: number;
  /** Gameplay mode - affects the number of piece types in the grid */
  mode: Match3Mode;
  /** Human-readable level name (set by the editor) */
  levelName?: string;
  /** Optional preset grid (used by the level editor). Row×column matrix of type numbers (1-based). */
  grid?: Match3Grid;
  /** Optional clear goals: piece name → required count. When set, clearing all goals wins the level early. */
  goals?: Record<string, number>;
  /** Optional move limit. When set, the game also ends when the player exhausts all moves. */
  maxMoves?: number;
  /** When true, game ends immediately if deadlock is detected. When false (default), board shuffles automatically. */
  enableDeadlock?: boolean;
  /** Per-piece spawn weight (index 0 = first common piece type, weight 1–5). Higher = more frequent. */
  weights?: number[];
  /** Optional scoring config. Omit to use default values. */
  scoring?: Match3ScoringConfig;
}

/** Default match3 configuration */
const defaultConfig: Match3Config = {
  rows: 9,
  columns: 7,
  tileSize: 50,
  freeMoves: false,
  duration: 60,
  mode: 'normal',
};

/** Build a config object overriding default values if suitable */
export function match3GetConfig(customConfig: Partial<Match3Config> = {}): Match3Config {
  return { ...defaultConfig, ...customConfig };
}

/** Mount a list of blocks available for given game mode */
export function match3GetBlocks(mode: Match3Mode): string[] {
  return [...blocks[mode], ...blocks.special];
}
