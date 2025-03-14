import Chat from '../models/Chat.js';

// Add a reaction to a message
export const addReaction = async (req, res) => {
    try {
        const { messageId, emoji } = req.body;
        const userId = req.user.id;

        const message = await Chat.findById(messageId);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        // Check if the user already reacted
        const existingReaction = message.reactions.find(r => r.userId.toString() === userId);
        if (existingReaction) {
            existingReaction.emoji = emoji;
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        res.status(200).json({ message: 'Reaction added', reactions: message.reactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
