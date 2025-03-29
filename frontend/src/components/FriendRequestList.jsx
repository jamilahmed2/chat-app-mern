import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    getFriendRequestsAction, 
    acceptFriendRequestAction, 
    declineFriendRequestAction,
    updateFriendshipStatus 
} from '../reducers/authSlice';

const FriendsList = () => {
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

    return (
        <div style={styles.container}>
            <h3>Friend Requests</h3>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {friendRequests.length > 0 ? (
                <ul style={styles.requestList}>
                    {friendRequests.map((request) => (
                        <li key={request._id} style={styles.requestItem}>
                            {request.requester.name}
                            <div>
                                <button 
                                    onClick={() => handleAcceptRequest(request)}
                                    style={styles.acceptButton}
                                >
                                    Accept
                                </button>
                                <button 
                                    onClick={() => handleDeclineRequest(request)}
                                    style={styles.declineButton}
                                >
                                    Decline
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No friend requests</p>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '1rem',
        backgroundColor: 'grey',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '1rem'
    },
    requestList: {
        listStyle: 'none',
        padding: 0
    },
    requestItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem',
        borderBottom: '1px solid #eee'
    },
    acceptButton: {
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        marginRight: '0.5rem',
        cursor: 'pointer'
    },
    declineButton: {
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        cursor: 'pointer'
    }
};

export default FriendsList;