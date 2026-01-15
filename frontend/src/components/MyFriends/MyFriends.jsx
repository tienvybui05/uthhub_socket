import { useEffect, useMemo, useState } from "react";
import styles from "./MyFriends.module.css";
import Avatar from "../Avatar/Avatar";
import { getMyFriends } from "../../api/friends";

function MyFriends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const [keyword, setKeyword] = useState("");
  const [sortMode, setSortMode] = useState("AZ"); // AZ | ZA | NEWEST
  const [filterMode, setFilterMode] = useState("ALL"); // ALL | NEW

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const normalize = (raw) => {
    const data = raw?.data ?? raw;
    const list = Array.isArray(data) ? data : data?.data || data?.items || [];

    // endpoint /friends của bạn đang trả status ACCEPTED (như ảnh postman)
    return list.filter((x) => (x?.status ?? "").toUpperCase() === "ACCEPTED");
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await getMyFriends();
      setFriends(normalize(res));
    } catch (err) {
      console.log("getMyFriends error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Không tải được danh sách bạn bè";
      showToast(msg);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNewFriend = (createdAt) => {
    if (!createdAt) return false;
    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return false;
    const diff = Date.now() - t;
    return diff <= 7 * 24 * 60 * 60 * 1000; // 7 ngày
  };

  const fmtCount = (n) => n.toLocaleString("vi-VN");

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();

    let list = friends;

    if (filterMode === "NEW") {
      list = list.filter((x) => isNewFriend(x?.createdAt));
    }

    if (k) {
      list = list.filter((x) => {
        const name = (x?.fullName ?? "").toLowerCase();
        const username = (x?.username ?? "").toLowerCase();
        return name.includes(k) || username.includes(k);
      });
    }

    list = [...list].sort((a, b) => {
      const an = (a?.fullName ?? "").trim();
      const bn = (b?.fullName ?? "").trim();

      if (sortMode === "AZ") return an.localeCompare(bn, "vi");
      if (sortMode === "ZA") return bn.localeCompare(an, "vi");

      // NEWEST
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [friends, keyword, sortMode, filterMode]);

  const newFriends = useMemo(
    () => filtered.filter((x) => isNewFriend(x?.createdAt)),
    [filtered]
  );

  const groups = useMemo(() => {
    // nhóm theo chữ cái đầu của fullName
    const map = new Map();

    filtered.forEach((u) => {
      const name = (u?.fullName ?? "").trim();
      const first = name ? name[0].toUpperCase() : "#";
      const key = /[A-ZÀ-Ỹ]/i.test(first) ? first : "#";

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(u);
    });

    // sort keys A-Z, # ở cuối
    const keys = Array.from(map.keys()).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b, "vi");
    });

    return keys.map((k) => ({ key: k, items: map.get(k) }));
  }, [filtered]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <p className={styles.pageTitle}>Danh sách bạn bè</p>
      </div>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <p className={styles.countText}>Bạn bè ({fmtCount(friends.length)})</p>
        </div>

        {/* Toolbar giống Zalo */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Tìm bạn"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button
                className={styles.clearBtn}
                onClick={() => setKeyword("")}
                aria-label="Xóa"
              >
                ×
              </button>
            )}
          </div>

          <select
            className={styles.select}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            title="Sắp xếp"
          >
            <option value="AZ">Tên (A-Z)</option>
            <option value="ZA">Tên (Z-A)</option>
            <option value="NEWEST">Mới nhất</option>
          </select>

          <select
            className={styles.select}
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            title="Lọc"
          >
            <option value="ALL">Tất cả</option>
            <option value="NEW">Bạn mới</option>
          </select>
        </div>

        {loading && <div className={styles.stateText}>Đang tải...</div>}

        {!loading && filtered.length === 0 && (
          <div className={styles.stateText}>Không có bạn bè phù hợp</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className={styles.list}>
            {/* Bạn mới */}
            {filterMode !== "NEW" && newFriends.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionTitle}>Bạn mới</p>

                {newFriends.slice(0, 5).map((u) => (
                  <FriendRow key={`new-${u?.userId}-${u?.requestId}`} user={u} />
                ))}
              </div>
            )}

            {/* Groups A/B/C */}
            {groups.map((g) => (
              <div className={styles.section} key={g.key}>
                <p className={styles.letter}>{g.key}</p>
                {g.items.map((u) => (
                  <FriendRow
                    key={`${u?.userId}-${u?.requestId}`}
                    user={u}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}

function FriendRow({ user }) {
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <div className={styles.avatar}>
          <Avatar
            src={user?.avatar || ""}
            alt={user?.fullName || user?.username || "avatar"}
          />
        </div>

        <div className={styles.meta}>
          <p className={styles.name}>{user?.fullName || "Người dùng"}</p>
          <p className={styles.sub}>
            {user?.username ? `@${user.username}` : "—"}
          </p>
        </div>
      </div>

      <button className={styles.moreBtn} title="Tùy chọn">
        …
      </button>
    </div>
  );
}

export default MyFriends;