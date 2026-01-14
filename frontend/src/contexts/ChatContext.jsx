import { createContext, useContext, useState, useCallback } from "react";
import { CHAT_TABS } from "../constants/contactsMenu";
import WebSocketService from "../services/WebSocketService";
import { AuthService } from "../services/auth.service";
import conversationApi from "../api/conversationApi";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  // Tab navigation
  const [leftTab, setLeftTab] = useState(CHAT_TABS.MESSAGES);
  const [selected, setSelected] = useState(null);

  // Conversations
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);

  // Messages
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Current user
  const currentUser = AuthService.getUser();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await conversationApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    try {
      const data = await conversationApi.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback((conversation) => {
    setCurrentConversation(conversation);
    if (conversation) {
      loadMessages(conversation.id);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  // Send a message
  const sendMessage = useCallback((content) => {
    if (!currentConversation || !content.trim()) return;

    const newMessage = {
      id: Date.now(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: currentUser?.id,
        fullName: currentUser?.fullName,
      },
    };

    // Optimistic update
    setMessages((prev) => [...prev, newMessage]);

    // Send via WebSocket
    WebSocketService.send("/app/chat.send", {
      conversationId: currentConversation.id,
      content: content.trim(),
    });

    // Update last message in conversations list
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentConversation.id
          ? {
            ...conv,
            lastMessage: content.trim(),
            lastMessageTime: new Date().toISOString(),
          }
          : conv
      )
    );
  }, [currentConversation, currentUser]);

  // Subscribe to messages (call this after WebSocket connects)
  const subscribeToMessages = useCallback(() => {
    if (!currentUser) return;

    WebSocketService.subscribe(`/user/queue/messages`, (message) => {
      // Add received message
      setMessages((prev) => [...prev, message]);

      // Update conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
              ...conv,
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount: conv.id !== currentConversation?.id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount,
            }
            : conv
        )
      );
    });
  }, [currentUser, currentConversation]);

  return (
    <ChatContext.Provider
      value={{
        // Tab navigation
        leftTab,
        setLeftTab,
        selected,
        setSelected,

        // Conversations
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation: selectConversation,
        loadConversations,

        // Messages
        messages,
        setMessages,
        isLoadingMessages,
        sendMessage,
        loadMessages,

        // WebSocket
        subscribeToMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  return useContext(ChatContext);
}
