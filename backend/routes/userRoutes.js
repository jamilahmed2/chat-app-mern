import express from 'express';
import { getAllUsersHome, getUser, updatePassword, updateUserEmail, updateUserName, uploadUserProfileImage, userEmailResendOTP, verifyEmailOTP } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { blockUser, reportUser, unblockUser } from '../controllers/userController.js';


const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});
router.get('/get-all-users',   getAllUsersHome);
router.get('/get-user/:id', getUser);
router.put('/update-user-name', protect, updateUserName);
router.put("/update-user-email", protect, updateUserEmail);
router.post("/verify-user-email", protect, verifyEmailOTP);
router.post("/resend-user-email-otp", protect, userEmailResendOTP);

router.put("/update-password", protect, updatePassword);
router.post('/upload-user-profile-image', protect, upload.single('profileImage'), uploadUserProfileImage);

router.post('/block', protect, blockUser);
router.post('/unblock', protect, unblockUser);
router.post('/report', protect, reportUser);

export default router;
