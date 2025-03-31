import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    getFriendRequestsAction, 
    acceptFriendRequestAction, 
    declineFriendRequestAction,
    updateFriendshipStatus 
} from '../reducers/authSlice';

const FriendRequestList = () => {
    const dispatch = useDispatch();
    const { friendRequests, loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            dispatch(getFriendRequestsAction());
        }
    }, [dispatch]);

    const handleAcceptRequest = (request) => {
        // Optimistic UI update - remove from friendRequests immediately
        const updatedRequests = friendRequests.filter(req => req._id !== request._id);
        dispatch({ 
            type: 'auth/updateFriendRequests', 
            payload: updatedRequests 
        });

        // Update friendship status
        dispatch(updateFriendshipStatus({ 
            userId: request.requester._id, 
            status: 'friend' 
        }));
        
        // Then dispatch accept action
        dispatch(acceptFriendRequestAction({ 
            requestId: request._id,
            friendId: request.requester._id
        }));
    };

    const handleDeclineRequest = (request) => {
        // Optimistic UI update - remove from friendRequests immediately
        const updatedRequests = friendRequests.filter(req => req._id !== request._id);
        dispatch({ 
            type: 'auth/updateFriendRequests', 
            payload: updatedRequests 
        });

        // Then dispatch decline action
        dispatch(declineFriendRequestAction(request._id));
    };

    // if (friendRequests.length === 0 && !loading) {
    //     return null; // Don't render if there are no requests
    // }

    return (
        <div className="friend-request-container">
            <div className="friend-request-header">
                <h3>Friend Requests</h3>
                <span className="request-count">{friendRequests.length}</span>
            </div>
            
            {loading && <p className="friend-request-loading">Loading...</p>}
            {error && <p className="friend-request-error">{error}</p>}
            
            {friendRequests.length > 0 ? (
                <div className="request-list">
                    {friendRequests.map((request) => (
                        <div key={request._id} className="request-item">
                            <p className="request-user-name">{request.requester.name}</p>
                            <div className="request-buttons">
                                <button 
                                    onClick={() => handleAcceptRequest(request)}
                                    className="accept-button"
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => handleDeclineRequest(request)}
                                    className="decline-button"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-requests">No friend requests</p>
            )}
        </div>
    );
};

export default FriendRequestList;