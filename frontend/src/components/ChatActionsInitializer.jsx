import { useEffect, useRef } from "react";
import { useChatActions } from "../hooks/useChatActions";

/**
 * This component initializes chat actions (WebSocket, subscriptions, etc.)
 * It must be rendered inside ChatProvider to access and update context state
 */
export function ChatActionsInitializer({ children }) {
    const { listenToMessages } = useChatActions();
    const hasInitialized = useRef(false);

    // Call listenToMessages ONCE on mount only
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const cleanup = listenToMessages();
        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return children;
}
