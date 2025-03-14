import express from "express";
import { registerUser, loginUser, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router