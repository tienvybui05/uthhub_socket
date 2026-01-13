import { useEffect, useRef, useState } from "react";
import NotificationItem from "./NotificationItem/NotificationItem";
import styles from "./Notifications.module.css";
import {
  getMyNotifications,
  getMyNotificationsAndIsReadFalse,
  updateIsRead,
} from "../../api/notifications";

function Notifications({ onClick }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const allBtnRef = useRef(null);
  const [activeTab, setActiveTab] = useState("all");
  useEffect(() => {
    handleGetAllNotification();
    allBtnRef.current?.focus();
  }, []);

  const handleGetAllNotification = async () => {
    try {
      setIsLoading(true);
      const res = await getMyNotifications();
      setNotifications(res);
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
      setNotifications(res);
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
          item.id === notification.id ? { ...item, isRead: true } : item
        );
      });
    } catch (err) {
      console.log(err);
    }
  };

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
