import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthService } from "../services/auth.service";

class WebSocketService {
  client = null;
  subscriptions = {}; // Format: { [topic]: { subscription, callback, isPersistent, cleanup } }
  connectionListeners = [];
  pendingSubscriptions = [];
  isConnecting = false;
  isInitialized = false;
  retryCount = 0;
  maxRetries = 3;
  connectionTimeout = null;

  // Singleton instance
  static instance = null;
  
  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // If already connected or connecting, do nothing
    if (this.client?.connected) {
      console.log("[WebSocketService] Already connected");
      this._processPendingSubscriptions();
      this.notifyConnectionListeners();
      return;
    }

    if (this.isConnecting) {
      console.log("[WebSocketService] Connection in progress...");
      return;
    }

    this.isConnecting = true;
    console.log("[WebSocketService] Starting connection...");

    const token = AuthService.getToken();
    if (!token) {
      console.error("[WebSocketService] No token available");
      this.isConnecting = false;
      
      // Retry after 2 seconds
      this.connectionTimeout = setTimeout(() => {
        this.connect();
      }, 2000);
      return;
    }

    // If client exists but not connected, deactivate first
    if (this.client) {
      console.log("[WebSocketService] Deactivating existing client");
      try {
        this.client.deactivate();
      } catch (error) {
        console.warn("[WebSocketService] Error deactivating client:", error);
      }
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_SOCKET_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[WebSocketService] ✅ Connected successfully!");
        this.isConnecting = false;
        this.isInitialized = true;
        this.retryCount = 0;
        
        // Process pending subscriptions
        this._processPendingSubscriptions();
        
        this.notifyConnectionListeners();
      },
      onDisconnect: () => {
        console.log("[WebSocketService] Disconnected");
        this.isConnecting = false;
        this.isInitialized = false;
      },
      onStompError: (frame) => {
        console.error("[WebSocketService] STOMP error:", frame);
        this.isConnecting = false;
        this._handleConnectionError();
      },
      onWebSocketError: (error) => {
        console.error("[WebSocketService] WebSocket error:", error);
        this.isConnecting = false;
        this._handleConnectionError();
      },
      onWebSocketClose: () => {
        console.log("[WebSocketService] WebSocket closed");
        this.isConnecting = false;
        this.isInitialized = false;
      },
    });

    try {
      this.client.activate();
    } catch (error) {
      console.error("[WebSocketService] Error activating client:", error);
      this.isConnecting = false;
      this._handleConnectionError();
    }
  }

  _handleConnectionError() {
    this.retryCount++;
    if (this.retryCount <= this.maxRetries) {
      console.log(`[WebSocketService] Retrying connection (${this.retryCount}/${this.maxRetries})...`);
      setTimeout(() => {
        this.connect();
      }, 2000 * this.retryCount);
    } else {
      console.error("[WebSocketService] Max retries reached, giving up");
    }
  }

  addConnectionListener(callback) {
    if (!this.connectionListeners.includes(callback)) {
      this.connectionListeners.push(callback);
    }
    
    // If already connected, call immediately
    if (this.isConnected()) {
      setTimeout(() => callback(), 0);
    }
  }

  removeConnectionListener(callback) {
    this.connectionListeners = this.connectionListeners.filter(cb => cb !== callback);
  }

  notifyConnectionListeners() {
    this.connectionListeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("[WebSocketService] Error in connection listener:", error);
      }
    });
  }

  subscribe(topic, callback, isPersistent = true) {
    console.log(`[WebSocketService] Subscribe requested: ${topic}`);
    
    if (!this.client || !this.client.connected) {
      console.log(`[WebSocketService] Not connected, adding to pending: ${topic}`);
      
      // Store subscription for when connection is ready
      this.pendingSubscriptions.push({ topic, callback, isPersistent });
      
      // Auto-connect if not connecting
      if (!this.isConnecting) {
        setTimeout(() => this.connect(), 100);
      }
      
      // Return cleanup function
      return () => {
        // Remove from pending
        this.pendingSubscriptions = this.pendingSubscriptions.filter(
          sub => !(sub.topic === topic && sub.callback === callback)
        );
      };
    }

    return this._subscribeInternal(topic, callback, isPersistent);
  }

  _subscribeInternal(topic, callback, isPersistent = true) {
    // Unsubscribe from existing if any
    if (this.subscriptions[topic]) {
      console.log(`[WebSocketService] Cleaning up existing subscription: ${topic}`);
      try {
        const existing = this.subscriptions[topic];
        // Check if callback is different before cleaning up
        if (existing.callback === callback) {
          // Same callback, don't unsubscribe
          console.log(`[WebSocketService] Same callback for ${topic}, skipping re-subscribe`);
          return () => this._unsubscribeInternal(topic, callback);
        }
        // Different callback, clean up
        if (existing.cleanup && typeof existing.cleanup === 'function') {
          existing.cleanup();
        }
      } catch (error) {
        console.warn(`[WebSocketService] Error cleaning up existing subscription for ${topic}:`, error);
      }
    }

    console.log(`[WebSocketService] Creating new subscription for: ${topic}`);
    
    try {
      const subscription = this.client.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log(`[WebSocketService] Received on ${topic}:`, data);
          callback(data);
        } catch (error) {
          console.error(`[WebSocketService] Error parsing message from ${topic}:`, error);
        }
      });

      // Create cleanup function
      const cleanup = () => {
        this._unsubscribeInternal(topic, callback);
      };

      // Store subscription info
      this.subscriptions[topic] = { subscription, callback, isPersistent, cleanup };
      console.log(`[WebSocketService] ✅ Successfully subscribed to: ${topic}`);
      
      return cleanup;
    } catch (error) {
      console.error(`[WebSocketService] Error subscribing to ${topic}:`, error);
      return () => {}; // Return empty cleanup function
    }
  }

  _unsubscribeInternal(topic, specificCallback = null) {
    if (!this.subscriptions[topic]) return;
    
    const subscriptionInfo = this.subscriptions[topic];
    
    // If specific callback is provided, only unsubscribe if it matches
    if (specificCallback && subscriptionInfo.callback !== specificCallback) {
      return;
    }
    
    console.log(`[WebSocketService] Unsubscribing from: ${topic}`);
    try {
      if (subscriptionInfo.subscription && subscriptionInfo.subscription.unsubscribe) {
        subscriptionInfo.subscription.unsubscribe();
      }
    } catch (error) {
      console.warn(`[WebSocketService] Error unsubscribing from ${topic}:`, error);
    }
    
    delete this.subscriptions[topic];
  }

  _processPendingSubscriptions() {
    console.log(`[WebSocketService] Processing ${this.pendingSubscriptions.length} pending subscriptions`);
    
    const toProcess = [...this.pendingSubscriptions];
    this.pendingSubscriptions = [];
    
    toProcess.forEach(({ topic, callback, isPersistent }) => {
      this._subscribeInternal(topic, callback, isPersistent);
    });
  }

  unsubscribe(topic) {
    console.log(`[WebSocketService] Unsubscribe called for topic: ${topic}`);
    
    // Remove from pending
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      sub => sub.topic !== topic
    );
    
    // Clean up subscription
    this._unsubscribeInternal(topic);
  }

  send(destination, body, retryCount = 0) {
    console.log(`[WebSocketService] Send requested: ${destination}`, body);
    
    if (!this.client || !this.client.connected) {
      console.warn(`[WebSocketService] Cannot send - not connected! Destination: ${destination}`);
      
      // Auto-connect if not connecting
      if (!this.isConnecting) {
        setTimeout(() => this.connect(), 100);
      }
      
      // Retry sending after connection
      if (retryCount < 3) {
        const handleConnected = () => {
          this.send(destination, body, retryCount + 1);
          this.removeConnectionListener(handleConnected);
        };
        
        this.addConnectionListener(handleConnected);
        return false;
      }
      
      console.error(`[WebSocketService] Failed to send after retries: ${destination}`);
      return false;
    }

    console.log(`[WebSocketService] Sending to ${destination}:`, body);
    
    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
      console.log(`[WebSocketService] ✅ Message sent to ${destination}`);
      return true;
    } catch (error) {
      console.error(`[WebSocketService] Error sending to ${destination}:`, error);
      
      // Retry on error
      if (retryCount < 2) {
        setTimeout(() => {
          this.send(destination, body, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
      return false;
    }
  }

  disconnect() {
    console.log("[WebSocketService] Disconnecting...");
    
    // Clear timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Clear all subscriptions
    Object.values(this.subscriptions).forEach(subInfo => {
      try {
        if (subInfo.cleanup && typeof subInfo.cleanup === 'function') {
          subInfo.cleanup();
        }
      } catch (error) {
        console.warn("[WebSocketService] Error cleaning up subscription:", error);
      }
    });
    this.subscriptions = {};
    
    // Clear pending
    this.pendingSubscriptions = [];
    
    // Clear listeners
    this.connectionListeners = [];
    
    // Deactivate client
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        console.warn("[WebSocketService] Error deactivating client:", error);
      }
    }
    
    this.isInitialized = false;
    this.isConnecting = false;
    this.retryCount = 0;
  }

  isConnected() {
    return this.client && this.client.connected;
  }

  waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve();
        return;
      }
      
      const timeoutId = setTimeout(() => {
        this.removeConnectionListener(onConnected);
        reject(new Error("WebSocket connection timeout"));
      }, timeout);
      
      const onConnected = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      this.addConnectionListener(onConnected);
      
      // Try to connect if not connecting
      if (!this.isConnecting) {
        this.connect();
      }
    });
  }
}

export default WebSocketService.getInstance();