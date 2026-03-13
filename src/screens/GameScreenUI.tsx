import { useEffect, useState } from 'react';
import eventEmitter from '@/utils/event-emitter';

export const GameScreenUIView = () => {
    const [hud, setHud] = useState({ timeRemaining: 0, score: 0 });

    useEffect(() => {
        const handler = (data: { timeRemaining: number; score: number }) => setHud(data);
        eventEmitter.on('hud:update', handler);
        return () => { eventEmitter.off('hud:update', handler); };
    }, []);

    const { timeRemaining, score } = hud;
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor(timeRemaining / 1000) % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const isLow = timeRemaining > 1 && timeRemaining < 11000;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-5 py-3 pointer-events-none mt-[4vh]"
            style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}
        >
            <div className="text-[22px] font-bold text-gold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
                {score.toLocaleString()}
            </div>
            <div
                className={`text-[26px] font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] transition-colors duration-100${isLow ? ' timer-flash' : ''}`}
            >
                {timeStr}
            </div>
        </div>
    );
};
