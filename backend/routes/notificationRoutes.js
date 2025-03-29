import express from "express";
import {getAllNotifications,markNotificationAsRead,deleteNotification, deleteAllNotifications} from '../controllers/notificationController.js'
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// notification routes
router.get('/', protect, getAllNotifications);
router.delete('/all', protect, deleteAllNotifications);
router.put('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);

export default router