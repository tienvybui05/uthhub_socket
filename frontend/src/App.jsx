import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import AppRouter from "./router/AppRouter";
import { BackgroundChatProvider } from "./contexts/BackgroundChatContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationsProvider } from "./contexts/NotificationsContext";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        pauseOnHover
      />
      <BackgroundChatProvider>
        <NotificationsProvider>
          <AppRouter />
        </NotificationsProvider>
      </BackgroundChatProvider>
    </>
  );
}

export default App;
