import { io } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
});

export default socket;
