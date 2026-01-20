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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import CustomToast from "../components/CustomToast/CustomToast";
const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const currentUser = AuthService.getUser();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasInitialized = useRef(false);
  const handleNotification = useCallback((data) => {
    setNotifications((prev) => [data, ...prev]);
    setUnreadCount((prev) => prev + 1);
    // toast.success(data.content, { icon: <FontAwesomeIcon icon={faBell} /> });
    toast(<CustomToast title={data.content} />);
  }, []);
  useEffect(() => {
    if (!currentUser?.id || hasInitialized.current) return;

    hasInitialized.current = true;

    WebSocketService.connect(() => {
      WebSocketService.subscribe(
        `/topic/notifications/${currentUser.id}`,
        handleNotification,
      );
    });
    return () => {};
  }, [currentUser?.id, handleNotification]);

  const markAllAsRead = useCallback(() => {
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
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationsContext);
};
