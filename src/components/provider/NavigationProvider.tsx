import { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import eventEmitter from '@/utils/event-emitter';

export type ScreenName = 'home' | 'game' | 'result' | null;

interface NavigationContextProps {
    currentScreen: ScreenName;
    navigate: (screen: ScreenName) => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>(null);

    const navigate = useCallback((screen: ScreenName) => {
        setCurrentScreen(screen);
    }, []);

    // Listen to Pixi-side navigation events (e.g. game over → result)
    useEffect(() => {
        const handler = (screen: string) => navigate(screen as ScreenName);
        eventEmitter.on('navigate', handler);
        return () => { eventEmitter.off('navigate', handler); };
    }, [navigate]);

    return (
        <NavigationContext.Provider value={{ currentScreen, navigate }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
    return context;
};
