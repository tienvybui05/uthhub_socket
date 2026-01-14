import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { useChat } from "../../../contexts/ChatContext";
import styles from "./ChatInput.module.css";

function ChatInput() {
    const [message, setMessage] = useState("");
    const textareaRef = useRef(null);
    const { currentConversation, sendMessage } = useChat();

    // Auto resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
        }
    }, [message]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || !currentConversation) return;

        sendMessage(message.trim());
        setMessage("");
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
                    onChange={(e) => setMessage(e.target.value)}
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
