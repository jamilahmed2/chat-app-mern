import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequests,
    getFriends,
    removeFriend
} from '../controllers/friendController.js';

const router = express.Router();

router.post('/send', protect, sendFriendRequest);
router.post('/accept', protect, acceptFriendRequest);
router.post('/decline', protect, declineFriendRequest);
router.get('/requests', protect, getFriendRequests);
router.get('/list', protect, getFriends);
router.post('/remove', protect, removeFriend);

export default router;
