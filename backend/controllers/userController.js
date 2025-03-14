import User from '../models/User.js';

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
