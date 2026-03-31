/** Typed event names for the game-UI bridge */
export type GameEventName = 'play' | 'dismiss-popup';

type Callback = () => void;

/** Lightweight event bus that bridges React UI components ↔ Pixi navigation. */
class GameEvents {
    private readonly listeners = new Map<GameEventName, Set<Callback>>();

    public on(event: GameEventName, cb: Callback): void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(cb);
    }

    public off(event: GameEventName, cb: Callback): void {
        this.listeners.get(event)?.delete(cb);
    }

    public emit(event: GameEventName): void {
        this.listeners.get(event)?.forEach((cb) => cb());
    }
}

export const gameEvents = new GameEvents();
