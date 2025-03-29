import express from "express";
import { registerUser, logoutUser,loginUser, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logoutUser);
export default router