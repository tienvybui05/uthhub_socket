import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { CHAT_TABS } from "../constants/contactsMenu";
import { AuthService } from "../services/auth.service";
import conversationApi from "../api/conversationApi";
import WebSocketService from "../services/WebSocketService";

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

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState([]);

  // Current user
  const currentUser = AuthService.getUser();

  // Refs for stable callbacks
  const currentConversationRef = useRef(currentConversation);
  const hasInitialized = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      console.log("[ChatContext] loadConversations - calling API...");
      const data = await conversationApi.getConversations();
      console.log("[ChatContext] loadConversations - API returned:", data);
      setConversations(data || []);
    } catch (error) {
      console.error("[ChatContext] Error loading conversations:", error);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    try {
      const data = await conversationApi.getMessages(conversationId);
      setMessages(data || []);
    } catch (error) {
      console.error("[ChatContext] Error loading messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Subscribe to typing events for a conversation
  const subscribeToTyping = useCallback((conversationId) => {
    if (!conversationId) return;

    WebSocketService.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (typingData) => {
        console.log("[ChatContext] Typing event received:", typingData);

        // Don't show typing indicator for current user
        if (typingData.userId === currentUser?.id) return;

        setTypingUsers((prev) => {
          if (typingData.typing) {
            // Add user to typing list if not already there
            if (prev.some((u) => u.userId === typingData.userId)) return prev;
            return [...prev, typingData];
          } else {
            // Remove user from typing list
            return prev.filter((u) => u.userId !== typingData.userId);
          }
        });
      }
    );
  }, [currentUser?.id]);

  // Subscribe to specific conversation topic
  const subscribeToConversation = useCallback((conversationId) => {
    if (!conversationId) return;

    WebSocketService.subscribe(
      `/topic/conversation/${conversationId}`,
      (messageResponse) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === messageResponse.id)) return prev;
          return [...prev, messageResponse];
        });

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? {
                ...conv,
                lastMessage: messageResponse.content,
                lastMessageAt: messageResponse.createdAt,
              }
              : conv
          )
        );

        // Clear typing indicator for the sender when message is received
        setTypingUsers((prev) =>
          prev.filter((u) => u.userId !== messageResponse.sender?.id)
        );
      }
    );
  }, []);

  // Select a conversation
  const selectConversation = useCallback((conversation) => {
    setCurrentConversation(conversation);
    setTypingUsers([]); // Clear typing users when switching conversations
    if (conversation && conversation.id) {
      loadMessages(conversation.id);
      subscribeToConversation(conversation.id);
      subscribeToTyping(conversation.id);
    } else {
      setMessages([]);
    }
  }, [loadMessages, subscribeToConversation, subscribeToTyping]);

  // Start a new conversation with a user
  const startNewConversation = useCallback((user) => {
    console.log("[ChatContext] startNewConversation called with user:", user);

    const existing = conversations.find((c) =>
      c.participants?.some((p) => p.id === user.id)
    );

    if (existing) {
      console.log("[ChatContext] Found existing conversation:", existing);
      selectConversation(existing);
    } else {
      console.log("[ChatContext] Creating temp conversation for user:", user.id);
      const tempConv = {
        id: null,
        participants: [user],
        isTemp: true,
        recipientId: user.id,
        name: user.fullName || user.username,
        avatarUrl: user.avatar || user.avatarUrl,
        isGroup: false,
        isOnline: false,
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
      };
      setCurrentConversation(tempConv);
      setMessages([]);
      console.log("[ChatContext] Temp conversation set:", tempConv);
    }
  }, [conversations, selectConversation]);

  // Send a message
  const sendMessage = useCallback((content) => {
    const conv = currentConversationRef.current;
    console.log("[ChatContext] sendMessage called, content:", content);
    console.log("[ChatContext] currentConversation:", conv);

    if (!conv || !content.trim()) {
      console.log("[ChatContext] sendMessage aborted - no conv or empty content");
      return;
    }

    const messagePayload = { content: content.trim() };

    if (conv.id) {
      messagePayload.conversationId = conv.id;
    } else if (conv.recipientId) {
      messagePayload.recipientId = conv.recipientId;
    } else {
      console.error("[ChatContext] No valid destination for message");
      return;
    }

    console.log("[ChatContext] Sending message payload:", messagePayload);
    WebSocketService.send("/app/chat.send", messagePayload);
    console.log("[ChatContext] Message sent via WebSocket");
  }, []);

  // Send typing status
  const sendTypingStatus = useCallback((isTyping) => {
    const conv = currentConversationRef.current;
    if (!conv?.id) return;

    WebSocketService.send("/app/chat.typing", {
      conversationId: conv.id,
      typing: isTyping,
    });
  }, []);

  // Initialize WebSocket and subscribe to user queue (ONCE)
  useEffect(() => {
    // Guard: Skip if no user OR already initialized
    if (!currentUser?.id || hasInitialized.current) {
      return;
    }

    // Mark as initialized BEFORE async operations
    hasInitialized.current = true;
    console.log("[ChatContext] Initializing for user:", currentUser.username);

    WebSocketService.connect(() => {
      console.log("[ChatContext] WebSocket CONNECTED!");

      // Subscribe to user's personal queue
      WebSocketService.subscribe(`/user/queue/messages`, (message) => {
        console.log("[ChatContext] Received message from queue:", message);
        const latestConversation = currentConversationRef.current;

        // Add message to current view
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Upgrade temp conversation to real
        if (latestConversation?.isTemp && message.conversationId) {
          setCurrentConversation((prev) => ({
            ...prev,
            id: message.conversationId,
            isTemp: false,
          }));
          subscribeToConversation(message.conversationId);
        }

        // Update conversations list
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === message.conversationId);
          if (existing) {
            return prev.map((conv) =>
              conv.id === message.conversationId
                ? {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageTime: message.createdAt,
                }
                : conv
            );
          } else {
            // New conversation, reload all
            loadConversations();
            return prev;
          }
        });
      });

      // Load conversations after connected
      console.log("[ChatContext] Calling loadConversations...");
      loadConversations();
    });

    // Cleanup only on unmount, not on re-render
    return () => {
      // Only disconnect if component is truly unmounting
      // hasInitialized stays true to prevent reconnect on StrictMode double-invoke
    };
  }, [currentUser?.id]); // Use primitive ID, not object reference

  return (
    <ChatContext.Provider
      value={{
        // State
        leftTab,
        setLeftTab,
        selected,
        setSelected,
        conversations,
        currentConversation,
        messages,
        isLoadingMessages,
        currentUser,
        typingUsers,
        // Actions
        loadConversations,
        loadMessages,
        selectConversation,
        startNewConversation,
        sendMessage,
        sendTypingStatus,
        setCurrentConversation,
        setMessages,
        setConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  return useContext(ChatContext);
}
