import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { Match3Mode, match3ValidModes } from '@/match3/Match3Config';
import { setPendingLevel } from '@/utils/levelBridge';
import type { GameModel, EditorSnapshot } from '@/store/game-store';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROWS = 9;
const COLUMNS = 7;

const PIECE_COUNT: Record<Match3Mode, number> = {
  test: 3,
  easy: 4,
  normal: 5,
  hard: 6,
};

const PIECE_INFO = [
  { name: 'Dragon', bg: '#e8412b', img: '/assets/editor/piece-dragon.png' },
  { name: 'Frog', bg: '#4abe50', img: '/assets/editor/piece-frog.png' },
  { name: 'Newt', bg: '#4287f5', img: '/assets/editor/piece-newt.png' },
  { name: 'Snake', bg: '#d4e84b', img: '/assets/editor/piece-snake.png' },
  { name: 'Spider', bg: '#9b4be8', img: '/assets/editor/piece-spider.png' },
  { name: 'Yeti', bg: '#a8e4f0', img: '/assets/editor/piece-yeti.png' },
] as const;

const SPECIAL_INFO = [
  { name: 'Blast', key: 'special-blast', bg: '#ff9235', img: '/assets/editor/special-blast.png' },
  { name: 'Row', key: 'special-row', bg: '#e84b9b', img: '/assets/editor/special-row.png' },
  { name: 'Column', key: 'special-column', bg: '#4be8c8', img: '/assets/editor/special-column.png' },
  { name: 'Colour', key: 'special-colour', bg: '#ffd579', img: '/assets/editor/special-colour.png' },
] as const;

type PaletteEntry = { kind: 'piece'; type: number } | { kind: 'special'; index: number };

type ToolMode = 'paint' | 'fill' | 'remove';

// Special sentinels stored as negative numbers: -(specialIndex+1)
const specialSentinel = (i: number) => -(i + 1);

// ─────────────────────────────────────────────────────────────────────────────
// Grid helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeEmptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => 0));
}

function makeRandomGrid(maxType: number): number[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLUMNS }, () => Math.floor(Math.random() * maxType) + 1),
  );
}

/**
 * Cyclic diagonal pattern: grid[r][c] = (r+c) % maxType + 1
 * Provably deadlocked for any maxType > 2: no adjacent swap can produce 3-in-a-row.
 */
function makeDeadlockGrid(maxType: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLUMNS }, (_, c) => ((r + c) % maxType) + 1));
}

function adaptGrid(prev: number[][], maxType: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLUMNS }, (_, c) => {
      const v = prev[r]?.[c];
      if (v === undefined || v === 0) return 0;
      if (v < 0) return v; // keep special sentinel
      if (v >= 1 && v <= maxType) return v;
      return 0; // out-of-range piece → clear
    }),
  );
}

function floodFill(grid: number[][], r: number, c: number, newVal: number): number[][] {
  const oldVal = grid[r][c];
  if (oldVal === newVal) return grid;
  const next = grid.map((row) => [...row]);
  const queue: [number, number][] = [[r, c]];
  while (queue.length) {
    const [cr, cc] = queue.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLUMNS) continue;
    if (next[cr][cc] !== oldVal) continue;
    next[cr][cc] = newVal;
    queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
  }
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// IconSelect — custom dropdown with image + text rows
// ─────────────────────────────────────────────────────────────────────────────

