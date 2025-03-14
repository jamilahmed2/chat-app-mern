import Chat from '../models/Chat.js';
import User from '../models/User.js';

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { receiver, message, media } = req.body;
        const sender = req.user.id;

        const newMessage = new Chat({ sender, receiver, message, media });
        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully', newMessage });
    } catch (error) {
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