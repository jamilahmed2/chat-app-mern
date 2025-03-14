import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get all notifications for a user
// router.get('/', protect, async (req, res) => {
//     try {
//         const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
//         res.json(notifications);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });
export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Mark notification as read
// router.put('/:id/read', protect, async (req, res) => {
//     try {
//         const notification = await Notification.findById(req.params.id);
//         if (!notification) return res.status(404).json({ message: 'Notification not found' });

//         notification.isRead = true;
//         await notification.save();
//         res.json({ message: 'Notification marked as read' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete a notification
// router.delete('/:id', protect, async (req, res) => {
//     try {
//         await Notification.findByIdAndDelete(req.params.id);
//         res.json({ message: 'Notification deleted' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

export const deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export default router;
