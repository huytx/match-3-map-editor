import { Match3Mode, match3ValidModes } from '@puzzling-potions/core';
import { storage } from './storage';

// Key for saved game mode in storage
const KEY_GAME_MODE = 'game-mode';

/**
 * Persistent user settings for game mode.
 */
class UserSettings {
    /** Get current game mode */
    public getGameMode() {
        const mode = storage.getString(KEY_GAME_MODE) as Match3Mode;
        return match3ValidModes.includes(mode) ? mode : 'normal';
    }

    /** Set current game mode */
    public setGameMode(mode: Match3Mode) {
        if (!match3ValidModes.includes(mode)) {
            throw new Error('Invalid game mode: ' + mode);
        }
        return storage.setString(KEY_GAME_MODE, mode);
    }
}

/** Shared user settings instance */
export const userSettings = new UserSettings();
