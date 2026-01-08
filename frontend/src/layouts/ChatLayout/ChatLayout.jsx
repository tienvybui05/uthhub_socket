import styles from "./ChatLayout.module.css";
import ChatMain from "./ChatMain/ChatMain";
import ConversationSidebar from "./ConversationSidebar/ConversationSidebar";
import SideNavigation from "./SideNavigation/SideNavigation";
function ChatLayout() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.chatMain}>
        <ChatMain />
      </div>
      <div className={styles.conversationSidebar}>
        <ConversationSidebar />
      </div>
      <div className={styles.sideNavigation}>
        <SideNavigation />
      </div>
    </div>
  );
}
export default ChatLayout;
