import { Match3Config } from '@puzzling-potions/core';
import {
  consumePendingLevel,
  getEditorMode,
  getEditorGoals,
  isEditorPreview,
  clearEditorPreview,
  setPendingLevel as sharedSetPendingLevel,
} from '@shared/utils/levelBridge';

export { consumePendingLevel, getEditorMode, getEditorGoals, isEditorPreview, clearEditorPreview };

/** Last level launched from the editor — used by Play Again on result screen */
let lastEditorLevel: Match3Config | null = null;

/** Store a level config to be consumed on the next game start. Also records it as lastEditorLevel. */
export function setPendingLevel(data: Match3Config | null) {
  sharedSetPendingLevel(data);
  if (data) lastEditorLevel = data;
}

/** Returns the last editor level config (for Play Again from result screen). */
export function getLastEditorLevel(): Match3Config | null {
  return lastEditorLevel;
}
