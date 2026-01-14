import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faComments, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useChat } from "../../contexts/ChatContext";
import ConversationItem from "./ConversationItem/ConversationItem";
import NewChatModal from "../NewChatModal/NewChatModal";
import CreateGroupModal from "../CreateGroupModal/CreateGroupModal";
import styles from "./ConversationList.module.css";

function ConversationList() {
    const { conversations, currentConversation, selectConversation } = useChat();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectConversation = (conversation) => {
        selectConversation(conversation);  // This will also load messages!
    };

    const handleNewChat = () => {
        setShowDropdown(false);
        setIsNewChatModalOpen(true);
    };

    const handleCreateGroup = () => {
        setShowDropdown(false);
        setIsCreateGroupModalOpen(true);
    };

    return (
        <div className={styles.wrapper}>
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.title}>Tin nhắn</span>
                <div className={styles.headerActions} ref={dropdownRef}>
                    <button
                        className={styles.newChatBtn}
                        title="Tạo mới"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className={styles.dropdown}>
                            <button className={styles.dropdownItem} onClick={handleNewChat}>
                                <FontAwesomeIcon icon={faUser} className={styles.dropdownIcon} />
                                <span>Trò chuyện mới</span>
                            </button>
                            <button className={styles.dropdownItem} onClick={handleCreateGroup}>
                                <FontAwesomeIcon icon={faUsers} className={styles.dropdownIcon} />
                                <span>Tạo nhóm</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Conversation List */}
            <div className={styles.list}>
                {conversations && conversations.length > 0 ? (
                    conversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            active={currentConversation?.id === conversation.id}
                            onClick={() => handleSelectConversation(conversation)}
                        />
                    ))
                ) : (
                    <div className={styles.empty}>
                        <FontAwesomeIcon icon={faComments} className={styles.emptyIcon} />
                        <p className={styles.emptyText}>Chưa có cuộc trò chuyện nào</p>
                        <p className={styles.emptyHint}>Bắt đầu trò chuyện với bạn bè</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
            />
            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
            />
        </div>
    );
}

export default ConversationList;

