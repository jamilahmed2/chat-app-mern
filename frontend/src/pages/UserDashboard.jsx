import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from 'react-router-dom';
import { updateUserEmailAction, updateUserNameAction, updateUserPasswordAction, setTempEmail, uploadProfileImageAction, logoutUserAction, getAllUsersHomeAction } from "../reducers/authSlice";
import socket from "../utils/socket";
import AlertNotification from "../components/AlertNotification";

const UserDashboard = () => {
    const { user, loading, error } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("profile"); // Default tab
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest(".profile-dropdown-container")) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // profile image
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            // File size validation (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage("File size must be less than 5MB");
                return;
            }

            // File type validation
            if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
                setMessage("File must be an image (JPEG, PNG, or GIF)");
                return;
            }

            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setMessage("Please select a file first");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('profileImage', selectedFile);

            const result = await dispatch(uploadProfileImageAction(formData));

            if (result.meta.requestStatus === "fulfilled") {
                setMessage("Profile image updated successfully");
                setTimeout(() => setMessage(""), 3000);
                setSelectedFile(null);
                setPreview(null);
            }
        } catch (error) {
            console.error("Upload error:", error);
            setMessage("Error uploading image");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        dispatch(updateUserNameAction({ name })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Name updated successfully");
                setTimeout(() => setMessage(""), 3000);
            }
        });
    };

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        dispatch(updateUserEmailAction({ email })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                dispatch(setTempEmail(email));
                navigate("/verify-email");
            }
        });
    };

    // Handle password change
    const handlePasswordChange = (e) => {
        e.preventDefault();
        dispatch(updateUserPasswordAction({ currentPassword, newPassword })).then((res) => {
            if (res.meta.requestStatus === "fulfilled") {
                setMessage("Password updated successfully");
                setTimeout(() => setMessage(""), 3000);
                setCurrentPassword("");
                setNewPassword("");
            }
        });
    };

    const navigateToChat = () => {
        navigate('/chats');
    };

    // Handle logout
      const handleLogout = () => {
        // Disconnect socket before logout
        if (socket && socket.connected) {
            socket.disconnect();
            console.log("Socket disconnected during logout");
        }
        
            dispatch(logoutUserAction()).then(() => {
                navigate('/');
            });
        };

    return (
        <div className="dashboard-container">
            {/* Notification */}
            {message && <AlertNotification message={message} type="success" />}
            {error && <AlertNotification message={error} type="error" />}

            {/* Main Layout */}
            <div className="dashboard-layout">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <div className="sidebar-header">
                        <h2><i className="ri-user-line"></i> User Dashboard</h2>
                    </div>
                    <ul className="sidebar-menu">
                        <li className={activeTab === "profile" ? "active" : ""}>
                            <button onClick={() => setActiveTab("profile")}>
                                <i className="ri-user-settings-line"></i> Profile Settings
                            </button>
                        </li>
                        <li className={activeTab === "security" ? "active" : ""}>
                            <button onClick={() => setActiveTab("security")}>
                                <i className="ri-lock-password-line"></i> Security
                            </button>
                        </li>
                        <li>
                            <button onClick={navigateToChat}>
                                <i className="ri-chat-3-line"></i> Chat
                            </button>
                        </li>
                        <li className="profile-dropdown-container">
                            <button 
                                className="profile-button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <img 
                                    src={user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                    alt="" 
                                />
                            </button>
                            {isDropdownOpen && (
                                <ul className="profile-dropdown">
                                    <li><button onClick={() => setActiveTab("profile")}><i className="ri-user-line"></i> Profile</button></li>
                                    <li><button onClick={handleLogout}><i className="ri-logout-box-line"></i> Logout</button></li>
                                </ul>
                            )}
                        </li>
                    </ul>
                </aside>

                {/* Content Area */}
                <main className="dashboard-content">
                    {activeTab === "profile" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Profile Information</h2>
                                <p>Update your personal information</p>
                </div>

                            <div className="profile-section">
                                <div className="profile-info">
                                    <div className="profile-avatar">
                    <img
                                            src={preview || user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60"} 
                                            alt="Profile" 
                    />
                                        <div className="upload-overlay">
                                            <label htmlFor="profile-upload">
                                                <i className="ri-camera-line"></i>
                                            </label>
                <input
                                                id="profile-upload" 
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                                                style={{display: 'none'}}
                                            />
                                        </div>
                                    </div>
                                    
                                    {selectedFile && (
                <button
                    onClick={handleUpload}
                                            className="upload-button"
                                            disabled={loading}
                                        >
                                            {loading ? "Uploading..." : "Upload Image"}
                                        </button>
                                    )}
                                    
                                    <div className="user-details">
                                        <h3>{user?.name}</h3>
                                        <p>{user?.email}</p>
                                    </div>
            </div>

                                <div className="profile-forms">
                                    <form onSubmit={handleUpdateName} className="update-form">
                                        <div className="form-group">
                                            <label>Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                                                placeholder="Update your name"
                                                required
                />
                                        </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Name"}
                </button>
            </form>

                                    <form onSubmit={handleUpdateEmail} className="update-form">
                                        <div className="form-group">
                                            <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Update your email"
                                                required
                />
                                        </div>
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Email"}
                </button>
            </form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === "security" && (
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Security Settings</h2>
                                <p>Update your password</p>
                            </div>
                            
                            <form onSubmit={handlePasswordChange} className="password-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                    required
                />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                    required
                />
                                </div>
                                <button type="submit" disabled={loading}>
                                    {loading ? "Updating..." : "Change Password"}
                </button>
            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default UserDashboard;