import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

const initializeSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // Store connected users
    const onlineUsers = new Map();

    // Socket authentication middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id);
            if (!user || user.isBanned) {
                return next(new Error('Authentication error: User is banned'));
            }

            socket.userId = user.id;
            next();
        } catch (error) {
            return next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`🔥 User connected: ${socket.userId}`);

        // Store user in online users map
        onlineUsers.set(socket.userId, socket.id);

        // Notify others that user is online
        io.emit('updateUserStatus', { userId: socket.userId, status: 'online' });

        // Event handlers
        registerFriendRequestHandlers(socket, io, onlineUsers);
        registerMessageHandlers(socket, io, onlineUsers);
        registerTypingHandlers(socket, io, onlineUsers);
        registerReactionHandlers(socket, io);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
            onlineUsers.delete(socket.userId);
            io.emit('updateUserStatus', { userId: socket.userId, status: 'offline' });
        });
    });

    return io;
};

// Friend request handlers
const registerFriendRequestHandlers = (socket, io, onlineUsers) => {
    socket.on('sendFriendRequest', async (data) => {
        const { recipientId } = data;

        if (onlineUsers.has(recipientId)) {
            io.to(onlineUsers.get(recipientId)).emit('friendRequestReceived', {
                senderId: socket.userId
            });
        }
    });

    socket.on('acceptFriendRequest', async (data) => {
        const { requesterId } = data;

        if (onlineUsers.has(requesterId)) {
            io.to(onlineUsers.get(requesterId)).emit('friendRequestAccepted', {
                accepterId: socket.userId
            });
        }
    });
};

// Message handlers
const registerMessageHandlers = (socket, io, onlineUsers) => {

    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, message, media, type } = data;

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        // Check if either user has blocked the other
        if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
            return;
        }

        // Create message data
        const messageData = {
            sender: senderId,
            receiver: receiverId,
            type
        };

        // Add message if it exists
        if (message) {
            messageData.message = message;
        }

        // Add media if it exists
        if (media) {
            messageData.media = media;
        }

        // Ensure at least message or media exists
        if (!message && !media) {
            return;
        }

        // Save message to database
        const newMessage = new Chat(messageData);
        await newMessage.save();

        // Send message to sender (for immediate UI update)
        if (onlineUsers.has(senderId)) {
            io.to(onlineUsers.get(senderId)).emit('receiveMessage', newMessage);
        }

        // Send message to recipient if online
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('receiveMessage', newMessage);
        }
    });
    socket.on('newMessageNotification', async (data) => {
        const { receiverId } = data;

        // Only notify the recipient that a new message was sent
        // They will fetch the actual message content from the API
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('newMessageNotification', {
                senderId: socket.userId
            });
        }
    });

    socket.on('messagesRead', async ({ senderId, receiverId, messageIds }) => {
        // console.log('SOCKET: messagesRead event received:', { senderId, receiverId, messageIds });

        try {
            // If no messageIds provided, find all unread messages
            if (!messageIds || messageIds.length === 0) {
                const messages = await Chat.find({
                    sender: senderId,
                    receiver: receiverId,
                    status: { $ne: 'read' }
                });
                messageIds = messages.map(msg => msg._id);
                // console.log(`Found ${messageIds.length} messages to mark as read`);
            }

            // Update message status in database
            if (messageIds.length > 0) {
                const updateResult = await Chat.updateMany(
                    { _id: { $in: messageIds } },
                    { status: 'read' }
                );
                // console.log('Database update result:', updateResult);
            }

            // Notify the sender that their messages were read
            if (onlineUsers.has(senderId) && messageIds.length > 0) {
                // console.log(`Emitting messagesReadNotification to ${senderId}`);
                io.to(onlineUsers.get(senderId)).emit('messagesReadNotification', {
                    receiverId,
                    messageIds
                });
            }
        } catch (err) {
            console.error('Error in messagesRead socket handler:', err);
        }
    });

    socket.on('messageDelivered', async ({ senderId, receiverId }) => {
        try {
            // Update sent messages to delivered
            await Chat.updateMany(
                {
                    sender: senderId,
                    receiver: receiverId,
                    status: 'sent'
                },
                { status: 'delivered' }
            );

            // Notify sender that messages were delivered
            if (onlineUsers.has(senderId)) {
                io.to(onlineUsers.get(senderId)).emit('messagesDeliveredNotification', {
                    receiverId
                });
            }
        } catch (err) {
            console.error('Error marking messages as delivered:', err);
        }
    });

    socket.on('deleteMessage', async (data) => {
        const { messageId, receiverId } = data;

        // Find the message to confirm it's deleted
        const message = await Chat.findById(messageId);
        if (!message) {
            // If message is already deleted, notify receiver
            if (onlineUsers.has(receiverId)) {
                io.to(onlineUsers.get(receiverId)).emit('messageDeleted', { messageId });
            }
            return;
        }

        // Notify the recipient of the deletion
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('messageDeleted', { messageId });
        }
    });
};

// Typing handlers
const registerTypingHandlers = (socket, io, onlineUsers) => {
    socket.on('typing', (data) => {
        const { receiverId } = data;
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('userTyping', { senderId: socket.userId });
        }
    });

    socket.on('stopTyping', (data) => {
        const { receiverId } = data;
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('userStoppedTyping', { senderId: socket.userId });
        }
    });
};

// Reaction handlers
const registerReactionHandlers = (socket, io) => {
    socket.on('addReaction', async (data) => {
        const { messageId, emoji, senderId } = data;

        const message = await Chat.findById(messageId);
        if (message) {
            const existingReaction = message.reactions.find(r => r.userId.toString() === senderId);
            if (existingReaction) {
                existingReaction.emoji = emoji;
            } else {
                message.reactions.push({ userId: senderId, emoji });
            }
            await message.save();

            io.emit('reactionUpdated', { messageId, reactions: message.reactions });
        }
    });
};

export default initializeSocketIO;