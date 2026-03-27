import { PIECE_INFO, SPECIAL_INFO, BLOCK_INFO, ICE_INFO } from './constants';
import type { PaletteEntry, ToolMode } from './constants';

interface Props {
  onClose: () => void;
  palette: PaletteEntry;
  onPaletteChange: (p: PaletteEntry) => void;
  tool: ToolMode;
  onToolChange: (t: ToolMode) => void;
  maxType: number;
}

export function BrushPickerOverlay({ onClose, palette, onPaletteChange, tool, onToolChange, maxType }: Props) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col gap-3 bg-[#170e2b] border border-white/15 rounded-2xl p-4
                   max-h-[85vh] overflow-y-auto w-64 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-gold font-bold text-sm">Pick Brush</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Pieces grid */}
        <div className="flex flex-col gap-2">
          <span className="text-white/30 text-[9px] uppercase tracking-wide">Pieces</span>
          <div className="grid grid-cols-3 gap-1.5">
            {PIECE_INFO.slice(0, maxType).map((info, i) => {
              const active = palette.kind === 'piece' && palette.type - 1 === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    onPaletteChange({ kind: 'piece', type: i + 1 });
                    if (tool === 'remove') onToolChange('paint');
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer transition-all border-2"
                  style={{
                    borderColor: active ? info.bg : 'transparent',
                    backgroundColor: active ? info.bg + '25' : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? `0 0 12px ${info.bg}50` : 'none',
                  }}
                >
                  <img src={info.img} alt={info.name} className="w-9 h-9 object-contain" />
                  <span className="text-[9px] text-white/70 truncate w-full text-center">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Specials grid */}
        <div className="flex flex-col gap-2">
          <span className="text-white/30 text-[9px] uppercase tracking-wide">Specials</span>
          <div className="grid grid-cols-2 gap-1.5">
            {SPECIAL_INFO.map((info, i) => {
              const active = palette.kind === 'special' && palette.index === i;
              return (
                <button
                  key={i}
                  onClick={() => {
                    onPaletteChange({ kind: 'special', index: i });
                    if (tool === 'remove') onToolChange('paint');
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer transition-all border-2"
                  style={{
                    borderColor: active ? info.bg : 'transparent',
                    backgroundColor: active ? info.bg + '25' : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? `0 0 12px ${info.bg}50` : 'none',
                  }}
                >
                  <img src={info.img} alt={info.name} className="w-9 h-9 object-contain" />
                  <span className="text-[9px] text-white/70 truncate w-full text-center">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Block */}
        <div className="flex flex-col gap-2">
          <span className="text-white/30 text-[9px] uppercase tracking-wide">Obstacle</span>
          {(() => {
            const active = palette.kind === 'block';
            return (
              <button
                onClick={() => {
                  onPaletteChange({ kind: 'block' });
                  if (tool === 'remove') onToolChange('paint');
                  onClose();
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer transition-all border-2 w-full"
                style={{
                  borderColor: active ? BLOCK_INFO.bg : 'transparent',
                  backgroundColor: active ? BLOCK_INFO.bg + '25' : 'rgba(255,255,255,0.05)',
                  boxShadow: active ? `0 0 12px ${BLOCK_INFO.bg}50` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center text-white/60 text-lg font-bold"
                  style={{ backgroundColor: BLOCK_INFO.bg + '50' }}
                >
                  ▪
                </div>
                <span className="text-[9px] text-white/70">{BLOCK_INFO.name}</span>
              </button>
            );
          })()}
        </div>

        <div className="h-px bg-white/10" />

        {/* Ice layer */}
        <div className="flex flex-col gap-2">
          <span className="text-white/30 text-[9px] uppercase tracking-wide">Ice Layer</span>
          <div className="grid grid-cols-3 gap-1.5">
            {ICE_INFO.map((info) => {
              const active = palette.kind === 'ice' && palette.hp === info.hp;
              return (
                <button
                  key={info.hp}
                  onClick={() => {
                    onPaletteChange({ kind: 'ice', hp: info.hp });
                    if (tool === 'remove') onToolChange('paint');
                    onClose();
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 cursor-pointer transition-all border-2"
                  style={{
                    borderColor: active ? info.bg : 'transparent',
                    backgroundColor: active ? info.bg + '25' : 'rgba(255,255,255,0.05)',
                    boxShadow: active ? `0 0 12px ${info.bg}50` : 'none',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center text-base"
                    style={{ backgroundColor: info.bg + '30', border: `2px solid ${info.bg}70` }}
                  >
                    ❄️
                  </div>
                  <span className="text-[9px] text-white/70">{info.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button>Done</button>
      </div>
    </div>
  );
}
