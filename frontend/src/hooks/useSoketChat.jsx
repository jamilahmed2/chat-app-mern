import { useState, useEffect, useRef } from 'react';
import socket from '../utils/socket';
import { getMessagesAction, getUnreadCountsAction, markAsDeliveredAction, markMessageAsReadAction, updateMessageStatus } from '../reducers/chatSlice';

const useSocketChat = ({ user, activeChat, messages, dispatch }) => {
    const [typing, setTyping] = useState(false);
    const [notification, setNotification] = useState(null);
    const [unreadMessages, setUnreadMessages] = useState({});

    // Connect socket if not already connected
    useEffect(() => {
        if (!socket.connected) {
            const userObj = JSON.parse(localStorage.getItem("user"));
            if (userObj && userObj.token) {
                socket.auth = { token: userObj.token };
                socket.connect();
            } else {
                console.error("No authentication token found for socket connection");
            }
        }

        // Clean up on unmount
        return () => {
            // No need to disconnect on unmount as we want to maintain connection
            // But we do need to remove all listeners
            removeAllListeners();
        };
    }, []);

    // Set up all socket event listeners
    useEffect(() => {
        // Message reception handler
        socket.on("receiveMessage", (message) => {
            if (message.sender === activeChat?._id || message.receiver === activeChat?._id) {
                dispatch({ type: "chat/addMessage", payload: message });
                if (message.sender === activeChat?._id && message.receiver === user?._id) {
                    dispatch(markMessageAsReadAction(activeChat._id))
                        .then((action) => {
                            if (!action.error && action.payload.messageIds) {
                                // Notify the sender that their message was read
                                emitMessagesRead({
                                    senderId: activeChat._id,
                                    receiverId: user._id,
                                    messageIds: action.payload.messageIds
                                });
                            }
                        });
                }

            } else {
                // Update local unread messages
                setUnreadMessages(prev => ({
                    ...prev,
                    [message.sender]: (prev[message.sender] || 0) + 1
                }));

                // IMPORTANT: Directly update Redux unread counts 
                dispatch({
                    type: "chat/updateUnreadCount",
                    payload: {
                        userId: message.sender,
                        increment: true
                    }
                });

                // IMPORTANT: Also fetch from server for consistency
                dispatch(getUnreadCountsAction());

                showNotification({
                    senderId: message.sender,
                    message: message.message || "New media message",
                });
            }
        });

        // Media message notification handler
        socket.on("newMessageNotification", ({ senderId, messageId }) => {
            if (senderId === activeChat?._id) {
                dispatch(getMessagesAction(activeChat._id));
            } else {
                setUnreadMessages(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));

                showNotification({
                    senderId: senderId,
                    message: "Sent a media message",
                });
            }
        });

        // Message delivery notification 
        socket.on("messagesDeliveredNotification", ({ receiverId }) => {
            if (activeChat?._id === receiverId) {
                const pendingMessages = messages.filter(m =>
                    m.sender === user._id && m.status === 'sent'
                );
                const messageIds = pendingMessages.map(m => m._id);

                if (messageIds.length > 0) {
                    dispatch(updateMessageStatus({ messageIds, status: 'delivered' }));
                }
            }
        });

        // Message read notification
        socket.on("messagesReadNotification", ({ receiverId, messageIds }) => {
            if (activeChat?._id === receiverId) {
                dispatch(updateMessageStatus({ messageIds, status: 'read' }));
            }
        });

        // Unread counts update
        socket.on('unreadCountsUpdate', (unreadCounts) => {
            dispatch({ type: "chat/setUnreadCounts", payload: unreadCounts });
        });

        // Message deletion
        socket.on("messageDeleted", ({ messageId }) => {
            dispatch({ type: "chat/removeMessage", payload: messageId });
        });

        // Typing indicators
        socket.on("userTyping", ({ senderId }) => {
            if (senderId === activeChat?._id) setTyping(true);
        });

        socket.on("userStoppedTyping", ({ senderId }) => {
            if (senderId === activeChat?._id) setTyping(false);
        });

        socket.on("reactionUpdated", ({ messageId, reactions }) => {
            dispatch({
                type: "chat/setMessageReactions",
                payload: { messageId, reactions }
            });
        });

        // Clean up listeners when dependencies change
        return () => removeAllListeners();
    }, [activeChat, messages, dispatch, user]);

    // Helper to remove all listeners
    const removeAllListeners = () => {
        socket.off("receiveMessage");
        socket.off("newMessageNotification");
        socket.off("messageDeleted");
        socket.off("userTyping");
        socket.off("userStoppedTyping");
        socket.off("messagesDeliveredNotification");
        socket.off("messagesReadNotification");
        socket.off('unreadCountsUpdate');
        socket.off('reactionUpdated');
    };

    // Helper to show notifications
    const showNotification = (notificationData) => {
        setNotification({
            ...notificationData,
            timestamp: new Date()
        });
        setTimeout(() => setNotification(null), 5000);
    };

    // Socket emit functions
    const emitSendMessage = (messageData) => {
        socket.emit("sendMessage", messageData);
    };

    const emitReceiveMessage = (messageData) => {
        socket.emit("receiveMessage", messageData);
    };

    const emitNewMessageNotification = (data) => {
        socket.emit("newMessageNotification", data);
    };

    const emitMessagesRead = (data) => {
        socket.emit("messagesRead", data);
    };

    const emitDeleteMessage = (data) => {
        socket.emit("deleteMessage", data);
    };

    const emitTyping = (receiverId) => {
        socket.emit("typing", { receiverId });
        setTimeout(() => {
            socket.emit("stopTyping", { receiverId });
        }, 1000);
    };
    const emitAddReaction = (messageId, emoji) => {
        socket.emit("addReaction", {
            messageId,
            emoji,
            senderId: user._id
        });
    };

    const emitRemoveReaction = (messageId) => {
        socket.emit("removeReaction", {
            messageId,
            senderId: user._id
        });
    };

    return {
        typing,
        notification,
        unreadMessages,
        setUnreadMessages,
        emitSendMessage,
        emitReceiveMessage,
        emitNewMessageNotification,
        emitMessagesRead,
        emitDeleteMessage,
        emitTyping,
        showNotification,
        emitAddReaction,
        emitRemoveReaction
    };
};

export default useSocketChat;