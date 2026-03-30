import { PIECE_INFO, SPECIAL_INFO, BLOCK_INFO, ICE_INFO, LOCK_INFO } from './constants';
import type { PaletteEntry, ToolMode } from './constants';

interface Props {
  onClose: () => void;
  palette: PaletteEntry;
  onPaletteChange: (p: PaletteEntry) => void;
  tool: ToolMode;
  onToolChange: (t: ToolMode) => void;
  maxType: number;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-white/30 text-[8px] uppercase tracking-widest mb-1 block">{children}</span>
);

function ItemBtn({
  active,
  color,
  title,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-0.5 rounded-lg p-1 cursor-pointer transition-all border-2 w-full"
      style={{
        borderColor: active ? color : 'transparent',
        backgroundColor: active ? color + '22' : 'rgba(255,255,255,0.05)',
        boxShadow: active ? `0 0 10px ${color}40` : 'none',
      }}
    >
      {children}
    </button>
  );
}

export function BrushPickerOverlay({ onClose, palette, onPaletteChange, tool, onToolChange, maxType }: Props) {
  const pick = (p: PaletteEntry) => {
    onPaletteChange(p);
    if (tool === 'remove') onToolChange('paint');
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col gap-2.5 bg-[#170e2b] border border-white/15 rounded-2xl p-3 w-95 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-gold font-bold text-sm">Pick Brush</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── Pieces ── */}
        <div>
          <SectionLabel>Pieces</SectionLabel>
          <div className="grid grid-cols-6 gap-1">
            {PIECE_INFO.slice(0, maxType).map((info, i) => {
              const active = palette.kind === 'piece' && palette.type - 1 === i;
              return (
                <ItemBtn
                  key={i}
                  active={active}
                  color={info.bg}
                  title={info.name}
                  onClick={() => pick({ kind: 'piece', type: i + 1 })}
                >
                  <img src={info.img} alt={info.name} className="w-7 h-7 object-contain" />
                  <span className="text-[7px] text-white/60 truncate w-full text-center leading-none">{info.name}</span>
                </ItemBtn>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* ── Specials + Block (same row) ── */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SectionLabel>Specials</SectionLabel>
            <div className="grid grid-cols-4 gap-1">
              {SPECIAL_INFO.map((info, i) => {
                const active = palette.kind === 'special' && palette.index === i;
                return (
                  <ItemBtn
                    key={i}
                    active={active}
                    color={info.bg}
                    title={info.name}
                    onClick={() => pick({ kind: 'special', index: i })}
                  >
                    <img src={info.img} alt={info.name} className="w-7 h-7 object-contain" />
                    <span className="text-[7px] text-white/60 truncate w-full text-center leading-none">
                      {info.name}
                    </span>
                  </ItemBtn>
                );
              })}
            </div>
          </div>

          <div className="w-px bg-white/10" />

          <div>
            <SectionLabel>Block</SectionLabel>
            <ItemBtn
              active={palette.kind === 'block'}
              color={BLOCK_INFO.bg}
              title={BLOCK_INFO.name}
              onClick={() => pick({ kind: 'block' })}
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center text-white/60 text-sm font-bold"
                style={{ backgroundColor: BLOCK_INFO.bg + '50' }}
              >
                ▪
              </div>
              <span className="text-[7px] text-white/60 leading-none">{BLOCK_INFO.name}</span>
            </ItemBtn>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* ── Ice + Lock (same row) ── */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SectionLabel>Ice Layer</SectionLabel>
            <div className="grid grid-cols-3 gap-1">
              {ICE_INFO.map((info) => {
                const active = palette.kind === 'ice' && palette.hp === info.hp;
                return (
                  <ItemBtn
                    key={info.hp}
                    active={active}
                    color={info.bg}
                    title={info.name}
                    onClick={() => pick({ kind: 'ice', hp: info.hp })}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: info.bg + '30', border: `1.5px solid ${info.bg}80` }}
                    >
                      ❄️
                    </div>
                    <span className="text-[7px] text-white/60 leading-none">×{info.hp}</span>
                  </ItemBtn>
                );
              })}
            </div>
          </div>

          <div className="w-px bg-white/10" />

          <div className="flex-1">
            <SectionLabel>Lock Layer</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {LOCK_INFO.map((info) => {
                const active = palette.kind === 'lock' && palette.hp === info.hp;
                return (
                  <ItemBtn
                    key={info.hp}
                    active={active}
                    color={info.bg}
                    title={info.name}
                    onClick={() => pick({ kind: 'lock', hp: info.hp })}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-sm"
                      style={{ backgroundColor: info.bg + '30', border: `1.5px solid ${info.bg}80` }}
                    >
                      🔒
                    </div>
                    <span className="text-[7px] text-white/60 leading-none">×{info.hp}</span>
                  </ItemBtn>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
