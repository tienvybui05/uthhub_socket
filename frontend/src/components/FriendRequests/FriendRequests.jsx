import { useEffect, useMemo, useState } from "react";
import styles from "./FriendRequests.module.css";

import Avatar from "../Avatar/Avatar";
import {
    getFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    getSentFriendRequests,
    cancelFriendRequest,
} from "../../api/friends";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage } from "@fortawesome/free-regular-svg-icons";

function FriendRequests() {
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);

    const [acting, setActing] = useState({ id: null, type: null });
    const [toast, setToast] = useState("");

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 2200);
    };

    const normalize = (raw) => {
        const data = raw?.data ?? raw;
        const list = Array.isArray(data) ? data : data?.requests || data?.items || data?.data || [];

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

    const receivedCount = useMemo(() => received.length, [received]);
    const sentCount = useMemo(() => sent.length, [sent]);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [r1, r2] = await Promise.all([getFriendRequests(), getSentFriendRequests()]);
            setReceived(normalize(r1));
            setSent(normalize(r2));
        } catch (err) {
            console.log("fetchAll error:", err);
            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                "Không tải được danh sách lời mời";
            showToast(msg);
            setReceived([]);
            setSent([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAccept = async (req) => {
        const id = req?.requestId;
        if (!id) return showToast("Thiếu requestId");

        try {
            setActing({ id, type: "accept" });
            await acceptFriendRequest(id);
            showToast("✅ Đã đồng ý kết bạn");
            setReceived((prev) => prev.filter((x) => x?.requestId !== id));
        } catch (err) {
            console.log("rejectFriendRequest error:", err);
            showToast(err?.response?.data?.message || err?.response?.data || "❌ Từ chối thất bại");
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
            setReceived((prev) => prev.filter((x) => x?.requestId !== id));
        } catch (err) {
            console.log("rejectFriendRequest error:", err);
            showToast(err?.response?.data?.message || err?.response?.data || "❌ Từ chối thất bại");
        } finally {
            setActing({ id: null, type: null });
        }
    };

    const handleCancel = async (req) => {
        const requestId = req?.requestId;
        const targetId = req?.userId;
        if (!targetId) return showToast("Thiếu userId (targetId)");

        try {
            setActing({ id: requestId, type: "cancel" });
            await cancelFriendRequest(targetId);
            showToast("✅ Đã thu hồi lời mời");
            setSent((prev) => prev.filter((x) => x?.requestId !== requestId));
        } catch (err) {
            console.log("cancelFriendRequest error:", err);
            showToast(err?.response?.data?.message || err?.response?.data || "❌ Thu hồi thất bại");
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
                    <div className={styles.receivedGrid3}>
                        {received.map((req) => {
                            const id = req?.requestId;
                            const isAccepting = acting.id === id && acting.type === "accept";
                            const isRejecting = acting.id === id && acting.type === "reject";
                            const disabled = isAccepting || isRejecting;

                            return (
                                <div className={styles.receivedCard} key={id}>
                                    <div className={styles.cardTop}>
                                        <div className={styles.sentTop}>
                                            <div className={styles.avatar}>
                                                <Avatar
                                                    src={req?.avatar || req?.avatarUrl || ""}
                                                    alt={req?.fullName || req?.username || "avatar"}
                                                />
                                            </div>

                                            <div className={styles.sentMeta}>
                                                <p className={styles.name}>{req?.fullName || "Người dùng"}</p>
                                                <p className={styles.sub}>
                                                    {req?.username ? `@${req.username}` : "—"}
                                                    {req?.createdAt ? ` • ${formatTime(req.createdAt)}` : ""}
                                                </p>
                                            </div>
                                        </div>

                                        {/* icon nhắn tin (UI only) */}
                                        <button className={styles.chatIconBtn} title="Nhắn tin" type="button">
                                            <FontAwesomeIcon icon={faMessage} />
                                        </button>
                                    </div>

                                    {req?.message && (
                                        <div className={styles.requestMsg} title={req.message}>
                                            {req.message}
                                        </div>
                                    )}

                                    <div className={styles.btnRow}>
                                        <button
                                            className={styles.btnReject2}
                                            onClick={() => handleReject(req)}
                                            disabled={disabled}
                                        >
                                            {isRejecting ? "Đang..." : "Từ chối"}
                                        </button>

                                        <button
                                            className={styles.btnAccept2}
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

                <div className={styles.sectionHeader2}>
                    <p className={styles.sectionTitle}>Lời mời đã gửi</p>
                    <span className={styles.badge}>{sentCount}</span>
                </div>

                {!loading && sentCount === 0 && (
                    <div className={styles.stateText}>Bạn chưa gửi lời mời nào</div>
                )}

                {!loading && sentCount > 0 && (
                    <div className={styles.sentGrid}>
                        {sent.map((req) => {
                            const id = req?.requestId;
                            const isCanceling = acting.id === id && acting.type === "cancel";

                            return (
                                <div className={styles.sentCard} key={id}>
                                    <div className={styles.cardTop}>
                                        <div className={styles.sentTop}>
                                            <div className={styles.avatar}>
                                                <Avatar
                                                    src={req?.avatar || req?.avatarUrl || ""}
                                                    alt={req?.fullName || req?.username || "avatar"}
                                                />
                                            </div>

                                            <div className={styles.sentMeta}>
                                                <p className={styles.name}>{req?.fullName || "Người dùng"}</p>
                                                <p className={styles.sub}>
                                                    {req?.createdAt ? formatTime(req.createdAt) : "Bạn đã gửi lời mời"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* icon nhắn tin (UI only) */}
                                        <button className={styles.chatIconBtn} title="Nhắn tin" type="button">
                                            <FontAwesomeIcon icon={faMessage} />
                                        </button>
                                    </div>

                                    <button
                                        className={styles.btnCancel}
                                        onClick={() => handleCancel(req)}
                                        disabled={isCanceling}
                                        title="Thu hồi lời mời"
                                    >
                                        {isCanceling ? "Đang..." : "Thu hồi lời mời"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && sentCount > 0 && (
                    <div className={styles.moreWrap}>
                        <button className={styles.btnMore}>Xem thêm</button>
                    </div>
                )}
            </div>

            {toast && <div className={styles.toast}>{toast}</div>}
        </div>
    );
}

export default FriendRequests;
