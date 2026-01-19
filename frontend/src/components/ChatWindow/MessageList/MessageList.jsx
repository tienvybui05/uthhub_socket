import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { useChat } from "../../../contexts/ChatContext";
import { AuthService } from "../../../services/auth.service";
import MessageBubble from "../MessageBubble/MessageBubble";
import styles from "./MessageList.module.css";

function MessageList({ onAvatarClick }) {
    const { messages, currentConversation, isLoadingMessages } = useChat();
    const messagesEndRef = useRef(null);
    const currentUser = AuthService.getUser();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Hôm nay";
        if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const groupMessagesByDate = (list) => {
        if (!list) return [];
        const groups = [];
        let currentDate = null;

        list.forEach((message, idx) => {
            const d = new Date(message.createdAt).toDateString();
            if (d !== currentDate) {
                currentDate = d;
                groups.push({ type: "date", date: message.createdAt, id: `date-${idx}` });
            }
            groups.push({ type: "message", message, id: message.id });
        });

        return groups;
    };

    const shouldShowAvatar = (grouped, index, message) => {
        if (index === grouped.length - 1) return true;
        const next = grouped[index + 1];
        if (next.type === "date") return true;

        const nextSenderId = next.message?.sender?.id;
        const curSenderId = message?.sender?.id;
        return String(nextSenderId) !== String(curSenderId);
    };

    const groupedMessages = groupMessagesByDate(messages);
    const isGroup = currentConversation?.isGroup;

    return (
        <div className={styles.wrapper}>
            {isLoadingMessages && (
                <div className={styles.loadingMore}>
                    <div className={styles.spinner} />
                </div>
            )}

            {groupedMessages.length === 0 ? (
                <div className={styles.empty}>
                    <FontAwesomeIcon icon={faCommentDots} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>
                        Chưa có tin nhắn nào.
                        <br />
                        Hãy bắt đầu cuộc trò chuyện!
                    </p>
                </div>
            ) : (
                groupedMessages.map((item, index) => {
                    if (item.type === "date") {
                        return (
                            <div key={item.id} className={styles.dateDivider}>
                                <span className={styles.dateLabel}>{formatDate(item.date)}</span>
                            </div>
                        );
                    }

                    const message = item.message;
                    const isSent = Number(message?.sender?.id) === Number(currentUser?.id);
                    const showAvatar = !isSent && shouldShowAvatar(groupedMessages, index, message);

                    // Check if this is the last sent message to show read avatar
                    const isLastSentMessage = isSent &&
                        !groupedMessages.slice(index + 1).some(g =>
                            g.type === "message" && Number(g.message?.sender?.id) === Number(currentUser?.id)
                        );

                    return (
                        <MessageBubble
                            key={`${item.id}-${message.isRead}`}
                            message={message}
                            isSent={isSent}
                            showAvatar={showAvatar}
                            showSenderName={isGroup && !isSent}
                            onAvatarClick={onAvatarClick}
                            isLastSent={isLastSentMessage}
                        />
                    );
                })
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}

export default MessageList;
