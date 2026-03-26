import type { Match3ScoringConfig } from '@puzzling-potions/core';

const FIELDS = [
  {
    key: 'pointsPerPop',
    label: 'Per pop',
    hint: 'Points per piece popped by a match',
    default: 1,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'pointsPerSpecialPop',
    label: 'Special pop',
    hint: 'Points per piece popped by a special',
    default: 3,
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'matchPieceMultiplier',
    label: 'Match ×',
    hint: 'Multiplier on piece count per match',
    default: 1,
    min: 0,
    max: 10,
    step: 0.5,
  },
  {
    key: 'comboMultiplier',
    label: 'Combo ×',
    hint: 'Multiplier on the combo bonus',
    default: 1,
    min: 0,
    max: 10,
    step: 0.5,
  },
  {
    key: 'avgPointsPerSecond',
    label: '★ baseline /s',
    hint: 'Pts/sec threshold used to calculate stars',
    default: 8,
    min: 1,
    max: 200,
    step: 1,
  },
] as const;

interface Props {
  onClose: () => void;
  scoring: Match3ScoringConfig;
  onScoringChange: (s: Match3ScoringConfig) => void;
}

export function ScoringOverlay({ onClose, scoring, onScoringChange }: Props) {
  const hasCustom = Object.keys(scoring).length > 0;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#0e0828]/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 shrink-0">
        <span className="text-gold font-bold text-xs uppercase tracking-widest">Scoring Config</span>
        <div className="flex items-center gap-2">
          {hasCustom && (
            <button
              className="text-[9px] text-white/40 hover:text-white/70 border border-white/15 hover:border-white/30
                         rounded px-1.5 py-0.5 cursor-pointer transition-colors"
              onClick={() => onScoringChange({})}
            >
              Reset all
            </button>
          )}
          <button className="btn-icon text-base flex items-center justify-center" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-0 overflow-y-auto flex-1 p-3">
        {FIELDS.map(({ key, label, hint, default: def, min, max, step }) => {
          const val = (scoring as Record<string, number>)[key] ?? def;
          const isCustom = (scoring as Record<string, number>)[key] !== undefined;
          return (
            <div key={key} className="flex items-center gap-3 py-2.5 border-b border-white/6 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white/80">{label}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{hint}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isCustom && (
                  <button
                    title="Reset to default"
                    className="text-[10px] text-white/25 hover:text-white/60 cursor-pointer transition-colors"
                    onClick={() => {
                      const next = { ...scoring } as Record<string, number>;
                      delete next[key];
                      onScoringChange(next as Match3ScoringConfig);
                    }}
                  >
                    ↺
                  </button>
                )}
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={val}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!isNaN(n)) onScoringChange({ ...scoring, [key]: n });
                  }}
                  className="w-16 bg-white/5 border text-white text-xs text-center rounded-lg
                             px-1.5 py-1.5 outline-none tabular-nums focus:border-orange"
                  style={{ borderColor: isCustom ? '#ffd57960' : 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-white/20 text-center px-3 pb-3 shrink-0">
        Fields with gold border override defaults. Use ↺ to reset individual values.
      </p>
    </div>
  );
}
