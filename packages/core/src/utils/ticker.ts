import type { Ticker } from 'pixi.js';

/**
 * Global ticker reference that can be set by the game application.
 * This allows Match3Piece to access ticker data without importing from main.
 */
let globalTicker: Ticker | null = null;

/**
 * Register the Pixi.js ticker globally for use in the Match3 engine
 * @param ticker The Pixi.js application ticker
 */
export function setGlobalTicker(ticker: Ticker) {
  globalTicker = ticker;
}

/**
 * Get the global ticker
 */
export function getGlobalTicker(): Ticker {
  if (!globalTicker) {
    throw new Error('Global ticker not initialized. Call setGlobalTicker() first.');
  }
  return globalTicker;
}

/**
 * Check if ticker is initialized
 */
export function isTickerInitialized(): boolean {
  return globalTicker !== null;
}
