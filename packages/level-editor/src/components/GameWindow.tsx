import { useEffect, useRef } from 'react';
import { setGlobalTicker } from '@puzzling-potions/core';
import { initAssets } from '@/utils/assets';
import { navigation, initNavigation } from '@/utils/navigation';
import { GameScreen } from '@/screens/GameScreen';
import eventEmitter from '@/utils/event-emitter';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { app } from '@/main';

export const GameWindow = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentScreen, navigate } = useNavigation();
  const pixiReady = useRef(false);
  const prevScreenRef = useRef<string | null>(null);

  // ── Initialize PixiJS once on mount ────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      await app.init({
        resolution: Math.max(window.devicePixelRatio, 2),
        backgroundColor: 0x0a0025,
      });

      setGlobalTicker(app.ticker);
      initNavigation(app);

      containerRef.current!.appendChild(app.canvas);

      // Resize handler
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const minW = 375;
        const minH = 700;
        const scaleX = w < minW ? minW / w : 1;
        const scaleY = h < minH ? minH / h : 1;
        const scale = Math.max(scaleX, scaleY);
        app.renderer.canvas.style.width = `${w}px`;
        app.renderer.canvas.style.height = `${h}px`;
        window.scrollTo(0, 0);
        app.renderer.resize(w * scale, h * scale);
        navigation.resize(w * scale, h * scale);
      };
      window.addEventListener('resize', resize);
      resize();

      // Load preload bundle, then background-load the rest
      await initAssets();

      pixiReady.current = true;
      navigate('level-editor');
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start Pixi GameScreen when React navigates to 'game' ───────────────
  useEffect(() => {
    const prev = prevScreenRef.current;
    prevScreenRef.current = currentScreen;

    if (!pixiReady.current) return;

    if (currentScreen === 'game') {
      navigation.showScreen(GameScreen);
    } else if (prev === 'game' && currentScreen !== 'result') {
      navigation.abandonCurrentScreen();
    }
  }, [currentScreen]);

  // ── Bridge: Pixi navigate events → React ───────────────────────────────
  useEffect(() => {
    const handleNavigate = (screen: string) => navigate(screen as any);
    eventEmitter.on('navigate', handleNavigate);
    return () => {
      eventEmitter.off('navigate', handleNavigate);
    };
  }, [navigate]);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
};
