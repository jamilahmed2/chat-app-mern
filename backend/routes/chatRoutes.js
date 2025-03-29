import express from 'express';
import { sendMessage, getMessages, deleteMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Chat routes
router.get('/:userId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);

export default router;
