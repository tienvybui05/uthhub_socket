import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments } from "@fortawesome/free-regular-svg-icons";
import { useChat } from "../../contexts/ChatContext";
import ChatHeader from "./ChatHeader/ChatHeader";
import MessageList from "./MessageList/MessageList";
import ChatInput from "./ChatInput/ChatInput";
import ChatInfoPanel from "./ChatInfoPanel/ChatInfoPanel";
import TypingIndicator from "./TypingIndicator/TypingIndicator";
import styles from "./ChatWindow.module.css";

function ChatWindow() {
    const { currentConversation, typingUsers } = useChat();
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

    // Empty state when no conversation is selected
    if (!currentConversation) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.emptyState}>
                    <FontAwesomeIcon icon={faComments} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Chào mừng đến UTH Hub</h3>
                    <p className={styles.emptyText}>
                        Chọn một cuộc trò chuyện để bắt đầu nhắn tin hoặc tìm kiếm bạn bè mới.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <ChatHeader onInfoClick={() => setIsInfoPanelOpen(true)} />
            <MessageList />
            <TypingIndicator typingUsers={typingUsers} />
            <ChatInput />
            <ChatInfoPanel
                isOpen={isInfoPanelOpen}
                onClose={() => setIsInfoPanelOpen(false)}
            />
        </div>
    );
}

export default ChatWindow;
