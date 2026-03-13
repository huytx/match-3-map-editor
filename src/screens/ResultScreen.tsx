import { useRef, useEffect } from 'react';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { userSettings } from '@/utils/userSettings';
import { userStats } from '@/utils/userStats';

function buildStars(grade: number): string {
    const n = Math.max(0, Math.min(3, grade));
    return '?'.repeat(n) + '?'.repeat(3 - n);
}

function gradeLabel(grade: number): string {
    return (['Better luck next time!', 'Good job!', 'Great job!', 'Amazing!'] as const)[
        Math.max(0, Math.min(3, grade))
    ];
}

export const ResultScreenView = () => {
    const { navigate } = useNavigation();
    const ref = useRef<HTMLDivElement>(null);

    const mode = userSettings.getGameMode();
    const performance = userStats.load(mode);
    const bestScore = userStats.loadBestScore(mode);
    const { score = 0, grade = 0 } = performance;
    const isBest = score > 0 && score >= bestScore;

    useEffect(() => {
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
                <div className="text-[40px] tracking-[6px] leading-none">{buildStars(grade)}</div>
                <div className="bg-white text-purple font-bold text-[15px] rounded-[20px] px-6 py-2">{gradeLabel(grade)}</div>
                <div className="text-[clamp(48px,12vw,72px)] font-bold text-white leading-none mt-1.5">{score.toLocaleString()}</div>
                <div className="text-sm text-gold">
                    {isBest ? '?? New best score!' : `Best: ${bestScore.toLocaleString()}`}
                </div>
            </div>
            <div className="py-6 pb-9">
                <button className="btn-play" onClick={() => navigate('game')}>? Play Again</button>
            </div>
        </div>
    );
};
