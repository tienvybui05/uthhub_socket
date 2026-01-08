import { ChatProvider } from "../../contexts/ChatContext";
import ChatLayout from "../../layouts/ChatLayout/ChatLayout";

function Messages() {
  return (
    <>
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </>
  );
}
export default Messages;
