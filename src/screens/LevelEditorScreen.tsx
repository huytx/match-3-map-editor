import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { Match3Mode, match3ValidModes } from '@/match3/Match3Config';
import { setPendingLevel } from '@/utils/levelBridge';

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
  { name: 'Dragon', bg: '#e8412b', emoji: '🐉' },
  { name: 'Frog', bg: '#4abe50', emoji: '🐸' },
  { name: 'Newt', bg: '#4287f5', emoji: '🦎' },
  { name: 'Snake', bg: '#d4e84b', emoji: '🐍' },
  { name: 'Spider', bg: '#9b4be8', emoji: '🕷️' },
  { name: 'Yeti', bg: '#a8e4f0', emoji: '❄️' },
] as const;

const SPECIAL_INFO = [
  { name: 'Blast', key: 'special-blast', bg: '#ff9235', emoji: '💥' },
  { name: 'Row', key: 'special-row', bg: '#e84b9b', emoji: '↔️' },
  { name: 'Column', key: 'special-column', bg: '#4be8c8', emoji: '↕️' },
  { name: 'Colour', key: 'special-colour', bg: '#ffd579', emoji: '🌈' },
] as const;

type PaletteEntry = { kind: 'piece'; type: number } | { kind: 'special'; index: number };

type ToolMode = 'paint' | 'fill' | 'erase';

// Special sentinels stored as negative numbers: -(specialIndex+1)
const specialSentinel = (i: number) => -(i + 1);

// ─────────────────────────────────────────────────────────────────────────────
// Grid helpers
// ─────────────────────────────────────────────────────────────────────────────

function randomType(max: number) {
  return Math.floor(Math.random() * max) + 1;
}

function makeRandomGrid(maxType: number): number[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLUMNS }, () => randomType(maxType)));
}

function adaptGrid(prev: number[][], maxType: number): number[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLUMNS }, (_, c) => {
      const v = prev[r]?.[c];
      if (v === undefined) return randomType(maxType);
      if (v < 0) return v; // keep special sentinel
      if (v >= 1 && v <= maxType) return v;
      return randomType(maxType);
    }),
  );
}

function floodFill(grid: number[][], r: number, c: number, newVal: number): number[][] {
  const oldVal = grid[r][c];
  if (oldVal === newVal) return grid;
  const next = grid.map((row) => [...row]);
  const queue: [number, number][] = [[r, c]];
  while (queue.length) {
    const entry = queue.pop()!;
    const [cr, cc] = entry;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLUMNS) continue;
    if (next[cr][cc] !== oldVal) continue;
    next[cr][cc] = newVal;
    queue.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
  }
  return next;
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
// Distribution chart
// ─────────────────────────────────────────────────────────────────────────────

