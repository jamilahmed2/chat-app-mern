import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { addReaction } from '../controllers/chatController.js';

const router = express.Router();

router.post('/reaction', protect, addReaction);

export default router;
