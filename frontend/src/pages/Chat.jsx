import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import moment from "moment";
import ScrollToBottom from "react-scroll-to-bottom";
import { getMessagesAction, sendMessageAction, deleteMessageAction } from "../reducers/chatSlice";
import { setActiveChat } from "../reducers/chatSlice";
import { getAllUsersHomeAction } from "../reducers/authSlice";

const ChatPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { messages, activeChat } = useSelector((state) => state.chat);
    const { user } = useSelector((state) => state.auth);

    const [users, setUsers] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [typing, setTyping] = useState(false);

    // Fetch users (except current user)
    useEffect(() => {
        if (!user) return;
        
        dispatch(getAllUsersHomeAction())
            .unwrap()
            .then((response) => {
                setUsers(response.users.filter(u => u._id !== user._id));
            })
            .catch((error) => {
                console.error("Failed to fetch users:", error);
            });
    }, [user, dispatch]);

    // Listen for real-time events
    useEffect(() => {
        // Initialize socket connection
        socket.auth = { token: localStorage.getItem("token") };
        socket.connect();

        socket.on("receiveMessage", (message) => {
            if (message.sender === activeChat?._id || message.receiver === activeChat?._id) {
                dispatch({ type: "chat/addMessage", payload: message });
            }
        });

        socket.on("userTyping", ({ senderId }) => {
            if (senderId === activeChat?._id) setTyping(true);
        });

        socket.on("userStoppedTyping", ({ senderId }) => {
            if (senderId === activeChat?._id) setTyping(false);
        });

        return () => {
            socket.off("receiveMessage");
            socket.off("userTyping");
            socket.off("userStoppedTyping");
            socket.disconnect();
        };
    }, [activeChat, dispatch]);

    // Fetch messages when a user is selected
    const loadMessages = async (user) => {
        dispatch(setActiveChat(user));
        dispatch(getMessagesAction(user._id));
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const messageData = {
            receiver: activeChat._id,
            message: newMessage
        };

        // Reset input field
        setNewMessage("");

        // Send message through Redux action
        dispatch(sendMessageAction(messageData));

        // Emit message via socket for real-time delivery
        socket.emit("sendMessage", {
            senderId: user.id,
            receiverId: activeChat._id,
            message: newMessage,
            type: "text"
        });
    };

    // Handle message deletion
    const handleDeleteMessage = (messageId) => {
        dispatch(deleteMessageAction(messageId));
    };

    // Typing indicator
    const handleTyping = () => {
        socket.emit("typing", { receiverId: activeChat?._id });
        setTimeout(() => {
            socket.emit("stopTyping", { receiverId: activeChat?._id });
        }, 1000);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar - User List */}
            <div className="w-1/3 bg-gray-100 p-4 border-r">
                <h2 className="text-xl font-bold mb-4">Chats</h2>
                {users.map((user) => (
                    <div
                        key={user._id}
                        onClick={() => loadMessages(user)}
                        className={`p-2 border-b cursor-pointer ${activeChat?._id === user._id ? 'bg-blue-100' : ''}`}
                    >
                        {user.name} {user.isOnline && "🟢"}
                    </div>
                ))}
            </div>

            {/* Chat Window */}
            <div className="w-2/3 flex flex-col">
                {/* Chat Header */}
                {activeChat && (
                    <div className="bg-gray-200 p-3 text-lg font-bold border-b">
                        {activeChat.name} {activeChat.isOnline && "🟢"}
                    </div>
                )}

                {/* Chat Messages */}
                <ScrollToBottom className="flex-1 p-4 overflow-auto">
                    {messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`p-2 my-1 ${msg.sender === user.id ? "text-right" : "text-left"}`}
                        >
                            <div className="relative group">
                                <div className={`px-3 py-1 rounded-md inline-block ${msg.sender === user.id ? "bg-blue-500 text-white" : "bg-gray-200"
                                    }`}>
                                    {msg.message}
                                </div>
                                {msg.sender === user.id && (
                                    <button
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="opacity-0 group-hover:opacity-100 ml-2 text-red-500"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">{moment(msg.createdAt).fromNow()}</div>
                        </div>
                    ))}
                    {typing && <div className="text-sm text-gray-500">Typing...</div>}
                </ScrollToBottom>

                {/* Chat Input */}
                {activeChat && (
                    <div className="p-3 border-t flex">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyUp={(e) => {
                                handleTyping();
                                if (e.key === "Enter") handleSendMessage();
                            }}
                            className="flex-1 p-2 border rounded"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;