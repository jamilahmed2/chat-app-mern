import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUserAction } from "../reducers/authSlice";
import socket from "../utils/socket";
import { setActiveChat } from "../reducers/chatSlice";

const Aside = ({ setShowMobileFriendsList }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);



    // Add this handler for the Chats button
    const handleChatsClick = (e) => {
        e.preventDefault();

        // Clear the active chat
        dispatch(setActiveChat(null));
        navigate('/chats', { replace: true });
        // If you have a state for showing friends list in mobile view, set it
        if (typeof setShowMobileFriendsList === 'function') {
            setShowMobileFriendsList(true);
        }
    };
    const handleNavigateHome = (e) => {
        e.preventDefault();
        dispatch(setActiveChat(null));
        navigate('/', { replace: true });

    }
    const handleNavigateUserDashboard = (e) => {
        e.preventDefault();
        dispatch(setActiveChat(null));
        navigate('/user-dashboard', { replace: true });
    }   
    
    // Handle logout
    const handleLogout = (e) => {
        // Disconnect socket before logout
        if (socket.connected) {
            socket.disconnect();
            console.log("Socket disconnected during logout");
        }

        dispatch(logoutUserAction()).then(() => {
            e.preventDefault();
            navigate('/', { replace: true });
        });
    };

    return (
        <aside className="chat-sidebar">
            <a onClick={handleChatsClick} className="chat-sidebar-logo">
                <i className="ri-chat-1-fill"></i>
            </a>
            <ul className="chat-sidebar-menu">
                <li><a onClick={handleNavigateHome} data-title="Home"><i className="ri-home-line"></i></a></li>
                <li className="active"><a
                    onClick={handleChatsClick}
                    className="chat-sidebar-link"
                >
                    <i className="ri-chat-3-line"></i>
                </a></li>
                <li><a onClick={handleNavigateUserDashboard} data-title="Security"><i className="ri-shield-line"></i></a></li>
                <li className={`chat-sidebar-profile ${isProfileDropdownOpen ? "active" : ""}`}>
                    <button
                        type="button"
                        className="chat-sidebar-profile-toggle"
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    >
                        <img
                            src={user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"}
                            alt=""
                        />
                    </button>
                    {isProfileDropdownOpen && (
                        <ul className="chat-sidebar-profile-dropdown">
                            <li><a onClick={handleNavigateUserDashboard}><i className="ri-user-line"></i> Profile</a></li>
                            <li>
                                <a onClick={handleLogout}>
                                    <i className="ri-logout-box-line"></i> Logout
                                </a>
                            </li>
                        </ul>
                    )}
                </li>
            </ul>
        </aside>
    );
};

export default Aside; 