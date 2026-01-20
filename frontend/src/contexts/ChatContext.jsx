import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
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

  // Read receipts - stores readers per conversation
  const [readBy, setReadBy] = useState(null);

  // Current user
  const [currentUser, setCurrentUser] = useState(AuthService.getUser());

  // Refs for stable callbacks
  const currentConversationRef = useRef(currentConversation);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const handler = () => setCurrentUser(AuthService.getUser());
    window.addEventListener("user_updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("user_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

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

      // Process data to add isOnline flag
      const processedData = data?.map(conv => {
        let isOnline = false;
        let participants = conv.participants || [];

        // Process participants to add isOnline flag from status string
        participants = participants.map(p => ({
          ...p,
          isOnline: p.status === 'ONLINE'
        }));

        if (!conv.isGroup) {
          const other = participants.find(p => p.username !== currentUser?.username);
          if (other && other.isOnline) {
            isOnline = true;
          }
        }

        return {
          ...conv,
          isOnline,
          participants
        };
      });

      setConversations(processedData || []);
    } catch (error) {
      console.error("[ChatContext] Error loading conversations:", error);
    }
  }, [currentUser?.username]);

  useEffect(() => {
    if (!currentUser?.id) return;

    loadConversations();
  }, [currentUser?.id, loadConversations]);

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
  const subscribeToTyping = useCallback(
    (conversationId) => {
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
    },
    [currentUser?.id]
  );

  // Mark messages as read
  const markAsRead = useCallback((conversationId) => {
    if (!conversationId) return;

    console.log("[ChatContext] markAsRead called for conversation:", conversationId);
    WebSocketService.send("/app/chat.markRead", {
      conversationId: conversationId,
    });
  }, []);

  // Subscribe to read receipt events
  const subscribeToReadReceipts = useCallback(
    (conversationId) => {
      if (!conversationId) return;

      console.log("[ChatContext] Subscribing to read receipts for:", conversationId);

      WebSocketService.subscribe(
        `/topic/conversation/${conversationId}/read`,
        (readReceipt) => {
          console.log("[ChatContext] Read receipt received from topic:", readReceipt);

          // Update all messages in this conversation as read
          setMessages((prev) => {
            console.log("[ChatContext] Updating messages to isRead=true");
            return prev.map((msg) => ({
              ...msg,
              isRead: true,
            }));
          });
        }
      );
    },
    []
  );

  // Subscribe to specific conversation topic
  const subscribeToConversation = useCallback((conversationId) => {
    if (!conversationId) return;

    WebSocketService.subscribe(
      `/topic/conversation/${conversationId}`,
      (response) => {
        // Check if this is a read receipt (has readerId) or a message (has content)
        if (response.readerId) {
          // This is a read receipt
          console.log("[ChatContext] Read receipt received on main topic:", response);
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              isRead: true,
            }))
          );
        } else {
          // This is a regular message
          // Update conversation list preview regardless of which conversation we are viewing
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId
                ? {
                  ...conv,
                  lastMessage: response.content,
                  lastMessageTime: response.createdAt,
                }
                : conv
            )
          );

          // Only update active message list and typing status if we are currently viewing this conversation
          const currentConv = currentConversationRef.current;

          // Debug logs
          if (response.sender?.id !== currentUser?.id) {
            console.log(`[ChatContext] Msg received. ID: ${response.id}, ConvID: ${response.conversationId}, CurrentConvID: ${currentConv?.id}`);
          }

          if (currentConv && currentConv.id === conversationId) {
            // DOUBLE CHECK: Ensure the message actually belongs to this conversation
            // This prevents issues where a message might be broadcast to the wrong topic or other weirdness
            if (response.conversationId && response.conversationId !== currentConv.id) {
              console.warn(`[ChatContext] BLOCKED LEAK: Msg ConvID ${response.conversationId} != Current ${currentConv.id}`);
              return;
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === response.id)) return prev;
              return [...prev, response];
            });

            // Clear typing indicator for the sender when message is received
            setTypingUsers((prev) =>
              prev.filter((u) => u.userId !== response.sender?.id)
            );

            // If the message is from someone else, mark it as read immediately
            if (currentUser?.id && response.sender?.id !== currentUser.id) {
              console.log("[ChatContext] New message received while in active conversation, marking as read...");
              markAsRead(conversationId);
            }
          }
        }
      }
    );
  }, [currentUser, markAsRead]);

  // Select a conversation
  const selectConversation = useCallback(
    (conversation) => {
      setCurrentConversation(conversation);
      setTypingUsers([]); // Clear typing users when switching conversations
      setReadBy(null); // Clear read receipts when switching conversations
      if (conversation && conversation.id) {
        loadMessages(conversation.id);
        subscribeToConversation(conversation.id);
        subscribeToTyping(conversation.id);
        subscribeToReadReceipts(conversation.id);
        // Mark messages as read when viewing conversation
        markAsRead(conversation.id);
      } else {
        setMessages([]);
      }
    },
    [loadMessages, subscribeToConversation, subscribeToTyping, subscribeToReadReceipts, markAsRead]
  );

  // Start a new conversation with a user
  const startNewConversation = useCallback(
    (user) => {
      console.log("[ChatContext] startNewConversation called with user:", user);

      const existing = conversations.find((c) =>
        c.participants?.some((p) => p.id === user.id)
      );

      if (existing) {
        console.log("[ChatContext] Found existing conversation:", existing);
        selectConversation(existing);
      } else {
        console.log(
          "[ChatContext] Creating temp conversation for user:",
          user.id
        );
        const tempConv = {
          id: null,
          participants: [user],
          isTemp: true,
          recipientId: user.id,
          name: user.fullName || user.username,
          avatarUrl: user.avatar || user.avatarUrl,
          isGroup: false,
          isOnline: user.status === 'ONLINE',
          lastMessage: "",
          lastMessageTime: new Date().toISOString(),
        };
        setCurrentConversation(tempConv);
        setMessages([]);
        console.log("[ChatContext] Temp conversation set:", tempConv);
      }
    },
    [conversations, selectConversation]
  );

  // Send a message
  const sendMessage = useCallback((content) => {
    const conv = currentConversationRef.current;
    console.log("[ChatContext] sendMessage called, content:", content);
    console.log("[ChatContext] currentConversation:", conv);

    if (!conv || !content.trim()) {
      console.log(
        "[ChatContext] sendMessage aborted - no conv or empty content"
      );
      return;
    }

    const messagePayload = { content: content.trim() };

    if (conv.id) {
      messagePayload.conversationId = conv.id;
      // Ensure we're subscribed to read receipts for this conversation
      subscribeToReadReceipts(conv.id);
    } else if (conv.recipientId) {
      messagePayload.recipientId = conv.recipientId;
    } else {
      console.error("[ChatContext] No valid destination for message");
      return;
    }

    console.log("[ChatContext] Sending message payload:", messagePayload);
    WebSocketService.send("/app/chat.send", messagePayload);
    console.log("[ChatContext] Message sent via WebSocket");
  }, [subscribeToReadReceipts]);

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

        // DEBUG: Check IDs
        if (latestConversation && latestConversation.id !== message.conversationId) {
          console.warn(`[ChatContext] Queue Msg Leak Blocked: ConvID ${message.conversationId} != Current ${latestConversation.id}`);
        }

        // Add message to current view ONLY if it belongs to the current conversation
        if (latestConversation && latestConversation.id === message.conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });

          // Auto-mark as read if we are viewing this conversation
          if (currentUser?.id && message.sender?.id !== currentUser.id) {
            console.log("[ChatContext] Queue message received in active view, marking as read...");
            markAsRead(message.conversationId);
          }
        }

        // Upgrade temp conversation to real
        if (latestConversation?.isTemp && message.conversationId) {
          setCurrentConversation((prev) => ({
            ...prev,
            id: message.conversationId,
            isTemp: false,
          }));
          subscribeToConversation(message.conversationId);
          subscribeToReadReceipts(message.conversationId);
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

      // Subscribe to user's personal queue for read receipts
      WebSocketService.subscribe(`/user/queue/read-receipts`, (readReceipt) => {
        console.log("[ChatContext] Received read receipt from queue:", readReceipt);
        const latestConversation = currentConversationRef.current;

        // Only update if viewing the same conversation
        if (latestConversation?.id === readReceipt.conversationId) {
          console.log("[ChatContext] Updating messages as read...");
          // Update all messages as read
          setMessages((prev) => {
            const updated = prev.map((msg) => ({
              ...msg,
              isRead: true,
            }));
            console.log("[ChatContext] Messages updated:", updated);
            return updated;
          });
        }
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

  // Manage status subscriptions based on loaded conversations
  // We use a separate effect/logic to ensure we subscribe to all participants
  const subscribedUsersRef = useRef(new Set());

  const subscribeToUserStatus = useCallback((username) => {
    if (!username || subscribedUsersRef.current.has(username)) return;

    // Don't subscribe to self
    if (currentUser?.username === username) return;

    console.log(`[ChatContext] Subscribing to status for: ${username}`);
    subscribedUsersRef.current.add(username);

    WebSocketService.subscribe(`/topic/active/${username}`, (statusMsg) => {
      console.log(`[ChatContext] Status update for ${username}:`, statusMsg);
      const isOnline = statusMsg.status === 'ONLINE';

      // Update conversations list
      setConversations(prevConvs => {
        return prevConvs.map(conv => {
          // Update participants inside conversation
          let participantsChanged = false;
          const updatedParticipants = conv.participants?.map(p => {
            if (p.username === username && (p.isOnline !== isOnline)) {
              participantsChanged = true;
              return { ...p, isOnline: isOnline, status: statusMsg.status };
            }
            return p;
          });

          // For 1-1 chats, update top-level isOnline
          let isOnlineChanged = false;
          let newConvIsOnline = conv.isOnline;

          if (!conv.isGroup) {
            const other = updatedParticipants?.find(p => p.username === username);
            if (other && conv.isOnline !== isOnline) {
              newConvIsOnline = isOnline;
              isOnlineChanged = true;
            }
          }

          if (participantsChanged || isOnlineChanged) {
            return {
              ...conv,
              participants: updatedParticipants,
              isOnline: newConvIsOnline
            };
          }
          return conv;
        });
      });

      // Update current conversation if needed
      setCurrentConversation(prev => {
        if (!prev) return prev;

        let shouldUpdate = false;
        const newParticipants = prev.participants?.map(p => {
          if (p.username === username && (p.isOnline !== isOnline)) {
            shouldUpdate = true;
            return { ...p, isOnline: isOnline, status: statusMsg.status };
          }
          return p;
        });

        // For 1-1 chats, update top-level isOnline
        let newIsOnline = prev.isOnline;
        if (!prev.isGroup) {
          const other = newParticipants?.find(p => p.username === username);
          if (other && prev.isOnline !== isOnline) {
            newIsOnline = isOnline;
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          return {
            ...prev,
            participants: newParticipants,
            isOnline: newIsOnline
          };
        }
        return prev;
      });

    });
  }, [currentUser?.username]);

  // Effect to subscribe to status for all users in conversations
  useEffect(() => {
    if (!conversations.length) return;

    conversations.forEach(conv => {
      conv.participants?.forEach(p => {
        if (p.username) subscribeToUserStatus(p.username);
      });
    });
  }, [conversations, subscribeToUserStatus]);

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
        readBy,
        // Actions
        loadConversations,
        loadMessages,
        selectConversation,
        startNewConversation,
        sendMessage,
        sendTypingStatus,
        markAsRead,
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
