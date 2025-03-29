import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

export const getAllNotifications = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const notifications = await Notification.find({ user: req.user.id })
            .populate('sender', 'name profileImage')
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Important: Use findOneAndDelete to ensure we're only deleting user's own notifications
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully', id: req.params.id });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteAllNotifications = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Add proper error handling around the database operation
        try {
            const result = await Notification.deleteMany({ user: req.user.id });

            res.json({
                message: 'All notifications deleted successfully',
                deletedCount: result.deletedCount
            });
        } catch (dbError) {
            console.error('Database error when deleting notifications:', dbError);
            res.status(500).json({ message: 'Database error when deleting notifications' });
        }
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ message: error.message || 'Server error when deleting notifications' });
    }
};