import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Avatar from "../Avatar/Avatar";
import styles from "./AddFriend.module.css";
import { useChat } from "../../contexts/ChatContext";

import { sendFriendRequest } from "../../api/friends";
import { searchUserByUsername } from "../../api/users";
import { CHAT_TABS } from "../../constants/contactsMenu";
import {
  cancelFriendRequest,
  acceptFriendRequest,
  unfriend,
} from "../../api/friends";

function AddFriend({ onClose }) {
  const { startNewConversation, setLeftTab } = useChat();
  const inputRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState("");

  const [foundUser, setFoundUser] = useState(null);
  const [searched, setSearched] = useState(false);

  const status = foundUser?.friendStatus;

  const handleWrapperClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleCancel = async () => {
    try {
      setIsSending(true);
      await cancelFriendRequest(foundUser.id);

      setFoundUser((u) => ({ ...u, friendStatus: "NONE" }));
    } catch {
      showToast("❌ Thu hồi thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsSending(true);
      await acceptFriendRequest(foundUser.requestId);

      setFoundUser((u) => ({ ...u, friendStatus: "FRIEND", requestId: null }));
    } catch {
      showToast("❌ Đồng ý thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleUnfriend = async () => {
    try {
      setIsSending(true);
      await unfriend(foundUser.id);

      setFoundUser((u) => ({ ...u, friendStatus: "NONE" }));
    } catch {
      showToast("❌ Hủy thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const handleSearch = async () => {
    const username = keyword.trim();
    if (!username) {
      showToast("Bạn chưa nhập username");
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSearching(true);
      setSearched(true);
      setFoundUser(null);

      const res = await searchUserByUsername(username);
      const user = res?.data ?? res;

      setFoundUser(user);
    } catch (err) {
      console.log("searchUserByUsername error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Không tìm thấy người dùng";
      showToast(msg);
      setFoundUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const myId = me?.id;

  const handleSendRequest = async () => {
    const username = foundUser?.username;
    if (!username) return;

    try {
      setIsSending(true);
      await sendFriendRequest(username);

      setFoundUser((u) => ({ ...u, friendStatus: "PENDING_SENT" }));
    } catch {
      showToast("❌ Gửi lời mời thất bại");
    } finally {
      setIsSending(false);
    }
  };

  const isMe = foundUser && myId && Number(foundUser.id) === Number(myId);

  const body = (
    <div className={styles.overlay} onClick={handleWrapperClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <p className={styles.title}>Thêm bạn</p>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={styles.input}
              placeholder="Nhập username để tìm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={isSearching || isSending}
            />

            {keyword.length > 0 && (
              <button
                className={styles.clear}
                onClick={() => {
                  setKeyword("");
                  setFoundUser(null);
                  setSearched(false);
                  inputRef.current?.focus();
                }}
                aria-label="Xóa"
                disabled={isSearching || isSending}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className={styles.content}>
          {!searched && (
            <p className={styles.hint}>
              Nhập <b>username</b> rồi bấm <b>Tìm kiếm</b>.
            </p>
          )}

          {searched && isSearching && <div className={styles.stateText}>Đang tìm...</div>}

          {searched && !isSearching && !foundUser && (
            <div className={styles.stateText}>Không tìm thấy người dùng</div>
          )}

          {foundUser && (
            <div className={styles.resultCard}>
              <div className={styles.left}>
                <div className={styles.avatar}>
                  <Avatar
                    src={foundUser?.avatar || foundUser?.avatarUrl || ""}
                    alt={foundUser?.fullName || foundUser?.username || "avatar"}
                  />
                </div>

                <div className={styles.meta}>
                  <p className={styles.name}>{foundUser.fullName || "Người dùng"}</p>
                  <p className={styles.sub}>@{foundUser.username}</p>
                </div>
              </div>

              {isMe ? (
                <span className={styles}></span>
              ) : (
                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionGhost}`}
                    onClick={() => {
                      startNewConversation(foundUser);
                      setLeftTab(CHAT_TABS.MESSAGES);
                      onClose();
                    }}
                    disabled={isSending}
                  >
                    Nhắn tin
                  </button>

                  {status === "NONE" && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionPrimary}`}
                      onClick={handleSendRequest}
                      disabled={isSending}
                    >
                      Kết bạn
                    </button>
                  )}

                  {status === "PENDING_SENT" && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionPrimary}`}
                      onClick={handleCancel}
                      disabled={isSending}
                    >
                      Thu hồi
                    </button>
                  )}

                  {status === "PENDING_RECEIVED" && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionPrimary}`}
                      onClick={handleAccept}
                      disabled={isSending}
                    >
                      Đồng ý
                    </button>
                  )}

                  {status === "FRIEND" && (
                    <button
                      className={`${styles.actionBtn} ${styles.actionPrimary}`}
                      onClick={handleUnfriend}
                      disabled={isSending}
                    >
                      Hủy kết bạn
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btnGhost} onClick={onClose} disabled={isSearching || isSending}>
            Hủy
          </button>

          <button className={styles.btnPrimary} onClick={handleSearch} disabled={isSearching || isSending}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span>{isSearching ? "Đang tìm..." : "Tìm kiếm"}</span>
          </button>
        </div>

        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    </div>
  );

  return createPortal(body, document.body);
}

export default AddFriend;
