import express from 'express';
import { sendMessage, getMessages, deleteMessage, markMessagesAsDelivered, markMessagesAsRead, getUnreadMessageCounts, addReaction, removeReaction } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const allowedMimeTypes = ['image/', 'video/'];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.some(type => file.mimetype.startsWith(type))) {
            return cb(new Error('Only image and video files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Chat routes
router.post('/send', protect, (req, res, next) => {
    upload.single('media')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, sendMessage);

router.get('/unread-counts', protect, getUnreadMessageCounts);
router.put('/delivered/:senderId', protect, markMessagesAsDelivered);
router.put('/read/:senderId', protect, markMessagesAsRead);

router.get('/:userId', protect, getMessages);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/reactions', protect, addReaction);
router.delete('/:messageId/reactions', protect, removeReaction);

export default router;
