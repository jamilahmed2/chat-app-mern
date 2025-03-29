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
    socket.on('sendFriendRequest', async ({ senderId, recipientId }) => {
        const notification = new Notification({
            user: recipientId,
            sender: senderId,
            type: 'friend_request',
            message: 'You have a new friend request',
        });
        await notification.save();

        if (onlineUsers.has(recipientId)) {
            io.to(onlineUsers.get(recipientId)).emit('newNotification', notification);
        }
    });
};

// Message handlers
const registerMessageHandlers = (socket, io, onlineUsers) => {
    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, message, type } = data;
    
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
    
        // Check if either user has blocked the other
        if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
            return;
        }
    
        // Save message to database
        const newMessage = new Chat({ sender: senderId, receiver: receiverId, message, type });
        await newMessage.save();
    
        // Send message to recipient if online
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('receiveMessage', newMessage);
        }
    });
};

// Typing indicator handlers
const registerTypingHandlers = (socket, io, onlineUsers) => {
    socket.on('typing', ({ receiverId }) => {
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('userTyping', { senderId: socket.userId });
        }
    });

    socket.on('stopTyping', ({ receiverId }) => {
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