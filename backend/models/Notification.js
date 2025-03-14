import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Receiver
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who triggered the notification
        type: { type: String, enum: ['message', 'friend_request'], required: true }, // Notification type
        message: { type: String, required: true }, // Notification content
        isRead: { type: Boolean, default: false }, // Read status
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
