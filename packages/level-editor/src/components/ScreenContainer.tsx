import { useNavigation, ScreenName } from './provider/NavigationProvider';
import { HomeScreenView } from '@/screens/HomeScreen';
import { LevelEditorScreenView } from '@/screens/LevelEditorScreen';
import { GameScreenUIView } from '@/screens/GameScreenUI';
import { ResultScreenView } from '@/screens/ResultScreen';
import { JSX } from 'react';

const SCREENS: Record<NonNullable<ScreenName>, () => JSX.Element> = {
  home: HomeScreenView,
  'level-editor': LevelEditorScreenView,
  game: GameScreenUIView,
  result: ResultScreenView,
};

export const ScreenContainer = () => {
  const { currentScreen } = useNavigation();
  if (!currentScreen) return null;
  const Component = SCREENS[currentScreen];
  return <Component />;
};
