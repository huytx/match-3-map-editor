import { useRef, useEffect } from 'react';
import { useNavigation } from '@/components/provider/NavigationProvider';

export const HomeScreenView = () => {
  const { navigate } = useNavigation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => ref.current?.classList.add('screen-visible'));
  }, []);

  return (
    <div
      ref={ref}
      className="html-screen justify-between [background:linear-gradient(160deg,#0a0025_0%,#2c136c_55%,#0a0025_100%)]"
    >
      <div className="flex flex-col items-center flex-1 justify-center gap-6">
        <div className="text-[clamp(26px,6vw,40px)] font-bold text-gold [text-shadow:0_0_30px_rgba(255,213,121,0.45)] text-center leading-tight">
          Puzzling Potions
        </div>
        <div className="text-[clamp(60px,14vw,90px)] filter-[drop-shadow(0_4px_14px_rgba(255,130,33,0.6))] leading-none">
          🧪⚗️
        </div>
        <button className="btn-play" onClick={() => navigate('game')}>
          ▶ Play
        </button>{' '}
        <button
          className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4 transition-colors cursor-pointer"
          onClick={() => navigate('level-editor')}
        >
          Level Editor
        </button>{' '}
      </div>
    </div>
  );
};
