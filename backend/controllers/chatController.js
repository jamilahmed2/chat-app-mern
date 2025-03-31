import Chat from '../models/Chat.js';
import cloudinary from '../utils/cloudinary.js';
import mongoose from 'mongoose';
// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { receiver, message } = req.body;
        const sender = req.user.id;
        let mediaUrl = null;

        // Handle media upload if a file is included
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'chat_media',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' }
                ]
            });

            mediaUrl = result.secure_url;
        }

        // Ensure at least a message or media is sent
        if (!message && !mediaUrl) {
            return res.status(400).json({ message: 'Message or media is required' });
        }

        const newMessage = new Chat({
            sender,
            receiver,
            message: message || '', // Store empty string if no message
            media: mediaUrl || null, // Store null if no media
            status: 'sent',
        });

        await newMessage.save();

        res.status(201).json({
            message: 'Message sent successfully',
            newMessage,
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Messages
export const getMessages = async (req, res) => {
    try {
        const userId = req.params.userId;
        const messages = await Chat.find({
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Message
export const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.messageId;
        const message = await Chat.findById(messageId);

        if (!message) return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        await message.deleteOne();
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Mark messages as delivered when a user opens the chat
export const markMessagesAsDelivered = async (req, res) => {
    try {
        const { senderId } = req.params;
        const receiverId = req.user.id;

        // Update all messages from this sender to 'delivered' status if they're 'sent'
        await Chat.updateMany(
            {
                sender: senderId,
                receiver: receiverId,
                status: 'sent'
            },
            { status: 'delivered' }
        );

        res.status(200).json({ message: 'Messages marked as delivered' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark messages as read when a user views them
export const markMessagesAsRead = async (req, res) => {
    try {
        const { senderId } = req.params;
        const receiverId = req.user.id;
        // console.log(`Marking messages as read: from ${senderId} to ${receiverId}`);
        
        // Find messages that need to be marked as read
        const messages = await Chat.find({ 
            sender: senderId, 
            receiver: receiverId, 
            status: { $ne: 'read' } 
        });
        
        // console.log(`Found ${messages.length} messages to mark as read`);
        
        // Update their status
        const updateResult = await Chat.updateMany(
            { 
                sender: senderId, 
                receiver: receiverId, 
                status: { $ne: 'read' } 
            },
            { status: 'read' }
        );
        
        // console.log(`Update result:`, updateResult);
        
        // Return the message IDs that were marked as read
        const messageIds = messages.map(msg => msg._id);
        
        res.status(200).json({ 
            senderId,
            messageIds 
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get unread message counts
export const getUnreadMessageCounts = async (req, res) => {
    try {
        const userId = req.user.id; // Receiver's ID
        // console.log("Fetching unread messages for user:", userId);

        // Aggregate unread message count per sender
        const unreadCounts = await Chat.aggregate([
            {
                $match: {
                    receiver: new mongoose.Types.ObjectId(userId),
                    status: { $in: ["sent", "delivered"] }, // Messages not read
                },
            },
            {
                $group: {
                    _id: "$sender",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Convert array result into a key-value object
        const result = unreadCounts.reduce((acc, item) => {
            acc[item._id.toString()] = item.count;
            return acc;
        }, {});

        // console.log("Unread message count result:", result);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching unread messages:", error);
        res.status(500).json({ message: error.message });
    }
};

// Add reaction to message
export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user.id;

        const message = await Chat.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Check if user has already reacted
        const existingReaction = message.reactions.findIndex(
            reaction => reaction.userId.toString() === userId
        );

        if (existingReaction !== -1) {
            // Update existing reaction
            message.reactions[existingReaction].emoji = emoji;
        } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        res.status(200).json({ message: 'Reaction added successfully', updatedMessage: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove reaction from message
export const removeReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Chat.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Filter out the user's reaction
        message.reactions = message.reactions.filter(
            reaction => reaction.userId.toString() !== userId
        );

        await message.save();

        res.status(200).json({ message: 'Reaction removed successfully', updatedMessage: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};