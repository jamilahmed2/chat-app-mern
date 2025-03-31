import User from '../models/User.js';
import { generateOTP, transporter } from '../utils/emailUtils.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from '../utils/cloudinary.js';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude passwords
        if (!users.length) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json({ totalUsers: users.length, users });
    } catch (error) {
        res.status(500).json({ message: "Server error: Unable to fetch users" });
    }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
    try {
        // console.log("Delete request received for user ID:", req.params.id); // Debug log
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.deleteOne();
        res.json({ message: "User deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const uploadAdminProfileImage = async (req, res) => {
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

// Update Admin Name
export const updateAdminName = async (req, res) => {
    try {
        const { name } = req.body;
        const admin = await User.findById(req.user.id);

        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        admin.name = name;
        const updatedAdmin = await admin.save();

        res.status(200).json({
            message: "Name updated successfully",
            user: {
                id: updatedAdmin.id,
                name: updatedAdmin.name,
                email: updatedAdmin.email,
                role: updatedAdmin.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Admin Email (Triggers OTP)
export const updateAdminEmail = async (req, res) => {
    try {
        const { email } = req.body;
        console.log("Requested Email Update:", email); // ✅ Log incoming email

        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== "admin") {
            console.log("Unauthorized request");
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (email === admin.email) {
            console.log("New email is the same as the current email");
            return res.status(400).json({ message: "New email is the same as current email" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Email is already in use by another user");
            return res.status(400).json({ message: "Email is already in use" });
        }

        const otp = generateOTP();
        console.log("Generated OTP:", otp); // ✅ Check OTP generation

        admin.otp = otp;
        admin.otpExpires = Date.now() + 10 * 60 * 1000;
        admin.isVerified = false;
        await admin.save();

        await transporter.sendMail({
            to: email,
            subject: "Email Change OTP Verification",
            text: `Your OTP for email update is: ${otp}. It will expire in 10 minutes.`,
        });

        console.log("OTP sent successfully");
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
        // console.log("Verifying OTP for email:", email);

        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if OTP is valid and not expired
        if (admin.otp !== otp || admin.otpExpires < Date.now()) {
            // console.log("Invalid or expired OTP");
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Update the admin's email and reset OTP fields
        admin.email = email;
        admin.otp = undefined;
        admin.otpExpires = undefined;
        admin.isVerified = true;
        await admin.save();

        const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);

        // console.log("Email updated successfully");
        return res.status(200).json({
            success: true,
            message: "Email updated successfully",
            user: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token, // Make sure token is included if needed
                isVerified: admin.isVerified,
                profileImage: admin.profileImage,
                status: admin.status,
                isBanned: admin.isBanned,
                blockedUsers: admin.blockedUsers,
            }
        });
    } catch (error) {
        // console.error("Error verifying email OTP:", error);
        res.status(500).json({ message: error.message });
    }
};

export const adminEmailResendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Generate OTP & save to DB with an expiration time
        const otp = generateOTP();
        admin.otp = otp;
        admin.otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await admin.save();

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

// Admin updates password
export const updateAdminPassword = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied!" });
    }

    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.user.id);

    if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    await admin.save();
    res.json({ message: "Password updated successfully" });
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

export const getBannedUsers = async (req, res) => {
    try {
        const bannedUsers = await User.find({ isBanned: true });
        res.status(200).json(bannedUsers);
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


/**
 * Get blocked status between two users
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getBlockStatus = async (req, res) => {
  try {
    const { userId, targetUserId } = req.params;
    
    // Validate input
    if (!userId || !targetUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and targetUserId are required' 
      });
    }

    // Check if users exist
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or both users not found' 
      });
    }

    // Check if targetUser is in user's blockedUsers array
    const isBlocked = user.blockedUsers.includes(targetUserId);
    
    // Check if user is in targetUser's blockedUsers array
    const isBlockedBy = targetUser.blockedUsers.includes(userId);

    return res.status(200).json({
      success: true,
      data: {
        isBlocked,      // True if user has blocked targetUser
        isBlockedBy,    // True if targetUser has blocked user
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        targetUser: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email
        }
      }
    });
  } catch (error) {
    console.error('Error in getBlockStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Unblock a user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const unblockUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    // Validate input
    if (!userId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and targetUserId are required'
      });
    }

    // Find the user who blocked the target
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the target user is actually blocked
    if (!user.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Target user is not blocked'
      });
    }

    // Remove targetUserId from blockedUsers array
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: targetUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'User has been unblocked successfully'
    });
  } catch (error) {
    console.error('Error in unblockUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all blocked user details for a specific user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId is required'
      });
    }

    const user = await User.findById(userId)
      .populate('blockedUsers', 'name email profileImage')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      count: user.blockedUsers.length,
      data: user.blockedUsers
    });
  } catch (error) {
    console.error('Error in getBlockedUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get blocked users information
export const getBlockedUsersInfo = async (req, res) => {
    try {
        const users = await User.find({}, { name: 1, email: 1, blockedUsers: 1 });
        
        // Filter users who have blocked others
        const usersWithBlocked = users.filter(user => user.blockedUsers.length > 0);
        
        // Get detailed information about blocked users
        const blockedUsersInfo = await Promise.all(usersWithBlocked.map(async (user) => {
            const blockedUsersDetails = await User.find(
                { _id: { $in: user.blockedUsers } },
                { name: 1, email: 1 }
            );
            
            return {
                blocker: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                blockedUsers: blockedUsersDetails
            };
        }));

        res.status(200).json({ blockedUsersInfo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin function to get all blocked users across the system
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const adminGetBlockedUsers = async (req, res) => {
  try {
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    // Find all users who have blocked at least one user
    const usersWithBlockedList = await User.find(
      { blockedUsers: { $exists: true, $ne: [] } },
      { name: 1, email: 1, profileImage: 1, blockedUsers: 1 }
    );

    // Get more information about each blocked user
    const enhancedData = await Promise.all(
      usersWithBlockedList.map(async (user) => {
        const blockedUserDetails = await User.find(
          { _id: { $in: user.blockedUsers } },
          { name: 1, email: 1, profileImage: 1 }
        );

        return {
          blocker: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
          },
          blocked: blockedUserDetails,
          count: blockedUserDetails.length
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enhancedData.length,
      data: enhancedData
    });
  } catch (error) {
    console.error('Error in adminGetBlockedUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin function to unblock a user on behalf of another user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const adminUnblockUser = async (req, res) => {
  try {
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    const { userId, targetUserId } = req.body;
    
    // Validate input
    if (!userId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Both userId and targetUserId are required'
      });
    }

    // Find the user who blocked the target
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the target user is actually blocked
    if (!user.blockedUsers.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Target user is not blocked'
      });
    }

    // Remove targetUserId from blockedUsers array
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: targetUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'User has been unblocked successfully',
      userId,
      targetUserId
    });
  } catch (error) {
    console.error('Error in adminUnblockUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin function to check block status between two users
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const adminGetBlockStatus = async (req, res) => {
  try {
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required'
      });
    }

    const { userId, targetUserId } = req.params;
    
    // Validate input
    if (!userId || !targetUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both userId and targetUserId are required' 
      });
    }

    // Check if users exist
    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'One or both users not found' 
      });
    }

    // Check blocking status in both directions
    const isBlocked = user.blockedUsers.includes(targetUserId);
    const isBlockedBy = targetUser.blockedUsers.includes(userId);

    return res.status(200).json({
      success: true,
      data: {
        isBlocked,      // True if user has blocked targetUser
        isBlockedBy,    // True if targetUser has blocked user
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        },
        targetUser: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          profileImage: targetUser.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Error in adminGetBlockStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};