import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['friend_request', 'friend_accepted', 'message'], // Add 'friend_accepted'
        required: true 
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
