import { useNavigation, ScreenName } from './provider/NavigationProvider';
import { HomeScreenView } from '@/screens/HomeScreen';
import { GameScreenUIView } from '@/screens/GameScreenUI';
import { ResultScreenView } from '@/screens/ResultScreen';
import { LevelEditorScreenView } from '@/screens/LevelEditorScreen';
import { JSX } from 'react';

const SCREENS: Record<NonNullable<ScreenName>, () => JSX.Element> = {
    home: HomeScreenView,
    game: GameScreenUIView,
    result: ResultScreenView,
    'level-editor': LevelEditorScreenView,
};

export const ScreenContainer = () => {
    const { currentScreen } = useNavigation();
    if (!currentScreen) return null;
    const Component = SCREENS[currentScreen];
    return <Component />;
};
