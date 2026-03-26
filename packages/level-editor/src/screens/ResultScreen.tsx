import { useRef, useEffect } from 'react';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { userStats } from '@/utils/userStats';
import {
  isEditorPreview,
  clearEditorPreview,
  getEditorMode,
  getEditorGoals,
  setPendingLevel,
  getLastEditorLevel,
} from '@/utils/levelBridge';

const PIECE_COLOR: Record<string, string> = {
  'piece-dragon': '#e8412b',
  'piece-frog': '#4abe50',
  'piece-newt': '#4287f5',
  'piece-snake': '#d4e84b',
  'piece-spider': '#9b4be8',
  'piece-yeti': '#a8e4f0',
};

export const ResultScreenView = () => {
  const { navigate } = useNavigation();
  const ref = useRef<HTMLDivElement>(null);

  const mode = getEditorMode();
  const goals = getEditorGoals();
  const hasGoals = Object.keys(goals).length > 0;
  const performance = userStats.load(mode);
  const { score = 0 } = performance;
  const clearedByName =
    (performance as typeof performance & { clearedByName?: Record<string, number> }).clearedByName ?? {};
  const goalsAllMet = hasGoals && Object.entries(goals).every(([n, r]) => (clearedByName[n] ?? 0) >= r);

  useEffect(() => {
    console.log('[Result] clearedByName:', clearedByName);
    requestAnimationFrame(() => ref.current?.classList.add('screen-visible'));
  }, []);

  return (
    <div
      ref={ref}
      className="html-screen justify-between [background:linear-gradient(160deg,#0a0025_0%,#2c136c_55%,#0a0025_100%)]"
    >
      <div className="flex flex-col items-center flex-1 justify-center gap-3">
        <div className="text-[clamp(28px,6vw,40px)] font-bold text-gold text-center">Results</div>
        <div className="text-xs text-white/45 uppercase tracking-[3px]">{mode} mode</div>

        {/* Goals mode: win/fail + per-piece breakdown */}
        {hasGoals ? (
          <>
            <div
              className="text-[clamp(22px,5vw,32px)] font-bold"
              style={{ color: goalsAllMet ? '#7aff7a' : '#ff6b6b' }}
            >
              {goalsAllMet ? '🌟 Level Complete!' : '❌ Goals not met'}
            </div>
            <div className="flex flex-col gap-2 mt-1 w-full max-w-xs">
              {Object.entries(goals).map(([name, required]) => {
                const cleared = clearedByName[name] ?? 0;
                const done = cleared >= required;
                const pct = Math.min(100, (cleared / required) * 100);
                const color = PIECE_COLOR[name] ?? '#aaa';
                const label = name.replace('piece-', '');
                return (
                  <div key={name} className="flex items-center gap-3">
                    <img src={`/assets/editor/${name}.png`} alt={label} className="w-7 h-7 object-contain shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize text-white/70">{label}</span>
                        <span className="font-bold tabular-nums" style={{ color: done ? '#7aff7a' : '#fff' }}>
                          {cleared} / {required} {done ? '✓' : ''}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: done ? '#7aff7a' : color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[clamp(32px,8vw,52px)] font-bold text-white leading-none mt-2">
              {score.toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-[clamp(48px,12vw,72px)] font-bold text-white leading-none mt-1.5">
            {score.toLocaleString()}
          </div>
        )}
      </div>
      <div className="py-6 pb-9 flex flex-col items-center gap-3">
        <button
          className="btn-play"
          onClick={() => {
            if (isEditorPreview()) setPendingLevel(getLastEditorLevel());
            navigate('game');
          }}
        >
          ▶ Play Again
        </button>
        {isEditorPreview() && (
          <button
            className="text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer"
            onClick={() => {
              clearEditorPreview();
              navigate('level-editor');
            }}
          >
            ← Back to Editor
          </button>
        )}
      </div>
    </div>
  );
};
