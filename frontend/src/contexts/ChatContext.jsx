import { Children, createContext, useContext, useState } from "react";
import { CHAT_TABS } from "../constants/contactsMenu";

const ChatContext = createContext(null);
export const ChatProvider = ({ children }) => {
  const [leftTab, setLeftTab] = useState(CHAT_TABS.MESSAGES);
  const [selected, setSelected] = useState(null);
  return (
    <ChatContext.Provider
      value={{
        leftTab,
        setLeftTab,
        selected,
        setSelected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
export function useChat() {
  return useContext(ChatContext);
}
