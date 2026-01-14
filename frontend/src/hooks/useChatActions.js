import { useCallback, useEffect, useRef } from "react";
import { useChat } from "../contexts/ChatContext";
import conversationApi from "../api/conversationApi";
import WebSocketService from "../services/WebSocketService";

export function useChatActions() {
    const {
        setConversations,
        setCurrentConversation,
        setMessages,
        setIsLoadingMessages,
        currentConversation,
        currentUser,
        conversations,
    } = useChat();

    // Use ref to track current conversation without triggering re-subscriptions
    const currentConversationRef = useRef(currentConversation);

    // Update ref whenever currentConversation changes
    useEffect(() => {
        currentConversationRef.current = currentConversation;
    }, [currentConversation]);

    // Load conversations from API
    const loadConversations = useCallback(async () => {
        try {
            const data = await conversationApi.getConversations();
            setConversations(data);
        } catch (error) {
            console.error("[useChatActions] Error loading conversations:", error);
        }
    }, [setConversations]);

    // Load messages for a conversation
    const loadMessages = useCallback(
        async (conversationId) => {
            console.log("[useChatActions] loadMessages called with id:", conversationId);
            if (!conversationId) {
                console.log("[useChatActions] No conversationId, skipping loadMessages");
                return;
            }

            setIsLoadingMessages(true);
            try {
                const data = await conversationApi.getMessages(conversationId);
                console.log("[useChatActions] Messages loaded from API:", data);
                setMessages(data || []);
            } catch (error) {
                console.error("[useChatActions] Error loading messages:", error);
                setMessages([]);
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [setMessages, setIsLoadingMessages]
    );

    // Subscribe to specific conversation topic
    const subscribeToConversation = useCallback((conversationId) => {
        if (!conversationId) return;

        console.log("[useChatActions] Subscribing to topic:", `/topic/conversation/${conversationId}`);
        WebSocketService.subscribe(
            `/topic/conversation/${conversationId}`,
            (messageResponse) => {
                console.log("[useChatActions] Received from topic:", messageResponse);
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
            }
        );
    }, [setMessages, setConversations]);

    // Select a conversation
    const selectConversation = useCallback(
        (conversation) => {
            console.log("[useChatActions] selectConversation called:", conversation);
            console.log("[useChatActions] conversation.id:", conversation?.id);
            setCurrentConversation(conversation);
            if (conversation && conversation.id) {
                loadMessages(conversation.id);
                subscribeToConversation(conversation.id);
            } else {
                console.log("[useChatActions] No conversation.id, clearing messages");
                setMessages([]);
            }
        },
        [loadMessages, subscribeToConversation, setCurrentConversation, setMessages]
    );

    // Start a new conversation with a user
    const startNewConversation = useCallback(
        (user) => {
            const existing = conversations.find((c) =>
                c.participants.some((p) => p.id === user.id)
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
                    avatarUrl: user.avatarUrl,
                    isGroup: false,
                    isOnline: false,
                    lastMessage: "",
                    lastMessageAt: new Date().toISOString(),
                };
                setCurrentConversation(tempConv);
                setMessages([]);
            }
        },
        [conversations, selectConversation, setCurrentConversation, setMessages]
    );

    // Send a message
    const sendMessage = useCallback(
        (content) => {
            if (!currentConversation || !content.trim()) return;

            const messagePayload = {
                content: content.trim(),
            };

            if (currentConversation.id) {
                messagePayload.conversationId = currentConversation.id;
            } else if (currentConversation.recipientId) {
                messagePayload.recipientId = currentConversation.recipientId;
            } else {
                console.error("[useChatActions] No valid destination for message");
                return;
            }

            WebSocketService.send("/app/chat.send", messagePayload);
        },
        [currentConversation]
    );

    // Listen to user queue (Call this once from Initializer)
    const listenToMessages = useCallback(() => {
        if (!currentUser) return;

        // Connect if not connected
        if (!WebSocketService.stompClient || !WebSocketService.stompClient.connected) {
            WebSocketService.connect(() => {
                // Subscribe after connect
                subscribeToUserQueue();
            });
        } else {
            subscribeToUserQueue();
        }

        function subscribeToUserQueue() {
            WebSocketService.subscribe(`/user/queue/messages`, (message) => {
                const latestConversation = currentConversationRef.current;

                // Always add message to current view
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
                                    unreadCount:
                                        latestConversation?.id !== message.conversationId
                                            ? (conv.unreadCount || 0) + 1
                                            : 0,
                                }
                                : conv
                        );
                    } else {
                        loadConversations();
                        return prev;
                    }
                });
            });
        }

        return () => WebSocketService.disconnect();
    }, [currentUser, setMessages, setCurrentConversation, setConversations, subscribeToConversation, loadConversations]);

    return {
        loadConversations,
        loadMessages,
        selectConversation,
        startNewConversation,
        sendMessage,
        listenToMessages // Expose this for the Initializer
    };
}
