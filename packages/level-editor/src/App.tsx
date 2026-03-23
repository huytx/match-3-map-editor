import { GameWindow } from './components/GameWindow';
import { ModalContainer } from './components/ModalContainer';
import { NavigationProvider } from './components/provider/NavigationProvider';
import { ScreenContainer } from './components/ScreenContainer';

export const App = () => {
  return (
    <div className="w-full h-full relative bg-deep-purple overflow-hidden">
      <NavigationProvider>
        <GameWindow />
        <ScreenContainer />
        <ModalContainer />
      </NavigationProvider>
    </div>
  );
};
