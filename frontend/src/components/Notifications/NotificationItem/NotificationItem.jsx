import { faPeopleGroup, faUser } from "@fortawesome/free-solid-svg-icons";
import { faSignalMessenger } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDateTime } from "../../../utils/formatDateTime";
import Avatar from "../../Avatar/Avatar";
import styles from "./NotificationItem.module.css";

function NotificationItem({ notifi, onClick }) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.avatar}>
                <Avatar src={notifi?.senderAvatar} />
                {notifi.style == "MESSAGE" && (
                    <div className={styles.messgae}>
                        <FontAwesomeIcon icon={faSignalMessenger} />
                    </div>
                )}
                {(notifi.style == "FRIEND_REQUEST" ||
                    notifi.style == "FRIEND_ACCEPTED") && (
                    <div className={styles.friend}>
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                )}
                {notifi.style == "CREATEGROUP" && (
                    <div className={styles.friend}>
                        <FontAwesomeIcon icon={faPeopleGroup} />
                    </div>
                )}
            </div>
            <div className={styles.content} onClick={onClick}>
                <p className={`${notifi.isRead == true ? styles.isRead : ""} `}>
                    {notifi.content}
                </p>
                <p
                    className={`${styles.time}  ${
                        notifi.isRead == true ? styles.isRead : ""
                    }`}
                >
                    {formatDateTime(notifi.createdAt)}
                </p>
            </div>
            {!notifi.isRead && <div className={styles.notRead}></div>}
        </div>
    );
}
export default NotificationItem;
