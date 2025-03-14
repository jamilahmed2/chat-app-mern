import express from 'express';
import connectDB from './db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js'
import friendRoutes from './routes/friendRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);

// Connect to MongoDB
connectDB();

// Store connected users
const onlineUsers = new Map();

// Authenticate socket connections
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        
        const user = await User.findById(decoded.id);

        if (!user || user.isBanned) {
            return next(new Error('Authentication error: You are banned'));
        }

        socket.userId = user.id;

        next();
    } catch (error) {
        return next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log(`🔥 User connected: ${socket.userId}`);

    // Store user in online users map
    onlineUsers.set(socket.userId, socket.id);

    // Real-time Friend Request Notification
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
    // Notify others that user is online
    io.emit('updateUserStatus', { userId: socket.userId, status: 'online' });

    // Handle incoming messages & store notifications
    // socket.on('sendMessage', async (data) => {
    //     const { senderId, receiverId, message, type } = data;

    //     // Save message in DB
    //     const newMessage = new Chat({ sender: senderId, receiver: receiverId, message, type });
    //     await newMessage.save();

    //     // Save notification in DB
    //     const notification = new Notification({
    //         user: receiverId,
    //         sender: senderId,
    //         type: 'message',
    //         message: 'New message received',
    //     });
    //     await notification.save();

    //     // Emit message & notification if receiver is online
    //     if (onlineUsers.has(receiverId)) {
    //         io.to(onlineUsers.get(receiverId)).emit('receiveMessage', newMessage);
    //         io.to(onlineUsers.get(receiverId)).emit('newNotification', notification);
    //     }
    // });
    socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, message, type } = data;
    
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
    
        if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
            return;
        }
    
        const newMessage = new Chat({ sender: senderId, receiver: receiverId, message, type });
        await newMessage.save();
    
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('receiveMessage', newMessage);
        }
    });
    

    // Handle typing indicators
    socket.on('typing', ({ receiverId }) => {
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('userTyping', { senderId: socket.userId });
        }
    });
    // reaction
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

    socket.on('stopTyping', ({ receiverId }) => {
        if (onlineUsers.has(receiverId)) {
            io.to(onlineUsers.get(receiverId)).emit('userStoppedTyping', { senderId: socket.userId });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.userId}`);
        onlineUsers.delete(socket.userId);
        io.emit('updateUserStatus', { userId: socket.userId, status: 'offline' });
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
