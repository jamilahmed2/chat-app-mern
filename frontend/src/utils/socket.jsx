import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_APP_SOCKET_URL;

// Create a function to get the token that will be used when connecting
const getAuthToken = () => {
  try {
    const user = localStorage.getItem("user");
    if (!user) return null;
    
    const userData = JSON.parse(user);
    return userData?.token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Create socket instance with proper configuration
const socket = io(SOCKET_URL, {
  autoConnect: false, // We'll connect manually when needed
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000, // Increase timeout to 20 seconds
  transports: ['websocket', 'polling'],
  withCredentials: true
});

// Add error event handlers
socket.on("connect_error", (err) => {
  // console.log(`Socket connection error: ${err.message}`);
  // Try to get a new token on connection error
  const token = getAuthToken();
  if (token) {
    socket.auth = { token };
    // Don't automatically reconnect - let the component handle this
  }
});

socket.on("connect", () => {
  // console.log("Socket connected successfully");
});

socket.on("connect_timeout", () => {
  // console.log("Socket connection timeout");
});

socket.on("reconnect", (attempt) => {
  // console.log(`Socket reconnected after ${attempt} attempts`);
  // Update auth token on reconnection
  const token = getAuthToken();
  if (token) {
    socket.auth = { token };
  }
});

socket.on("disconnect", (reason) => {
  // console.log(`Socket disconnected: ${reason}`);
  if (reason === "io server disconnect") {
    // The server has forcefully disconnected the socket
    // Attempting to reconnect may not be appropriate here
    // console.log("Server disconnected the socket");
  }
});

// Export the socket instance
export default socket;