interface DistChartProps {
  grid: number[][];
  maxType: number;
}
const DistChart = ({ grid, maxType }: DistChartProps) => {
  const flat = grid.flat();
  const total = flat.filter((v) => v > 0).length;
  const counts = Array.from({ length: maxType }, (_, i) => ({
    type: i + 1,
    count: flat.filter((v) => v === i + 1).length,
  }));
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2">
      <h2 className="text-gold font-bold text-xs uppercase tracking-widest">Distribution</h2>
      <div className="flex flex-col gap-1.5">
        {counts.map(({ type, count }) => {
          const info = PIECE_INFO[type - 1];
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span className="text-sm w-5 text-center leading-none">{info?.emoji}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: info?.bg }}
                />
              </div>
              <span className="text-[10px] text-white/40 tabular-nums w-7 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const LevelEditorScreenView = () => {
  const { navigate } = useNavigation();
  const screenRef = useRef<HTMLDivElement>(null);

  // Config
  const [mode, setMode] = useState<Match3Mode>('normal');
  const [duration, setDuration] = useState(60);
  const [freeMoves, setFreeMoves] = useState(false);
  const [levelName, setLevelName] = useState('');

  // Grid history
  const { grid, push, undo, redo, canUndo, canRedo } = useHistory(makeRandomGrid(PIECE_COUNT['normal']));

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
      if (e.key === 'e' || e.key === 'E') setTool('erase');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Mode change → re-clamp existing grid
  useEffect(() => {
    push(adaptGrid(grid, PIECE_COUNT[mode]));
    if (palette.kind === 'piece' && palette.type > PIECE_COUNT[mode]) setPalette({ kind: 'piece', type: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Paint logic ───────────────────────────────────────────────────────────
  const paintValue = useCallback((): number => {
    if (tool === 'erase') return randomType(maxType);
    if (palette.kind === 'piece') return palette.type;
    if (palette.kind === 'special') return specialSentinel(palette.index);
    return randomType(maxType);
  }, [palette, tool, maxType]);

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
    if (type < 0) {
      const sp = SPECIAL_INFO[Math.abs(type) - 1];
      return { bg: sp?.bg ?? '#888', border: '#ffd579aa', label: sp?.emoji ?? '★' };
    }
    const info = PIECE_INFO[type - 1];
    return { bg: info?.bg ?? '#555', border: 'rgba(255,255,255,0.08)', label: '' };
  };

  // ── Special stats ─────────────────────────────────────────────────────────
  const specialCount = useMemo(() => grid.flat().filter((v) => v < 0).length, [grid]);

  // ── Resolve grid (specials → actual type offsets) ─────────────────────────
  const resolveGrid = useCallback((): number[][] => {
    return grid.map((row) => row.map((v) => (v < 0 ? maxType + Math.abs(v) : v)));
  }, [grid, maxType]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    setPendingLevel({
      rows: ROWS,
      columns: COLUMNS,
      tileSize: 50,
      freeMoves,
      duration,
      mode,
      levelName: levelName || undefined,
      grid: resolveGrid(),
    });
    navigate('game');
  };

  const handleExport = () => {
    const data = {
      levelName: levelName || undefined,
      rows: ROWS,
      columns: COLUMNS,
      tileSize: 50,
      freeMoves,
      duration,
      mode,
      grid: resolveGrid(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${levelName || 'level'}.json`;
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
        setFreeMoves(Boolean(data.freeMoves));
        setLevelName(data.levelName ?? '');
        push(Array.isArray(data.grid) ? adaptGrid(data.grid, PIECE_COUNT[m]) : makeRandomGrid(PIECE_COUNT[m]));
      } catch {
        /* ignore bad JSON */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={screenRef}
      className="html-screen overflow-y-auto overflow-x-hidden items-stretch justify-start
                       [background:linear-gradient(160deg,#0a0025_0%,#2c136c_55%,#0a0025_100%)]"
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <button className="btn-icon text-base" onClick={() => navigate('home')} aria-label="Back">
          ←
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-gold font-bold text-sm tracking-wide leading-tight">Level Editor</h1>
          {levelName && <span className="text-white/40 text-[10px]">{levelName}</span>}
        </div>
        <div className="flex gap-1">
          <button
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
            className="btn-icon text-sm disabled:opacity-25"
          >
            ↩
          </button>
          <button
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={redo}
            className="btn-icon text-sm disabled:opacity-25"
          >
            ↪
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col xl:flex-row gap-4 p-4 w-full max-w-6xl mx-auto">
        {/* LEFT: Config + stats */}
        <div className="flex flex-col gap-3 xl:w-48 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-gold font-bold text-xs uppercase tracking-widest">Config</h2>

            <label className="flex flex-col gap-1 text-xs text-white/70">
              Level Name
              <input
                type="text"
                placeholder="My Level"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
                className="bg-deep-purple border border-white/20 text-white rounded-lg px-2 py-1.5 text-sm outline-none focus:border-orange"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-white/70">
              Mode
              <select
                className="bg-deep-purple border border-white/20 text-white rounded-lg px-2 py-1.5 text-sm cursor-pointer"
                value={mode}
                onChange={(e) => setMode(e.target.value as Match3Mode)}
              >
                {match3ValidModes.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)} ({PIECE_COUNT[m]} types)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-white/70">
              Duration (s)
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={30}
                  max={300}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="flex-1 accent-orange h-1 cursor-pointer"
                />
                <span className="w-8 text-right text-white text-xs tabular-nums">{duration}</span>
              </div>
            </label>

            <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={freeMoves}
                onChange={(e) => setFreeMoves(e.target.checked)}
                className="w-4 h-4 accent-orange cursor-pointer"
              />
              Free Moves
            </label>
          </div>

          <DistChart grid={grid} maxType={maxType} />

          {specialCount > 0 && (
            <p className="text-white/30 text-[10px] px-1">
              ★ {specialCount} pre-placed special{specialCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* CENTRE: Grid */}
        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
          {/* Tool bar */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1.5">
            {(
              [
                ['paint', '✏️', 'Paint (P)'],
                ['fill', '🪣', 'Fill (F)'],
                ['erase', '🧹', 'Erase (E)'],
              ] as [ToolMode, string, string][]
            ).map(([t, icon, title]) => (
              <button
                key={t}
                title={title}
                onClick={() => setTool(t)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all"
                style={{
                  backgroundColor: tool === t ? 'rgba(255,213,121,0.2)' : 'transparent',
                  color: tool === t ? '#ffd579' : 'rgba(255,255,255,0.4)',
                }}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </button>
            ))}
          </div>

          <p className="text-white/25 text-[10px] h-3.5 tabular-nums">
            {hovered ? `row ${hovered[0]}, col ${hovered[1]}` : ''}
          </p>

          {/* Grid */}
          <div
            className="touch-none select-none overflow-auto max-w-full"
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
                  const { bg, border, label } = getCellStyle(type);
                  const isHov = hovered?.[0] === r && hovered?.[1] === c;
                  return (
                    <div
                      key={c}
                      className="w-9 h-9 m-px rounded-md cursor-crosshair border-2 flex items-center justify-center text-[11px] leading-none transition-transform duration-75"
                      style={{
                        backgroundColor: bg,
                        borderColor: border,
                        transform: isHov ? 'scale(1.18)' : 'scale(1)',
                        zIndex: isHov ? 10 : 0,
                        boxShadow: isHov ? `0 0 10px ${bg}` : 'none',
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
                      {label}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex gap-4 flex-wrap justify-center pt-1">
            <button
              className="text-xs text-white/35 hover:text-white/65 transition-colors cursor-pointer"
              onClick={() => push(makeRandomGrid(maxType))}
            >
              ↺ Randomize
            </button>
          </div>

          <p className="text-white/20 text-[10px] tabular-nums">
            {ROWS} × {COLUMNS}
          </p>
        </div>

        {/* RIGHT: Palette + Actions */}
        <div className="flex flex-col gap-3 xl:w-44 shrink-0">
          {/* Pieces */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5">
            <h2 className="text-gold font-bold text-xs uppercase tracking-widest mb-0.5">Pieces</h2>
            {PIECE_INFO.slice(0, maxType).map((info, i) => {
              const t = i + 1;
              const active = palette.kind === 'piece' && palette.type === t;
              return (
                <button
                  key={t}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all"
                  style={{
                    backgroundColor: active ? info.bg + '28' : 'transparent',
                    borderColor: active ? info.bg : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                  onClick={() => {
                    setPalette({ kind: 'piece', type: t });
                    setTool('paint');
                  }}
                >
                  <span className="text-sm leading-none">{info.emoji}</span>
                  {info.name}
                </button>
              );
            })}
          </div>

          {/* Specials */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5">
            <h2 className="text-gold font-bold text-xs uppercase tracking-widest mb-0.5">Pre-placed Specials</h2>
            {SPECIAL_INFO.map((sp, i) => {
              const active = palette.kind === 'special' && palette.index === i;
              return (
                <button
                  key={sp.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all"
                  style={{
                    backgroundColor: active ? sp.bg + '28' : 'transparent',
                    borderColor: active ? sp.bg : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                  onClick={() => {
                    setPalette({ kind: 'special', index: i });
                    setTool('paint');
                  }}
                >
                  <span className="text-sm leading-none">{sp.emoji}</span>
                  {sp.name}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button className="btn-play text-sm py-2.5 px-4" onClick={handlePlay}>
              ▶ Play Level
            </button>
            <button
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-4 py-2.5 text-sm cursor-pointer transition-colors"
              onClick={handleExport}
            >
              ↓ Export JSON
            </button>
            <label className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-4 py-2.5 text-sm cursor-pointer transition-colors text-center">
              ↑ Import JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
