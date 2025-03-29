import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { acceptFriendRequestAction, getAllUsersHomeAction, getFriendRequestsAction, getFriendsAction, logoutUserAction, removeFriendAction, sendFriendRequestAction, updateFriendshipStatus } from '../reducers/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import FriendRequestList from '../components/FriendRequestList';
import Notifications from '../components/Notifications';
const Home = () => {
    const isLoggedIn = localStorage.getItem('user');
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { totalUsers, loading, error, friends, friendRequests } = useSelector((state) => state.auth);

    // Fetch all data at component mount
    useEffect(() => {
        // Fetch users 
        dispatch(getAllUsersHomeAction());

        // Only fetch friend-related data if logged in
        if (isLoggedIn) {
            dispatch(getFriendRequestsAction());
            dispatch(getFriendsAction());
        }
    }, [dispatch, isLoggedIn]);

    const getFriendButtonText = (user) => {
        if (!user) return "Add Friend";
        if (user.isFriend) return "Remove Friend";
        if (user.isPending) return "Request Sent";
        if (user.isReceived) return "Accept Request";
        return "Add Friend";
    };

    const getFriendButtonStyle = (user) => ({
        ...styles.button,
        backgroundColor: user.isFriend ? '#ef4444' :
            user.isPending ? '#9ca3af' :
                user.isReceived ? '#10b981' :
                    '#3b82f6',
        opacity: user.isPending && !user.isReceived ? 0.7 : 1,
        cursor: user.isPending && !user.isReceived ? 'not-allowed' : 'pointer'
    });

    const handleFriendAction = (otherUser) => {
        // Prevent self-friend request
        if (otherUser._id === user._id) {
            return;
        }

        // Different actions based on current relationship
        if (otherUser.isFriend) {
            // Remove friend - apply optimistic update
            dispatch(updateFriendshipStatus({ userId: otherUser._id, status: 'none' }));
            dispatch(removeFriendAction(otherUser._id));
        }
        else if (otherUser.isReceived) {
            // Find the request ID from friendRequests
            const request = friendRequests.find(req =>
                req.requester._id === otherUser._id ||
                req.requester === otherUser._id
            );

            if (request) {
                // Accept friend request
                dispatch(updateFriendshipStatus({ userId: otherUser._id, status: 'friend' }));
                dispatch(acceptFriendRequestAction({
                    requestId: request._id,
                    friendId: otherUser._id
                }));
            }
        }
        else if (!otherUser.isPending) {
            // Send friend request - apply optimistic update
            dispatch(updateFriendshipStatus({ userId: otherUser._id, status: 'pending' }));
            dispatch(sendFriendRequestAction(otherUser._id));
        }
    };


    const handleLogout = () => {
        dispatch(logoutUserAction()).then(() => {
            dispatch(getAllUsersHomeAction())
            navigate('/');
        });
    };

    return (
        <>
            {isLoggedIn && <Notifications />}
            {isLoggedIn && <FriendRequestList />}
            <header style={styles.header}>
                {loading ? (
                    <p>Loading users...</p>
                ) : (
                    <div style={styles.userListContainer}>
                        {Array.isArray(totalUsers) && totalUsers.length > 0 ? (
                            <ul style={styles.userList}>
                                {totalUsers.map((otherUser) => (
                                    <li key={otherUser._id} style={styles.userItem}>
                                        <div style={styles.userInfo}>
                                            <img
                                                src={otherUser.profileImage || "/default-avatar.png"}
                                                alt={`${otherUser.name}'s profile`}
                                                style={styles.profileImage}
                                                onError={(e) => e.target.src = "/default-avatar.png"}
                                            />
                                            <strong>{otherUser.name}</strong>
                                            <span style={getFriendStatusStyle(otherUser.status)}>
                                                {otherUser.status}
                                            </span>
                                            {isLoggedIn && user && user._id !== otherUser._id && (
                                                <div style={{ marginLeft: 'auto', display: 'flex' }}>
                                                    <button
                                                        style={getFriendButtonStyle(otherUser)}
                                                        onClick={() => handleFriendAction(otherUser)}
                                                        disabled={otherUser.isPending && !otherUser.isReceived}
                                                    >
                                                        {getFriendButtonText(otherUser)}
                                                    </button>
                                                    {otherUser.isFriend && (
                                                        <button
                                                            style={styles.chatButton}
                                                            onClick={() => navigate(`/chats/${otherUser._id}`)}
                                                        >
                                                            Chat
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No users found.</p>
                        )}
                    </div>
                )}

                <nav style={styles.nav}>
                    <div style={styles.logo}>RBAC Dashboard</div>
                    <ul style={styles.navList}>
                        <li>
                            <Link to="/" style={styles.navLink}>Home</Link>
                        </li>

                        {/* Show Dashboard Link Based on Role */}
                        {user && (
                            <li>
                                <Link
                                    to={user.role === "admin" ? "/dashboard" : "/user-dashboard"}
                                    style={styles.navLink}
                                >
                                    {user.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
                                </Link>
                            </li>
                        )}


                        {!isLoggedIn && (
                            <li>
                                <Link to="/register" style={styles.navLink}>Register</Link>
                            </li>
                        )}

                        {isLoggedIn ? (
                            <li>
                                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                            </li>
                        ) : (
                            <li>
                                <Link to="/login" style={styles.navLink}>Login</Link>
                            </li>
                        )}
                    </ul>
                </nav>
            </header>
        </>
    );
};


const getFriendStatusStyle = (status) => ({
    ...styles.status,
    color: status === 'online' ? '#10b981' : '#6b7280'
});

const styles = {
    header: {
        backgroundColor: '#1f2937',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    button: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        cursor: 'pointer',
        marginRight: '8px',
    },
    status: {
        display: 'inline-block',
        marginLeft: '8px',
        fontWeight: 'bold',
    },
    profileImage: {
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
    },
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#f9fafb',
    },
    navList: {
        listStyle: 'none',
        display: 'flex',
        gap: '16px',
        margin: 0,
        padding: 0,
    },
    navLink: {
        textDecoration: 'none',
        color: '#f9fafb',
        padding: '8px 16px',
        transition: 'background-color 0.3s',
        borderRadius: '4px',
    },
    logoutButton: {
        backgroundColor: '#ef4444',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
};

export default Home;
