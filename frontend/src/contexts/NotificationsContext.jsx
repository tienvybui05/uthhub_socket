import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { AuthService } from "../services/auth.service";
import WebSocketService from "../services/WebSocketService";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast/CustomToast";

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const currentUser = AuthService.getUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Sử dụng local ref thay vì global ref
  const hasInitializedRef = useRef(false);
  const subscriptionCleanupRef = useRef(null);
  const connectionListenerRef = useRef(null);
  const mountedRef = useRef(true);

  const handleNotification = useCallback((data) => {
    if (!mountedRef.current) return;
    
    console.log("[NotificationsProvider] New notification received:", data);
    
    // Add notification to list
    setNotifications((prev) => {
      const newNotifications = [data, ...prev];
      // Keep only last 100 notifications
      return newNotifications.slice(0, 100);
    });
    
    // Increment unread count
    setUnreadCount((prev) => prev + 1);
    
    // Show toast
    toast(<CustomToast title={data.content || "New notification"} />, {
      position: "top-right",
      autoClose: 5000,
    });
  }, []);

  // Reset initialization khi user thay đổi
  useEffect(() => {
    if (currentUser?.id) {
      hasInitializedRef.current = false;
      mountedRef.current = true;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      console.log("[NotificationsProvider] No user ID, skipping setup");
      return;
    }

    // Check nếu đã được mount lại
    if (hasInitializedRef.current) {
      console.log("[NotificationsProvider] Already initialized, skipping");
      return;
    }

    console.log("[NotificationsProvider] Setting up notification system for user:", currentUser.id);
    hasInitializedRef.current = true;

    const notificationTopic = `/topic/notifications/${currentUser.id}`;
    
    const setupNotificationSubscription = () => {
      if (!mountedRef.current) return;
      
      console.log("[NotificationsProvider] Setting up subscription to:", notificationTopic);
      
      // Clean up any existing subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
      
      // Subscribe to notifications
      const cleanup = WebSocketService.subscribe(
        notificationTopic,
        (data) => {
          if (!mountedRef.current) return;
          handleNotification(data);
        },
        true // Persistent subscription
      );
      
      if (cleanup) {
        subscriptionCleanupRef.current = cleanup;
        console.log("[NotificationsProvider] ✅ Notification subscription active");
      }
    };

    // Handle WebSocket connection
    const handleWebSocketConnected = () => {
      if (!mountedRef.current) return;
      console.log("[NotificationsProvider] WebSocket connected, setting up notifications");
      setupNotificationSubscription();
    };

    connectionListenerRef.current = handleWebSocketConnected;
    
    // Add connection listener
    WebSocketService.addConnectionListener(handleWebSocketConnected);

    // If already connected, setup immediately
    if (WebSocketService.isConnected()) {
      console.log("[NotificationsProvider] WebSocket already connected");
      setupNotificationSubscription();
    } else {
      console.log("[NotificationsProvider] WebSocket not yet connected, waiting...");
      // KHÔNG gọi connect() trực tiếp ở đây - WebSocketProvider đã xử lý
      // Chỉ cần đợi connection listener được gọi
    }

    // Load existing notifications from API (optional)
    const loadExistingNotifications = async () => {
      if (!mountedRef.current) return;
      
      try {
        // You would call your API here
        // const existing = await notificationApi.getNotifications();
        // setNotifications(existing);
      } catch (error) {
        console.error("[NotificationsProvider] Error loading notifications:", error);
      }
    };
    
    loadExistingNotifications();

    // Cleanup
    return () => {
      console.log("[NotificationsProvider] Cleaning up...");
      mountedRef.current = false;
      
      // Remove connection listener
      if (connectionListenerRef.current) {
        WebSocketService.removeConnectionListener(connectionListenerRef.current);
        connectionListenerRef.current = null;
      }
      
      // Cleanup subscription
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
      
      // Unsubscribe từ service
      WebSocketService.unsubscribe(notificationTopic);
      
      // KHÔNG reset hasInitialized ở đây vì ref sẽ reset khi user thay đổi
    };
  }, [currentUser?.id, handleNotification]);

  const markAllAsRead = useCallback(() => {
    if (!mountedRef.current) return;
    setUnreadCount(0);
    // Optional: Call API to mark as read on server
  }, []);

  const markAsRead = useCallback((notificationId) => {
    if (!mountedRef.current) return;
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    if (!mountedRef.current) return;
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        setNotifications,
        setUnreadCount,
        markAllAsRead,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};