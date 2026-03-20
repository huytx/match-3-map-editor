import { PIECE_INFO, SPECIAL_INFO, COLUMNS, ROWS } from './constants';
import { makeEmptyGrid, makeRandomGrid, makeDeadlockGrid, BLOCK_SENTINEL } from './gridUtils';

function getCellStyle(type: number) {
  if (type === 0) return { bg: 'rgba(10,0,30,0.55)', border: 'rgba(255,255,255,0.06)', img: '' };
  if (type === BLOCK_SENTINEL) return { bg: '#3a2e4a', border: '#7a6e8eaa', img: '' };
  if (type < 0) {
    const sp = SPECIAL_INFO[Math.abs(type) - 1];
    return { bg: 'rgba(10,0,30,0.7)', border: '#ffd579aa', img: sp?.img ?? '' };
  }
  const info = PIECE_INFO[type - 1];
  return { bg: 'rgba(10,0,30,0.7)', border: info ? info.bg + 'aa' : 'rgba(255,255,255,0.12)', img: info?.img ?? '' };
}

interface Props {
  grid: number[][];
  hovered: [number, number] | null;
  onHover: (h: [number, number] | null) => void;
  isPainting: React.MutableRefObject<boolean>;
  onCellDown: (r: number, c: number) => void;
  onCellEnter: (r: number, c: number) => void;
  maxType: number;
  onPush: (g: number[][]) => void;
}

export function EditorGrid({ grid, hovered, onHover, isPainting, onCellDown, onCellEnter, maxType, onPush }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-w-0 gap-2 p-4">
      {/* Coord hint */}
      <p className="text-white/25 text-[10px] h-3.5 tabular-nums">
        {hovered ? `row ${hovered[0]},  col ${hovered[1]}` : ''}
      </p>

      {/* Grid */}
      <div
        className="touch-none select-none"
        onPointerDown={() => {
          isPainting.current = true;
        }}
        onPointerLeave={() => {
          onHover(null);
          isPainting.current = false;
        }}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((type, c) => {
              const { bg, border, img } = getCellStyle(type);
              const isHov = hovered?.[0] === r && hovered?.[1] === c;
              return (
                <div
                  key={c}
                  className="w-9 h-9 m-px rounded-md cursor-crosshair border-2 flex items-center justify-center
                             overflow-hidden transition-transform duration-75"
                  style={{
                    backgroundColor: bg,
                    borderColor: border,
                    transform: isHov ? 'scale(1.18)' : 'scale(1)',
                    zIndex: isHov ? 10 : 0,
                    boxShadow: isHov ? `0 0 10px ${border}` : 'none',
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover([r, c]);
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onCellDown(r, c);
                  }}
                  onPointerEnter={() => onCellEnter(r, c)}
                >
                  {img && <img src={img} alt="" className="w-full h-full object-contain pointer-events-none" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom helpers */}
      <div className="flex gap-4 items-center flex-wrap justify-center pt-1">
        <button
          className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          onClick={() => onPush(makeEmptyGrid())}
        >
          🗑️ Clear
        </button>
        <button
          className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
          onClick={() => onPush(makeRandomGrid(maxType))}
        >
          ↺ Randomize
        </button>
        <button
          title="Load a provably-deadlocked board to test auto-shuffle"
          className="text-xs text-orange/50 hover:text-orange transition-colors cursor-pointer"
          onClick={() => onPush(makeDeadlockGrid(maxType))}
        >
          🔒 Deadlock
        </button>
        <span className="text-white/15 text-[10px] tabular-nums">
          {COLUMNS} × {ROWS}
        </span>
      </div>
    </div>
  );
}
