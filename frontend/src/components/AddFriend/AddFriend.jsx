import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Avatar from "../Avatar/Avatar";
import styles from "./AddFriend.module.css";

import { sendFriendRequest } from "../../api/friends";
import { searchUserByUsername } from "../../api/users";

function AddFriend({ onClose }) {
  const inputRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState("");

  const [foundUser, setFoundUser] = useState(null); // user tìm được
  const [searched, setSearched] = useState(false);  // để biết đã search chưa

  const handleWrapperClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
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
      // axiosInstance của bạn đang trả response.data trực tiếp hay trả full?
      // Nếu axiosInstance đã unwrap data thì res là object user luôn.
      // Nếu chưa unwrap thì dùng res.data
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

  const handleSendRequest = async () => {
    const username = foundUser?.username;
    if (!username) return;

    try {
      setIsSending(true);
      await sendFriendRequest(username);
      showToast("✅ Đã gửi lời mời kết bạn");

      // Optional: khóa nút kết bạn sau khi gửi
      setFoundUser((prev) => (prev ? { ...prev, _requested: true } : prev));
    } catch (err) {
      console.log("sendFriendRequest error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "❌ Gửi lời mời thất bại";
      showToast(msg);
    } finally {
      setIsSending(false);
    }
  };

  const body = (
    <div className={styles.overlay} onClick={handleWrapperClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <p className={styles.title}>Thêm bạn</p>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Search box */}
        <div className={styles.searchRow}>
          <div className={styles.country}>
            <span className={styles.flag} aria-hidden="true">🇻🇳</span>
            <span className={styles.code}>(+84)</span>
            <span className={styles.caret} aria-hidden="true">▾</span>
          </div>

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

        {/* Content */}
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
                  <Avatar />
                </div>

                <div className={styles.meta}>
                  <p className={styles.name}>{foundUser.fullName || "Người dùng"}</p>
                  <p className={styles.sub}>@{foundUser.username}</p>
                </div>
              </div>

              <button
                className={styles.addBtn}
                onClick={handleSendRequest}
                disabled={isSending || foundUser._requested}
                title={`Gửi lời mời đến: ${foundUser.username}`}
              >
                {foundUser._requested
                  ? "Đã gửi"
                  : isSending
                  ? "Đang gửi..."
                  : "Kết bạn"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
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