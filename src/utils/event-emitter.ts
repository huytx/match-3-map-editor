import EventEmitter from 'eventemitter3';
import type { ReactElement } from 'react';

interface ModalState {
  visible: boolean;
  child?: ReactElement | null;
  effect?: boolean;
  backgroundColor?: string | null;
}

type Events = {
  /** Pixi game signals React to change screen */
  navigate: [screen: string];
  /** Pixi game sends HUD data each frame */
  'hud:update': [
    data: {
      timeRemaining: number;
      score: number;
      clearedPieces: number;
      clearedByName: Record<string, number>;
      goals: Record<string, number>;
      movesLeft: number;
      maxMoves: number;
      isTimeless: boolean;
    },
  ];
  /** Pixi pause button / window blur → show pause modal */
  'game:pause': [];
  /** Pause modal "Done" → resume game */
  'game:resume': [];
  /** Open/close the modal container */
  changeModalState: [state: Partial<ModalState>];
};

export type { ModalState };

const eventEmitter = new EventEmitter<Events>();
export default eventEmitter;
