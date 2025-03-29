import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem("token")
  },
  transports: ['websocket', 'polling'], // Add this line
  withCredentials: true, // Add this line
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;