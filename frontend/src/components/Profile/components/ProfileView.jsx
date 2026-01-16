// ProfileView.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPen, faCamera } from "@fortawesome/free-solid-svg-icons";
import defaultAvatar from "../../../assets/default_avatar.jpg";

function pad2(n) {
    return String(n).padStart(2, "0");
}

function formatDOB(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return `${pad2(d.getDate())} tháng ${pad2(d.getMonth() + 1)}, ${d.getFullYear()}`;
}

function genderLabel(g) {
    if (g === "MALE") return "Nam";
    if (g === "FEMALE") return "Nữ";
    if (g === "OTHER") return "Khác";
    return "-";
}

function ProfileView({
                         styles,
                         isLoading,
                         error,
                         profile,
                         avatarValue,
                         onClose,
                         onEdit,
                         onEditAvatar,
                         isSaving,
                     }) {
    const handleClose = () => {
        if (isSaving) return;
        onClose();
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.title}>Thông tin tài khoản</span>
                <button className={styles.iconBtn} onClick={handleClose} disabled={isSaving}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        <div className={styles.cover} />

                        <div className={styles.profileTop}>
                            <div className={styles.avatarWrap}>
                                <img
                                    className={styles.avatar}
                                    src={avatarValue || profile?.avatar || defaultAvatar}
                                    alt="avatar"
                                />
                                <button
                                    className={styles.avatarEditBtn}
                                    onClick={onEditAvatar}
                                    title="Đổi avatar"
                                    disabled={isSaving}
                                >
                                    <FontAwesomeIcon icon={faCamera} />
                                </button>
                            </div>

                            <div className={styles.nameRow}>
                                <div className={styles.name}>{profile?.fullName || "-"}</div>
                                <button className={styles.iconBtnSmall} onClick={onEdit} disabled={isSaving}>
                                    <FontAwesomeIcon icon={faPen} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>Thông tin cá nhân</div>

                            <div className={styles.infoRow}>
                                <div className={styles.infoLabel}>Giới tính</div>
                                <div className={styles.infoValue}>{genderLabel(profile?.gender)}</div>
                            </div>

                            <div className={styles.infoRow}>
                                <div className={styles.infoLabel}>Ngày sinh</div>
                                <div className={styles.infoValue}>{formatDOB(profile?.dateOfBirth)}</div>
                            </div>

                            <div className={styles.infoRow}>
                                <div className={styles.infoLabel}>Email</div>
                                <div className={styles.infoValue}>{profile?.email || "-"}</div>
                            </div>

                            {error ? <div className={styles.error}>{error}</div> : null}
                        </div>

                        <button className={styles.updateBtn} onClick={onEdit} disabled={isSaving}>
                            <FontAwesomeIcon icon={faPen} />
                            <span>{isSaving ? "Đang xử lý..." : "Cập nhật"}</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProfileView;
