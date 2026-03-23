import { useState, useRef, useEffect } from 'react';
import { PIECE_INFO, SPECIAL_INFO } from './constants';

interface Props {
  onClose: () => void;
  goals: Record<string, number>;
  onGoalCountChange: (name: string, count: number) => void;
  maxType: number;
  activeGoals: Record<string, number>;
}

type GoalItem = { name: string; label: string; img: string; bg: string; max: number };

function buildAllItems(maxType: number): GoalItem[] {
  return [
    ...PIECE_INFO.slice(0, maxType).map((info) => ({
      name: `piece-${info.name.toLowerCase()}`,
      label: info.name,
      img: info.img,
      bg: info.bg,
      max: 999,
    })),
    ...SPECIAL_INFO.map((info) => ({
      name: info.key,
      label: info.name,
      img: info.img,
      bg: info.bg,
      max: 99,
    })),
  ];
}

// ── Custom image-select dropdown ──────────────────────────────────────────────
function ItemSelect({
  items,
  value,
  onChange,
}: {
  items: GoalItem[];
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((i) => i.name === value) ?? items[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border cursor-pointer transition-colors text-left"
        style={{
          backgroundColor: selected.bg + '18',
          borderColor: selected.bg + '60',
        }}
      >
        <img src={selected.img} alt={selected.label} className="w-6 h-6 object-contain shrink-0" />
        <span className="flex-1 text-xs font-semibold text-white truncate">{selected.label}</span>
        <span className="text-white/30 text-[10px] shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-10 rounded-xl border border-white/15
                     bg-[#1a0e30] shadow-xl overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
        >
          {/* Pieces group */}
          <div className="px-2 pt-2 pb-0.5">
            <span className="text-white/25 text-[8px] uppercase tracking-widest">Pieces</span>
          </div>
          {items
            .filter((i) => i.name.startsWith('piece-'))
            .map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onChange(item.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-white/8 text-left"
                style={{ backgroundColor: item.name === value ? item.bg + '20' : undefined }}
              >
                <img src={item.img} alt={item.label} className="w-5 h-5 object-contain shrink-0" />
                <span className="text-xs text-white/80">{item.label}</span>
                {item.name === value && (
                  <span className="ml-auto text-[10px]" style={{ color: item.bg }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          {/* Specials group */}
          <div className="px-2 pt-2 pb-0.5 border-t border-white/8 mt-1">
            <span className="text-white/25 text-[8px] uppercase tracking-widest">Specials</span>
          </div>
          {items
            .filter((i) => !i.name.startsWith('piece-'))
            .map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onChange(item.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-white/8 text-left"
                style={{ backgroundColor: item.name === value ? item.bg + '20' : undefined }}
              >
                <img src={item.img} alt={item.label} className="w-5 h-5 object-contain shrink-0" />
                <span className="text-xs text-white/80">{item.label}</span>
                {item.name === value && (
                  <span className="ml-auto text-[10px]" style={{ color: item.bg }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          <div className="h-1.5" />
        </div>
      )}
    </div>
  );
}

export function GoalsOverlay({ onClose, goals, onGoalCountChange, maxType, activeGoals }: Props) {
  const allItems = buildAllItems(maxType);
  const [selectedName, setSelectedName] = useState(allItems[0].name);
  const [inputVal, setInputVal] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = allItems.find((i) => i.name === selectedName)!;
  const activeCount = Object.keys(activeGoals).length;

  // When user switches selector, pre-fill input with existing goal count (or 1)
  const handleSelectChange = (name: string) => {
    setSelectedName(name);
    const existing = goals[name];
    setInputVal(existing > 0 ? String(existing) : '1');
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleAdd = () => {
    const v = parseInt(inputVal, 10);
    if (!isNaN(v) && v > 0) {
      onGoalCountChange(selectedName, Math.min(selectedItem.max, v));
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex flex-col bg-[#170e2b] border border-white/15 rounded-2xl shadow-xl w-72"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-gold font-bold text-sm">Edit Goals</h3>
            <p className="text-white/30 text-[9px] mt-0.5">
              {activeCount > 0 ? `${activeCount} goal${activeCount > 1 ? 's' : ''} set` : 'No goals yet'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {/* Row: selector + (count input if piece) + action button */}
          <div className="flex items-center gap-2">
            <ItemSelect items={allItems} value={selectedName} onChange={handleSelectChange} />

            {/* Number input */}
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={selectedItem.max}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              className="w-14 h-9 rounded-xl border text-center text-sm font-bold tabular-nums outline-none
                         bg-white/5 text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ borderColor: selectedItem.bg + '60' }}
            />

            {/* Action button */}
            <button
              onClick={handleAdd}
              className="h-9 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0"
              style={{
                backgroundColor: selectedItem.bg + '30',
                border: `1px solid ${selectedItem.bg}70`,
                color: selectedItem.bg,
              }}
            >
              Set
            </button>
          </div>

          {/* Active goals chips */}
          {activeCount > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-white/30 text-[9px] uppercase tracking-widest font-bold">Active</span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(activeGoals).map(([name, count]) => {
                  const item = allItems.find((i) => i.name === name);
                  if (!item) return null;
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-1 rounded-lg pl-1 pr-0.5 py-0.5"
                      style={{ backgroundColor: item.bg + '22', border: `1px solid ${item.bg}55` }}
                    >
                      <img src={item.img} alt={item.label} className="w-5 h-5 object-contain shrink-0" />
                      <span className="text-xs font-bold tabular-nums px-0.5" style={{ color: item.bg }}>
                        ×{count}
                      </span>
                      <button
                        onClick={() => onGoalCountChange(name, 0)}
                        className="w-4 h-4 rounded flex items-center justify-center text-[9px]
                                   text-white/25 hover:text-red-400 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 pb-4 pt-0">
          {activeCount > 0 && (
            <button
              onClick={() => Object.keys(goals).forEach((k) => onGoalCountChange(k, 0))}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/35
                         hover:text-white/60 rounded-xl py-2 text-xs cursor-pointer transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold
                       rounded-xl py-2 text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
