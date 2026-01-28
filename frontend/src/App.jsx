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
import { WebSocketProvider } from "./contexts/WebSocketProvider";
import { ChatProvider } from "./contexts/ChatContext";

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
        <WebSocketProvider>
          <NotificationsProvider>
            <ChatProvider>
              <AppRouter />
            </ChatProvider>
          </NotificationsProvider>
        </WebSocketProvider>
      </BackgroundChatProvider>
    </>
  );
}

export default App;