function IconSelect({
  options,
  value,
  isActive,
  onSelect,
}: {
  options: readonly { name: string; bg: string; img: string }[];
  value: number;
  isActive: boolean;
  onSelect: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const safeValue = Math.min(value, options.length - 1);
  const selected = options[safeValue];
  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all w-full"
        style={{
          borderColor: isActive ? selected.bg : 'rgba(255,255,255,0.15)',
          backgroundColor: isActive ? selected.bg + '18' : 'rgba(255,255,255,0.05)',
          boxShadow: isActive ? `0 0 8px ${selected.bg}44` : 'none',
        }}
      >
        <img src={selected.img} alt={selected.name} className="w-5 h-5 object-contain shrink-0" />
        <span className="flex-1 text-xs text-white/80 text-left truncate">{selected.name}</span>
        <span
          className="text-white/40 text-[10px] transition-transform duration-150"
          style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          className="mt-0.5 flex flex-col rounded-lg border border-white/12 overflow-hidden"
          style={{ backgroundColor: '#170e2b' }}
        >
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => {
                onSelect(i);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-white/8"
              style={{ backgroundColor: i === safeValue ? opt.bg + '22' : undefined }}
            >
              <img src={opt.img} alt={opt.name} className="w-5 h-5 object-contain shrink-0" />
              <span className="text-xs text-white/75 truncate">{opt.name}</span>
              {i === safeValue && <span className="ml-auto text-[10px] text-white/35">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History hook
// ─────────────────────────────────────────────────────────────────────────────

function useHistory(init: number[][]) {
  const [past, setPast] = useState<number[][][]>([]);
  const [present, setPresent] = useState<number[][]>(init);
  const [future, setFuture] = useState<number[][][]>([]);

  const push = useCallback(
    (next: number[][]) => {
      setPast((p) => [...p.slice(-50), present]);
      setPresent(next);
      setFuture([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [present],
  );

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, present]);
    setPresent(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, present]);

  return { grid: present, push, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const LevelEditorScreenView = () => {
  const { navigate } = useNavigation();
  const screenRef = useRef<HTMLDivElement>(null);

  // ── Restore snapshot from store on mount ────────────────────────────
  const snapshot = useStoreState<GameModel, EditorSnapshot | null>((s) => s.editor.snapshot);
  const saveSnapshot = useStoreActions<GameModel>((a) => a.editor.save);

  const initialGrid = snapshot?.grid ?? makeEmptyGrid();
  const initialMode = snapshot?.mode ?? 'normal';
  const initialDuration = snapshot?.duration ?? 60;
  const initialLevelName = snapshot?.levelName ?? '';
  const initialGoals = snapshot?.goals ?? {};

  // Config
  const [mode, setMode] = useState<Match3Mode>(initialMode);
  const [duration, setDuration] = useState(initialDuration);
  const [levelName, setLevelName] = useState(initialLevelName);
  // Goals: piece name → required count (0 = disabled)
  const [goals, setGoals] = useState<Record<string, number>>(initialGoals);
  const goalsEnabled = Object.values(goals).some((v) => v > 0);

  const setGoalCount = (name: string, count: number) => setGoals((g) => ({ ...g, [name]: Math.max(0, count) }));

  // Active goals (count > 0) passed to level config
  const activeGoals = Object.fromEntries(Object.entries(goals).filter(([, v]) => v > 0));

  // Grid history — start from snapshot or empty
  const { grid, push, undo, redo, canUndo, canRedo } = useHistory(initialGrid);

  // Editor
  const [palette, setPalette] = useState<PaletteEntry>({ kind: 'piece', type: 1 });
  const [tool, setTool] = useState<ToolMode>('paint');
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  const isPainting = useRef(false);
  const maxType = PIECE_COUNT[mode];

  // Fade-in
  useEffect(() => {
    requestAnimationFrame(() => screenRef.current?.classList.add('screen-visible'));
  }, []);

  // Global pointer-up stop
  useEffect(() => {
    const stop = () => {
      isPainting.current = false;
    };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'p' || e.key === 'P') setTool('paint');
      if (e.key === 'f' || e.key === 'F') setTool('fill');
      if (e.key === 'r' || e.key === 'R') setTool('remove');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Mode change → clamp grid (out-of-range pieces become empty)
  useEffect(() => {
    push(adaptGrid(grid, PIECE_COUNT[mode]));
    if (palette.kind === 'piece' && palette.type > PIECE_COUNT[mode]) setPalette({ kind: 'piece', type: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Paint logic ───────────────────────────────────────────────────────────
  const paintValue = useCallback((): number => {
    if (tool === 'remove') return 0;
    if (palette.kind === 'piece') return palette.type;
    if (palette.kind === 'special') return specialSentinel(palette.index);
    return 0;
  }, [palette, tool]);

  const applyPaint = useCallback(
    (r: number, c: number, g: number[][]): number[][] => {
      const next = g.map((row) => [...row]);
      next[r][c] = paintValue();
      return next;
    },
    [paintValue],
  );

  const handleCellDown = useCallback(
    (r: number, c: number) => {
      isPainting.current = true;
      if (tool === 'fill') {
        push(floodFill(grid, r, c, paintValue()));
      } else {
        push(applyPaint(r, c, grid));
      }
    },
    [grid, tool, push, applyPaint, paintValue],
  );

  const handleCellEnter = useCallback(
    (r: number, c: number) => {
      if (!isPainting.current || tool === 'fill') return;
      push(applyPaint(r, c, grid));
    },
    [grid, tool, push, applyPaint],
  );

  // ── Cell visuals ──────────────────────────────────────────────────────────
  const getCellStyle = (type: number) => {
    if (type === 0) return { bg: 'rgba(10,0,30,0.55)', border: 'rgba(255,255,255,0.06)', img: '' };
    if (type < 0) {
      const sp = SPECIAL_INFO[Math.abs(type) - 1];
      return { bg: 'rgba(10,0,30,0.7)', border: '#ffd579aa', img: sp?.img ?? '' };
    }
    const info = PIECE_INFO[type - 1];
    return { bg: 'rgba(10,0,30,0.7)', border: info ? info.bg + 'aa' : 'rgba(255,255,255,0.12)', img: info?.img ?? '' };
  };

  // ── Resolve grid (specials → actual type offsets) ─────────────────────────
  const resolveGrid = useCallback((): number[][] => {
    return grid.map((row) => row.map((v) => (v < 0 ? maxType + Math.abs(v) : v)));
  }, [grid, maxType]);

  // ── Distribution items ────────────────────────────────────────────────────
  const distItems = useMemo(() => {
    const flat = grid.flat();
    const total = flat.filter((v) => v > 0).length;
    return Array.from({ length: maxType }, (_, i) => {
      const type = i + 1;
      const count = flat.filter((v) => v === type).length;
      const pct = total ? Math.round((count / total) * 100) : 0;
      return { type, count, pct, info: PIECE_INFO[i] };
    });
  }, [grid, maxType]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    saveSnapshot({ grid, mode, duration, levelName, goals });
    setPendingLevel({
      rows: ROWS,
      columns: COLUMNS,
      tileSize: 50,
      freeMoves: false,
      duration,
      mode,
      levelName: levelName || undefined,
      grid: resolveGrid(),
      goals: Object.keys(activeGoals).length > 0 ? activeGoals : undefined,
    });
    navigate('game');
  };

  const handleExport = () => {
    const data = {
      levelName: levelName || undefined,
      rows: ROWS,
      columns: COLUMNS,
      tileSize: 50,
      freeMoves: false,
      duration,
      mode,
      grid: resolveGrid(),
      goals: Object.keys(activeGoals).length > 0 ? activeGoals : undefined,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${levelName || 'level'}_${PIECE_COUNT[mode]}t.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const m: Match3Mode = match3ValidModes.includes(data.mode) ? data.mode : 'normal';
        setMode(m);
        setDuration(Math.max(30, Math.min(300, Number(data.duration) || 60)));
        setLevelName(data.levelName ?? '');
        setGoals(typeof data.goals === 'object' && data.goals ? data.goals : {});
        push(Array.isArray(data.grid) ? adaptGrid(data.grid, PIECE_COUNT[m]) : makeEmptyGrid());
      } catch {
        /* ignore bad JSON */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Tool definitions ──────────────────────────────────────────────────────
  const TOOLS: [ToolMode, string, string][] = [
    ['paint', '✏️', 'Paint (P)'],
    ['fill', '🪣', 'Fill (F)'],
    ['remove', '🗑️', 'Remove (R)'],
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // Render — landscape two-panel layout, no outer scroll
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={screenRef}
      className="html-screen flex flex-row overflow-hidden
                 [background:linear-gradient(160deg,#0a0025_0%,#2c136c_55%,#0a0025_100%)]"
    >
      {/* ── LEFT PANEL: Editor controls ──────────────────────────────────── */}
      <div className="w-60 shrink-0 flex flex-col h-full border-r border-white/10 bg-black/25 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2.5 border-b border-white/10 shrink-0 gap-1">
          <button
            className="btn-icon text-base flex item-center justify-center"
            onClick={() => navigate('home')}
            aria-label="Back"
          >
            <p className="-translate-y-0.5">←</p>
          </button>
          <span className="text-gold font-bold text-xs">Level Editor</span>
          <div className="flex gap-0.5">
            <button
              title="Undo (Ctrl+Z)"
              disabled={!canUndo}
              onClick={undo}
              className="btn-icon text-xs disabled:opacity-25"
            >
              ↩
            </button>
            <button
              title="Redo (Ctrl+Y)"
              disabled={!canRedo}
              onClick={redo}
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
                onChange={(e) => setLevelName(e.target.value)}
                className="bg-white/5 border border-white/15 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-orange w-full"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-white/30 text-[9px] uppercase tracking-wide">Pieces</span>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Match3Mode)}
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
                <span className="text-white/30 text-[9px] uppercase tracking-wide">Time</span>
                <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg px-2 py-1.5">
                  <input
                    type="number"
                    min={30}
                    max={300}
                    step={10}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(30, Math.min(300, Number(e.target.value))))}
                    className="w-10 bg-transparent text-white text-xs text-center outline-none tabular-nums"
                  />
                  <span className="text-white/30 text-xs">s</span>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-white/8 shrink-0" />

          {/* Brush */}
          <section className="flex flex-col gap-2">
            <h2 className="text-gold/70 text-[10px] uppercase tracking-widest font-bold">Brush</h2>

            {/* Piece select */}
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30 text-[9px] uppercase tracking-wide">Piece</span>
              <IconSelect
                options={PIECE_INFO.slice(0, maxType)}
                value={palette.kind === 'piece' ? palette.type - 1 : 0}
                isActive={palette.kind === 'piece'}
                onSelect={(i) => {
                  setPalette({ kind: 'piece', type: i + 1 });
                  setTool('paint');
                }}
              />
            </div>

            {/* Special select */}
            <div className="flex flex-col gap-0.5">
              <span className="text-white/30 text-[9px] uppercase tracking-wide">Special</span>
              <IconSelect
                options={SPECIAL_INFO}
                value={palette.kind === 'special' ? palette.index : 0}
                isActive={palette.kind === 'special'}
                onSelect={(i) => {
                  setPalette({ kind: 'special', index: i });
                  setTool('paint');
                }}
              />
            </div>

            {/* Tool toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/15">
              {TOOLS.map(([t, icon, title]) => (
                <button
                  key={t}
                  title={title}
                  onClick={() => setTool(t)}
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

          {/* Distribution — compact */}
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
              <span className="text-[9px] text-white/30">{goalsEnabled ? 'clear to win' : 'off'}</span>
            </div>
            <div className="flex flex-col gap-1">
              {PIECE_INFO.slice(0, maxType).map((info) => {
                const name = `piece-${info.name.toLowerCase()}`;
                const val = goals[name] ?? 0;
                return (
                  <div key={name} className="flex items-center gap-1.5">
                    <img src={info.img} alt={info.name} className="w-4 h-4 object-contain shrink-0" />
                    <div
                      className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer"
                      title={`${info.name}: ${val} required`}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: val > 0 ? '100%' : '0%', backgroundColor: info.bg }}
                      />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={999}
                      step={5}
                      value={val || ''}
                      placeholder="0"
                      onChange={(e) => setGoalCount(name, Number(e.target.value) || 0)}
                      className="w-14 bg-white/5 border border-white/10 text-white text-[12px] text-center rounded px-0.5 py-0.5 outline-none tabular-nums"
                      style={{ borderColor: val > 0 ? info.bg + '80' : undefined }}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Spacer pushes actions to bottom */}
          <div className="flex-1" />

          {/* Actions */}
          <section className="flex flex-col gap-3 shrink-0">
            <button className="btn-play text-sm py-2.5 px-2" onClick={handlePlay}>
              ▶ Play Level
            </button>
            <div className="flex gap-1.5">
              <button
                className="flex-1 bg-white/8 hover:bg-white/15 border border-white/15 text-white/70
                           rounded-xl py-2 text-xs cursor-pointer transition-colors"
                onClick={handleExport}
              >
                ↓ Export
              </button>
              <label
                className="flex-1 bg-white/8 hover:bg-white/15 border border-white/15 text-white/70
                            rounded-xl py-2 text-xs cursor-pointer transition-colors text-center"
              >
                ↑ Import
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* ── RIGHT PANEL: Grid preview ─────────────────────────────────────── */}
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
            setHovered(null);
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
                      setHovered([r, c]);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleCellDown(r, c);
                    }}
                    onPointerEnter={() => handleCellEnter(r, c)}
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
            onClick={() => push(makeEmptyGrid())}
          >
            🗑️ Clear
          </button>
          <button
            className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            onClick={() => push(makeRandomGrid(maxType))}
          >
            ↺ Randomize
          </button>
          <button
            title="Load a provably-deadlocked board to test auto-shuffle"
            className="text-xs text-orange/50 hover:text-orange transition-colors cursor-pointer"
            onClick={() => push(makeDeadlockGrid(maxType))}
          >
            🔒 Deadlock
          </button>
          <span className="text-white/15 text-[10px] tabular-nums">
            {COLUMNS} × {ROWS}
          </span>
        </div>
      </div>
    </div>
  );
};
