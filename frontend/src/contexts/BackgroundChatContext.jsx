import { createContext, useContext, useState } from "react";
import { CHAT_BACKGROUND } from "../constants/contactsMenu";

const BackgroundChatContext = createContext(null);
export const BackgroundChatProvider = ({ children }) => {
  const [backgroundColor, setBackgroundColor] = useState(
    CHAT_BACKGROUND.DEFAULT
  );

  return (
    <BackgroundChatContext.Provider
      value={{ backgroundColor, setBackgroundColor }}
    >
      {children}
    </BackgroundChatContext.Provider>
  );
};
export function useBackgroundChat() {
  return useContext(BackgroundChatContext);
}
