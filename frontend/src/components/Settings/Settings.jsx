import styles from "./Settings.module.css";
import { useBackgroundChat } from "../../contexts/BackgroundChatContext";
import { CHAT_BACKGROUND } from "../../constants/contactsMenu";

function Settings({ onClick }) {
  const { backgroundColor, setBackgroundColor } = useBackgroundChat();

  return (
    <div className={styles.modalOverlay} onClick={onClick}>
      <div onClick={(e) => e.stopPropagation()} className={styles.wrapper}>
        <button onClick={() => setBackgroundColor(CHAT_BACKGROUND.DEFAULT)}>
          Màu xanh lá cây
        </button>
        <button onClick={() => setBackgroundColor(CHAT_BACKGROUND.PINK)}>
          Màu hồng dễ thương
        </button>
        <button onClick={() => setBackgroundColor(CHAT_BACKGROUND.DARK)}>
          Màu đen ngầu
        </button>
      </div>
    </div>
  );
}

export default Settings;
