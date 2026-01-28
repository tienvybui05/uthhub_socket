import { useEffect, useRef, useState } from "react";
import NotificationItem from "./NotificationItem/NotificationItem";
import styles from "./Notifications.module.css";
import {
  getMyNotifications,
  getMyNotificationsAndIsReadFalse,
  updateIsRead,
} from "../../api/notifications";
import { AuthService } from "../../services/auth.service";
import WebSocketService from "../../services/WebSocketService";
import { getUsersById } from "../../api/users";
import { bindTingUnlockOnce, playTingSound } from "../../utils/sound.jsx";

function Notifications({ onClick }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const allBtnRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  const currentUser = AuthService.getUser();

  const userAvatarCacheRef = useRef(new Map());
  const subscriptionCleanupRef = useRef(null);

  const getSenderId = (n) => {
    return (
      n?.senderId ??
      n?.fromUserId ??
      n?.userId ??
      n?.sender?.id ??
      n?.user?.id ??
      null
    );
  };

  const enrichNotificationAvatar = async (n) => {
    if (!n) return n;

    const existed =
      n?.senderAvatar ??
      n?.avatar ??
      n?.sender?.avatar ??
      n?.user?.avatar ??
      n?.sender?.avatarUrl ??
      n?.user?.avatarUrl;

    if (typeof existed === "string" && existed.trim()) {
      return { ...n, senderAvatar: existed };
    }

    const senderId = getSenderId(n);
    if (!senderId) return n;

    if (userAvatarCacheRef.current.has(senderId)) {
      return { ...n, senderAvatar: userAvatarCacheRef.current.get(senderId) };
    }

    try {
      const u = await getUsersById(senderId);
      const avatarRaw = u?.avatar ?? u?.avatarUrl ?? "";
      userAvatarCacheRef.current.set(senderId, avatarRaw);
      return { ...n, senderAvatar: avatarRaw };
    } catch {
      return n;
    }
  };

  useEffect(() => {
    bindTingUnlockOnce(); // unlock audio sau khi user click/press key
    handleGetAllNotification();
    allBtnRef.current?.focus();
    
    return () => {
      // Cleanup subscription khi component unmount
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetAllNotification = async () => {
    try {
      setIsLoading(true);
      const res = await getMyNotifications();
      const enriched = await Promise.all(
        (res || []).map(enrichNotificationAvatar),
      );
      setNotifications(enriched);
      setActiveTab("all");
    } catch (err) {
      console.log("Lỗi khi lấy danh sách thông báo", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllNotificationAndIsReadFalse = async () => {
    try {
      setIsLoading(true);
      const res = await getMyNotificationsAndIsReadFalse();
      const enriched = await Promise.all(
        (res || []).map(enrichNotificationAvatar),
      );
      setNotifications(enriched);
      setActiveTab("unread");
    } catch (err) {
      console.log("Lỗi khi lấy danh sách thông báo", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRead = async (notification) => {
    if (notification.isRead) return;

    try {
      await updateIsRead(notification.id);

      setNotifications((prev) => {
        if (activeTab === "unread") {
          return prev.filter((item) => item.id !== notification.id);
        }

        return prev.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        );
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    // Cleanup previous subscription
    if (subscriptionCleanupRef.current) {
      subscriptionCleanupRef.current();
      subscriptionCleanupRef.current = null;
    }

    const topic = `/topic/notifications/${currentUser.id}`;
    console.log(`[Notifications] Subscribing to: ${topic}`);

    // Sử dụng WebSocketService.subscribe mới
    const cleanup = WebSocketService.subscribe(
      topic,
      async (data) => {
        const enriched = await enrichNotificationAvatar(data);

        // TING: chỉ khi server không set silent
        // và chỉ ting cho GROUP notification
        const style = String(enriched?.style || "").toUpperCase();
        const silent = enriched?.silent === true;
        if (
          !silent &&
          (style === "GROUP" || style === "SYSTEM" || style === "MESSAGE")
        ) {
          playTingSound();
        }

        setNotifications((prev) => {
          if (prev.some((n) => n.id === enriched.id)) return prev;
          if (activeTab === "unread" && enriched.isRead) return prev;
          return [enriched, ...prev];
        });
      },
      true // persistent subscription
    );

    subscriptionCleanupRef.current = cleanup;
    console.log(`[Notifications] ✅ Subscribed to notifications`);

    return () => {
      if (subscriptionCleanupRef.current) {
        subscriptionCleanupRef.current();
        subscriptionCleanupRef.current = null;
      }
      WebSocketService.unsubscribe(topic);
    };
  }, [currentUser?.id, activeTab]);

  return (
    <div className={styles.modalOverlay} onClick={onClick}>
      <div onClick={(e) => e.stopPropagation()} className={styles.wrapper}>
        <div className={styles.header}>
          <p className={styles.title}>Thông báo</p>
        </div>

        <div className={styles.content}>
          <div className={styles.action}>
            <button
              ref={allBtnRef}
              className={`${activeTab == "all" ? styles.active : ""}`}
              onClick={handleGetAllNotification}
            >
              Tất cả
            </button>
            <button
              className={`${activeTab == "unread" ? styles.active : ""}`}
              onClick={handleGetAllNotificationAndIsReadFalse}
            >
              Chưa đọc
            </button>
          </div>

          <div className={styles.notifications}>
            {isLoading && <div>Đang tải...</div>}
            {!isLoading && notifications.length === 0 && (
              <div>Không có thông báo</div>
            )}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notifi={notification}
                onClick={() => handleRead(notification)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;