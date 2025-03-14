import User from '../models/User.js';
import { generateOTP, transporter } from '../utils/emailUtils.js';
import bcrypt from 'bcryptjs';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        await user.deleteOne();
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin updates email with OTP verification
export const updateAdminEmail = async (req, res) => {
    try {
        const { newEmail } = req.body;
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') return res.status(403).json({ message: "Unauthorized" });
        
        const otp = generateOTP();
        admin.otp = otp;
        admin.isVerified = false;
        await admin.save();
        
        await transporter.sendMail({
            to: newEmail,
            subject: "Email Change OTP",
            text: `Your OTP for email update is ${otp}`,
        });
        res.status(200).json({ message: "OTP sent for email verification" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin updates password
export const updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') return res.status(403).json({ message: "Unauthorized" });
        
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });
        
        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Get all reported users
export const getReportedUsers = async (req, res) => {
    try {
        const reportedUsers = await User.find({ reports: { $exists: true, $not: { $size: 0 } } }).select('-password');
        res.status(200).json(reportedUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear reports on a user
export const clearReports = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.reports = [];
        await user.save();
        res.status(200).json({ message: 'Reports cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ban a user
export const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBanned = true;
        await user.save();
        res.status(200).json({ message: 'User banned successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unban a user
export const unbanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isBanned = false;
        await user.save();
        res.status(200).json({ message: 'User unbanned successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


