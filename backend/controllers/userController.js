import User from '../models/User.js';
import Friend from '../models/Friend.js';
import cloudinary from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';
import { generateOTP, transporter } from '../utils/emailUtils.js'
import mongoose from 'mongoose';


export const getAllUsersHome = async (req, res) => {
    try {
        const currentUserId = req.user?._id;
        // console.log('Current User ID:', currentUserId);

        // If no user is logged in, return only public info
        if (!currentUserId) {
            const users = await User.find({ role: "user" }, { password: 0, otp: 0, otpExpires: 0, role: 0 });
            return res.status(200).json({
                success: true,
                users
            });
        }


        // Convert currentUserId to ObjectId to ensure proper comparison
        const objectIdCurrentUser = new mongoose.Types.ObjectId(currentUserId);
        // console.log('Current User ObjectId:', objectIdCurrentUser);

        // Get all users except current user
        const users = await User.find(
            { _id: { $ne: currentUserId }, role: "user" },
            { password: 0, otp: 0, otpExpires: 0 }
        );

        // console.log('Found users count:', users.length);
        // console.log('User IDs in response:', users.map(u => u._id.toString()));

        // Get all friendships for current user - get pending and accepted in one query
        const friendships = await Friend.find({
            $or: [
                { requester: currentUserId },
                { recipient: currentUserId }
            ]
        });


        // Map users with friendship status - improved logic
        const usersWithStatus = users.map(user => {
            
            const userObj = user.toJSON();
            // isReported flag based on current user's reports
            if (currentUserId) {
                userObj.isReported = user.reports &&
                    user.reports.some(report => report.reportedBy.toString() === currentUserId);
            } else {
                userObj.isReported = false;
            }
            // Find matching friendship
            const friendship = friendships.find(f =>
                (f.requester.toString() === user._id.toString() || f.recipient.toString() === user._id.toString())
            );

            if (!friendship) {
                // No relationship exists
                return {
                    ...userObj,
                    isFriend: false,
                    isPending: false,
                    isReceived: false
                };
            }

            const isFriend = friendship.status === 'accepted';
            const isPending = friendship.status === 'pending' &&
                friendship.requester.toString() === currentUserId;
            const isReceived = friendship.status === 'pending' &&
                friendship.recipient.toString() === currentUserId;

            return {
                ...userObj,
                isFriend,
                isPending,
                isReceived,
                isReported,
                friendshipId: friendship._id
            };
        });

        res.status(200).json({
            success: true,
            users: usersWithStatus
        });
    } catch (error) {
        // console.error('Error in getAllUsersHome:', error);
        res.status(500).json({
            success: false,
            message: "Server error: Unable to fetch users"
        });
    }
};



export const getUser = async (req, res) => {
    const { id } = req.params;
    if (id !== req.params.id) {
        return res.status(400).json({ message: "Invalid user ID" });
    }
    try {
        const post = await User.findById(id);

        res.status(200).json(post);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

// Block a user
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.blockedUsers.includes(userId)) {
            return res.status(400).json({ message: 'User already blocked' });
        }

        user.blockedUsers.push(userId);
        await user.save();
        res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId);
        await user.save();
        res.status(200).json({ message: 'User unblocked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Report a user
export const reportUser = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        const reportedUser = await User.findById(userId);
        if (!reportedUser) return res.status(404).json({ message: 'User not found' });

        reportedUser.reports.push({ reportedBy: req.user.id, reason });
        await reportedUser.save();
        res.status(200).json({ message: 'User reported successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserName = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.user.id);

        if (!user || user.role !== "user") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        user.name = name;
        const updatedUser = await user.save();

        res.status(200).json({
            message: "Name updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserEmail = async (req, res) => {
    try {
        const { email } = req.body;
        // console.log("Requested Email Update:", email); // ✅ Log incoming email

        const user = await User.findById(req.user.id);
        if (!user || user.role !== "user") {
            // console.log("Unauthorized request");
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (email === user.email) {
            // console.log("New email is the same as the current email");
            return res.status(400).json({ message: "New email is the same as current email" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Email is already in use by another user");
            return res.status(400).json({ message: "Email is already in use" });
        }


        const otp = generateOTP();
        // console.log("Generated OTP:", otp); // ✅ Check OTP generation

        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        user.isVerified = false;
        await user.save();

        await transporter.sendMail({
            to: email,
            subject: "Email Change OTP Verification",
            text: `Your OTP for email update is: ${otp}. It will expire in 10 minutes.`,
        });

        // console.log("OTP sent successfully");
        res.status(200).json({ message: "OTP sent to new email for verification" });
    } catch (error) {
        console.error("Error updating admin email:", error); // ✅ Log backend errors
        res.status(500).json({ message: error.message });
    }
};

// new email
export const verifyEmailOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        console.log("Verifying OTP for email:", email);

        const user = await User.findById(req.user.id);
        if (!user || user.role !== "user") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if OTP is valid and not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            console.log("Invalid or expired OTP");
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update the user's email and reset OTP fields
        user.email = email;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true;
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

        console.log("Email updated successfully");
        return res.status(200).json({
            success: true,
            message: "Email updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token, // Make sure token is included if needed
                isVerified: user.isVerified,
                profileImage: user.profileImage,
                status: user.status,
                isBanned: user.isBanned,
                blockedUsers: user.blockedUsers,
            }
        });
    } catch (error) {
        console.error("Error verifying email OTP:", error);
        res.status(500).json({ message: error.message });
    }
};

export const userEmailResendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findById(req.user.id);
        if (!user || user.role !== "user") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Generate OTP & save to DB with an expiration time
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        // Send OTP email to the new email address
        await transporter.sendMail({
            to: email,
            subject: "Your OTP Code",
            text: `Your new OTP is: ${otp}. It will expire in 10 minutes.`,
        });

        res.status(200).json({ message: "New OTP sent to new email" });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update Password
export const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const uploadUserProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Delete old image from Cloudinary if exists
        if (user.profileImage && user.profileImage.includes('cloudinary')) {
            const publicId = user.profileImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'profile_images',
            transformation: [
                { width: 400, height: 400, crop: 'fill' },
                { quality: 'auto' }
            ]
        });

        user.profileImage = result.secure_url;
        await user.save();

        res.status(200).json({
            message: 'Profile image updated successfully',
            profileImage: result.secure_url
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};