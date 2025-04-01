import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { acceptFriendRequestAction, getAllUsersHomeAction, getFriendRequestsAction, getFriendsAction, logoutUserAction, removeFriendAction, sendFriendRequestAction, updateFriendshipStatus, blockUserAction, unblockUserAction, reportUserAction } from '../reducers/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import FriendRequestList from '../components/FriendRequestList';
import Notifications from '../components/Notifications';
import socket from '../utils/socket';
import { IoLogoOctocat, IoSearchOutline, IoMenuOutline, IoCloseOutline, IoPersonOutline, IoLogOutOutline, IoChatboxOutline, IoPeopleOutline, IoFlagOutline } from 'react-icons/io5';


const Home = () => {
    const isLoggedIn = localStorage.getItem('user');
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [userToReport, setUserToReport] = useState(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { totalUsers, loading, error, friends, friendRequests } = useSelector((state) => state.auth);

    // Fetch all data at component mount
    useEffect(() => {
        // Fetch users only once when component mounts
        // Create a flag to prevent multiple requests
        let isMounted = true;

        const fetchData = async () => {
            if (isMounted) {
                // Fetch users 
                await dispatch(getAllUsersHomeAction());

                // Only fetch friend-related data if logged in
                if (isLoggedIn) {
                    await dispatch(getFriendRequestsAction());
                    await dispatch(getFriendsAction());
                }
            }
        };

        fetchData();

        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array ensures this runs only once


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside profile dropdown and friend requests
            const isOutsideProfileDropdown = !event.target.closest(".profile-dropdown-container") &&
                !event.target.closest(".profile-dropdown");
            const isOutsideFriendRequests = !event.target.closest(".friend-request-wrapper") &&
                !event.target.closest(".friend-requests-button");
            const isOutsideMobileMenu = !event.target.closest(".header-nav") &&
                !event.target.closest(".hamburger-button");

            // Close dropdowns if clicking outside
            if (isOutsideProfileDropdown) {
                setIsDropdownOpen(false);
            }

            if (isOutsideFriendRequests) {
                setShowFriendRequests(false);
            }

            if (isOutsideMobileMenu) {
                setMobileMenuOpen(false);
            }
        };

        // Listen for clicks anywhere in the document
        document.addEventListener("click", handleClickOutside);

        // Clean up event listener on component unmount
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    // Add class to body when dropdowns are open
    useEffect(() => {
        if (isDropdownOpen || showFriendRequests) {
            document.body.classList.add('overlay-open');
        } else {
            document.body.classList.remove('overlay-open');
        }

        return () => {
            document.body.classList.remove('overlay-open');
        };
    }, [isDropdownOpen, showFriendRequests]);


    // Filter users based on search term
    const filteredUsers = totalUsers?.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getFriendButtonText = (user) => {
        if (!user) return "Add Friend";
        if (user.isFriend) return "Remove Friend";
        if (user.isPending) return "Request Sent";
        if (user.isReceived) return "Accept Request";
        return "Add Friend";
    };

    const getFriendButtonClass = (user) => {
        if (user.isFriend) return "friend-button remove";
        if (user.isPending) return "friend-button pending";
        if (user.isReceived) return "friend-button accept";
        return "friend-button add";
    };

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


    // check if user is reported
    const isUserReported = (userId) => {
        // Get directly from Redux state
        return totalUsers.find(user => user._id === userId)?.isReported || false;
    };

    const isUserBlocked = (userId) => {
        if (!user || !user.blockedUsers) return false;
        return Array.isArray(user.blockedUsers) && user.blockedUsers.includes(userId);
    };

    const isBlockedByUser = (userId) => {
        // First check if user is logged in
        if (!user || !user._id) return false;

        const otherUser = totalUsers.find(u => u._id === userId);
        return otherUser && otherUser.blockedUsers &&
            Array.isArray(otherUser.blockedUsers) &&
            otherUser.blockedUsers.includes(user._id);
    };

    const handleBlockUser = (userId) => {
        if (isUserBlocked(userId)) {
            dispatch(unblockUserAction(userId));
            // Optimistic UI update
            if (user.blockedUsers) {
                const updatedBlockedUsers = user.blockedUsers.filter(id => id !== userId);
                const updatedUser = { ...user, blockedUsers: updatedBlockedUsers };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } else {
            dispatch(blockUserAction(userId));
            // Optimistic UI update
            const updatedBlockedUsers = [...(user.blockedUsers || []), userId];
            const updatedUser = { ...user, blockedUsers: updatedBlockedUsers };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const openReportModal = (user) => {
        setUserToReport(user);
        setReportModalOpen(true);
        setReportReason('');
    };

    const closeReportModal = () => {
        setReportModalOpen(false);
        setUserToReport(null);
    };
    const handleReportUser = (e) => {
        e.preventDefault();
        if (!reportReason.trim() || !userToReport) return;

        dispatch(reportUserAction({
            userId: userToReport._id,
            reason: reportReason
        }))
            .unwrap()
            .then(() => {
                closeReportModal();
            })
            .catch(error => {
                console.error("Failed to report user:", error);
            });
    };

    const handleLogout = () => {
        // First disconnect socket if it's connected
        if (socket && socket.connected) {
            // console.log("Disconnecting socket during logout");
            socket.disconnect();
        }

        // Then dispatch logout action
        dispatch(logoutUserAction()).then(() => {

            dispatch(getAllUsersHomeAction());
            navigate('/');
        });
    };

    return (

        <div className="home-container">

            {/* Friend Request List positioned absolutely */}
            {isLoggedIn && showFriendRequests && (
                <div className="friend-request-wrapper">
                    <FriendRequestList />
                </div>
            )}

            {/* Main Content */}
            <main className="home-content">

                <div className="content-container">
                    <div className="user-search-section">
                        <h2>Find People</h2>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="search-button">
                                <IoSearchOutline />
                            </button>
                        </div>
                    </div>

                    <div className="users-grid-section">
                        {loading ? (
                            <div className="loading-container">
                                <p>Loading users...</p>
                            </div>
                        ) : (
                            <div className="users-grid">
                                {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                                    filteredUsers.map((otherUser) => (
                                        <div key={otherUser._id} className="user-card">
                                            <Link to={`/users/${otherUser._id}`}>
                                                <div className="user-card-header">
                                                    <img
                                                        src={otherUser.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"}
                                                        alt={`${otherUser.name}'s profile`}
                                                        className="user-avatar"
                                                    />
                                                    <div className="user-status">
                                                        <span className={`status-indicator ${otherUser.status === 'online' ? 'online' : 'offline'}`}></span>
                                                        <span className="status-text">{otherUser.status || 'offline'}</span>
                                                    </div>
                                                </div>

                                                <div className="user-card-body">
                                                    <h3 className="user-name">{otherUser.name}</h3>
                                                    {isLoggedIn && isBlockedByUser(otherUser._id) && (
                                                        <p className="blocked-status">This user has blocked you</p>
                                                    )}
                                                </div>
                                            </Link>

                                            {isLoggedIn && user && user._id !== otherUser._id && user.role === "user" && (
                                                <div className="user-card-actions">
                                                    <button
                                                        className={getFriendButtonClass(otherUser)}
                                                        onClick={() => handleFriendAction(otherUser)}
                                                        disabled={otherUser.isPending && !otherUser.isReceived}
                                                    >
                                                        {getFriendButtonText(otherUser)}
                                                    </button>

                                                    {otherUser.isFriend && (
                                                        <>
                                                            <button
                                                                className="chat-button"
                                                                onClick={() => navigate(`/chats/${otherUser._id}`)}
                                                            >
                                                                <IoChatboxOutline /> Chat
                                                            </button>

                                                            <button
                                                                className={`block-button ${isUserBlocked(otherUser._id) ? "unblock-button" : ""}`}
                                                                onClick={() => handleBlockUser(otherUser._id)}
                                                                disabled={isBlockedByUser(otherUser._id)}
                                                                title={isBlockedByUser(otherUser._id) ? "You cannot block a user who has blocked you" : ""}
                                                            >
                                                                {isUserBlocked(otherUser._id) ? "Unblock" : "Block"}
                                                            </button>

                                                            {/* Report Button - only for friends */}
                                                            <button
                                                                className={`report-button ${isUserReported(otherUser._id) ? "reported" : ""}`}
                                                                onClick={() => openReportModal(otherUser)}
                                                                disabled={isUserReported(otherUser._id)}
                                                                title={isUserReported(otherUser._id) ? "User reported" : "Report this user"}
                                                            >
                                                                <IoFlagOutline />
                                                                {isUserReported(otherUser._id) ? "Reported" : "Report"}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-results">
                                        <p>No users found matching your search.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>


            {/* Report Modal */}
            {reportModalOpen && (
                <div className="report-modal-overlay">
                    <div className="report-modal">
                        <div className="report-modal-header">
                            <h3>Report User</h3>
                            <button className="close-modal" onClick={closeReportModal}>×</button>
                        </div>
                        <form onSubmit={handleReportUser}>
                            <div className="report-modal-body">
                                <p>Please provide a reason for reporting {userToReport?.name}:</p>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Explain why you are reporting this user..."
                                    required
                                ></textarea>
                            </div>
                            <div className="report-modal-footer">
                                <button type="button" onClick={closeReportModal}>Cancel</button>
                                <button type="submit" disabled={!reportReason.trim()}>Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
