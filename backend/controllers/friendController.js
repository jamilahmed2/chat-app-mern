import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';

// ✅ Send Friend Request
export const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const requesterId = req.user.id;

        // Check if a request already exists
        const existingRequest = await Friend.findOne({ requester: requesterId, recipient: recipientId });
        if (existingRequest) return res.status(400).json({ message: 'Friend request already sent' });

        const friendRequest = new Friend({ requester: requesterId, recipient: recipientId });
        await friendRequest.save();

        // Store notification
        const notification = new Notification({
            user: recipientId,
            sender: requesterId,
            type: 'friend_request',
            message: 'You have a new friend request',
        });
        await notification.save();

        res.status(201).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await Friend.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Friend request not found' });

        request.status = 'accepted';
        await request.save();

        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Decline Friend Request
export const declineFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        await Friend.findByIdAndDelete(requestId);
        res.status(200).json({ message: 'Friend request declined' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Get Friend Requests
export const getFriendRequests = async (req, res) => {
    try {
        const requests = await Friend.find({ recipient: req.user.id, status: 'pending' }).populate('requester', 'name email');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Get Friends List
export const getFriends = async (req, res) => {
    try {
        const friends = await Friend.find({
            $or: [{ requester: req.user.id }, { recipient: req.user.id }],
            status: 'accepted'
        }).populate('requester recipient', 'name email');

        res.status(200).json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Remove Friend
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        await Friend.findOneAndDelete({ 
            $or: [{ requester: req.user.id, recipient: friendId }, { requester: friendId, recipient: req.user.id }],
            status: 'accepted'
        });

        res.status(200).json({ message: 'Friend removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
