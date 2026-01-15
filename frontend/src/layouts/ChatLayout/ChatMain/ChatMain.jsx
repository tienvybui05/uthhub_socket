import { CHAT_TABS, CONTACTS_TAB } from "../../../constants/contactsMenu";
import { useChat } from "../../../contexts/ChatContext";
import ChatWindow from "../../../components/ChatWindow/ChatWindow";
import FriendRequests from "../../../components/FriendRequests/FriendRequests";
import MyFriends from "../../../components/MyFriends/MyFriends";
function ChatMain() {
  const { leftTab, selected } = useChat();

  if (leftTab === CHAT_TABS.MESSAGES) {
    return <ChatWindow />;
  } else {

    switch (selected) {
      case CONTACTS_TAB.MY_FRIENDS:
        return <MyFriends />;

      case CONTACTS_TAB.FRIEND_REQUESTS:
        return <FriendRequests />;

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
