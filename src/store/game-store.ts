import { action, createStore, Action } from 'easy-peasy';
import type { Match3Mode } from '../match3/Match3Config';

// ── Level editor snapshot ─────────────────────────────────────────────────
export interface EditorSnapshot {
  grid: number[][];
  mode: Match3Mode;
  duration: number;
  /** Max moves limit (0 = no limit) */
  movesLimit: number;
  levelName: string;
  goals: Record<string, number>;
}

interface EditorModel {
  snapshot: EditorSnapshot | null;
  save: Action<EditorModel, EditorSnapshot>;
  clear: Action<EditorModel>;
}

// ── Root model ────────────────────────────────────────────────────────────
export interface GameModel {
  gameMode: Match3Mode;
  soundEnabled: boolean;
  editor: EditorModel;
  setGameMode: Action<GameModel, Match3Mode>;
  setSoundEnabled: Action<GameModel, boolean>;
}

export const gameStore = createStore<GameModel>({
  gameMode: 'normal',
  soundEnabled: true,
  editor: {
    snapshot: null,
    save: action((state, payload) => {
      state.snapshot = payload;
    }),
    clear: action((state) => {
      state.snapshot = null;
    }),
  },
  setGameMode: action((state, payload) => {
    state.gameMode = payload;
  }),
  setSoundEnabled: action((state, payload) => {
    state.soundEnabled = payload;
  }),
});
