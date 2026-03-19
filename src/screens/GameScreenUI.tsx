import { useEffect, useState } from 'react';
import eventEmitter from '@/utils/event-emitter';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { isEditorPreview, clearEditorPreview } from '@/utils/levelBridge';

// Piece + special colour map for goal progress bars
const PIECE_COLOR: Record<string, string> = {
  'piece-dragon': '#e8412b',
  'piece-frog': '#4abe50',
  'piece-newt': '#4287f5',
  'piece-snake': '#d4e84b',
  'piece-spider': '#9b4be8',
  'piece-yeti': '#a8e4f0',
  'special-blast': '#ff9235',
  'special-row': '#e84b9b',
  'special-column': '#4be8c8',
  'special-colour': '#ffd579',
};

export const GameScreenUIView = () => {
  const { navigate } = useNavigation();
  const [hud, setHud] = useState({
    timeRemaining: 0,
    score: 0,
    clearedPieces: 0,
    clearedByName: {} as Record<string, number>,
    goals: {} as Record<string, number>,
    movesLeft: 0,
    maxMoves: 0,
  });
  const [editorPreview] = useState(() => isEditorPreview());

  useEffect(() => {
    const handler = (data: {
      timeRemaining: number;
      score: number;
      clearedPieces: number;
      clearedByName: Record<string, number>;
      goals: Record<string, number>;
      movesLeft: number;
      maxMoves: number;
    }) => setHud(data);
    eventEmitter.on('hud:update', handler);
    return () => {
      eventEmitter.off('hud:update', handler);
    };
  }, []);

  const { timeRemaining, score, clearedByName, goals, movesLeft, maxMoves } = hud;
  const hasGoals = Object.keys(goals).length > 0;
  const hasMoves = maxMoves > 0;
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor(timeRemaining / 1000) % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isLow = timeRemaining > 1 && timeRemaining < 11000;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}
    >
      {/* Top bar: back button / score / timer */}
      <div className="flex justify-between items-center px-5 py-3 mt-[4vh]">
        {/* Back to editor button */}
        {editorPreview ? (
          <button
            className="pointer-events-auto text-white/60 hover:text-white text-[13px] font-bold
                                 bg-black/30 hover:bg-black/50 border border-white/20 rounded-xl px-3 py-1.5
                                 transition-all cursor-pointer leading-none"
            onClick={() => {
              clearEditorPreview();
              navigate('level-editor');
            }}
          >
            ← Editor
          </button>
        ) : (
          <div />
        )}

        <div className="text-[22px] font-bold text-gold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {score.toLocaleString()}
        </div>
        <div className="flex items-center gap-3">
          {hasMoves && (
            <div className="flex flex-col items-center leading-none">
              <span
                className={`text-[22px] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] transition-colors duration-100${movesLeft <= 5 && movesLeft > 0 ? ' timer-flash' : ''}`}
                style={{ color: movesLeft <= 5 ? '#ff9235' : '#ffffff' }}
              >
                {movesLeft}
              </span>
              <span className="text-[9px] text-white/40 uppercase tracking-wide">moves</span>
            </div>
          )}
          <div
            className={`text-[26px] font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] transition-colors duration-100${isLow ? ' timer-flash' : ''}`}
          >
            {timeStr}
          </div>
        </div>
      </div>

      {/* Goals panel — shown only when goals are set */}
      {hasGoals && (
        <div className="flex justify-center px-4">
          <div className="flex gap-2 flex-wrap justify-center bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
            {Object.entries(goals).map(([name, required]) => {
              const cleared = clearedByName[name] ?? 0;
              const done = cleared >= required;
              const pct = Math.min(100, (cleared / required) * 100);
              const color = PIECE_COLOR[name] ?? '#fff';
              const label = name.replace('piece-', '');
              return (
                <div key={name} className="flex items-center gap-1.5">
                  <img src={`/assets/editor/${name}.png`} alt={label} className="w-5 h-5 object-contain" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: done ? '#7aff7a' : '#fff' }}>
                        {cleared}
                      </span>
                      <span className="text-[10px] text-white/40">/{required}</span>
                      {done && <span className="text-[10px] text-[#7aff7a]">✓</span>}
                    </div>
                    <div className="w-14 h-1 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: done ? '#7aff7a' : color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
