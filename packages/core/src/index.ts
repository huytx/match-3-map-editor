/**
 * Puzzling Potions - Core Game Engine
 * Exports Match3 game logic and configuration
 */

// Game engine
export { Match3 } from './match3/Match3';
export type { Match3OnMatchData, Match3OnMoveData, Match3OnPopData } from './match3/Match3';

// Configuration
export { match3GetConfig, match3GetBlocks, match3ValidModes } from './match3/Match3Config';
export type { Match3Config, Match3Mode } from './match3/Match3Config';

// Types & utilities
export { MATCH3_BLOCK_TYPE, match3GridToString } from './match3/Match3Utility';
export type { Match3Type, Match3Position, Match3Grid } from './match3/Match3Utility';

// Subsystems (if needed by integration layer)
export { Match3Board } from './match3/Match3Board';
export { Match3Actions } from './match3/Match3Actions';
export { Match3Process } from './match3/Match3Process';
export { Match3Special } from './match3/Match3Special';
export { Match3Stats } from './match3/Match3Stats';
export type { Match3StatsData } from './match3/Match3Stats';
export { Match3Timer } from './match3/Match3Timer';
export { Match3Piece } from './match3/Match3Piece';
export type { Match3PieceOptions } from './match3/Match3Piece';

// Ticker utilities (required for animation)
export { setGlobalTicker, getGlobalTicker, isTickerInitialized } from './utils/ticker';
