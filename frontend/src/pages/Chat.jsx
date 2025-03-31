import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../utils/socket";
import moment from "moment";
import ScrollToBottom from "react-scroll-to-bottom";
import EmojiPicker from 'emoji-picker-react';
import { setActiveChat, addMessage, removeMessage, updateMessageStatus, resetUnreadCount, getMessagesAction, sendMessageAction, deleteMessageAction, getUnreadCountsAction, markAsDeliveredAction, markMessageAsReadAction, addReactionAction, removeReactionAction } from "../reducers/chatSlice";

import { getFriendsAction, logoutUserAction } from "../reducers/authSlice";
import { blockUserAction, unblockUserAction, reportUserAction } from "../actions/userActions";
import Aside from "../components/Aside";
import useSocketChat from "../hooks/useSoketChat";
const ChatPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userId } = useParams();
    const { messages, activeChat, unreadCounts } = useSelector((state) => state.chat);
    const { user, friends, totalUsers } = useSelector((state) => state.auth);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [friendsList, setFriendsList] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionTarget, setReactionTarget] = useState(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [reportedUsers, setReportedUsers] = useState({});
    const [showMobileFriendsList, setShowMobileFriendsList] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);

    const {
        typing,
        notification,
        setUnreadMessages,
        emitSendMessage,
        emitReceiveMessage,
        emitNewMessageNotification,
        emitMessagesRead,
        emitDeleteMessage,
        emitTyping,
        showNotification,
        emitAddReaction,
        emitRemoveReaction
    } = useSocketChat({
        user,
        activeChat,
        messages,
        dispatch
    });

    // fetch unread counts on initial load
    useEffect(() => {
        if (user) {
            dispatch(getUnreadCountsAction());
        }
    }, [user, dispatch]);


    // Fetch friends instead of all users
    useEffect(() => {
        if (!user) return;

        dispatch(getFriendsAction())
            .unwrap()
            .then((response) => {
                // Process friends data to get a list of friend users
                const friendUsers = response.map(friendship => {
                    // Get the friend user object (not the current user)
                    const friendUser = friendship.requester._id === user._id
                        ? friendship.recipient
                        : friendship.requester;

                    return {
                        ...friendUser,
                        isFriend: true
                    };
                });

                setFriendsList(friendUsers);
                // If URL has userId, load that chat
                if (userId && friendUsers.length > 0) {
                    const friend = friendUsers.find(f => f._id === userId);
                    if (friend) {
                        loadMessages(friend);
                        setShowMobileFriendsList(false);
                    }
                }
            })
            .catch((error) => {
                console.error("Failed to fetch friends:", error);
            });
    }, [user, dispatch, userId]);

    // Update reported users status from totalUsers
    useEffect(() => {
        if (totalUsers && totalUsers.length > 0) {
            const reportedStatus = {};
            totalUsers.forEach(user => {
                if (user.isReported) {
                    reportedStatus[user._id] = true;
                }
            });
            setReportedUsers(reportedStatus);
        }
    }, [totalUsers]);


    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".chat-sidebar-profile")) {
                setIsProfileDropdownOpen(false);
            }
            if (!event.target.closest(".user-menu-container")) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedMedia) return;

        if (isUserBlocked(activeChat._id) || isBlockedByUser(activeChat._id)) {
            showNotification({
                message: `Cannot send message. ${isUserBlocked(activeChat._id) ? 'You have blocked this user.' : 'You have been blocked by this user.'}`,
            });
            return;
        }

        try {
            // Reset UI state
            setNewMessage("");

            // If there's media, use Redux action to upload properly
            if (selectedMedia) {
                // Show uploading indicator
                showNotification({
                    message: "Sending...",
                });

                // Dispatch the action with FormData
                const result = await dispatch(sendMessageAction({
                    receiver: activeChat._id,
                    message: newMessage,
                    media: selectedMedia
                })).unwrap();

                // Clear media preview
                setSelectedMedia(null);
                setMediaPreview(null);

                // Use socket functions from hook
                emitReceiveMessage(result);
                emitNewMessageNotification({
                    senderId: user._id,
                    receiverId: activeChat._id,
                    messageId: result._id
                });
            } else {
                // Text-only message stays the same
                const messageData = {
                    senderId: user._id,
                    receiverId: activeChat._id,
                    message: newMessage,
                    type: "text"
                };
                emitSendMessage(messageData);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification({
                message: "Failed to send message. Please try again.",
            });
        }
    };
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type and size
        const fileType = file.type;
        const fileSize = file.size / 1024 / 1024; // in MB

        if (!fileType.startsWith('image/') && !fileType.startsWith('video/')) {
            showNotification({
                message: "Only image and video files are allowed!",
                timestamp: new Date()
            });
            return;
        }

        if (fileSize > 10) {
            showNotification({
                message: "File size must be less than 10MB",
                timestamp: new Date()
            });
            return;
        }

        setSelectedMedia(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };
    // load messages
    const loadMessages = async (friend) => {
        if (isLoadingChat || (activeChat && activeChat._id === friend._id)) {
            return;
        }
        try {
            setIsLoadingChat(true);
            dispatch(setActiveChat(friend));

            // First mark messages as delivered
            await dispatch(markAsDeliveredAction(friend._id))
                .catch(err => {
                    console.error("Error marking as delivered:", err);
                });

            // Then fetch messages
            dispatch(getMessagesAction(friend._id)).then(() => {
                // Once messages are loaded, mark them as read
                dispatch(markMessageAsReadAction(friend._id)).then(action => {
                    if (!action.error) {
                        // Use emitMessagesRead from hook
                        emitMessagesRead({
                            senderId: friend._id,
                            receiverId: user._id,
                            messageIds: action.payload.messageIds
                        });
                    } else {
                        console.error("Error in markMessageAsReadAction:", action.error);
                    }
                });
            });

            // Update URL to reflect selected chat
            navigate(`/chats/${friend._id}`, { replace: true });

            // Hide the friends list on mobile when a chat is selected
            setShowMobileFriendsList(false);

            // Clear unread count for this friend in local state and Redux
            setUnreadMessages(prev => ({
                ...prev,
                [friend._id]: 0
            }));
            dispatch(resetUnreadCount(friend._id));
        } finally {
            setIsLoadingChat(false);
        }
    };
    // Handle back button click in mobile view
    const handleBackButtonClick = (e) => {
        e.preventDefault();
        dispatch(setActiveChat(null));
        navigate("/chats", { replace: true })
        setShowMobileFriendsList(true);
    };


    // Add this function to remove selected media
    const removeSelectedMedia = () => {
        setSelectedMedia(null);
        setMediaPreview(null);
    };

    // Function to check if a user is reported
    const isUserReported = (userId) => {
        return totalUsers.find(user => user._id === userId)?.isReported || false;
    };
    // Check if current user is blocked by the other user
    const isBlockedByUser = (userId) => {
        if (!user || !userId) return false;

        const otherUser = totalUsers.find(u => u._id === userId);
        return otherUser && otherUser.blockedUsers &&
            Array.isArray(otherUser.blockedUsers) &&
            otherUser.blockedUsers.includes(user._id);
    };

    // Handle message deletion
    const handleDeleteMessage = (messageId) => {
        dispatch(deleteMessageAction(messageId))
            .then(() => {
                emitDeleteMessage({
                    messageId,
                    receiverId: activeChat._id
                });
            });
    };

    // Typing indicator
    const handleTyping = () => {
        if (activeChat) {
            emitTyping(activeChat._id);
        }
    };


    // Check if user is blocked
    const isUserBlocked = (userId) => {
        return user?.blockedUsers?.includes(userId) || false;
    };

    // message reaction
    const handleReactionClick = (messageId) => {
        setReactionTarget(messageId);
        setShowReactionPicker(true);
    };

    const handleSelectEmoji = (emojiData) => {
        if (reactionTarget) {
            dispatch(addReactionAction({
                messageId: reactionTarget,
                emoji: emojiData.emoji
            }));
            emitAddReaction(reactionTarget, emojiData.emoji);
            setShowReactionPicker(false);
            setReactionTarget(null);
        }
    };

    const handleRemoveReaction = (messageId) => {
        dispatch(removeReactionAction(messageId));
        emitRemoveReaction(messageId);
    };

    // Function to render reactions for a message
    const renderReactions = (message) => {
        if (!message.reactions || message.reactions.length === 0) return null;

        return (
            <div className="message-reactions">
                {message.reactions.map((reaction, index) => (
                    <span
                        key={index}
                        className="reaction-emoji"
                        onClick={() => {
                            // If it's the current user's reaction, allow removing it
                            if (reaction.userId === user._id) {
                                handleRemoveReaction(message._id);
                            }
                        }}
                    >
                        {reaction.emoji}
                    </span>
                ))}
            </div>
        );
    };

    // Check if current user has reacted to a message
    const hasUserReacted = (message) => {
        return message.reactions?.some(reaction => reaction.userId === user._id);
    };
    // Handle blocking user
    const handleBlockUser = () => {
        if (!activeChat) return;

        dispatch(blockUserAction(activeChat._id))
            .unwrap()
            .then(() => {
                setIsUserMenuOpen(false);

                // Update local state (same as Home page)
                if (user.blockedUsers) {
                    const updatedBlockedUsers = [...user.blockedUsers, activeChat._id];
                    const updatedUser = { ...user, blockedUsers: updatedBlockedUsers };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                // Show notification that user was blocked
                showNotification({
                    message: `${activeChat.name} has been blocked`,
                    timestamp: new Date()
                });
            })
            .catch(error => {
                console.error("Failed to block user:", error);
            });
    };

    // Handle unblocking user
    const handleUnblockUser = () => {
        if (!activeChat) return;

        dispatch(unblockUserAction(activeChat._id))
            .unwrap()
            .then(() => {
                setIsUserMenuOpen(false);

                // Update local state (same as Home page)
                if (user.blockedUsers) {
                    const updatedBlockedUsers = user.blockedUsers.filter(id => id !== activeChat._id);
                    const updatedUser = { ...user, blockedUsers: updatedBlockedUsers };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }

                // Show notification that user was unblocked
                showNotification({
                    message: `${activeChat.name} has been unblocked`,
                    timestamp: new Date()
                });
            })
            .catch(error => {
                console.error("Failed to unblock user:", error);
            });
    };

    // Open report modal
    const openReportModal = () => {
        setShowReportModal(true);
        setIsUserMenuOpen(false);
    };

    // Handle reporting user
    const handleReportUser = (e) => {
        e.preventDefault();

        if (!activeChat || !reportReason.trim()) return;

        dispatch(reportUserAction({ userId: activeChat._id, reason: reportReason }))
            .unwrap()
            .then(() => {
                setShowReportModal(false);
                setReportReason("");

                // Update local state to mark user as reported
                setReportedUsers(prev => ({
                    ...prev,
                    [activeChat._id]: true
                }));

                // Show notification that user was reported
                showNotification({
                    message: `Report submitted successfully`
                });
            })
            .catch(error => {
                console.error("Failed to report user:", error);
            });
    };

    // Format date label for display
    const formatDateLabel = (dateStr) => {
        const msgDate = moment(dateStr);
        const today = moment().startOf('day');
        const yesterday = moment().subtract(1, 'days').startOf('day');

        if (msgDate.isSame(today, 'd')) {
            return 'Today';
        } else if (msgDate.isSame(yesterday, 'd')) {
            return 'Yesterday';
        } else if (msgDate.isAfter(moment().subtract(7, 'days'))) {
            return msgDate.format('dddd'); // Day of week
        } else {
            return msgDate.format('MMMM D, YYYY'); // Full date
        }
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        if (!messages || messages.length === 0) return [];

        const groupedMessages = [];
        let currentDate = null;

        messages.forEach(msg => {
            const msgDate = moment(msg.createdAt).startOf('day').format('YYYY-MM-DD');

            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groupedMessages.push({
                    type: 'date',
                    date: msg.createdAt,
                    id: `date-${msgDate}`
                });
            }

            groupedMessages.push({
                type: 'message',
                data: msg
            });
        });

        return groupedMessages;
    };
    return (
        <section className="chat-section">
            <div className="chat-container">
                {/* Notification */}
                {notification && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        backgroundColor: '#4a5568',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        zIndex: 1000,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                    }}>
                        <strong>
                            {notification.senderId ?
                                (friendsList.find(f => f._id === notification.senderId)?.name || 'Someone') + ': '
                                : ''}
                        </strong>
                        {notification.message ? (
                            <>
                                {notification.message.substring(0, 30)}
                                {notification.message.length > 30 ? '...' : ''}
                            </>
                        ) : 'Notification received'}
                    </div>
                )}

                {/* Report User Modal */}
                {showReportModal && (
                    <div className="report-modal-overlay">
                        <div className="report-modal">
                            <div className="report-modal-header">
                                <h3>Report {activeChat?.name}</h3>
                                <button className="close-modal" onClick={() => setShowReportModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleReportUser}>
                                <div className="report-modal-body">
                                    <p>Please provide a reason for reporting {activeChat?.name}:</p>
                                    <textarea
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        placeholder="Explain why you are reporting this user..."
                                        required
                                    ></textarea>
                                </div>
                                <div className="report-modal-footer">
                                    <button type="button" onClick={() => setShowReportModal(false)}>Cancel</button>
                                    <button type="submit" disabled={!reportReason.trim()}>Submit Report</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Use the Aside component here */}
                <Aside setShowMobileFriendsList={setShowMobileFriendsList} />

                <div className="chat-content">
                    {/* Only show friends list on mobile when showMobileFriendsList is true */}
                    <div className={`content-sidebar ${!showMobileFriendsList && 'd-none d-md-block'}`}>
                        <div className="content-sidebar-title">Chats</div>
                        <form action="" className="content-sidebar-form">
                            <input type="search" className="content-sidebar-input" placeholder="Search..." />
                            <button type="submit" className="content-sidebar-submit"><i className="ri-search-line"></i></button>
                        </form>
                        <div className="content-messages">
                            <ul className="content-messages-list">
                                {friendsList.length === 0 ? (
                                    <li style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "15px"
                                    }}>
                                        <p style={{ color: "var(--slate-500)" }}>No friends yet. Add someone to talk to!</p>
                                        <button
                                            onClick={() => navigate('/')}
                                            style={{
                                                backgroundColor: "var(--emerald-500)",
                                                color: "white",
                                                padding: "8px 16px",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            <i className="ri-user-add-line"></i>
                                            Find Friends
                                        </button>
                                    </li>
                                ) : (
                                    friendsList.map((friend) => (
                                        <li key={friend._id}
                                            onClick={() => loadMessages(friend)}
                                            className={`p-2 border-b cursor-pointer ${activeChat?._id === friend._id ? 'bg-blue-100' : ''}`}
                                            style={{ position: 'relative' }}
                                        >
                                            <a>
                                                <img className="content-message-image" src={friend.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} alt="" />
                                                <span className="content-message-info">
                                                    <span className="content-message-name">
                                                        {friend.name} {friend.status === 'online' && "🟢"}
                                                    </span>

                                                </span>
                                                {unreadCounts[friend._id] > 0 && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        right: '10px',
                                                        top: '10px',
                                                        backgroundColor: 'var(--emerald-500)',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px'
                                                    }}>
                                                        {unreadCounts[friend._id]}
                                                    </span>
                                                )}
                                            </a>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Conversation area (only show when a chat is active) */}
                    {activeChat ? (
                        <div className={`conversation active ${showMobileFriendsList ? 'd-none d-md-flex' : ''}`}>
                            {isLoadingChat ? (<>

                            </>) : (<>
                                <div className="conversation-top">
                                    <button type="button" className="conversation-back" onClick={handleBackButtonClick}><i className="ri-arrow-left-line"></i></button>
                                    <div className="conversation-user">
                                        <img className="conversation-user-image" src={activeChat.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} alt="" />
                                        <div>
                                            <div className="conversation-user-name">{activeChat.name}</div>
                                            <div className={`conversation-user-status ${activeChat.status === 'online' ? 'online' : 'offline'}`}>
                                                {activeChat.status}
                                            </div>

                                        </div>
                                    </div>

                                    {/* User Options Menu */}
                                    <div className="user-menu-container" style={{ position: 'relative', marginLeft: 'auto' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '20px'
                                            }}
                                        >
                                            <i className="ri-more-2-line"></i>
                                        </button>

                                        {isUserMenuOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '30px',
                                                backgroundColor: 'white',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                                borderRadius: '4px',
                                                zIndex: 10,
                                                minWidth: '150px'
                                            }}>
                                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                                    {isUserBlocked(activeChat._id) ? (
                                                        <li>
                                                            <button
                                                                onClick={handleUnblockUser}
                                                                style={{
                                                                    display: 'block',
                                                                    width: '100%',
                                                                    textAlign: 'left',
                                                                    padding: '10px 15px',
                                                                    border: 'none',
                                                                    background: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <i className="ri-user-unfollow-line" style={{ marginRight: '5px' }}></i>
                                                                Unblock User
                                                            </button>
                                                        </li>
                                                    ) : (
                                                        <li>
                                                            <button
                                                                onClick={handleBlockUser}
                                                                style={{
                                                                    display: 'block',
                                                                    width: '100%',
                                                                    textAlign: 'left',
                                                                    padding: '10px 15px',
                                                                    border: 'none',
                                                                    background: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <i className="ri-forbid-line" style={{ marginRight: '5px' }}></i>
                                                                Block User
                                                            </button>
                                                        </li>
                                                    )}
                                                    <li>
                                                        <button
                                                            onClick={isUserReported(activeChat?._id) ? undefined : openReportModal}
                                                            style={{
                                                                display: 'block',
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                padding: '10px 15px',
                                                                border: 'none',
                                                                background: 'none',
                                                                cursor: isUserReported(activeChat?._id) ? 'not-allowed' : 'pointer',
                                                                color: isUserReported(activeChat?._id) ? '#aaa' : '#e53e3e',
                                                                opacity: isUserReported(activeChat?._id) ? 0.7 : 1
                                                            }}
                                                            disabled={isUserReported(activeChat?._id)}
                                                        >
                                                            <i className="ri-flag-line" style={{ marginRight: '5px' }}></i>
                                                            {isUserReported(activeChat?._id) ? 'Reported' : 'Report User'}
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>)}


                            <div className="conversation-main">
                                {/* Show a message if user is blocked */}
                                {isUserBlocked(activeChat._id) && (
                                    <div style={{
                                        padding: '10px',
                                        textAlign: 'center',
                                        backgroundColor: '#f8d7da',
                                        color: '#721c24',
                                        margin: '10px'
                                    }}>
                                        <p>You have blocked this user. Unblock to send and receive messages.</p>
                                    </div>
                                )}

                                {/* Show a message if user is blocked by the other user */}
                                {isBlockedByUser(activeChat._id) && (
                                    <div style={{
                                        padding: '10px',
                                        textAlign: 'center',
                                        backgroundColor: '#f8d7da',
                                        color: '#721c24',
                                        margin: '10px'
                                    }}>
                                        <p>You cannot send messages because you have been blocked by this user.</p>
                                    </div>
                                )}
                                {isLoadingChat ? (
                                    <>
                                        <div className="conversation-loading">
                                            <p>Loading...</p>
                                        </div>
                                    </>

                                ) :
                                    (<ScrollToBottom>
                                        <ul className="conversation-wrapper">
                                            {groupMessagesByDate(messages).map((item) => (
                                                item.type === 'date' ? (
                                                    <div className="coversation-divider" key={item.id}>
                                                        <span>{formatDateLabel(item.date)}</span>
                                                    </div>
                                                ) : (

                                                    <li className={`conversation-item ${item.data.sender !== user._id ? 'someone' : ''}`} key={item.data._id}>
                                                        <div className="conversation-item-side">
                                                            <img
                                                                className="conversation-item-image"
                                                                src={(item.data.sender === user._id ? user : activeChat).profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"}
                                                                alt=""
                                                            />
                                                        </div>

                                                        <div className="conversation-item-content">

                                                            <div className="conversation-item-wrapper">
                                                                <div className="conversation-item-box">
                                                                    <div className="conversation-item-text">
                                                                        <p>{item.data.message}</p>
                                                                        {/* Display media if present */}
                                                                        {item.data.media && (
                                                                            <div className="conversation-item-media">
                                                                                {item.data.media.includes('image') ? (
                                                                                    <img
                                                                                        src={item.data.media}
                                                                                        alt="Message attachment"
                                                                                        onClick={() => window.open(item.data.media, '_blank')}
                                                                                    />
                                                                                ) : (
                                                                                    <video
                                                                                        src={item.data.media}
                                                                                        controls
                                                                                        style={{ maxWidth: '250px', borderRadius: '8px' }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {/* <div className="conversation-item-time">{moment(item.data.createdAt).fromNow()}</div> */}
                                                                        <div className="conversation-item-time">
                                                                            {moment(item.data.createdAt).fromNow()}

                                                                            {/* Add read status icons - only show for messages sent by current user */}
                                                                            {item.data.sender === user._id && (
                                                                                <span className="message-status-indicator">
                                                                                    {item.data.status === 'sent' && (
                                                                                        <i className="ri-check-line" title="Sent"></i>
                                                                                    )}
                                                                                    {item.data.status === 'delivered' && (
                                                                                        <i className="ri-check-double-line" title="Delivered"></i>
                                                                                    )}
                                                                                    {item.data.status === 'read' && (
                                                                                        <i className="ri-check-double-line read" title="Read"></i>
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {renderReactions(item.data)}
                                                                    <div className="conversation-item-dropdown">
                                                                        {item.data.sender === user._id ? (
                                                                            <>
                                                                                <div className="conversation-item-dropdown">
                                                                                    <button
                                                                                        onClick={() => handleDeleteMessage(item.data._id)}
                                                                                        type="button"
                                                                                        className="conversation-item-dropdown-toggle"
                                                                                    >
                                                                                        <i className="ri-delete-bin-line"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                {/* Add reaction button */}
                                                                                <button
                                                                                    onClick={() => handleReactionClick(item.data._id)}
                                                                                    type="button"
                                                                                    className="conversation-item-reaction-toggle"
                                                                                >
                                                                                    <i className={`ri-emotion-${hasUserReacted(item.data) ? 'fill' : 'line'}`}></i>
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                            </div>
                                                        </div>

                                                    </li>
                                                )
                                            ))}
                                            {showReactionPicker && (
                                                <div className="emoji-picker-modal">
                                                    <div className="emoji-picker-backdrop" onClick={() => setShowReactionPicker(false)}></div>
                                                    <div className="emoji-picker-container">
                                                        <EmojiPicker
                                                            onEmojiClick={handleSelectEmoji}
                                                            disableAutoFocus={true}
                                                            searchPlaceholder="Search emoji..."
                                                            width={300}
                                                            height={400}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {/* Show media preview if a file is selected */}
                                            {selectedMedia && (
                                                <div className="media-preview-container">
                                                    <div className="media-preview">
                                                        {selectedMedia.type.startsWith("image/") ? (
                                                            <img src={mediaPreview} alt="Selected media" />
                                                        ) : (
                                                            <video src={mediaPreview} controls />
                                                        )}
                                                        <button
                                                            className="remove-media-btn"
                                                            onClick={removeSelectedMedia}
                                                            title="Remove"
                                                        >
                                                            <i className="ri-close-circle-fill"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            {typing && (
                                                <li className="typing-indicator">
                                                    <div style={{ backgroundColor: 'grey', color: 'white', padding: '5px 10px', borderRadius: '4px', display: 'inline-block' }}>
                                                        Typing...
                                                    </div>
                                                </li>
                                            )}
                                        </ul>
                                    </ScrollToBottom>
                                    )
                                }
                            </div>

                            <div className="conversation-form">
                                {/* Don't show message input if user is blocked */}
                                {isUserBlocked(activeChat._id) || isBlockedByUser(activeChat._id) ? (
                                    <div style={{ width: '100%', textAlign: 'center', padding: '10px' }}>
                                        {isUserBlocked(activeChat._id) ? (
                                            <button
                                                onClick={handleUnblockUser}
                                                style={{
                                                    padding: '8px 15px',
                                                    backgroundColor: '#4a5568',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Unblock to continue conversation
                                            </button>
                                        ) : (
                                            <div style={{ color: '#721c24' }}>
                                                Messaging unavailable - you have been blocked
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>

                                        <div className="conversation-form-group">
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyDown={(e) => {
                                                    handleTyping();
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                className="conversation-form-input"
                                                rows="1"
                                                placeholder="Type here..."
                                            ></textarea>

                                            {/* File input */}
                                            <input
                                                type="file"
                                                id="media-upload"
                                                accept="image/*,video/*"
                                                onChange={handleFileSelect}
                                                hidden
                                            />
                                            <button
                                                type="button"
                                                className="conversation-form-button conversation-form-attachment"
                                                onClick={() => document.getElementById('media-upload').click()}
                                            >
                                                <i className="ri-attachment-2"></i>
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleSendMessage}
                                            type="button"
                                            className="conversation-form-button conversation-form-submit"
                                        >
                                            <i className="ri-send-plane-2-line"></i>
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                    ) : (
                        <>
                            {/* Default view when no chat is selected */}
                            <div className="conversation conversation-default active">
                                <i className="ri-chat-3-line"></i>
                                <p>Select chat and view conversation!</p>
                            </div>
                        </>
                    )

                    }
                </div>
            </div>
        </section>
    );
};

export default ChatPage;