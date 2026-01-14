import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import AppRouter from "./router/AppRouter";
import { BackgroundChatProvider } from "./contexts/BackgroundChatContext";

function App() {
  return (
    <>
      <BackgroundChatProvider>
        <AppRouter />
      </BackgroundChatProvider>
    </>
  );
}

export default App;
