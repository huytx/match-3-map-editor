import { Match3Config } from '../match3/Match3Config';

/**
 * Module-level bridge for passing a custom level config from the Level Editor
 * (React) to GameScreen (Pixi). The editor calls setPendingLevel() before
 * navigating to 'game'; GameScreen.prepare() calls consumePendingLevel() once.
 */

let pendingLevel: Match3Config | null = null;
let fromEditor = false;
let editorMode: Match3Config['mode'] = 'normal';
let editorGoals: Record<string, number> = {};

/** Store a level config to be consumed on the next game start. */
export function setPendingLevel(data: Match3Config | null) {
  pendingLevel = data;
  fromEditor = data !== null;
  if (data) {
    editorMode = data.mode;
    editorGoals = data.goals ?? {};
  } else {
    editorGoals = {};
  }
}

/** Returns the mode of the level launched from the editor. */
export function getEditorMode(): Match3Config['mode'] {
  return editorMode;
}

/** Returns the goals of the level launched from the editor. */
export function getEditorGoals(): Record<string, number> {
  return editorGoals;
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
