import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNotificationsAction, markNotificationAsReadAction, deleteNotificationAction, deleteAllNotificationsAction } from '../reducers/notificationSlice';
import { IoNotificationsOutline } from 'react-icons/io5';
import { IoClose } from 'react-icons/io5';

const Notifications = () => {
    const dispatch = useDispatch();
    const { notifications, loading } = useSelector(state => state.notifications);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        dispatch(getNotificationsAction());
    }, [dispatch]);

    const handleNotificationClick = (notificationId) => {
        dispatch(markNotificationAsReadAction(notificationId));
    };

    const handleDeleteNotification = (e, notificationId) => {
        e.stopPropagation(); // Prevent triggering the mark as read
        dispatch(deleteNotificationAction(notificationId));
    };

    const handleClearAll = () => {
        dispatch(deleteAllNotificationsAction());
        setIsOpen(false); // Close dropdown after clearing
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="notification-container">
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <IoNotificationsOutline />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <button
                            onClick={handleClearAll}
                            className="clear-all-button"
                            disabled={notifications.length === 0}
                        >
                            Clear All
                        </button>
                    </div>
                    
                    <div className="notification-list">
                        {loading ? (
                            <p className="notification-loading">Loading notifications...</p>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification._id)}
                                >
                                    <div className="notification-content">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">
                                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                                        className="notification-delete-button"
                                        aria-label="Delete notification"
                                    >
                                        <IoClose />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="no-notifications">No notifications</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;