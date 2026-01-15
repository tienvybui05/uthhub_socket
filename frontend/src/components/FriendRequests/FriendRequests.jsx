import { useEffect, useMemo, useState } from "react";
import styles from "./FriendRequests.module.css";

import Avatar from "../Avatar/Avatar";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../api/friends";

function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState({ id: null, type: null });
  // type: "accept" | "reject"
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const normalize = (raw) => {
    const data = raw?.data ?? raw;
    const list = Array.isArray(data)
      ? data
      : data?.requests || data?.items || data?.data || [];

    return list
      .filter((x) => (x?.status ?? "").toUpperCase() === "PENDING")
      .sort((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yy = String(d.getFullYear()).slice(-2);
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${dd}/${mm}/${yy} - ${hh}:${min}`;
  };

  const receivedCount = useMemo(() => requests.length, [requests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getFriendRequests();
      setRequests(normalize(res));
    } catch (err) {
      console.log("getFriendRequests error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Không tải được danh sách lời mời";
      showToast(msg);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = async (req) => {
    const id = req?.requestId;
    if (!id) return showToast("Thiếu requestId");

    try {
      setActing({ id, type: "accept" });
      await acceptFriendRequest(id);
      showToast("✅ Đã đồng ý kết bạn");
      setRequests((prev) => prev.filter((x) => x?.requestId !== id));
    } catch (err) {
      console.log("acceptFriendRequest error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "❌ Đồng ý thất bại";
      showToast(msg);
    } finally {
      setActing({ id: null, type: null });
    }
  };

  const handleReject = async (req) => {
    const id = req?.requestId;
    if (!id) return showToast("Thiếu requestId");

    try {
      setActing({ id, type: "reject" });
      await rejectFriendRequest(id);
      showToast("✅ Đã từ chối");
      setRequests((prev) => prev.filter((x) => x?.requestId !== id));
    } catch (err) {
      console.log("rejectFriendRequest error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "❌ Từ chối thất bại";
      showToast(msg);
    } finally {
      setActing({ id: null, type: null });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <p className={styles.pageTitle}>Lời mời kết bạn</p>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <p className={styles.sectionTitle}>Lời mời đã nhận</p>
          <span className={styles.badge}>{receivedCount}</span>
        </div>

        {loading && <div className={styles.stateText}>Đang tải...</div>}

        {!loading && receivedCount === 0 && (
          <div className={styles.stateText}>Không có lời mời kết bạn</div>
        )}

        {!loading && receivedCount > 0 && (
          <div className={styles.list}>
            {requests.map((req) => {
              const id = req?.requestId;

              const isAccepting = acting.id === id && acting.type === "accept";
              const isRejecting = acting.id === id && acting.type === "reject";
              const disabled = isAccepting || isRejecting;

              return (
                <div className={styles.card} key={id}>
                  <div className={styles.cardLeft}>
                    <div className={styles.avatar}>
                      <Avatar
                        src={req?.avatar || ""}
                        alt={req?.fullName || req?.username || "avatar"}
                      />
                    </div>

                    <div className={styles.meta}>
                      <p className={styles.name}>{req?.fullName || "Người dùng"}</p>

                      <p className={styles.sub}>
                        {req?.username ? `@${req.username}` : "—"}
                        {req?.createdAt ? ` • ${formatTime(req.createdAt)}` : ""}
                      </p>

                      {req?.message && (
                        <p className={styles.msg} title={req.message}>
                          {req.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.btnReject}
                      onClick={() => handleReject(req)}
                      disabled={disabled}
                    >
                      {isRejecting ? "Đang..." : "Từ chối"}
                    </button>

                    <button
                      className={styles.btnAccept}
                      onClick={() => handleAccept(req)}
                      disabled={disabled}
                    >
                      {isAccepting ? "Đang..." : "Đồng ý"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

export default FriendRequests;