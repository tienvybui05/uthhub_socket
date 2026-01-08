import { Children, createContext, useContext, useState } from "react";

const ChatContext = createContext(null);
export const ChatProvider = ({ children }) => {
  const [leftTab, setLeftTab] = useState("chat");
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
