import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    media: { type: String }, // Optional media attachment
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    reactions: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: { type: String }, 
        }
    ],
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For soft delete
}, { timestamps: true });

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;
