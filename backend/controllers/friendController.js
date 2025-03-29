import Friend from '../models/Friend.js';
import Notification from '../models/Notification.js';

export const sendFriendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;
        const requesterId = req.user.id;

        // Prevent self-friend request
        if (recipientId === requesterId) {
            return res.status(400).json({
                message: 'Cannot send friend request to yourself'
            });
        }
        
        // Check existing friendship - improved query
        const existingFriendship = await Friend.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({
                    message: 'Already friends'
                });
            }
            if (existingFriendship.status === 'pending') {
                return res.status(400).json({
                    message: 'Friend request already pending'
                });
            }
            if (existingFriendship.status === 'removed') {
                // Re-enable a removed friendship
                existingFriendship.status = 'pending';
                existingFriendship.requester = requesterId;
                existingFriendship.recipient = recipientId;
                await existingFriendship.save();
                
                // Create notification
                const notification = new Notification({
                    user: recipientId,
                    sender: requesterId,
                    type: 'friend_request',
                    message: 'You have a new friend request',
                });
                await notification.save();
                
                return res.status(200).json({ 
                    message: 'Friend request sent',
                    recipientId
                });
            }
        }

        // Create and save the friend request
        const friendRequest = new Friend({ 
            requester: requesterId, 
            recipient: recipientId, 
            status: 'pending' 
        });
        await friendRequest.save();

        // Store notification
        const notification = new Notification({
            user: recipientId,
            sender: requesterId,
            type: 'friend_request',
            message: 'You have a new friend request',
        });
        await notification.save();

        res.status(201).json({ 
            message: 'Friend request sent',
            recipientId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Accept Friend Request
// Update acceptFriendRequest function
export const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;
        
        const request = await Friend.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Friend request not found' });
        
        // Verify this request is intended for the current user
        if (request.recipient.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to accept this request' });
        }

        request.status = 'accepted';
        await request.save();

        // Get the requester's ID for the response
        const friendId = request.requester.toString();

        // Create notification with correct type
        const notification = new Notification({
            user: friendId,
            sender: userId,
            type: 'friend_request', // Use existing valid type temporarily
            message: 'Your friend request was accepted'
        });
        await notification.save();

        res.status(200).json({ 
            message: 'Friend request accepted',
            requestId,
            friendId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Decline Friend Request
export const declineFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;
        
        // Verify this request is intended for the current user
        const request = await Friend.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Friend request not found' });
        
        if (request.recipient.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to decline this request' });
        }
        
        await Friend.findByIdAndDelete(requestId);
        res.status(200).json({ 
            message: 'Friend request declined',
            requestId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Get Friend Requests
export const getFriendRequests = async (req, res) => {
    try {
        const requests = await Friend.find({ 
            recipient: req.user.id, 
            status: 'pending' 
        }).populate('requester', 'name email profileImage status');
        
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Get Friends List
export const getFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const friends = await Friend.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        }).populate('requester recipient', 'name email profileImage status');

        res.status(200).json(friends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Remove Friend - Changed to actually delete the friendship
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;

        // Find and update the friendship status to 'removed'
        const friendship = await Friend.findOneAndUpdate(
            {
                $or: [
                    { requester: userId, recipient: friendId, status: 'accepted' },
                    { requester: friendId, recipient: userId, status: 'accepted' }
                ]
            },
            { status: 'removed' },
            { new: true }
        );

        if (!friendship) {
            return res.status(404).json({ message: "Friend not found or already removed" });
        }

        res.status(200).json({ 
            message: "Friend removed successfully",
            friendId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};