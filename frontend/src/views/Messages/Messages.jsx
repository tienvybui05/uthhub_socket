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
import { NotificationsProvider } from "../../contexts/NotificationsContext";

function Messages() {
  const { backgroundColor } = useBackgroundChat();

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
      <ChatLayout />
    </ThemeWrapper>
  );
}

export default Messages;
