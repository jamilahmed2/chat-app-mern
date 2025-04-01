import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IoLogoOctocat, IoCloseOutline, IoMenuOutline, IoPeopleOutline } from 'react-icons/io5';
import { logoutUserAction } from '../reducers/authSlice';
import Notifications from './Notifications';
import FriendRequestList from './FriendRequestList';

const Header = () => {
    const isLoggedIn = localStorage.getItem('user');
    const user = isLoggedIn ? JSON.parse(localStorage.getItem('user')) : null;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const { friendRequests } = useSelector((state) => state.auth);
   
    const handleProfileClick = () => {
       if(user.role==="admin"){
        navigate('/dashboard', { replace: true });
        setIsProfileDropdownOpen(false);
        return;
      }else if(user.role==="user"){
        navigate('/user-dashboard', { replace: true });
        setIsProfileDropdownOpen(false);
        return;
      }else(
        navigate('/', { replace: true })
      )
    };

    const handleLogout = () => {
        dispatch(logoutUserAction());
        navigate('/', { replace: true });
    };

    return (
        <header className="home-header">
            <div className="header-container">
                <div className="header-logo">
                    <IoLogoOctocat />
                    <span>Social Chat</span>
                </div>

                {/* Hamburger Menu Button (Mobile Only) */}
                <button
                    className="hamburger-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setMobileMenuOpen(!mobileMenuOpen);
                        // Close other dropdowns when opening mobile menu
                        setIsProfileDropdownOpen(false);
                        setShowFriendRequests(false);
                    }}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <IoCloseOutline /> : <IoMenuOutline />}
                </button>

                {/* Navigation - Desktop */}
                <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    <ul className="nav-list">
                        <li className="nav-item active">
                            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        </li>

                        {isLoggedIn && user.role === "user" && (
                            <li className="nav-item">
                                <Link to="/chats" onClick={() => setMobileMenuOpen(false)}>Chats</Link>
                            </li>
                        )}

                        {user && (
                            <li className="nav-item">
                                <Link
                                    to={user.role === "admin" ? "/dashboard" : "/user-dashboard"}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {user.role === "admin" ? "Admin Dashboard" : "Dashboard"}
                                </Link>
                            </li>
                        )}

                        {!isLoggedIn && (
                            <>
                                <li className="nav-item">
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                {/* User Controls Section */}
                {isLoggedIn && (
                    <div className="user-controls">
                        {/* Friend Requests Button */}
                        <button
                            className="friend-requests-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFriendRequests(!showFriendRequests);
                                setIsProfileDropdownOpen(false);
                            }}
                            aria-label="Friend Requests"
                        >
                            <IoPeopleOutline />
                            {friendRequests?.length > 0 && (
                                <span className="requests-badge">{friendRequests.length}</span>
                            )}
                        </button>

                        {/* Friend Request List positioned absolutely */}
                        {showFriendRequests && (
                            <div className="friend-request-wrapper">
                                <FriendRequestList />
                            </div>
                        )}

                        {/* Notifications Component */}
                        <Notifications />

                        {/* Profile Dropdown */}
                        <li className={`head-sidebar-profile ${isProfileDropdownOpen ? "active" : ""}`}>
                            <button
                                type="button"
                                className="head-sidebar-profile-btn"
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            >
                                <img
                                    src={user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"}
                                    alt=""
                                />
                            </button>
                            {isProfileDropdownOpen && (
                                <ul className="head-sidebar-profile-dropdown">
                                    <li>
                                        <a onClick={handleProfileClick}>
                                            <i className="ri-user-line"></i> Profile
                                        </a>
                                    </li>
                                    <li>
                                        <a onClick={() => {
                                            handleLogout();
                                            setIsProfileDropdownOpen(false);
                                        }}>
                                            <i className="ri-logout-box-line"></i> Logout
                                        </a>
                                    </li>
                                </ul>
                            )}
                        </li>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;