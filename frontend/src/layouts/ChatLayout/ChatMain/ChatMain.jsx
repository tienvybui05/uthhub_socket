import { CHAT_TABS, CONTACTS_TAB } from "../../../constants/contactsMenu";
import { useChat } from "../../../contexts/ChatContext";

function ChatMain() {
  const { leftTab, selected } = useChat();

  if (leftTab === CHAT_TABS.MESSAGES) {
    return <div>messages</div>;
  } else {
   
    switch (selected) {
      case CONTACTS_TAB.MY_FRIENDS:
        return <div>bạn bè</div>;

      case CONTACTS_TAB.FRIEND_REQUESTS:
        return <div>lời mời</div>;

      case CONTACTS_TAB.GROUPS:
        return <div>nhóm và cộng đồng</div>;

      case CONTACTS_TAB.GROUP_INVITES:
        return <div>Lời mời vào nhóm và cộng đồng</div>;

      default:
        return <div>trang trống</div>;
    }
  }
}
export default ChatMain;
