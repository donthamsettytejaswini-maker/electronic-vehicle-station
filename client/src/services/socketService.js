import { io } from "socket.io-client";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace(":5173", ":5000");

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected to server:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[Socket.IO] Connection error:", error.message);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[Socket.IO] Socket cleanly disconnected");
  }
};

export const joinSessionRoom = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit("join:session", sessionId);
    console.log(`[Socket.IO] Joined room session:${sessionId}`);
  }
};

export const leaveSessionRoom = (sessionId) => {
  const s = getSocket();
  if (s && sessionId) {
    s.emit("leave:session", sessionId);
    console.log(`[Socket.IO] Left room session:${sessionId}`);
  }
};

export const joinAdminMonitoring = () => {
  const s = getSocket();
  if (s) {
    s.emit("join:admin");
    console.log(`[Socket.IO] Joined admin monitoring room`);
  }
};

export const leaveAdminMonitoring = () => {
  const s = getSocket();
  if (s) {
    s.emit("leave:admin");
  }
};

export const subscribeToSessionUpdates = (callback) => {
  const s = getSocket();
  if (s && callback) {
    s.on("session:updated", callback);
    s.on("session:started", callback);
    s.on("session:paused", callback);
    s.on("session:resumed", callback);
    s.on("session:completed", callback);
    s.on("session:stopped", callback);
  }
};

export const unsubscribeFromSessionUpdates = (callback) => {
  const s = getSocket();
  if (s && callback) {
    s.off("session:updated", callback);
    s.off("session:started", callback);
    s.off("session:paused", callback);
    s.off("session:resumed", callback);
    s.off("session:completed", callback);
    s.off("session:stopped", callback);
  }
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit("join:user", userId);
    console.log(`[Socket.IO] Joined room user:${userId}`);
  }
};

export const leaveUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit("leave:user", userId);
  }
};

export const onNotification = (callback) => {
  const s = getSocket();
  if (s && callback) {
    s.on("notification:new", callback);
  }
};

export const offNotification = (callback) => {
  const s = getSocket();
  if (s && callback) {
    s.off("notification:new", callback);
  }
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  joinSessionRoom,
  leaveSessionRoom,
  joinUserRoom,
  leaveUserRoom,
  joinAdminMonitoring,
  leaveAdminMonitoring,
  subscribeToSessionUpdates,
  unsubscribeFromSessionUpdates,
  onNotification,
  offNotification,
};

