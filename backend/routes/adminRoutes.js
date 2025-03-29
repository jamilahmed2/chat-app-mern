import express from 'express';
import { getAllUsers, deleteUser, updateAdminPassword, getReportedUsers, clearReports, banUser, unbanUser, getBannedUsers, updateAdminEmail, updateAdminName, verifyEmailOTP, adminEmailResendOTP, uploadAdminProfileImage } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import multer from 'multer';
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

// Admin routes
router.get('/getAllUsers', protect, adminOnly, getAllUsers);
router.get('/getBannedUsers', protect, adminOnly, getBannedUsers);
router.delete("/deleteUser/:id", protect, adminOnly, deleteUser);

router.post('/upload-admin-profile-image', protect, upload.single('profileImage'), uploadAdminProfileImage);
router.put('/updateAdminPassword', protect, adminOnly, updateAdminPassword);
router.put('/update-name', protect, adminOnly, updateAdminName);
router.put("/update-email", protect, adminOnly, updateAdminEmail);
router.post("/verify-email", protect, adminOnly, verifyEmailOTP);
router.post("/resend-email-otp", protect, adminOnly, adminEmailResendOTP);

router.get('/reported-users', protect, adminOnly, getReportedUsers);
router.put('/clear-reports/:userId', protect, adminOnly, clearReports);
router.put('/ban/:userId', protect, adminOnly, banUser);
router.put('/unban/:userId', protect, adminOnly, unbanUser);

export default router;
