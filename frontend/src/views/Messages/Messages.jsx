import WebSocketService from "../../services/WebSocketService";
import { useEffect } from "react";
import { AuthService } from "../../services/auth.service";
import { ChatProvider } from "../../contexts/ChatContext";
import ChatLayout from "../../layouts/ChatLayout/ChatLayout";
import { useBackgroundChat } from "../../contexts/BackgroundChatContext";
import { CHAT_BACKGROUND } from "../../constants/contactsMenu";

import GlobalDefautl from "../../styles/GlobalDefautl/GlobalDefautl";
import GlobalPink from "../../styles/GlobalPink/GlobalPink";
import GlobalDark from "../../styles/GlobalDark/GlobalDark";

function Messages() {
  const { backgroundColor } = useBackgroundChat();

  useEffect(() => {
    WebSocketService.connect(
      () => {
        const currentUser = AuthService.getUser();
        if (currentUser) {
          WebSocketService.send("/app/user/connect", {
            username: currentUser.username,
            status: "ONLINE",
          });
        }
      },
      (error) => {
        console.log("Lỗi khi kết nối với websocket", error);
      }
    );

    return () => WebSocketService.disconnect();
  }, []);

  let ThemeWrapper;

  switch (backgroundColor) {
    case CHAT_BACKGROUND.PINK:
      ThemeWrapper = GlobalPink;
      break;
    case CHAT_BACKGROUND.DARK:
      ThemeWrapper = GlobalDark;
      break;
    case CHAT_BACKGROUND.DEFAULT:
    default:
      ThemeWrapper = GlobalDefautl;
  }

  return (
    <ThemeWrapper>
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </ThemeWrapper>
  );
}

export default Messages;
