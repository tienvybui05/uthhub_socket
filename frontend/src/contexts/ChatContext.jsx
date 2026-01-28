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
import { bindTingUnlockOnce, playTingSound } from "../utils/sound";

const ChatContext = createContext(null);

// Custom hook to wait for WebSocket connection - FIXED VERSION
const useWebSocketReady = () => {
  const [isReady, setIsReady] = useState(() => WebSocketService.isConnected());
  
  useEffect(() => {
    // Check immediately
    if (WebSocketService.isConnected()) {
      setIsReady(true);
      return;
    }
    
    // Add listener for connection
    const handleConnected = () => {
      setIsReady(true);
    };
    
    WebSocketService.addConnectionListener(handleConnected);
    
    // Shorter timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      console.log("[useWebSocketReady] Timeout reached, setting ready anyway");
      setIsReady(true); // Set ready anyway to avoid UI blocking
    }, 5000);
    
    return () => {
      WebSocketService.removeConnectionListener(handleConnected);
      clearTimeout(timeoutId);
    };
  }, []);
  
  return isReady;
};

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

  // Read receipts
  const [readBy, setReadBy] = useState(null);

  // Current user
  const currentUser = AuthService.getUser();

  // Refs
  const currentConversationRef = useRef(currentConversation);
  const conversationsRef = useRef(conversations);
  const hasInitialized = useRef(false);
  const userStatusRef = useRef({});
  const subscriptionCleanups = useRef({});

  // Check WebSocket connection
  const isWebSocketReady = useWebSocketReady();

  // Update refs
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback((conversationId) => {
    if (!conversationId) return;
    
    const topics = [
      `/topic/conversation/${conversationId}`,
      `/topic/conversation/${conversationId}/typing`,
      `/topic/conversation/${conversationId}/read`
    ];
    
    topics.forEach(topic => {
      if (subscriptionCleanups.current[topic]) {
        subscriptionCleanups.current[topic]();
        delete subscriptionCleanups.current[topic];
      }
      WebSocketService.unsubscribe(topic);
    });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      console.log("[ChatContext] Loading conversations...");
      const data = await conversationApi.getConversations();

      const conversationsWithStatus = (data || []).map((conv) => {
        let isOnline = false;

        if (!conv.isGroup && conv.participants) {
          const otherParticipant = conv.participants.find(
            (p) => p.username !== currentUser?.username
          );

          if (otherParticipant) {
            isOnline = otherParticipant?.status === 'ONLINE';
            if (userStatusRef.current[otherParticipant.username]) {
              isOnline = userStatusRef.current[otherParticipant.username] === 'ONLINE';
            }
          }
        }

        return { ...conv, isOnline };
      });

      setConversations(conversationsWithStatus);
    } catch (error) {
      console.error("[ChatContext] Error loading conversations:", error);
    }
  }, [currentUser?.username]);

  // Initial load
  useEffect(() => {
    if (!currentUser?.id) return;
    loadConversations();
  }, [currentUser?.id, loadConversations]);

  // Load messages
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

  // Mark messages as read
  const markAsRead = useCallback((conversationId) => {
    if (!conversationId) return;
    
    if (!WebSocketService.isConnected()) {
      console.log("[ChatContext] WebSocket not connected, queuing markAsRead");
      
      // Queue the markAsRead for when connected
      const handleConnected = () => {
        WebSocketService.send("/app/chat.markRead", { conversationId });
        WebSocketService.removeConnectionListener(handleConnected);
      };
      WebSocketService.addConnectionListener(handleConnected);
      return;
    }
    
    WebSocketService.send("/app/chat.markRead", { conversationId });
  }, []);

  // Subscribe to conversation events
  const subscribeToConversationEvents = useCallback((conversationId) => {
    if (!conversationId) return;

    console.log(`[ChatContext] Subscribing to events for conversation ${conversationId}`);

    // Message updates
    const msgCleanup = WebSocketService.subscribe(
      `/topic/conversation/${conversationId}`,
      (response) => {
        if (response.readerId) {
          setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
          return;
        }

        // Update conversation preview
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: response.content,
                lastMessageTime: response.createdAt,
              }
            : conv
        ));

        const currentConv = currentConversationRef.current;
        if (currentConv && currentConv.id === conversationId) {
          if (response.conversationId && response.conversationId !== currentConv.id) return;

          setMessages(prev => {
            if (prev.some(m => m.id === response.id)) return prev;
            return [...prev, response];
          });

          setTypingUsers(prev => prev.filter(u => u.userId !== response.sender?.id));

          if (currentUser?.id && response.sender?.id !== currentUser.id) {
            markAsRead(conversationId);
          }
        }
      },
      false // Not persistent - will be cleaned up when conversation changes
    );
    
    if (msgCleanup) {
      subscriptionCleanups.current[`/topic/conversation/${conversationId}`] = msgCleanup;
    }

    // Typing indicators
    const typingCleanup = WebSocketService.subscribe(
      `/topic/conversation/${conversationId}/typing`,
      (typingData) => {
        if (typingData.userId === currentUser?.id) return;

        setTypingUsers((prev) => {
          if (typingData.typing) {
            if (prev.some((u) => u.userId === typingData.userId)) return prev;
            return [...prev, typingData];
          } else {
            return prev.filter((u) => u.userId !== typingData.userId);
          }
        });
      },
      false
    );
    
    if (typingCleanup) {
      subscriptionCleanups.current[`/topic/conversation/${conversationId}/typing`] = typingCleanup;
    }

    // Read receipts
    const readCleanup = WebSocketService.subscribe(
      `/topic/conversation/${conversationId}/read`,
      (readReceipt) => {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      },
      false
    );
    
    if (readCleanup) {
      subscriptionCleanups.current[`/topic/conversation/${conversationId}/read`] = readCleanup;
    }
  }, [currentUser?.id, markAsRead]);

  // Select conversation
  const selectConversation = useCallback((conversation) => {
    console.log(`[ChatContext] Selecting conversation:`, conversation?.id);
    
    // Cleanup previous subscriptions
    if (currentConversationRef.current?.id) {
      const prevId = currentConversationRef.current.id;
      cleanupSubscriptions(prevId);
    }

    setCurrentConversation(conversation);
    setTypingUsers([]);
    setReadBy(null);

    if (conversation?.id) {
      loadMessages(conversation.id);
      
      if (isWebSocketReady) {
        subscribeToConversationEvents(conversation.id);
        markAsRead(conversation.id);
      } else {
        console.log("[ChatContext] WebSocket not ready, will subscribe when connected");
        // Queue subscription for when WebSocket is ready
        const handleConnected = () => {
          subscribeToConversationEvents(conversation.id);
          markAsRead(conversation.id);
          WebSocketService.removeConnectionListener(handleConnected);
        };
        WebSocketService.addConnectionListener(handleConnected);
      }
    } else {
      setMessages([]);
    }
  }, [loadMessages, subscribeToConversationEvents, markAsRead, cleanupSubscriptions, isWebSocketReady]);

  // Start new conversation
  const startNewConversation = useCallback((user) => {
    const existing = conversations.find((c) =>
      c.participants?.some((p) => p.id === user.id)
    );

    if (existing) {
      selectConversation(existing);
    } else {
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
        lastMessageTime: new Date().toISOString(),
      };
      setCurrentConversation(tempConv);
      setMessages([]);
    }
  }, [conversations, selectConversation]);

  // Send message
  const sendMessage = useCallback((content, options = {}) => {
    const conv = currentConversationRef.current;
    if (!conv || !content.trim()) return;

    const messagePayload = { content: content.trim() };

    if (conv.id) {
      messagePayload.conversationId = conv.id;
    } else if (conv.recipientId) {
      messagePayload.recipientId = conv.recipientId;
    } else {
      return;
    }

    if (Array.isArray(options.mentionedUserIds) && options.mentionedUserIds.length > 0) {
      messagePayload.mentionedUserIds = options.mentionedUserIds;
    }

    WebSocketService.send("/app/chat.send", messagePayload);
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

  // Main WebSocket setup - RUNS ONLY ONCE
  useEffect(() => {
    if (!currentUser?.id || hasInitialized.current) return;

    console.log("[ChatProvider] Initializing WebSocket subscriptions...");
    bindTingUnlockOnce();
    hasInitialized.current = true;

    const setupSubscriptions = () => {
      console.log("[ChatProvider] Setting up chat subscriptions...");

      // Personal message queue
      const messagesCleanup = WebSocketService.subscribe(
        `/user/queue/messages`,
        (message) => {
          const latestConversation = currentConversationRef.current;
          const convId = message?.conversationId;
          const currentConvId = latestConversation?.id;
          const isFromMe = message?.sender?.id === currentUser?.id;
          const isSystem = message?.isSystem === true;

          // Play sound for new messages not in current conversation
          if (!isFromMe && !isSystem && convId && convId !== currentConvId) {
            const conv = conversationsRef.current?.find(c => c.id === convId);
            const muted = conv?.muted === true;
            if (!muted) playTingSound();
          }

          // Add to current conversation if matches
          if (latestConversation && latestConversation.id === convId) {
            setMessages(prev => {
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });

            if (currentUser?.id && message.sender?.id !== currentUser.id) {
              markAsRead(convId);
            }
          }

          // Upgrade temp conversation
          if (latestConversation?.isTemp && convId) {
            setCurrentConversation(prev => ({
              ...prev,
              id: convId,
              isTemp: false,
            }));
            subscribeToConversationEvents(convId);
          }

          // Update conversations list
          setConversations(prev => {
            const existing = prev.find(c => c.id === convId);
            if (existing) {
              return prev.map(conv =>
                conv.id === convId
                  ? {
                      ...conv,
                      lastMessage: message.content,
                      lastMessageTime: message.createdAt,
                    }
                  : conv
              );
            } else {
              loadConversations();
              return prev;
            }
          });
        },
        true // Persistent subscription
      );
      
      if (messagesCleanup) {
        subscriptionCleanups.current['/user/queue/messages'] = messagesCleanup;
      }

      // Read receipts
      const readReceiptsCleanup = WebSocketService.subscribe(
        `/user/queue/read-receipts`,
        (readReceipt) => {
          const latestConversation = currentConversationRef.current;
          if (latestConversation?.id === readReceipt.conversationId) {
            setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
          }
        },
        true
      );
      
      if (readReceiptsCleanup) {
        subscriptionCleanups.current['/user/queue/read-receipts'] = readReceiptsCleanup;
      }

      // User status updates
      const statusCleanup = WebSocketService.subscribe(
        `/topic/user-status`,
        (statusMessage) => {
          console.log(`[ChatProvider] User status update: ${statusMessage.username} -> ${statusMessage.status}`);
          
          userStatusRef.current[statusMessage.username] = statusMessage.status;

          // Update conversations
          setConversations(prev => prev.map(conv => {
            if (!conv.isGroup && conv.participants) {
              const participant = conv.participants.find(p => p.username === statusMessage.username);
              if (participant) {
                return { ...conv, isOnline: statusMessage.status === 'ONLINE' };
              }
            }
            return conv;
          }));

          // Update current conversation
          setCurrentConversation(prev => {
            if (!prev || prev.isGroup) return prev;
            const participant = prev.participants?.find(p => p.username === statusMessage.username);
            if (participant) {
              return { ...prev, isOnline: statusMessage.status === 'ONLINE' };
            }
            return prev;
          });
        },
        true
      );
      
      if (statusCleanup) {
        subscriptionCleanups.current['/topic/user-status'] = statusCleanup;
      }
      
      console.log("[ChatProvider] ✅ All subscriptions active");
    };

    // Handle WebSocket connection
    const handleWebSocketConnected = () => {
      console.log("[ChatProvider] WebSocket connected, setting up chat subscriptions");
      setupSubscriptions();
      
      // Resubscribe to current conversation if exists
      if (currentConversationRef.current?.id) {
        subscribeToConversationEvents(currentConversationRef.current.id);
      }
    };

    WebSocketService.addConnectionListener(handleWebSocketConnected);

    // If already connected, setup immediately
    if (WebSocketService.isConnected()) {
      console.log("[ChatProvider] WebSocket already connected, setting up...");
      setupSubscriptions();
    } else {
      console.log("[ChatProvider] WebSocket not connected yet, will setup when connected");
      // Try to connect
      if (!WebSocketService.isConnecting) {
        setTimeout(() => WebSocketService.connect(), 100);
      }
    }

    // Cleanup
    return () => {
      console.log("[ChatProvider] Cleaning up subscriptions...");
      
      WebSocketService.removeConnectionListener(handleWebSocketConnected);
      
      // Cleanup all subscriptions
      Object.values(subscriptionCleanups.current).forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
      subscriptionCleanups.current = {};
      
      hasInitialized.current = false;
    };
  }, [currentUser?.id, markAsRead, loadConversations, subscribeToConversationEvents]);

  return (
    <ChatContext.Provider
      value={{
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
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}