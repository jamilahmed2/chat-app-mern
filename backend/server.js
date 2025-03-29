import express from 'express';
import http from 'http';
import connectDB from './db.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import friendRoutes from './routes/friendRoutes.js';

// Import socket handler
import initializeSocketIO from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create HTTP server
const server = http.createServer(app);

// Set up middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
initializeSocketIO(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
