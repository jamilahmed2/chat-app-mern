import React, { useEffect, useState } from 'react';

const AlertNotification = ({ message, type = 'error', duration = 3000 }) => {
    const [visible, setVisible] = useState(true);
    
    useEffect(() => {
        // Set a timeout to automatically dismiss the notification
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);
        
        // Clear the timeout if the component unmounts or if message changes
        return () => clearTimeout(timer);
    }, [duration]);
    
    // If not visible anymore, don't render anything
    if (!visible || !message) return null;
    
    // Determine the CSS class based on notification type
    const notificationClass = `notification ${type === 'success' ? 'success' : ''}`;
    
    return (
        <div className={notificationClass}>
            {message}
        </div>
    );
};

export default AlertNotification; 