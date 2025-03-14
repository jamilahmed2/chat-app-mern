import express from 'express';
import { getAllUsers, deleteUser, updateAdminEmail, updateAdminPassword, getReportedUsers, clearReports, banUser, unbanUser } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/users', protect, adminOnly, getAllUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.put('/update-email', protect, adminOnly, updateAdminEmail);
router.put('/update-password', protect, adminOnly, updateAdminPassword);

router.get('/reported-users', protect, adminOnly, getReportedUsers);
router.put('/clear-reports/:userId', protect, adminOnly, clearReports);
router.put('/ban/:userId', protect, adminOnly, banUser);
router.put('/unban/:userId', protect, adminOnly, unbanUser);
router.delete('/delete-user/:userId', protect, adminOnly, deleteUser);

export default router;
