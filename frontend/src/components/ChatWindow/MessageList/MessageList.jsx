import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { useChat } from "../../../contexts/ChatContext";
import { AuthService } from "../../../services/auth.service";
import MessageBubble from "../MessageBubble/MessageBubble";
import styles from "./MessageList.module.css";

function MessageList() {
    const { messages, currentConversation, isLoadingMessages } = useChat();
    const messagesEndRef = useRef(null);
    const currentUser = AuthService.getUser();

    console.log("[MessageList] Rendering with messages:", messages);
    console.log("[MessageList] Messages length:", messages?.length);

    // Auto scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Format date for divider
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Hôm nay";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Hôm qua";
        } else {
            return date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        if (!messages) return [];

        const groups = [];
        let currentDate = null;

        messages.forEach((message, index) => {
            const messageDate = new Date(message.createdAt).toDateString();

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    type: "date",
                    date: message.createdAt,
                    id: `date-${index}`,
                });
            }

            groups.push({
                type: "message",
                message,
                id: message.id,
            });
        });

        return groups;
    };

    // Check if should show avatar (last message from user in a group)
    const shouldShowAvatar = (messages, index, message) => {
        if (index === messages.length - 1) return true;
        const nextMessage = messages[index + 1];
        if (nextMessage.type === "date") return true;
        if (nextMessage.message?.sender?.id !== message.sender?.id) return true;
        return false;
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
                    const isSent = message.sender?.id === currentUser?.id;
                    const showAvatar = shouldShowAvatar(groupedMessages, index, message);

                    return (
                        <MessageBubble
                            key={item.id}
                            message={message}
                            isSent={isSent}
                            showAvatar={showAvatar}
                            showSenderName={isGroup && !isSent}
                        />
                    );
                })
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}

export default MessageList;
