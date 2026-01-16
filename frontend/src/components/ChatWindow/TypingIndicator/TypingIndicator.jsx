import styles from "./TypingIndicator.module.css";

function TypingIndicator({ typingUsers }) {
    if (!typingUsers || typingUsers.length === 0) {
        return null;
    }

    // Format the typing message
    const getTypingMessage = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].fullName || typingUsers[0].username} đang soạn tin nhắn`;
        } else if (typingUsers.length === 2) {
            const names = typingUsers.map(u => u.fullName || u.username);
            return `${names[0]} và ${names[1]} đang soạn tin nhắn`;
        } else {
            return `${typingUsers.length} người đang soạn tin nhắn`;
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.dots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                </div>
                <span className={styles.text}>{getTypingMessage()}</span>
            </div>
        </div>
    );
}

export default TypingIndicator;
