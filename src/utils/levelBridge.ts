import { Match3Config } from '../match3/Match3Config';

/**
 * Module-level bridge for passing a custom level config from the Level Editor
 * (React) to GameScreen (Pixi). The editor calls setPendingLevel() before
 * navigating to 'game'; GameScreen.prepare() calls consumePendingLevel() once.
 */

let pendingLevel: Match3Config | null = null;

/** Store a level config to be consumed on the next game start. */
export function setPendingLevel(data: Match3Config | null) {
    pendingLevel = data;
}

/** Read and clear the pending level config (returns null if none was set). */
export function consumePendingLevel(): Match3Config | null {
    const data = pendingLevel;
    pendingLevel = null;
    return data;
}
