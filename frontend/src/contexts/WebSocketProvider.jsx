import { useEffect } from "react";
import WebSocketService from "../services/WebSocketService";
import { AuthService } from "../services/auth.service";

export const WebSocketProvider = ({ children }) => {
  useEffect(() => {
    const currentUser = AuthService.getUser();
    
    if (!currentUser?.id) {
      console.log("[WebSocketProvider] No user found, skipping WebSocket connection");
      return;
    }

    console.log("[WebSocketProvider] Initializing WebSocket connection for user:", currentUser.id);
    
    // Connect WebSocket - chỉ một lần
    WebSocketService.connect();

    // Cleanup chỉ khi component unmount (khi user logout hoặc app unmount)
    return () => {
      console.log("[WebSocketProvider] Component unmounting, but keeping WebSocket connection");
      // KHÔNG gọi disconnect() ở đây vì:
      // 1. WebSocketService là singleton
      // 2. Connection sẽ được maintain giữa các route changes
      // 3. Chỉ disconnect khi user logout hoặc app reload
    };
  }, []); // Empty dependency array - chỉ chạy một lần khi mount

  return children;
};