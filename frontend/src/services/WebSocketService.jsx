// WebSocketService.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { AuthService } from "../services/auth.service";

class WebSocketService {
  client = null;
  subscriptions = {};

  connect(onConnect) {
    // Prevent multiple connections
    if (this.client && this.client.connected) {
      console.log("[WebSocketService] Already connected, calling onConnect directly");
      if (onConnect) onConnect();
      return;
    }

    // If client exists but not connected, deactivate first
    if (this.client) {
      console.log("[WebSocketService] Deactivating existing client before reconnect");
      this.client.deactivate();
    }

    console.log("[WebSocketService] Creating new client...");
    this.client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_SOCKET_URL),
      connectHeaders: {
        Authorization: `Bearer ${AuthService.getToken()}`,
      },
      onConnect: () => {
        console.log("[WebSocketService] Connected successfully!");
        if (onConnect) onConnect();
      },
      onDisconnect: () => {
        console.log("[WebSocketService] Disconnected");
      },
      onStompError: (frame) => {
        console.error("[WebSocketService] STOMP error:", frame);
      },
    });

    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.client.connected) {
      console.warn("[WebSocketService] Cannot subscribe - not connected! topic:", topic);
      return null;
    }

    // Unsubscribe from existing if any
    if (this.subscriptions[topic]) {
      console.log("[WebSocketService] Unsubscribing from existing topic:", topic);
      this.subscriptions[topic].unsubscribe();
    }

    console.log("[WebSocketService] Subscribing to:", topic);
    const subscription = this.client.subscribe(topic, (msg) => {
      console.log("[WebSocketService] Received message on:", topic);
      callback(JSON.parse(msg.body));
    });

    this.subscriptions[topic] = subscription;
    console.log("[WebSocketService] Successfully subscribed to:", topic);
    return subscription;
  }

  unsubscribe(topic) {
    if (this.subscriptions[topic]) {
      console.log("[WebSocketService] Unsubscribing from:", topic);
      this.subscriptions[topic].unsubscribe();
      delete this.subscriptions[topic];
    }
  }
  send(destination, body) {
    console.log("[WebSocketService] send() called, destination:", destination);
    console.log("[WebSocketService] client connected?", this.client?.connected);

    if (!this.client || !this.client.connected) {
      console.error("[WebSocketService] Cannot send - client not connected!");
      return;
    }

    console.log("[WebSocketService] Publishing message:", body);
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
    console.log("[WebSocketService] Message published!");
  }

  disconnect() {
    if (this.client) this.client.deactivate();
  }
}

export default new WebSocketService();
