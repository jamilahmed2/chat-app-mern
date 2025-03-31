// backend/controllers/authController.js

import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateOTP,transporter } from '../utils/emailUtils.js';
import dotenv from 'dotenv';

dotenv.config();


// Register User
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        user = new User({ name, email, password: hashedPassword, otp, isVerified: false });
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        // Send OTP via email
        await transporter.sendMail({
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP is ${otp}, It will be expired in 10 minutes`,
        });

        res.status(201).json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // ✅ Update `isVerified` and remove OTP
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        user.status= 'online'
        await user.save();

        // ✅ Generate a JWT token (so user gets logged in automatically after verification)
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

        // ✅ Fetch updated user object without password
        const updatedUser = await User.findOne({ email }).select("-password");

        return res.json({
            message: "Email verified successfully",
            user: updatedUser,
            token, // Send token so user can log in directly
        });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP & save to DB with an expiration time
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        // Send OTP email
        await transporter.sendMail({
            to: email,
            subject: "Your OTP Code",
            text: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
        });

        res.status(200).json({ message: "New OTP sent to email" });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been banned' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

        // If user is not verified, send OTP and return a flag
        if (!user.isVerified) {
            return res.status(200).json({
                email: user.email,
                isVerified: false,
                message: "Email not verified. Verify Now"
            });
        }

        user.status = 'online';
        await user.save();

        // Normal login response if verified
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isVerified: user.isVerified,
            status: user.status,
            isBanned: user.isBanned,
            blockedUsers: user.blockedUsers,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password (OTP-based)
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        await transporter.sendMail({
            to: email,
            subject: 'Password Reset OTP',
            text: `Your OTP for password reset is ${otp}, It will expire in 10 minutes.`,
        });

        res.status(200).json({ message: 'OTP sent for password reset' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        // console.log("Reset Password Request:", req.body); // Debugging

        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // console.log("User found:", user.email, "Stored OTP:", user.otp);

        if (user.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password must be different from the old password' });
        }
        
        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        await user.save();
        // Send Confirmation Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Successfully",
            text: `Hello, your password has been successfully changed. If you did not perform this action, please contact support immediately.`
        });

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        // console.error("Reset Password Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update user status to offline
        user.status = 'offline';
        await user.save();

        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};