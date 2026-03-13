import { useEffect, useRef } from 'react';
import { initAssets } from '@/utils/assets';
import { navigation } from '@/utils/navigation';
import { GameScreen } from '@/screens/GameScreen';
import eventEmitter from '@/utils/event-emitter';
import { useNavigation } from '@/components/provider/NavigationProvider';
import { openModal, closeModal } from '@/components/ModalContainer';
import { PausePopupView } from '@/popups/PausePopup';
import { app } from '@/main';

export const GameWindow = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { currentScreen, navigate } = useNavigation();
    const pixiReady = useRef(false);

    // ── Initialize PixiJS once on mount ────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const init = async () => {
            await app.init({
                resolution: Math.max(window.devicePixelRatio, 2),
                backgroundColor: 0x0a0025,
            });

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
            navigate('home');
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Start Pixi GameScreen when React navigates to 'game' ───────────────
    useEffect(() => {
        if (!pixiReady.current || currentScreen !== 'game') return;
        navigation.showScreen(GameScreen);
    }, [currentScreen]);

    // ── Bridge: Pixi events ↔ React ────────────────────────────────────────
    useEffect(() => {
        const handlePause = () => {
            navigation.currentScreen?.pause?.();
            openModal(<PausePopupView />);
        };

        const handleResume = () => {
            closeModal();
            navigation.currentScreen?.resume?.();
        };

        const handleVisibility = () => {
            if (document.hidden) navigation.currentScreen?.blur?.();
        };

        eventEmitter.on('game:pause', handlePause);
        eventEmitter.on('game:resume', handleResume);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            eventEmitter.off('game:pause', handlePause);
            eventEmitter.off('game:resume', handleResume);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0" />;
};
