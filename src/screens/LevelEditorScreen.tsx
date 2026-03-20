import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStoreActions, useStoreState } from 'easy-peasy';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { Match3Mode, match3ValidModes } from '@/match3/Match3Config';
import { setPendingLevel } from '@/utils/levelBridge';
import type { GameModel, EditorSnapshot } from '@/store/game-store';

import { ROWS, COLUMNS, PIECE_COUNT, PIECE_INFO } from './editor/constants';
import type { PaletteEntry, ToolMode } from './editor/constants';
import { makeEmptyGrid, adaptGrid, specialSentinel, floodFill, BLOCK_SENTINEL } from './editor/gridUtils';
import { MATCH3_BLOCK_TYPE } from '@/match3/Match3Utility';
import { useHistory } from './editor/useHistory';
import { EditorLeftPanel } from './editor/EditorLeftPanel';
import { EditorGrid } from './editor/EditorGrid';

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export const LevelEditorScreenView = () => {
  const { navigate } = useNavigation();
  const screenRef = useRef<HTMLDivElement>(null);

  // ── Store ─────────────────────────────────────────────────────────────────
  const snapshot = useStoreState<GameModel, EditorSnapshot | null>((s) => s.editor.snapshot);
  const saveSnapshot = useStoreActions<GameModel>((a) => a.editor.save);

  // ── Initial values from snapshot ──────────────────────────────────────────
  const initialGrid = snapshot?.grid ?? makeEmptyGrid();
  const initialMode = snapshot?.mode ?? 'normal';
  const initialDuration = snapshot?.duration ?? 60;
  const initialMovesLimit = snapshot?.movesLimit ?? 0;
  const initialLevelName = snapshot?.levelName ?? '';
  const initialGoals = snapshot?.goals ?? {};
  const initialWeights = snapshot?.weights;
  const initialEnableDeadlock = snapshot?.enableDeadlock ?? false;
  // ── State ─────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Match3Mode>(initialMode);
  const [duration, setDuration] = useState(initialDuration);
  const [movesLimit, setMovesLimit] = useState(initialMovesLimit);
  const [levelName, setLevelName] = useState(initialLevelName);
  const [goals, setGoals] = useState<Record<string, number>>(initialGoals);
  const [enableDeadlock, setEnableDeadlock] = useState(initialEnableDeadlock);
  const [weights, setWeights] = useState<number[]>(() =>
    Array.from({ length: PIECE_COUNT[initialMode] }, (_, i) => initialWeights?.[i] ?? 1),
  );
  const [palette, setPalette] = useState<PaletteEntry>({ kind: 'piece', type: 1 });
  const [tool, setTool] = useState<ToolMode>('paint');
  const [hovered, setHovered] = useState<[number, number] | null>(null);
  const isPainting = useRef(false);

  const { grid, push, undo, redo, canUndo, canRedo } = useHistory(initialGrid);
  const maxType = PIECE_COUNT[mode];

  // ── Goals helpers ─────────────────────────────────────────────────────────
  const setGoalCount = (name: string, count: number) => setGoals((g) => ({ ...g, [name]: Math.max(0, count) }));
  const activeGoals = Object.fromEntries(Object.entries(goals).filter(([, v]) => v > 0));
  const goalsEnabled = Object.values(goals).some((v) => v > 0);

  // ── Distribution ──────────────────────────────────────────────────────────
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

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => screenRef.current?.classList.add('screen-visible'));
  }, []);

  useEffect(() => {
    const stop = () => {
      isPainting.current = false;
    };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

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

  useEffect(() => {
    push(adaptGrid(grid, PIECE_COUNT[mode]));
    if (palette.kind === 'piece' && palette.type > PIECE_COUNT[mode]) setPalette({ kind: 'piece', type: 1 });
    setWeights((prev) => Array.from({ length: PIECE_COUNT[mode] }, (_, i) => prev[i] ?? 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Paint logic ───────────────────────────────────────────────────────────
  const paintValue = useCallback((): number => {
    if (tool === 'remove') return 0;
    if (palette.kind === 'piece') return palette.type;
    if (palette.kind === 'special') return specialSentinel(palette.index);
    if (palette.kind === 'block') return BLOCK_SENTINEL;
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

  // ── Resolve grid (specials → actual type offsets) ─────────────────────────
  const resolveGrid = useCallback((): number[][] => {
    return grid.map((row) =>
      row.map((v) => {
        if (v === BLOCK_SENTINEL) return MATCH3_BLOCK_TYPE;
        if (v < 0) return maxType + Math.abs(v);
        return v;
      }),
    );
  }, [grid, maxType]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    saveSnapshot({ grid, mode, duration, movesLimit, levelName, goals, weights, enableDeadlock });
    setPendingLevel({
      rows: ROWS,
      columns: COLUMNS,
      tileSize: 50,
      freeMoves: false,
      duration,
      maxMoves: movesLimit > 0 ? movesLimit : undefined,
      mode,
      levelName: levelName || undefined,
      grid: resolveGrid(),
      goals: Object.keys(activeGoals).length > 0 ? activeGoals : undefined,
      weights,
      enableDeadlock,
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
      maxMoves: movesLimit > 0 ? movesLimit : undefined,
      mode,
      grid: resolveGrid(),
      goals: Object.keys(activeGoals).length > 0 ? activeGoals : undefined,
      weights,
      enableDeadlock,
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
        setDuration(Math.max(0, Math.min(300, Number(data.duration) || 60)));
        setMovesLimit(Math.max(0, Number(data.maxMoves) || 0));
        setLevelName(data.levelName ?? '');
        setGoals(typeof data.goals === 'object' && data.goals ? data.goals : {});
        setEnableDeadlock(data.enableDeadlock === true);
        setWeights(
          Array.isArray(data.weights)
            ? Array.from({ length: PIECE_COUNT[m] }, (_, i) => data.weights[i] ?? 1)
            : Array.from({ length: PIECE_COUNT[m] }, () => 1),
        );
        push(Array.isArray(data.grid) ? adaptGrid(data.grid, PIECE_COUNT[m]) : makeEmptyGrid());
      } catch {
        /* ignore bad JSON */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={screenRef}
      className="html-screen flex flex-row overflow-hidden
                 [background:linear-gradient(160deg,#0a0025_0%,#2c136c_55%,#0a0025_100%)]"
    >
      <EditorLeftPanel
        onBack={() => navigate('home')}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        mode={mode}
        onModeChange={setMode}
        duration={duration}
        onDurationChange={setDuration}
        movesLimit={movesLimit}
        onMovesLimitChange={setMovesLimit}
        levelName={levelName}
        onLevelNameChange={setLevelName}
        enableDeadlock={enableDeadlock}
        onEnableDeadlockChange={setEnableDeadlock}
        palette={palette}
        onPaletteChange={setPalette}
        tool={tool}
        onToolChange={setTool}
        maxType={maxType}
        distItems={distItems}
        weights={weights}
        onWeightChange={(i, w) =>
          setWeights((prev) => {
            const next = [...prev];
            next[i] = w;
            return next;
          })
        }
        goals={goals}
        onGoalCountChange={setGoalCount}
        activeGoals={activeGoals}
        goalsEnabled={goalsEnabled}
        onPlay={handlePlay}
        onExport={handleExport}
        onImport={handleImport}
      />
      <EditorGrid
        grid={grid}
        hovered={hovered}
        onHover={setHovered}
        isPainting={isPainting}
        onCellDown={handleCellDown}
        onCellEnter={handleCellEnter}
        maxType={maxType}
        onPush={push}
      />
    </div>
  );
};
