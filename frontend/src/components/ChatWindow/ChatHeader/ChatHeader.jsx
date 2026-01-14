import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faVideo, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { useChat } from "../../../contexts/ChatContext";
import { AuthService } from "../../../services/auth.service";
import defaultAvatar from "../../../assets/default_avatar.jpg";
import styles from "./ChatHeader.module.css";

function ChatHeader({ onInfoClick }) {
    const { currentConversation } = useChat();
    const currentUser = AuthService.getUser();

    if (!currentConversation) return null;

    // Get display name - prefer name, otherwise get from participants
    const getDisplayName = () => {
        if (currentConversation.name) return currentConversation.name;
        if (currentConversation.isGroup) return "Nhóm chat";

        // For 1-1 chat, get the other participant's name
        const participants = currentConversation.participants || [];
        const otherParticipant = participants.find(p => p.id !== currentUser?.id);
        return otherParticipant?.fullName || otherParticipant?.username || otherParticipant?.email || "Người dùng";
    };

    // Get avatar URL
    const getAvatarUrl = () => {
        if (currentConversation.avatarUrl) return currentConversation.avatarUrl;
        if (currentConversation.isGroup) return null;

        const participants = currentConversation.participants || [];
        const otherParticipant = participants.find(p => p.id !== currentUser?.id);
        return otherParticipant?.avatar || otherParticipant?.avatarUrl || null;
    };

    const displayName = getDisplayName();
    const displayAvatar = getAvatarUrl();
    const { isGroup, isOnline, participantCount } = currentConversation;

    // Get initials for group avatar
    const getInitials = (name) => {
        if (!name) return "G";
        return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
    };

    // Get status text
    const getStatusText = () => {
        if (isGroup) {
            return `${participantCount || 0} thành viên`;
        }
        return isOnline ? "Đang hoạt động" : "Offline";
    };

    return (
        <div className={styles.wrapper}>
            {/* User/Group Info */}
            <div className={styles.userInfo}>
                <div className={styles.avatar}>
                    {isGroup ? (
                        <div className={styles.groupAvatar}>{getInitials(displayName)}</div>
                    ) : (
                        <img
                            src={displayAvatar || defaultAvatar}
                            alt={displayName}
                            className={styles.avatarImg}
                        />
                    )}
                    {!isGroup && isOnline && <span className={styles.onlineIndicator} />}
                </div>
                <div className={styles.details}>
                    <span className={styles.name}>{displayName}</span>
                    <span
                        className={`${styles.status} ${isOnline && !isGroup ? styles.statusOnline : ""}`}
                    >
                        {getStatusText()}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <button className={styles.actionBtn} title="Gọi thoại">
                    <FontAwesomeIcon icon={faPhone} />
                </button>
                <button className={styles.actionBtn} title="Gọi video">
                    <FontAwesomeIcon icon={faVideo} />
                </button>
                <button
                    className={styles.actionBtn}
                    title="Thông tin"
                    onClick={onInfoClick}
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>
            </div>
        </div>
    );
}

export default ChatHeader;

