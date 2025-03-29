import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getNotificationsAction, markNotificationAsReadAction, deleteNotificationAction, deleteAllNotificationsAction } from '../reducers/notificationSlice';

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

    return (
        <div style={styles.container}>
            <button
                style={styles.notificationButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                🔔
                {notifications.filter(n => !n.read).length > 0 && (
                    <span style={styles.badge}>
                        {notifications.filter(n => !n.read).length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={styles.dropdown}>
                    <div style={styles.clearAllContainer}>
                        <button
                            onClick={handleClearAll}
                            style={styles.clearAllButton}
                        >
                            Clear All
                        </button>
                    </div>
                    {loading ? (
                        <p>Loading notifications...</p>

                    ) : notifications.length > 0 ? (

                        notifications.map((notification) => (

                            <div
                                key={notification._id}
                                style={{
                                    ...styles.notification,
                                    backgroundColor: notification.read ? '#f3f4f6' : '#808080'
                                }}
                                onClick={() => handleNotificationClick(notification._id)}
                            >
                                <div style={styles.notificationContent}>
                                    <p style={styles.message}>{notification.message}</p>
                                    <small style={styles.time}>
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </small>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteNotification(e, notification._id)}
                                    style={styles.deleteButton}
                                >
                                    ×
                                </button>

                            </div>
                        ))
                    ) : (
                        <p style={styles.noNotifications}>No notifications</p>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        position: 'relative',
        display: 'inline-block',
    },
    notificationButton: {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        position: 'relative'
    },
    badge: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#ef4444',
        color: 'white',
        borderRadius: '50%',
        padding: '2px 6px',
        fontSize: '12px'
    },
    dropdown: {
        position: 'absolute',
        right: 0,
        top: '100%',
        width: '300px',
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        zIndex: 1000
    },
    notification: {
        padding: '12px',
        backgroundColor: 'grey',
        borderBottom: '1px solid grey',
        cursor: 'pointer'
    },
    message: {
        margin: '0 0 4px 0'
    },
    time: {
        color: 'black'
    },
    notificationContent: {
        flex: 1
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        color: '#6b7280',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '4px 8px',
        marginLeft: '8px'
    },
    clearAllContainer: {
        padding: '8px',
        borderBottom: '1px solid rgb(50, 96, 188)',
        backgroundColor: 'rgb(50, 96, 188)',
        textAlign: 'right'
    },
    clearAllButton: {
        background: '#ef4444',
        color: 'white',
        border: 'none',
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
    },
    noNotifications: {
        padding: '12px',
        textAlign: 'center',
        color: '#6b7280'
    }
};

export default Notifications;