import { StoreProvider } from "easy-peasy";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { gameStore } from "./store/game-store";
// Import main.ts to ensure app is initialized
import "./main";

createRoot(document.getElementById("root")!).render(
  <StoreProvider store={gameStore}>
    <App />
  </StoreProvider>
);
