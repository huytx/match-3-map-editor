import { action, createStore, Action } from 'easy-peasy';
import type { Match3Mode } from '../match3/Match3Config';

interface GameModel {
    gameMode: Match3Mode;
    soundEnabled: boolean;
    setGameMode: Action<GameModel, Match3Mode>;
    setSoundEnabled: Action<GameModel, boolean>;
}

export const gameStore = createStore<GameModel>({
    gameMode: 'normal',
    soundEnabled: true,
    setGameMode: action((state, payload) => {
        state.gameMode = payload;
    }),
    setSoundEnabled: action((state, payload) => {
        state.soundEnabled = payload;
    }),
});
