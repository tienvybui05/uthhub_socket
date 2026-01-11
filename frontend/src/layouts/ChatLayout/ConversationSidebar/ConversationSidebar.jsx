import ContactList from "../../../components/ContactList/ContactList";
import ContactSearch from "../../../components/ContactSearch/ContactSearch";
import { CHAT_TABS } from "../../../constants/contactsMenu";
import { useChat } from "../../../contexts/ChatContext";
import styles from "./ConversationSidebar.module.css";
function ConversationSidebar() {
  const { leftTab } = useChat();
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <ContactSearch />
      </div>
      <div className={styles.content}>
        {leftTab === CHAT_TABS.MESSAGES && <div>Nhắn tin</div>}
        {leftTab === CHAT_TABS.CONTACTS && <ContactList />}
      </div>
    </div>
  );
}
export default ConversationSidebar;
