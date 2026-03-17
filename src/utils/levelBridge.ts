import { Match3Config } from '../match3/Match3Config';

/**
 * Module-level bridge for passing a custom level config from the Level Editor
 * (React) to GameScreen (Pixi). The editor calls setPendingLevel() before
 * navigating to 'game'; GameScreen.prepare() calls consumePendingLevel() once.
 */

let pendingLevel: Match3Config | null = null;
let fromEditor = false;

/** Store a level config to be consumed on the next game start. */
export function setPendingLevel(data: Match3Config | null) {
  pendingLevel = data;
  fromEditor = data !== null;
}

/** Read and clear the pending level config (returns null if none was set). */
export function consumePendingLevel(): Match3Config | null {
  const data = pendingLevel;
  pendingLevel = null;
  return data;
}

/** Returns true when the current game session was launched from the level editor. */
export function isEditorPreview(): boolean {
  return fromEditor;
}

/** Clear the editor-preview flag (call when navigating back to the editor). */
export function clearEditorPreview() {
  fromEditor = false;
}
