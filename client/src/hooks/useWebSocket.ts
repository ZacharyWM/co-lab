import { useEffect, useRef, useCallback } from "react";
import { SignalingService } from "../services/signaling";
import { useAppContext } from "./useAppContext";
import { WebSocketMessage, User } from "../types";

// Simple pub/sub for external listeners (e.g., WebRTC)
type Listener = (message: WebSocketMessage) => void;
const listeners = new Map<string, Set<Listener>>();

function notify(type: string, message: WebSocketMessage) {
  const set = listeners.get(type);
  if (!set) return;
  for (const cb of set) {
    try {
      cb(message);
    } catch (e) {
      console.error("Listener error", e);
    }
  }
}

export function useWebSocket() {
  const signalingService = useRef<SignalingService | null>(null);
  const {
    currentUser,
    setCurrentUser,
    addUser,
    removeUser,
    updateUser,
    setConnectionStatus,
    clearUsers,
  } = useAppContext();

  // Store the latest values in refs to avoid stale closures
  const handleMessageRef = useRef<(message: WebSocketMessage) => void>();
  const setConnectionStatusRef = useRef(setConnectionStatus);
  const clearUsersRef = useRef(clearUsers);

  // Update refs when values change
  setConnectionStatusRef.current = setConnectionStatus;
  clearUsersRef.current = clearUsers;

  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case "connection":
          if (currentUser && message.data.userId) {
            setCurrentUser({
              ...currentUser,
              id: message.data.userId,
            });
          }
          break;

        case "joined":
          setConnectionStatus(true);
          if (message.data.users) {
            clearUsers();
            message.data.users.forEach((user: User) => {
              if (user.id !== currentUser?.id) {
                addUser(user);
              }
            });
          }
          // Notify listeners (e.g., WebRTC) so they can reconcile peers
          notify("joined", message);
          break;

        case "user-joined":
          if (message.data && message.data.id !== currentUser?.id) {
            addUser(message.data);
          }
          break;

        case "user-left":
          if (message.data.userId) {
            removeUser(message.data.userId);
          }
          notify("user-left", message);
          break;

        case "position-update":
          if (message.data.userId && message.data.userId !== currentUser?.id) {
            updateUser(message.data.userId, {
              x: message.data.x,
              y: message.data.y,
            });
          }
          break;

        case "zone-enter":
        case "zone-exit":
          if (message.data.userId && message.data.userId !== currentUser?.id) {
            updateUser(message.data.userId, {
              zone:
                message.type === "zone-enter"
                  ? message.data.zoneName
                  : undefined,
            });
          }
          notify(message.type, message);
          break;

        case "error":
          console.error("Server error:", message.data.message);
          setConnectionStatus(false, message.data.message);
          break;

        default:
          // pass through to external listeners (e.g., offer/answer/ice)
          notify(message.type, message);
          // still log for visibility
          console.log("Unhandled message type:", message.type);
      }
    },
    [
      currentUser,
      setCurrentUser,
      addUser,
      removeUser,
      updateUser,
      setConnectionStatus,
      clearUsers,
    ]
  );

  // Update the ref with the latest handleMessage
  handleMessageRef.current = handleMessage;

  // Bridge local movement events to server position updates
  useEffect(() => {
    const handler = (e: Event) => {
      const { x, y } =
        (e as CustomEvent<{ x: number; y: number }>).detail || {};
      if (typeof x === "number" && typeof y === "number") {
        signalingService.current?.sendPosition(x, y);
      }
    };
    window.addEventListener("local:position", handler as EventListener);
    return () =>
      window.removeEventListener("local:position", handler as EventListener);
  }, []);

  const connect = useCallback(async () => {
    if (signalingService.current?.isConnected()) {
      console.log("Already connected, skipping connection attempt");
      return;
    }

    if (!signalingService.current) {
      signalingService.current = new SignalingService();
      if (handleMessageRef.current) {
        signalingService.current.addMessageHandler(handleMessageRef.current);
      }
    }

    try {
      console.log("Initiating WebSocket connection...");
      await signalingService.current.connect();
      setConnectionStatusRef.current(true);
    } catch (error) {
      console.error("Failed to connect to server:", error);
      setConnectionStatusRef.current(false, "Failed to connect to server");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (signalingService.current) {
      signalingService.current.disconnect();
      signalingService.current = null;
      setConnectionStatusRef.current(false);
      clearUsersRef.current();
    }
  }, []);

  const send = useCallback((type: string, data: any) => {
    if (signalingService.current) {
      signalingService.current.send({ type, data });
    }
  }, []);

  const on = useCallback((type: string, cb: Listener) => {
    let set = listeners.get(type);
    if (!set) {
      set = new Set();
      listeners.set(type, set);
    }
    set.add(cb);
  }, []);

  const off = useCallback((type: string, cb: Listener) => {
    const set = listeners.get(type);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) listeners.delete(type);
  }, []);

  const joinRoom = useCallback((name: string) => {
    if (signalingService.current) {
      signalingService.current.joinRoom(name);
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (signalingService.current) {
      signalingService.current.leaveRoom();
    }
  }, []);

  const sendPosition = useCallback((x: number, y: number) => {
    if (signalingService.current) {
      signalingService.current.sendPosition(x, y);
    }
  }, []);

  const sendZoneEnter = useCallback((zoneName: string) => {
    if (signalingService.current) {
      signalingService.current.sendZoneEnter(zoneName);
    }
  }, []);

  const sendZoneExit = useCallback((zoneName: string) => {
    if (signalingService.current) {
      signalingService.current.sendZoneExit(zoneName);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendPosition,
    sendZoneEnter,
    sendZoneExit,
    send,
    on,
    off,
    isConnected: signalingService.current?.isConnected() || false,
    signalingService: signalingService.current,
  };
}
