import eventEmitter from '@/utils/event-emitter';

export const PausePopupView = () => {
    const handleDone = () => {
        eventEmitter.emit('game:resume');
    };

    return (
        <div className="popup-panel popup-panel--visible">
            <div className="text-[32px] font-bold text-gold text-center">Paused</div>
            <button className="btn-popup" onClick={handleDone}>
                Done
            </button>
        </div>
    );
};
