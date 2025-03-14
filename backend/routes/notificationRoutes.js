import express from "express";
import {getAllNotifications,markNotificationAsRead,deleteNotification} from '../controllers/notificationController.js'
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// notification routes
router.post('/', protect, getAllNotifications);
router.get('/:id/read', protect, markNotificationAsRead);
router.delete('/:id', protect, deleteNotification);

export default router