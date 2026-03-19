import { useState } from 'react';
import { match3ValidModes } from '@/match3/Match3Config';
import type { Match3Mode } from '@/match3/Match3Config';
import { PIECE_COUNT, PIECE_INFO, SPECIAL_INFO } from './constants';
import type { PaletteEntry, ToolMode } from './constants';
import { BrushPickerOverlay } from './BrushPickerOverlay';
import { GoalsOverlay } from './GoalsOverlay';

const TOOLS: [ToolMode, string, string][] = [
  ['paint', '✏️', 'Paint (P)'],
  ['fill', '🪣', 'Fill (F)'],
  ['remove', '🗑️', 'Remove (R)'],
];

interface Props {
  onBack: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mode: Match3Mode;
  onModeChange: (m: Match3Mode) => void;
  duration: number;
  onDurationChange: (d: number) => void;
  movesLimit: number;
  onMovesLimitChange: (m: number) => void;
  levelName: string;
  onLevelNameChange: (l: string) => void;
  palette: PaletteEntry;
  onPaletteChange: (p: PaletteEntry) => void;
  tool: ToolMode;
  onToolChange: (t: ToolMode) => void;
  maxType: number;
  distItems: Array<{ type: number; count: number; pct: number; info: (typeof PIECE_INFO)[number] }>;
  goals: Record<string, number>;
  onGoalCountChange: (name: string, count: number) => void;
  activeGoals: Record<string, number>;
  goalsEnabled: boolean;
  onPlay: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EditorLeftPanel({
  onBack,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mode,
  onModeChange,
  duration,
  onDurationChange,
  movesLimit,
  onMovesLimitChange,
  levelName,
  onLevelNameChange,
  palette,
  onPaletteChange,
  tool,
  onToolChange,
  maxType,
  distItems,
  goals,
  onGoalCountChange,
  activeGoals,
  goalsEnabled,
  onPlay,
  onExport,
  onImport,
}: Props) {
  const [brushOverlayOpen, setBrushOverlayOpen] = useState(false);
  const [goalsOverlayOpen, setGoalsOverlayOpen] = useState(false);

  const brushInfo = palette.kind === 'piece' ? PIECE_INFO[palette.type - 1] : SPECIAL_INFO[palette.index];
  const brushKindLabel = palette.kind === 'piece' ? 'Piece' : 'Special';

  return (
    <div className="w-80 shrink-0 flex flex-col h-full border-r border-white/10 bg-black/25 overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2.5 border-b border-white/10 shrink-0 gap-1">
        <button className="btn-icon text-base flex item-center justify-center" onClick={onBack} aria-label="Back">
          <p className="-translate-y-0.5">←</p>
        </button>
        <span className="text-gold font-bold text-xs">Level Editor</span>
        <div className="flex gap-0.5">
          <button
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            className="btn-icon text-xs disabled:opacity-25"
          >
            ↩
          </button>
          <button
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedo}
            className="btn-icon text-xs disabled:opacity-25"
          >
            ↪
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1 min-h-0">
        {/* Config */}
        <section className="flex flex-col gap-2">
          <h2 className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Config</h2>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/30 text-[9px] uppercase tracking-wide">Label / File name</span>
            <input
              type="text"
              placeholder="my-level…"
              value={levelName}
              onChange={(e) => onLevelNameChange(e.target.value)}
              className="bg-white/5 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-orange w-full"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-white/30 text-[9px] uppercase tracking-wide">Pieces</span>
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value as Match3Mode)}
                className="bg-white/5 border border-white/15 text-white rounded-lg px-2 py-1.5 text-xs cursor-pointer w-full"
              >
                {match3ValidModes.map((m) => (
                  <option key={m} value={m} className="bg-[#1a0040]">
                    {PIECE_COUNT[m]} types
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30 text-[9px] uppercase tracking-wide">Time (s)</span>
              <input
                type="number"
                min={30}
                max={300}
                step={10}
                value={duration}
                onChange={(e) => onDurationChange(Math.max(30, Math.min(300, Number(e.target.value))))}
                className="w-14 bg-white/5 border border-white/15 text-white text-xs text-center rounded-lg px-1.5 py-1.5 outline-none tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30 text-[9px] uppercase tracking-wide">Moves</span>
              <input
                type="number"
                min={0}
                max={999}
                step={5}
                value={movesLimit || ''}
                placeholder="∞"
                onChange={(e) => onMovesLimitChange(Math.max(0, Number(e.target.value) || 0))}
                title="Max moves (0 = unlimited)"
                className="w-14 bg-white/5 border border-white/15 text-white text-xs text-center rounded-lg px-1.5 py-1.5 outline-none tabular-nums"
                style={{ borderColor: movesLimit > 0 ? '#ff923560' : undefined }}
              />
            </div>
          </div>
        </section>

        <div className="h-px bg-white/8 shrink-0" />

        {/* Brush */}
        <section className="flex flex-col gap-2">
          <h2 className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Brush</h2>

          {/* Big current-brush preview — tap to open picker */}
          <button
            onClick={() => setBrushOverlayOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all w-full text-left"
            style={{
              borderColor: tool === 'remove' ? 'rgba(255,255,255,0.12)' : brushInfo.bg + '99',
              backgroundColor: tool === 'remove' ? 'rgba(255,255,255,0.04)' : brushInfo.bg + '18',
              boxShadow: tool === 'remove' ? 'none' : `0 0 16px ${brushInfo.bg}28`,
            }}
          >
            {tool === 'remove' ? (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10 text-2xl">
                🗑️
              </div>
            ) : (
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: brushInfo.bg + '28', border: `2px solid ${brushInfo.bg}70` }}
              >
                <img src={brushInfo.img} alt={brushInfo.name} className="w-9 h-9 object-contain drop-shadow" />
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white leading-tight">
                {tool === 'remove' ? 'Remove' : brushInfo.name}
              </span>
              <span
                className="text-[9px] uppercase tracking-wide leading-tight mt-0.5"
                style={{ color: tool === 'remove' ? 'rgba(255,255,255,0.3)' : brushInfo.bg }}
              >
                {tool === 'remove' ? 'eraser' : brushKindLabel}
              </span>
            </div>
            <span className="text-white/25 text-[10px] shrink-0">change ▾</span>
          </button>

          {/* Tool toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/15">
            {TOOLS.map(([t, icon, title]) => (
              <button
                key={t}
                title={title}
                onClick={() => onToolChange(t)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] cursor-pointer transition-colors"
                style={{
                  backgroundColor: tool === t ? 'rgba(255,213,121,0.18)' : 'transparent',
                  color: tool === t ? '#ffd579' : 'rgba(255,255,255,0.35)',
                }}
              >
                <span>{icon}</span>
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-white/8 shrink-0" />

        {/* Distribution */}
        <section className="flex flex-col gap-1.5">
          <h2 className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Distribution</h2>
          <div className="flex flex-col gap-1">
            {distItems.map(({ type, pct, info }) => (
              <div key={type} className="flex items-center gap-1.5">
                <img src={info?.img} alt={info?.name} className="w-4 h-4 object-contain shrink-0" />
                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: info?.bg }}
                  />
                </div>
                <span className="text-[9px] text-white/35 w-6 text-right tabular-nums shrink-0">{pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px bg-white/8 shrink-0" />

        {/* Goals */}
        <section className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Goals</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/30">{goalsEnabled ? 'clear to win' : 'off'}</span>
              <button
                onClick={() => setGoalsOverlayOpen(true)}
                className="text-[9px] text-gold/70 hover:text-gold border border-gold/30 hover:border-gold/60
                           rounded px-1.5 py-0.5 cursor-pointer transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
          {goalsEnabled ? (
            <div className="flex flex-wrap gap-1">
              {Object.entries(activeGoals).map(([name, count]) => {
                const pieceInfo = PIECE_INFO.find((p) => `piece-${p.name.toLowerCase()}` === name);
                const specInfo = SPECIAL_INFO.find((s) => s.key === name);
                const info = pieceInfo ?? specInfo;
                if (!info) return null;
                return (
                  <div
                    key={name}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-white/80"
                    style={{ backgroundColor: info.bg + '25', border: `1px solid ${info.bg}50` }}
                  >
                    <img src={info.img} alt={info.name} className="w-3.5 h-3.5 object-contain shrink-0" />
                    <span className="tabular-nums font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[9px] text-white/20 italic">No goals set — tap Edit to add some.</p>
          )}
        </section>

        {/* Spacer pushes actions to bottom */}
        <div className="flex-1" />

        {/* Actions */}
        <section className="flex flex-col gap-3 shrink-0">
          <button className="btn-play text-sm py-2.5 px-2" onClick={onPlay}>
            ▶ Play Level
          </button>
          <div className="flex gap-1.5">
            <button
              className="flex-1 bg-white/8 hover:bg-white/15 border border-white/15 text-white/70
                         rounded-xl py-2 text-xs cursor-pointer transition-colors"
              onClick={onExport}
            >
              ↓ Export
            </button>
            <label
              className="flex-1 bg-white/8 hover:bg-white/15 border border-white/15 text-white/70
                          rounded-xl py-2 text-xs cursor-pointer transition-colors text-center"
            >
              ↑ Import
              <input type="file" accept=".json" className="hidden" onChange={onImport} />
            </label>
          </div>
        </section>
      </div>

      {/* Brush picker overlay */}
      {brushOverlayOpen && (
        <BrushPickerOverlay
          onClose={() => setBrushOverlayOpen(false)}
          palette={palette}
          onPaletteChange={onPaletteChange}
          tool={tool}
          onToolChange={onToolChange}
          maxType={maxType}
        />
      )}

      {/* Goals overlay */}
      {goalsOverlayOpen && (
        <GoalsOverlay
          onClose={() => setGoalsOverlayOpen(false)}
          goals={goals}
          onGoalCountChange={onGoalCountChange}
          maxType={maxType}
          activeGoals={activeGoals}
        />
      )}
    </div>
  );
}
