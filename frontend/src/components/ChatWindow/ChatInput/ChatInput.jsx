import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { useChat } from "../../../contexts/ChatContext";
import styles from "./ChatInput.module.css";

function ChatInput() {
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const { currentConversation, sendMessage, sendTypingStatus } = useChat();

    // Auto resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [message]);

    // Stop typing indicator
    const stopTyping = useCallback(() => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            sendTypingStatus(false);
        }
    }, [sendTypingStatus]);

    // Handle typing with debounce
    const handleTyping = useCallback(() => {
        if (!currentConversation?.id) return;

        // Send typing = true if not already typing
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            sendTypingStatus(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 2000);
    }, [currentConversation?.id, sendTypingStatus, stopTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            stopTyping();
        };
    }, [stopTyping]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || !currentConversation) return;

        // Stop typing indicator before sending
        stopTyping();
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        sendMessage(message.trim());
        setMessage("");
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        handleTyping();
    };

    const handleKeyDown = (e) => {
        // Enter to send, Shift+Enter for new line
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className={styles.wrapper} onSubmit={handleSubmit}>
            {/* Attach Button */}
            <button type="button" className={styles.attachBtn} title="Đính kèm file">
                <FontAwesomeIcon icon={faPaperclip} />
            </button>

            {/* Input Container */}
            <div className={styles.inputContainer}>
                <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                />
            </div>

            {/* Send Button */}
            <button
                type="submit"
                className={styles.sendBtn}
                disabled={!message.trim()}
                title="Gửi tin nhắn"
            >
                <FontAwesomeIcon icon={faPaperPlane} />
            </button>
        </form>
    );
}

export default ChatInput;
