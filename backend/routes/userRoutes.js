import express from 'express';
import { updateProfile, uploadProfileImage } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { blockUser, reportUser, unblockUser } from '../controllers/userController.js';

const router = express.Router();

// Multer setup for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/profiles');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// User profile management routes
router.put('/update-profile', protect, updateProfile);
router.post('/upload-profile-image', protect, upload.single('profileImage'), uploadProfileImage);

router.post('/block', protect, blockUser);
router.post('/unblock', protect, unblockUser);
router.post('/report', protect, reportUser);

export default router;
